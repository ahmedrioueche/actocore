import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import type {
  ApiKeyIssuedData,
  ApiKeyMetadata,
  CreateApiKeyDto,
} from '@ahmedrioueche/actocore-shared';
import { Model } from 'mongoose';
import { ApiKeyException } from './exceptions/api-key.exception';
import { ApiKey, ApiKeyDocument } from './schemas/api-key.schema';
import {
  extractKeyPrefix,
  generateApiKeySecret,
  verifyApiKey,
  hashApiKey,
} from './utils/api-key-crypto';
import { ErrorCode } from '@ahmedrioueche/actocore-shared';
import { ProjectsService } from '../projects/projects.service';

export interface ValidatedApiKey {
  id: string;
  projectId: string;
  prefix: string;
  name?: string;
}

@Injectable()
export class ApiKeysService {
  constructor(
    @InjectModel(ApiKey.name) private readonly apiKeyModel: Model<ApiKeyDocument>,
    private readonly config: ConfigService,
    private readonly projects: ProjectsService,
  ) {}

  async issue(body: CreateApiKeyDto): Promise<ApiKeyIssuedData> {
    await this.projects.assertExists(body.projectId);

    const rawKey = generateApiKeySecret();
    const prefix = extractKeyPrefix(rawKey);
    const keyHash = await hashApiKey(rawKey, this.getPepper());

    const doc = await this.apiKeyModel.create({
      projectId: body.projectId,
      prefix,
      keyHash,
      name: body.name,
    });

    return {
      id: doc._id.toString(),
      projectId: doc.projectId,
      prefix: doc.prefix,
      key: rawKey,
      name: doc.name,
      createdAt: (doc.createdAt ?? new Date()).toISOString(),
    };
  }

  async revoke(keyId: string): Promise<ApiKeyMetadata> {
    const doc = await this.apiKeyModel
      .findByIdAndUpdate(keyId, { revokedAt: new Date() }, { new: true })
      .exec();

    if (!doc) {
      throw new NotFoundException(`API key ${keyId} not found`);
    }

    return this.toMetadata(doc);
  }

  async validateBearerToken(
    authorizationHeader: string | undefined,
  ): Promise<ValidatedApiKey> {
    const rawKey = this.extractBearerToken(authorizationHeader);
    if (!rawKey) {
      throw new ApiKeyException(
        ErrorCode.API_KEY_MISSING,
        'Missing Bearer API key',
      );
    }

    if (!rawKey.startsWith('aco_')) {
      throw new ApiKeyException(
        ErrorCode.API_KEY_INVALID,
        'Invalid API key format',
      );
    }

    const prefix = extractKeyPrefix(rawKey);
    const doc = await this.apiKeyModel.findOne({ prefix }).exec();

    if (!doc) {
      throw new ApiKeyException(
        ErrorCode.API_KEY_INVALID,
        'Invalid API key',
      );
    }

    if (doc.revokedAt) {
      throw new ApiKeyException(
        ErrorCode.API_KEY_REVOKED,
        'API key has been revoked',
      );
    }

    const valid = await verifyApiKey(rawKey, this.getPepper(), doc.keyHash);
    if (!valid) {
      throw new ApiKeyException(
        ErrorCode.API_KEY_INVALID,
        'Invalid API key',
      );
    }

    return {
      id: doc._id.toString(),
      projectId: doc.projectId,
      prefix: doc.prefix,
      name: doc.name,
    };
  }

  async recordUsage(keyId: string): Promise<void> {
    await this.apiKeyModel
      .findByIdAndUpdate(keyId, { lastUsedAt: new Date() })
      .exec()
      .catch(() => undefined);
  }

  private extractBearerToken(
    authorizationHeader: string | undefined,
  ): string | undefined {
    if (!authorizationHeader?.startsWith('Bearer ')) {
      return undefined;
    }
    const token = authorizationHeader.slice('Bearer '.length).trim();
    return token || undefined;
  }

  private getPepper(): string {
    const pepper = this.config.get<string>('auth.apiKeyPepper');
    if (!pepper) {
      throw new ConflictException('API_KEY_PEPPER is not configured');
    }
    return pepper;
  }

  private toMetadata(doc: ApiKeyDocument): ApiKeyMetadata {
    return {
      id: doc._id.toString(),
      projectId: doc.projectId,
      prefix: doc.prefix,
      name: doc.name,
      createdAt: (doc.createdAt ?? new Date()).toISOString(),
      lastUsedAt: doc.lastUsedAt?.toISOString(),
      revokedAt: doc.revokedAt?.toISOString(),
    };
  }
}
