import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type {
  StudioOnboardingStateData,
  StudioOnboardingStep,
  UpdateStudioOnboardingDto,
} from '@ahmedrioueche/actocore-shared';
import {
  ErrorCode,
  resolveOnboardingCurrentStep,
  STUDIO_ONBOARDING_STEPS,
  StudioRole,
} from '@ahmedrioueche/actocore-shared';
import { Model, Types } from 'mongoose';
import type { StudioRequestContext } from './studio-context';
import {
  StudioAccount,
  StudioAccountDocument,
  StudioOnboardingSchema,
} from './schemas/studio-account.schema';

@Injectable()
export class StudioOnboardingService {
  constructor(
    @InjectModel(StudioAccount.name)
    private readonly accountModel: Model<StudioAccountDocument>,
  ) {}

  async getState(ctx: StudioRequestContext): Promise<StudioOnboardingStateData> {
    if (!this.isOnboardingRequired(ctx.role)) {
      return this.editorSkippedState();
    }

    const account = await this.requireAccount(ctx.accountId);
    return this.toStateData(account);
  }

  async updateState(
    ctx: StudioRequestContext,
    body: UpdateStudioOnboardingDto,
  ): Promise<StudioOnboardingStateData> {
    if (!this.isOnboardingRequired(ctx.role)) {
      throw new ForbiddenException({
        errorCode: ErrorCode.FORBIDDEN,
        message: 'Onboarding is not available for this role',
      });
    }

    this.assertAccountAdmin(ctx);

    const account = await this.requireAccount(ctx.accountId);
    const onboarding = this.ensureOnboarding(account);

    if (body.skip === true) {
      onboarding.skipped = true;
      onboarding.completed = true;
      onboarding.completedAt = new Date();
      onboarding.currentStep = 'done';
    } else if (body.complete === true) {
      onboarding.completed = true;
      onboarding.skipped = false;
      onboarding.completedAt = new Date();
      onboarding.completedSteps = [...STUDIO_ONBOARDING_STEPS];
      onboarding.currentStep = 'done';
    } else if (body.completeStep) {
      this.markStepComplete(onboarding, body.completeStep);
    } else {
      throw new BadRequestException({
        errorCode: ErrorCode.VALIDATION_ERROR,
        message: 'Provide completeStep, skip, or complete',
      });
    }

    await account.save();
    return this.toStateData(account);
  }

  private isOnboardingRequired(role: StudioRole): boolean {
    return role === StudioRole.USER_ADMIN || role === StudioRole.SUPER_ADMIN;
  }

  private assertAccountAdmin(ctx: StudioRequestContext): void {
    if (
      ctx.role !== StudioRole.USER_ADMIN &&
      ctx.role !== StudioRole.SUPER_ADMIN
    ) {
      throw new ForbiddenException({
        errorCode: ErrorCode.INSUFFICIENT_PERMISSIONS,
        message: 'Workspace admin access required',
      });
    }
  }

  private async requireAccount(
    accountId: string,
  ): Promise<StudioAccountDocument> {
    if (!Types.ObjectId.isValid(accountId)) {
      throw new NotFoundException({
        errorCode: ErrorCode.NOT_FOUND,
        message: 'Workspace not found',
      });
    }
    const account = await this.accountModel.findById(accountId).exec();
    if (!account) {
      throw new NotFoundException({
        errorCode: ErrorCode.NOT_FOUND,
        message: 'Workspace not found',
      });
    }
    return account;
  }

  private ensureOnboarding(account: StudioAccountDocument): StudioOnboardingSchema {
    if (!account.onboarding) {
      account.onboarding = {
        completed: false,
        skipped: false,
        completedSteps: [],
        currentStep: 'welcome',
      };
    }
    return account.onboarding;
  }

  private markStepComplete(
    onboarding: StudioOnboardingSchema,
    step: StudioOnboardingStep,
  ): void {
    const steps = new Set(
      (onboarding.completedSteps ?? []).filter((s): s is StudioOnboardingStep =>
        STUDIO_ONBOARDING_STEPS.includes(s as StudioOnboardingStep),
      ),
    );
    steps.add(step);
    onboarding.completedSteps = [...steps];
    onboarding.currentStep = resolveOnboardingCurrentStep(
      onboarding.completedSteps as StudioOnboardingStep[],
      onboarding.completed,
      onboarding.skipped,
    );
    if (onboarding.currentStep === 'done') {
      onboarding.completed = true;
      onboarding.completedAt = new Date();
    }
  }

  private toStateData(account: StudioAccountDocument): StudioOnboardingStateData {
    const onboarding = this.ensureOnboarding(account);
    const completedSteps = (onboarding.completedSteps ?? []).filter(
      (s): s is StudioOnboardingStep =>
        STUDIO_ONBOARDING_STEPS.includes(s as StudioOnboardingStep),
    );

    return {
      required: true,
      completed: onboarding.completed,
      skipped: onboarding.skipped,
      completedAt: onboarding.completedAt?.toISOString(),
      currentStep: resolveOnboardingCurrentStep(
        completedSteps,
        onboarding.completed,
        onboarding.skipped,
      ),
      completedSteps,
    };
  }

  private editorSkippedState(): StudioOnboardingStateData {
    return {
      required: false,
      completed: true,
      skipped: false,
      currentStep: 'done',
      completedSteps: [...STUDIO_ONBOARDING_STEPS],
    };
  }
}
