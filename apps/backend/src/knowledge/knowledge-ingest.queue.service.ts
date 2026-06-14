import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job, Queue, Worker } from 'bullmq';
import { KnowledgeIngestService } from './knowledge-ingest.service';
import {
  KNOWLEDGE_INGEST_QUEUE,
  type KnowledgeIngestJobData,
} from './knowledge-ingest.types';

const INGEST_JOB_ATTEMPTS = 3;
const INGEST_WORKER_CONCURRENCY = 2;

@Injectable()
export class KnowledgeIngestQueueService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(KnowledgeIngestQueueService.name);
  private queue: Queue<KnowledgeIngestJobData> | null = null;
  private worker: Worker<KnowledgeIngestJobData> | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly ingest: KnowledgeIngestService,
  ) {}

  onModuleInit() {
    if (!this.config.get<boolean>('redis.enabled')) {
      return;
    }

    const url = this.config.getOrThrow<string>('redis.url');
    const connection = { url };

    this.queue = new Queue<KnowledgeIngestJobData>(KNOWLEDGE_INGEST_QUEUE, {
      connection,
      defaultJobOptions: {
        attempts: INGEST_JOB_ATTEMPTS,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 500,
      },
    });

    this.worker = new Worker<KnowledgeIngestJobData>(
      KNOWLEDGE_INGEST_QUEUE,
      async (job) => this.ingest.processIngestJob(job.data),
      { connection, concurrency: INGEST_WORKER_CONCURRENCY },
    );

    this.worker.on('failed', (job, err) => {
      void this.handleFailedJob(job, err);
    });

    this.worker.on('error', (err) => {
      this.logger.warn(`Ingest worker error: ${err.message}`);
    });

    this.logger.log('Knowledge ingest queue worker started');
  }

  async onModuleDestroy() {
    await this.worker?.close();
    await this.queue?.close();
    this.worker = null;
    this.queue = null;
  }

  isEnabled(): boolean {
    return this.queue != null;
  }

  async enqueue(
    data: KnowledgeIngestJobData,
    options?: { replace?: boolean },
  ): Promise<void> {
    if (!this.queue) {
      throw new Error('Knowledge ingest queue is not available');
    }

    const jobId = `${data.projectId}:${data.sourceId}`;

    if (options?.replace) {
      const existing = await this.queue.getJob(jobId);
      if (existing) {
        await existing.remove();
      }
    }

    await this.queue.add('ingest', data, { jobId });
  }

  private async handleFailedJob(
    job: Job<KnowledgeIngestJobData> | undefined,
    err: Error,
  ): Promise<void> {
    if (!job) {
      return;
    }

    const maxAttempts = job.opts.attempts ?? INGEST_JOB_ATTEMPTS;
    if (job.attemptsMade < maxAttempts) {
      return;
    }

    await this.ingest.markIngestErrorById(
      job.data.projectId,
      job.data.sourceId,
      err,
    );
  }
}
