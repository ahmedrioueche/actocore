import {
  DEFAULT_CURRENCY,
  normalizeStudioPlanLocaleText,
  sanitizeStudioPlanFeatures,
  sanitizeStudioPlanLocaleText,
  type AppPlanLevel,
  type CreateStudioPlanDto,
  type Paginated,
  type PaginationQuery,
  type StudioPlan,
  type UpdateStudioPlanDto,
} from '@ahmedrioueche/actocore-shared';
import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  normalizePagination,
  paginate,
} from '../common/pagination/pagination.util';
import { getAppEnvironment } from '../config/mongodb.config';
import { StudioPlanModel } from './schemas/billing.schema';
import { StudioPayPalCatalogService } from './studio-paypal-catalog.service';
import { normalizeStudioPlanLimits } from './studio-plan-limits.util';
import { seedDefaultStudioPlans } from './studio-plans-seed.util';
import {
  paidPlanNeedsPayPalSync,
  pricingCycleChanged,
} from './utils/studio-paypal-catalog.util';

@Injectable()
export class StudioPlansService implements OnApplicationBootstrap {
  private readonly logger = new Logger(StudioPlansService.name);

  constructor(
    @InjectModel(StudioPlanModel.name)
    private readonly planModel: Model<StudioPlanModel>,
    @Inject(forwardRef(() => StudioPayPalCatalogService))
    private readonly paypalCatalog: StudioPayPalCatalogService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    if (getAppEnvironment() !== 'development') {
      return;
    }

    try {
      await seedDefaultStudioPlans(this.planModel);
      this.logger.log('Ensured default studio plans (development bootstrap)');
    } catch (err) {
      this.logger.error('Failed to seed default studio plans', err);
    }
  }

  async create(dto: CreateStudioPlanDto): Promise<StudioPlan> {
    this.validatePaidPricing(dto.level, dto.pricing);
    const doc = await this.planModel.create({
      ...dto,
      description: sanitizeStudioPlanLocaleText(dto.description),
      yearlyDiscountBadge: sanitizeStudioPlanLocaleText(dto.yearlyDiscountBadge),
      features: sanitizeStudioPlanFeatures(dto.features),
      version: 1,
      isActive: dto.isActive ?? true,
      trialDays: dto.trialDays ?? 0,
    });

    if (paidPlanNeedsPayPalSync(doc.level, doc.pricing)) {
      await this.applyPayPalCatalogSync(doc);
    }

    return this.toPlan(doc);
  }

  async list(includeInactive = false): Promise<StudioPlan[]> {
    const filter = includeInactive ? {} : { isActive: { $ne: false } };
    const docs = await this.planModel.find(filter).sort({ order: 1, level: 1 }).exec();
    return docs.map((d) => this.toPlan(d));
  }

  /** Paginated variant used by the Studio admin plans list route. */
  async listPaginated(
    includeInactive = false,
    query: PaginationQuery = {},
  ): Promise<Paginated<StudioPlan>> {
    const { page, limit, skip } = normalizePagination(query);
    const filter = includeInactive ? {} : { isActive: { $ne: false } };

    const [docs, total] = await Promise.all([
      this.planModel
        .find(filter)
        .sort({ order: 1, level: 1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.planModel.countDocuments(filter).exec(),
    ]);

    return paginate(
      docs.map((d) => this.toPlan(d)),
      total,
      { page, limit },
    );
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
    if (dto.description !== undefined) {
      doc.description = sanitizeStudioPlanLocaleText(dto.description);
    }
    if (dto.yearlyDiscountBadge !== undefined) {
      doc.yearlyDiscountBadge = sanitizeStudioPlanLocaleText(
        dto.yearlyDiscountBadge,
      );
    }
    if (dto.features !== undefined) {
      doc.features = sanitizeStudioPlanFeatures(dto.features);
    }

    const pricingChanged =
      dto.pricing != null
        ? pricingCycleChanged(doc.pricing, dto.pricing)
        : { monthly: false, yearly: false };

    const { description, yearlyDiscountBadge, features, ...rest } = dto;
    Object.assign(doc, rest);

    const shouldSyncPayPal =
      paidPlanNeedsPayPalSync(doc.level, doc.pricing) &&
      (pricingChanged.monthly ||
        pricingChanged.yearly ||
        !doc.paypalPlanIds?.monthly ||
        !doc.paypalPlanIds?.yearly);

    if (shouldSyncPayPal) {
      await this.applyPayPalCatalogSync(doc);
    }

    await doc.save();
    return this.toPlan(doc);
  }

  async syncPayPalCatalog(id: string): Promise<StudioPlan> {
    const doc = await this.planModel.findById(id).exec();
    if (!doc) {
      throw new NotFoundException('Plan not found');
    }
    if (doc.level === 'free') {
      throw new BadRequestException('Free plan does not use PayPal catalog');
    }
    if (!this.paypalCatalog.isConfigured()) {
      throw new BadRequestException('PayPal is not configured');
    }
    await this.applyPayPalCatalogSync(doc);
    await doc.save();
    return this.toPlan(doc);
  }

  private async applyPayPalCatalogSync(doc: StudioPlanModel): Promise<void> {
    const result = await this.paypalCatalog.syncPlanCatalog(doc);
    if (result.skipped) {
      return;
    }
    if (result.paypalProductId) {
      doc.paypalProductId = result.paypalProductId;
    }
    if (result.paypalPlanIds) {
      doc.paypalPlanIds = result.paypalPlanIds;
    }
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

  async findByPayPalPlanId(planId: string): Promise<StudioPlanModel | null> {
    return this.planModel
      .findOne({
        $or: [
          { 'paypalPlanIds.monthly': planId },
          { 'paypalPlanIds.yearly': planId },
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
      description: normalizeStudioPlanLocaleText(doc.description),
      isActive: doc.isActive,
      pricing: doc.pricing as StudioPlan['pricing'],
      paypalProductId: doc.paypalProductId,
      paypalPlanIds: doc.paypalPlanIds,
      trialDays: doc.trialDays,
      limits: normalizeStudioPlanLimits(doc.limits),
      features: sanitizeStudioPlanFeatures(doc.features),
      isRecommended: doc.isRecommended ?? false,
      yearlyDiscountBadge: normalizeStudioPlanLocaleText(
        doc.yearlyDiscountBadge,
      ),
      createdAt: (doc.createdAt ?? new Date()).toISOString(),
      updatedAt: doc.updatedAt?.toISOString(),
    };
  }
}
