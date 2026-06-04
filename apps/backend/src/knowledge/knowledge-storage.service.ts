import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { KnowledgeResolvedConfig } from '../config/knowledge.config';

@Injectable()
export class KnowledgeStorageService {
  constructor(private readonly config: ConfigService) {}

  private get cfg(): KnowledgeResolvedConfig {
    return this.config.getOrThrow<KnowledgeResolvedConfig>('knowledge');
  }

  storageKey(projectId: string, sourceId: string, originalFilename: string): string {
    const safe = originalFilename.replace(/[^a-zA-Z0-9._-]/g, '_');
    return `${projectId}/${sourceId}/${safe}`;
  }

  async save(
    storageKey: string,
    buffer: Buffer,
  ): Promise<void> {
    const fullPath = join(this.cfg.storagePath, storageKey);
    await mkdir(dirname(fullPath), { recursive: true });
    await writeFile(fullPath, buffer);
  }

  async remove(storageKey: string | undefined): Promise<void> {
    if (!storageKey?.trim()) {
      return;
    }
    const fullPath = join(this.cfg.storagePath, storageKey);
    try {
      await unlink(fullPath);
    } catch {
      // ignore missing file on delete
    }
  }
}
