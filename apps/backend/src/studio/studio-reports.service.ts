import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type {
  CreateStudioReportDto,
  Paginated,
  PaginationQuery,
  StudioReportData,
  StudioReportStatus,
  UpdateStudioReportStatusDto,
} from '@ahmedrioueche/actocore-shared';
import {
  ErrorCode,
  StudioReportStatus as ReportStatus,
} from '@ahmedrioueche/actocore-shared';
import { Model } from 'mongoose';
import {
  normalizePagination,
  paginate,
} from '../common/pagination/pagination.util';
import type { StudioRequestContext } from './studio-context';
import {
  StudioAccount,
  StudioAccountDocument,
} from './schemas/studio-account.schema';
import {
  StudioReport,
  StudioReportDocument,
} from './schemas/studio-report.schema';
import { StudioEmailService } from './studio-email.service';

export type ListReportsFilters = {
  search?: string;
  status?: string;
  type?: string;
};

@Injectable()
export class StudioReportsService {
  private static readonly REPORT_COOLDOWN_MS = 60 * 60 * 1000;

  private readonly logger = new Logger(StudioReportsService.name);

  constructor(
    @InjectModel(StudioReport.name)
    private readonly reportModel: Model<StudioReportDocument>,
    @InjectModel(StudioAccount.name)
    private readonly accountModel: Model<StudioAccountDocument>,
    private readonly email: StudioEmailService,
  ) {}

  async create(
    ctx: StudioRequestContext,
    body: CreateStudioReportDto,
  ): Promise<StudioReportData> {
    await this.assertReportCooldown(ctx.userId);

    const account = await this.accountModel.findById(ctx.accountId).exec();
    const accountName = account?.name ?? 'Workspace';

    const doc = await this.reportModel.create({
      accountId: ctx.accountId,
      accountName,
      reporterUserId: ctx.userId,
      reporterEmail: ctx.email,
      reporterDisplayName: ctx.username,
      type: body.type,
      subject: body.subject?.trim() || undefined,
      message: body.message.trim(),
      status: ReportStatus.OPEN,
    });

    const data = this.toData(doc);
    void this.notifyByEmail(data).catch((err) => {
      this.logger.error('Failed to send report notification email', err);
    });

    return data;
  }

  async getForAccount(
    accountId: string,
    reportId: string,
  ): Promise<StudioReportData> {
    const doc = await this.reportModel
      .findOne({ _id: reportId, accountId })
      .exec();
    if (!doc) {
      throw new NotFoundException('Report not found');
    }
    return this.toData(doc);
  }

  async listForAccount(
    accountId: string,
    query: PaginationQuery = {},
  ): Promise<Paginated<StudioReportData>> {
    const { page, limit, skip } = normalizePagination(query);
    const filter = { accountId };

    const [docs, total] = await Promise.all([
      this.reportModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.reportModel.countDocuments(filter).exec(),
    ]);

    return paginate(
      docs.map((doc) => this.toData(doc)),
      total,
      { page, limit },
    );
  }

  async getById(reportId: string): Promise<StudioReportData> {
    const doc = await this.reportModel.findById(reportId).exec();
    if (!doc) {
      throw new NotFoundException('Report not found');
    }
    return this.toData(doc);
  }

  async listAll(
    filters: ListReportsFilters,
    query: PaginationQuery = {},
  ): Promise<Paginated<StudioReportData>> {
    const { page, limit, skip } = normalizePagination(query);
    const filter: Record<string, unknown> = {};

    if (filters.status?.trim()) {
      filter.status = filters.status.trim();
    }
    if (filters.type?.trim()) {
      filter.type = filters.type.trim();
    }
    if (filters.search?.trim()) {
      const search = filters.search.trim();
      filter.$or = [
        { accountName: { $regex: search, $options: 'i' } },
        { reporterEmail: { $regex: search, $options: 'i' } },
        { reporterDisplayName: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } },
      ];
    }

    const [docs, total] = await Promise.all([
      this.reportModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.reportModel.countDocuments(filter).exec(),
    ]);

    return paginate(
      docs.map((doc) => this.toData(doc)),
      total,
      { page, limit },
    );
  }

  async updateStatus(
    reportId: string,
    body: UpdateStudioReportStatusDto,
  ): Promise<StudioReportData> {
    const doc = await this.reportModel
      .findByIdAndUpdate(
        reportId,
        { status: body.status as StudioReportStatus },
        { new: true },
      )
      .exec();
    if (!doc) {
      throw new NotFoundException('Report not found');
    }
    return this.toData(doc);
  }

  private async notifyByEmail(report: StudioReportData): Promise<void> {
    await this.email.sendStudioReportNotification(report);
  }

  private async assertReportCooldown(userId: string): Promise<void> {
    const cooldownStart = new Date(
      Date.now() - StudioReportsService.REPORT_COOLDOWN_MS,
    );
    const recent = await this.reportModel
      .findOne({
        reporterUserId: userId,
        createdAt: { $gte: cooldownStart },
      })
      .sort({ createdAt: -1 })
      .exec();

    if (!recent) {
      return;
    }

    const createdAt = recent.createdAt ?? new Date();
    const retryAfterMs =
      createdAt.getTime() +
      StudioReportsService.REPORT_COOLDOWN_MS -
      Date.now();
    const retryAfterSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000));

    throw new HttpException(
      {
        errorCode: ErrorCode.REPORT_RATE_LIMIT,
        message: 'You can submit one report per hour.',
        details: { retryAfterSeconds },
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }

  private toData(doc: StudioReportDocument): StudioReportData {
    return {
      id: doc._id.toString(),
      accountId: doc.accountId,
      accountName: doc.accountName,
      reporterUserId: doc.reporterUserId,
      reporterEmail: doc.reporterEmail,
      reporterDisplayName: doc.reporterDisplayName,
      type: doc.type,
      subject: doc.subject,
      message: doc.message,
      status: doc.status,
      createdAt: (doc.createdAt ?? new Date()).toISOString(),
      updatedAt: (doc.updatedAt ?? new Date()).toISOString(),
    };
  }
}
