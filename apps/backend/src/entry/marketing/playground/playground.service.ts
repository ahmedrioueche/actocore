import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { ErrorCode } from '@ahmedrioueche/actocore-shared';
import { Model } from 'mongoose';
import { ApiKeysService } from '../../../auth/api-keys.service';
import type { MarketingChatResolvedConfig } from '../../../config/marketing-chat.config';
import {
  PLAYGROUND_ACCOUNT_ID,
  type PlaygroundResolvedConfig,
} from '../../../config/playground.config';
import { ProjectDeleteService } from '../../../projects/project-delete.service';
import { ProjectsService } from '../../../projects/projects.service';
import { SdkConfigService } from '../../../projects/sdk-config/sdk-config.service';
import { RedisService } from '../../../redis/redis.service';
import { ActionsService } from '../../../actions/actions.service';
import { AppPagesService } from '../../../actions/app-pages.service';
import {
  decryptPlaygroundSecret,
  encryptPlaygroundSecret,
} from './playground-crypto.util';
import {
  PLAYGROUND_DEFAULT_ACTIONS,
  PLAYGROUND_DEFAULT_APP_PAGES,
  PLAYGROUND_DEFAULT_SDK_CONFIG,
} from './playground-seed.catalog';
import { createPlaygroundToken } from './playground-token.util';
import {
  PlaygroundSession,
  PlaygroundSessionDocument,
} from './schemas/playground-session.schema';

export type PlaygroundBootstrapResult = {
  projectId: string;
  projectName: string;
  apiKey: string;
  playgroundToken: string;
};

type MemoryBucket = { count: number; resetAt: number };

@Injectable()
export class PlaygroundService {
  private readonly logger = new Logger(PlaygroundService.name);
  private readonly bootstrapMemory = new Map<string, MemoryBucket>();

  constructor(
    @InjectModel(PlaygroundSession.name)
    private readonly sessionModel: Model<PlaygroundSessionDocument>,
    private readonly config: ConfigService,
    private readonly projects: ProjectsService,
    private readonly projectDelete: ProjectDeleteService,
    private readonly apiKeys: ApiKeysService,
    private readonly actions: ActionsService,
    private readonly appPages: AppPagesService,
    private readonly sdkConfig: SdkConfigService,
    private readonly redis: RedisService,
  ) {}

  assertEnabled(): void {
    const marketing = this.config.get<MarketingChatResolvedConfig>('marketingChat');
    const playground = this.config.get<PlaygroundResolvedConfig>('playground');

    if (!marketing?.enabled) {
      throw new ServiceUnavailableException({
        errorCode: ErrorCode.SERVICE_UNAVAILABLE,
        message: 'Marketing chat is not available.',
      });
    }

    if (!playground?.enabled) {
      throw new ServiceUnavailableException({
        errorCode: ErrorCode.SERVICE_UNAVAILABLE,
        message: 'Public playground is not available.',
      });
    }
  }

  async bootstrap(input: {
    visitorId: string;
    projectName?: string;
    origin?: string | null;
    clientIp: string;
  }): Promise<PlaygroundBootstrapResult> {
    this.assertEnabled();

    const visitorId = input.visitorId?.trim();
    if (!visitorId || visitorId.length > 128) {
      throw new BadRequestException({
        errorCode: ErrorCode.VALIDATION_ERROR,
        message: 'visitorId is required.',
      });
    }

    const existing = await this.sessionModel.findOne({ visitorId }).exec();
    if (existing && existing.expiresAt > new Date()) {
      return this.toBootstrapResult(existing);
    }

    if (existing) {
      await this.deleteSession(existing);
    }

    await this.enforceBootstrapRateLimit(input.clientIp);

    const playground = this.config.getOrThrow<PlaygroundResolvedConfig>('playground');
    const name = input.projectName?.trim() || 'My playground project';
    const project = await this.projects.createForPlayground(name);
    const issued = await this.apiKeys.issue({
      projectId: project.id,
      name: 'playground',
    });

    await this.seedProject(project.id);

    const expiresAt = new Date(
      Date.now() + playground.projectTtlDays * 24 * 60 * 60 * 1000,
    );
    const session = await this.sessionModel.create({
      visitorId,
      projectId: project.id,
      projectName: name,
      apiKeyId: issued.id,
      apiKeyCiphertext: encryptPlaygroundSecret(
        issued.key,
        playground.sessionSecret,
      ),
      origin: input.origin ?? undefined,
      expiresAt,
    });

    return this.toBootstrapResult(session);
  }

  async assertProjectAccess(
    projectId: string,
    tokenPayload: { visitorId: string; projectId: string },
  ): Promise<PlaygroundSessionDocument> {
    if (tokenPayload.projectId !== projectId) {
      throw new ForbiddenException({
        errorCode: ErrorCode.FORBIDDEN,
        message: 'Project access denied.',
      });
    }

    const session = await this.sessionModel
      .findOne({ visitorId: tokenPayload.visitorId, projectId })
      .exec();

    if (!session || session.expiresAt <= new Date()) {
      throw new ForbiddenException({
        errorCode: ErrorCode.FORBIDDEN,
        message: 'Playground session expired.',
      });
    }

    return session;
  }

  async cleanupExpiredSessions(): Promise<number> {
    const expired = await this.sessionModel
      .find({ expiresAt: { $lte: new Date() } })
      .exec();

    for (const session of expired) {
      await this.deleteSession(session);
    }

    if (expired.length > 0) {
      this.logger.log(`Cleaned up ${expired.length} expired playground session(s).`);
    }

    return expired.length;
  }

  private async deleteSession(session: PlaygroundSessionDocument): Promise<void> {
    await this.projectDelete.deleteProject(session.projectId, PLAYGROUND_ACCOUNT_ID);
    await this.sessionModel.deleteOne({ _id: session._id }).exec();
  }

  private async seedProject(projectId: string): Promise<void> {
    for (const action of PLAYGROUND_DEFAULT_ACTIONS) {
      await this.actions.create(projectId, {
        name: action.name,
        description: action.description,
        inputSchema: action.inputSchema,
        enabled: true,
      });
    }

    for (const page of PLAYGROUND_DEFAULT_APP_PAGES) {
      await this.appPages.create(projectId, {
        slug: page.slug,
        title: page.title,
        route: page.route,
        description: page.description,
        enabled: true,
      });
    }

    await this.sdkConfig.updateConfig(projectId, PLAYGROUND_DEFAULT_SDK_CONFIG);
  }

  private toBootstrapResult(
    session: PlaygroundSessionDocument,
  ): PlaygroundBootstrapResult {
    const playground = this.config.getOrThrow<PlaygroundResolvedConfig>('playground');
    const apiKey = decryptPlaygroundSecret(
      session.apiKeyCiphertext,
      playground.sessionSecret,
    );

    return {
      projectId: session.projectId,
      projectName: session.projectName,
      apiKey,
      playgroundToken: createPlaygroundToken(
        { visitorId: session.visitorId, projectId: session.projectId },
        playground.sessionSecret,
        playground.projectTtlDays,
      ),
    };
  }

  private async enforceBootstrapRateLimit(clientIp: string): Promise<void> {
    const playground = this.config.getOrThrow<PlaygroundResolvedConfig>('playground');
    const windowSec = 24 * 60 * 60;
    const key = `playground:bootstrap:ip:${clientIp}`;
    const { count } = await this.increment(key, windowSec);

    if (count > playground.maxBootstrapPerIpPerDay) {
      throw new ForbiddenException({
        errorCode: ErrorCode.TOO_MANY_REQUESTS,
        message: 'Too many playground projects created from this network.',
      });
    }
  }

  private async increment(
    key: string,
    windowSec: number,
  ): Promise<{ count: number }> {
    const redisKey = `ratelimit:${key}`;
    const count = await this.redis.incrWithTtl(redisKey, windowSec);
    if (count != null) {
      return { count };
    }

    const now = Date.now();
    const bucket = this.bootstrapMemory.get(key);
    if (!bucket || bucket.resetAt <= now) {
      this.bootstrapMemory.set(key, { count: 1, resetAt: now + windowSec * 1000 });
      return { count: 1 };
    }

    bucket.count += 1;
    return { count: bucket.count };
  }
}
