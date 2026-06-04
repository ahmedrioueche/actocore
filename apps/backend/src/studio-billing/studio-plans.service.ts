import {
  DEFAULT_CURRENCY,
  type AppPlanLevel,
  type CreateStudioPlanDto,
  type StudioPlan,
  type UpdateStudioPlanDto,
} from '@ahmedrioueche/actocore-shared';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { StudioPlanModel } from './schemas/billing.schema';

@Injectable()
export class StudioPlansService {
  constructor(
    @InjectModel(StudioPlanModel.name)
    private readonly planModel: Model<StudioPlanModel>,
  ) {}

  async create(dto: CreateStudioPlanDto): Promise<StudioPlan> {
    this.validatePaidPricing(dto.level, dto.pricing);
    const doc = await this.planModel.create({
      ...dto,
      version: 1,
      isActive: dto.isActive ?? true,
      trialDays: dto.trialDays ?? 14,
    });
    return this.toPlan(doc);
  }

  async list(includeInactive = false): Promise<StudioPlan[]> {
    const filter = includeInactive ? {} : { isActive: { $ne: false } };
    const docs = await this.planModel.find(filter).sort({ order: 1, level: 1 }).exec();
    return docs.map((d) => this.toPlan(d));
  }

  async listPublic(): Promise<StudioPlan[]> {
    return this.list(false);
  }

  async getByMongoId(id: string): Promise<StudioPlan> {
    const doc = await this.planModel.findById(id).exec();
    if (!doc) {
      throw new NotFoundException('Plan not found');
    }
    return this.toPlan(doc);
  }

  async getByPlanId(planId: string): Promise<StudioPlanModel> {
    const doc = await this.planModel.findOne({ planId }).exec();
    if (!doc) {
      throw new NotFoundException(`Plan not found: ${planId}`);
    }
    return doc;
  }

  async update(id: string, dto: UpdateStudioPlanDto): Promise<StudioPlan> {
    const doc = await this.planModel.findById(id).exec();
    if (!doc) {
      throw new NotFoundException('Plan not found');
    }
    const level = dto.level ?? doc.level;
    if (dto.pricing) {
      this.validatePaidPricing(level, dto.pricing);
    }
    Object.assign(doc, dto);
    await doc.save();
    return this.toPlan(doc);
  }

  async remove(id: string): Promise<{ message: string; planId: string }> {
    const doc = await this.planModel.findById(id).exec();
    if (!doc) {
      throw new NotFoundException('Plan not found');
    }
    const planId = doc.planId;
    await doc.deleteOne();
    return { message: 'Plan deleted', planId };
  }

  async findByPaddlePriceId(priceId: string): Promise<StudioPlanModel | null> {
    return this.planModel
      .findOne({
        $or: [
          { 'paddlePriceIds.monthly': priceId },
          { 'paddlePriceIds.yearly': priceId },
        ],
      })
      .exec();
  }

  private validatePaidPricing(
    level: AppPlanLevel,
    pricing: Record<string, { monthly?: number; yearly?: number }>,
  ): void {
    if (level === 'free') {
      return;
    }
    const row = pricing[DEFAULT_CURRENCY] ?? {};
    const hasMonthly = row.monthly != null;
    const hasYearly = row.yearly != null;
    if (!hasMonthly && !hasYearly) {
      throw new BadRequestException(
        'Paid plans need monthly or yearly pricing in default currency',
      );
    }
  }

  toPlan(doc: StudioPlanModel): StudioPlan {
    return {
      id: doc._id.toString(),
      planId: doc.planId,
      version: doc.version,
      level: doc.level,
      order: doc.order,
      name: doc.name,
      description: doc.description,
      isActive: doc.isActive,
      pricing: doc.pricing as StudioPlan['pricing'],
      paddleProductId: doc.paddleProductId,
      paddlePriceIds: doc.paddlePriceIds,
      trialDays: doc.trialDays,
      limits: doc.limits ?? {},
      createdAt: (doc.createdAt ?? new Date()).toISOString(),
      updatedAt: doc.updatedAt?.toISOString(),
    };
  }
}
