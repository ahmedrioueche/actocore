import {
  BadRequestException,
  ForbiddenException,
  Injectable,
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
  resolveProductTourActiveStep,
  STUDIO_PRODUCT_TOUR_STEPS,
  STUDIO_PRODUCT_TOUR_VERSION,
  StudioRole,
} from '@ahmedrioueche/actocore-shared';
import { Model, Types } from 'mongoose';
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

@Injectable()
export class StudioProductTourService {
  constructor(
    @InjectModel(StudioMembership.name)
    private readonly membershipModel: Model<StudioMembershipDocument>,
    @InjectModel(StudioAccount.name)
    private readonly accountModel: Model<StudioAccountDocument>,
  ) {}

  async getState(ctx: StudioRequestContext): Promise<StudioProductTourStateData> {
    const membership = await this.requireMembership(ctx);
    const eligible = await this.isEligible(ctx);
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

    const membership = await this.requireMembership(ctx);
    const tour = this.ensureProductTour(membership);

    if (body.dismiss === true) {
      tour.dismissed = true;
    } else if (body.completeStep || body.completeSteps?.length) {
      this.markStepsComplete(tour, [
        ...(body.completeSteps ?? []),
        ...(body.completeStep ? [body.completeStep] : []),
      ]);

      const inaccessible = getProductTourStepsToAutoComplete(
        this.normalizedCompletedSteps(tour),
        ctx.permissions,
      );
      if (inaccessible.length > 0) {
        this.markStepsComplete(tour, inaccessible);
      }
    } else {
      throw new BadRequestException({
        errorCode: ErrorCode.VALIDATION_ERROR,
        message: 'Provide completeStep, completeSteps, or dismiss',
      });
    }

    await membership.save();
    return this.toStateData(membership, ctx.permissions, eligible);
  }

  private async isEligible(ctx: StudioRequestContext): Promise<boolean> {
    if (
      ctx.role !== StudioRole.USER_ADMIN &&
      ctx.role !== StudioRole.SUPER_ADMIN
    ) {
      return false;
    }

    const account = await this.accountModel.findById(ctx.accountId).exec();
    if (!account?.onboarding) {
      return false;
    }

    return account.onboarding.completed === true && account.onboarding.skipped !== true;
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
}
