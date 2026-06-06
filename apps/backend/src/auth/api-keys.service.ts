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
  Paginated,
  PaginationQuery,
  UpdateApiKeyDto,
} from '@ahmedrioueche/actocore-shared';
import { Model } from 'mongoose';
import {
  normalizePagination,
  paginate,
} from '../common/pagination/pagination.util';
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
import { StudioAccessService } from '../studio/studio-access.service';
import type { StudioRequestContext } from '../studio/studio-context';

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
    private readonly studioAccess: StudioAccessService,
  ) {}

  async listForProject(
    ctx: StudioRequestContext | null,
    projectId: string,
    includeRevoked = false,
  ): Promise<ApiKeyMetadata[]> {
    if (ctx) {
      this.studioAccess.assertProjectAccess(ctx, projectId);
      await this.projects.assertExistsForAccount(ctx, projectId);
    } else {
      await this.projects.assertExists(projectId);
    }

    const docs = await this.apiKeyModel
      .find(
        includeRevoked
          ? { projectId }
          : { projectId, revokedAt: { $exists: false } },
      )
      .sort({ createdAt: -1 })
      .exec();

    return docs.map((doc) => this.toMetadata(doc));
  }

  /** Paginated variant used by the Studio api-keys list route. */
  async listForProjectPaginated(
    ctx: StudioRequestContext | null,
    projectId: string,
    options: { includeRevoked?: boolean } & PaginationQuery = {},
  ): Promise<Paginated<ApiKeyMetadata>> {
    if (ctx) {
      this.studioAccess.assertProjectAccess(ctx, projectId);
      await this.projects.assertExistsForAccount(ctx, projectId);
    } else {
      await this.projects.assertExists(projectId);
    }

    const { page, limit, skip } = normalizePagination(options);
    const filter = options.includeRevoked
      ? { projectId }
      : { projectId, revokedAt: { $exists: false } };

    const [docs, total] = await Promise.all([
      this.apiKeyModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.apiKeyModel.countDocuments(filter).exec(),
    ]);

    return paginate(
      docs.map((doc) => this.toMetadata(doc)),
      total,
      { page, limit },
    );
  }

  async rotateAllForProject(
    ctx: StudioRequestContext | null,
    projectId: string,
  ): Promise<{ revokedCount: number }> {
    if (ctx) {
      this.studioAccess.assertProjectAccess(ctx, projectId);
      await this.projects.assertExistsForAccount(ctx, projectId);
    } else {
      await this.projects.assertExists(projectId);
    }

    const result = await this.apiKeyModel.updateMany(
      { projectId, revokedAt: { $exists: false } },
      { revokedAt: new Date() },
    );

    return { revokedCount: result.modifiedCount ?? 0 };
  }

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

  async revoke(
    ctx: StudioRequestContext | null,
    keyId: string,
  ): Promise<ApiKeyMetadata> {
    const existing = await this.apiKeyModel.findById(keyId).exec();
    if (!existing) {
      throw new NotFoundException(`API key ${keyId} not found`);
    }

    if (ctx) {
      this.studioAccess.assertProjectAccess(ctx, existing.projectId);
      await this.projects.assertExistsForAccount(ctx, existing.projectId);
    }

    const doc = await this.apiKeyModel
      .findByIdAndUpdate(keyId, { revokedAt: new Date() }, { new: true })
      .exec();

    if (!doc) {
      throw new NotFoundException(`API key ${keyId} not found`);
    }

    return this.toMetadata(doc);
  }

  async update(
    ctx: StudioRequestContext | null,
    keyId: string,
    body: UpdateApiKeyDto,
  ): Promise<ApiKeyMetadata> {
    const existing = await this.apiKeyModel.findById(keyId).exec();
    if (!existing) {
      throw new NotFoundException(`API key ${keyId} not found`);
    }

    if (existing.revokedAt) {
      throw new NotFoundException(`API key ${keyId} not found`);
    }

    if (ctx) {
      this.studioAccess.assertProjectAccess(ctx, existing.projectId);
      await this.projects.assertExistsForAccount(ctx, existing.projectId);
    }

    const trimmedName = body.name?.trim();
    const doc = await this.apiKeyModel
      .findByIdAndUpdate(
        keyId,
        { name: trimmedName || undefined },
        { new: true },
      )
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
