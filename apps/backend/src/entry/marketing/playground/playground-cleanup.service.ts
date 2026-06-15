import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { PlaygroundResolvedConfig } from '../../../config/playground.config';
import { PlaygroundService } from './playground.service';

const CLEANUP_INTERVAL_MS = 6 * 60 * 60 * 1000;

@Injectable()
export class PlaygroundCleanupService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PlaygroundCleanupService.name);
  private timer?: ReturnType<typeof setInterval>;

  constructor(
    private readonly config: ConfigService,
    private readonly playground: PlaygroundService,
  ) {}

  onModuleInit(): void {
    const enabled = this.config.get<PlaygroundResolvedConfig>('playground')?.enabled;
    if (!enabled) {
      return;
    }

    void this.runCleanup();
    this.timer = setInterval(() => {
      void this.runCleanup();
    }, CLEANUP_INTERVAL_MS);
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  private async runCleanup(): Promise<void> {
    try {
      await this.playground.cleanupExpiredSessions();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Playground cleanup failed: ${message}`);
    }
  }
}
