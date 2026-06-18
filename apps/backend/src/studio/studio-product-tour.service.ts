import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type {
  StudioProductTourStateData,
  StudioProductTourStep,
  UpdateStudioProductTourDto,
} from '@ahmedrioueche/actocore-shared';
import {
  ErrorCode,
  getProductTourStepsToAutoComplete,
  isStudioProductTourStep,
  isStudioTestAccountEmail,
  resolveProductTourActiveStep,
  STUDIO_PRODUCT_TOUR_STEPS,
  STUDIO_PRODUCT_TOUR_VERSION,
  STUDIO_TEST_ACCOUNT_LEASE_TTL_SECONDS,
  StudioRole,
} from '@ahmedrioueche/actocore-shared';
import { Model, Types } from 'mongoose';
import { RedisService } from '../redis/redis.service';
import type { StudioRequestContext } from './studio-context';
import {
  StudioAccount,
  StudioAccountDocument,
} from './schemas/studio-account.schema';
import {
  StudioMembership,
  StudioMembershipDocument,
  StudioProductTourSchema,
} from './schemas/studio-membership.schema';

type DemoTourRecord = {
  version: number;
  dismissed: boolean;
  completedSteps: string[];
  expiresAt: number;
};

@Injectable()
export class StudioProductTourService {
  private readonly logger = new Logger(StudioProductTourService.name);
  private readonly memoryDemoTours = new Map<string, DemoTourRecord>();

  constructor(
    @InjectModel(StudioMembership.name)
    private readonly membershipModel: Model<StudioMembershipDocument>,
    @InjectModel(StudioAccount.name)
    private readonly accountModel: Model<StudioAccountDocument>,
    private readonly redis: RedisService,
  ) {}

  async getState(ctx: StudioRequestContext): Promise<StudioProductTourStateData> {
    const eligible = await this.isEligible(ctx);
    if (this.isDemoSession(ctx)) {
      const tour = await this.readDemoTour(ctx.testAccountLeaseId!);
      return this.toStateDataFromTour(tour, ctx.permissions, eligible);
    }

    const membership = await this.requireMembership(ctx);
    return this.toStateData(membership, ctx.permissions, eligible);
  }

  async updateState(
    ctx: StudioRequestContext,
    body: UpdateStudioProductTourDto,
  ): Promise<StudioProductTourStateData> {
    const eligible = await this.isEligible(ctx);
    if (!eligible) {
      throw new ForbiddenException({
        errorCode: ErrorCode.FORBIDDEN,
        message: 'Product tour is not available for this user',
      });
    }

    if (this.isDemoSession(ctx)) {
      const leaseId = ctx.testAccountLeaseId!;
      const tour = await this.readDemoTour(leaseId);
      this.applyTourUpdate(tour, body, ctx.permissions);
      await this.writeDemoTour(leaseId, tour);
      return this.toStateDataFromTour(tour, ctx.permissions, eligible);
    }

    const membership = await this.requireMembership(ctx);
    const tour = this.ensureProductTour(membership);
    this.applyTourUpdate(tour, body, ctx.permissions);
    await membership.save();
    return this.toStateData(membership, ctx.permissions, eligible);
  }

  private applyTourUpdate(
    tour: StudioProductTourSchema,
    body: UpdateStudioProductTourDto,
    permissions: string[],
  ): void {
    if (body.dismiss === true) {
      tour.dismissed = true;
      return;
    }

    if (body.completeStep || body.completeSteps?.length) {
      this.markStepsComplete(tour, [
        ...(body.completeSteps ?? []),
        ...(body.completeStep ? [body.completeStep] : []),
      ]);

      const inaccessible = getProductTourStepsToAutoComplete(
        this.normalizedCompletedSteps(tour),
        permissions,
      );
      if (inaccessible.length > 0) {
        this.markStepsComplete(tour, inaccessible);
      }
      return;
    }

    throw new BadRequestException({
      errorCode: ErrorCode.VALIDATION_ERROR,
      message: 'Provide completeStep, completeSteps, or dismiss',
    });
  }

  private isDemoSession(ctx: StudioRequestContext): boolean {
    return (
      Boolean(ctx.email && isStudioTestAccountEmail(ctx.email)) &&
      Boolean(ctx.testAccountLeaseId?.trim())
    );
  }

  private async isEligible(ctx: StudioRequestContext): Promise<boolean> {
    if (
      ctx.role !== StudioRole.USER_ADMIN &&
      ctx.role !== StudioRole.SUPER_ADMIN
    ) {
      return false;
    }

    if (this.isDemoSession(ctx)) {
      return true;
    }

    const account = await this.accountModel.findById(ctx.accountId).exec();
    if (!account?.onboarding) {
      return false;
    }

    return (
      account.onboarding.completed === true &&
      account.onboarding.skipped !== true
    );
  }

  private async requireMembership(
    ctx: StudioRequestContext,
  ): Promise<StudioMembershipDocument> {
    const membership = await this.membershipModel
      .findOne({
        userId: new Types.ObjectId(ctx.userId),
        accountId: new Types.ObjectId(ctx.accountId),
      })
      .exec();

    if (!membership) {
      throw new NotFoundException({
        errorCode: ErrorCode.NOT_FOUND,
        message: 'Membership not found',
      });
    }

    return membership;
  }

  private ensureProductTour(
    membership: StudioMembershipDocument,
  ): StudioProductTourSchema {
    if (!membership.productTour) {
      membership.productTour = {
        version: STUDIO_PRODUCT_TOUR_VERSION,
        dismissed: false,
        completedSteps: [],
      };
    }
    return membership.productTour;
  }

  private markStepsComplete(
    tour: StudioProductTourSchema,
    steps: StudioProductTourStep[],
  ): void {
    const completed = new Set(this.normalizedCompletedSteps(tour));
    for (const step of steps) {
      if (isStudioProductTourStep(step)) {
        completed.add(step);
      }
    }
    tour.completedSteps = STUDIO_PRODUCT_TOUR_STEPS.filter((step) =>
      completed.has(step),
    );
  }

  private normalizedCompletedSteps(
    tour: StudioProductTourSchema,
  ): StudioProductTourStep[] {
    return (tour.completedSteps ?? []).filter((step): step is StudioProductTourStep =>
      isStudioProductTourStep(step),
    );
  }

  private toStateData(
    membership: StudioMembershipDocument,
    permissions: string[],
    eligible: boolean,
  ): StudioProductTourStateData {
    const tour = this.ensureProductTour(membership);
    return this.toStateDataFromTour(tour, permissions, eligible);
  }

  private toStateDataFromTour(
    tour: StudioProductTourSchema,
    permissions: string[],
    eligible: boolean,
  ): StudioProductTourStateData {
    const completedSteps = this.normalizedCompletedSteps(tour);

    return {
      version: tour.version ?? STUDIO_PRODUCT_TOUR_VERSION,
      dismissed: tour.dismissed ?? false,
      completedSteps,
      eligible,
      activeStep: resolveProductTourActiveStep(
        completedSteps,
        permissions,
        tour.dismissed ?? false,
        eligible,
      ),
    };
  }

  private demoTourKey(leaseId: string): string {
    return `studio:demo-product-tour:${leaseId}`;
  }

  private createEmptyDemoTour(): DemoTourRecord {
    return {
      version: STUDIO_PRODUCT_TOUR_VERSION,
      dismissed: false,
      completedSteps: [],
      expiresAt: Date.now() + STUDIO_TEST_ACCOUNT_LEASE_TTL_SECONDS * 1000,
    };
  }

  private async readDemoTour(leaseId: string): Promise<StudioProductTourSchema> {
    const fromRedis = await this.readRedisDemoTour(leaseId);
    if (fromRedis) {
      return fromRedis;
    }

    const fromMemory = this.readMemoryDemoTour(leaseId);
    if (fromMemory) {
      return fromMemory;
    }

    return this.createEmptyDemoTour();
  }

  private async writeDemoTour(
    leaseId: string,
    tour: StudioProductTourSchema,
  ): Promise<void> {
    const record: DemoTourRecord = {
      version: tour.version ?? STUDIO_PRODUCT_TOUR_VERSION,
      dismissed: tour.dismissed ?? false,
      completedSteps: tour.completedSteps ?? [],
      expiresAt: Date.now() + STUDIO_TEST_ACCOUNT_LEASE_TTL_SECONDS * 1000,
    };

    const storedInRedis = await this.writeRedisDemoTour(leaseId, record);
    if (!storedInRedis) {
      this.writeMemoryDemoTour(leaseId, record);
    }
  }

  private async readRedisDemoTour(
    leaseId: string,
  ): Promise<StudioProductTourSchema | null> {
    const client = this.redis.getClient();
    if (!client) {
      return null;
    }

    try {
      if (client.status !== 'ready') {
        await client.connect();
      }
      const raw = await client.get(this.demoTourKey(leaseId));
      if (!raw) {
        return null;
      }
      const parsed = JSON.parse(raw) as DemoTourRecord;
      return {
        version: parsed.version ?? STUDIO_PRODUCT_TOUR_VERSION,
        dismissed: parsed.dismissed ?? false,
        completedSteps: parsed.completedSteps ?? [],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Redis unavailable for demo product tour (${message})`);
      return null;
    }
  }

  private async writeRedisDemoTour(
    leaseId: string,
    record: DemoTourRecord,
  ): Promise<boolean> {
    const client = this.redis.getClient();
    if (!client) {
      return false;
    }

    try {
      if (client.status !== 'ready') {
        await client.connect();
      }
      await client.set(
        this.demoTourKey(leaseId),
        JSON.stringify(record),
        'EX',
        STUDIO_TEST_ACCOUNT_LEASE_TTL_SECONDS,
      );
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Failed to persist demo product tour (${message})`);
      return false;
    }
  }

  private readMemoryDemoTour(leaseId: string): StudioProductTourSchema | null {
    const record = this.memoryDemoTours.get(leaseId);
    if (!record) {
      return null;
    }
    if (record.expiresAt <= Date.now()) {
      this.memoryDemoTours.delete(leaseId);
      return null;
    }
    return {
      version: record.version,
      dismissed: record.dismissed,
      completedSteps: record.completedSteps,
    };
  }

  private writeMemoryDemoTour(leaseId: string, record: DemoTourRecord): void {
    this.memoryDemoTours.set(leaseId, record);
  }
}
