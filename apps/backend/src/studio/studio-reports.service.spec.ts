import { HttpException, NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import {
  ErrorCode,
  StudioReportStatus,
  StudioReportType,
} from '@ahmedrioueche/actocore-shared';
import { StudioReportsService } from './studio-reports.service';
import { StudioReport } from './schemas/studio-report.schema';
import { StudioAccount } from './schemas/studio-account.schema';
import { StudioEmailService } from './studio-email.service';

describe('StudioReportsService', () => {
  const accountId = '507f1f77bcf86cd799439011';
  const userId = '507f1f77bcf86cd799439012';

  const ctx = {
    userId,
    accountId,
    email: 'user@example.com',
    username: 'dev',
    role: 'user_admin' as const,
    permissions: [],
    projectIds: [],
  };

  let service: StudioReportsService;
  let reportModel: {
    create: jest.Mock;
    findOne: jest.Mock;
    find: jest.Mock;
    countDocuments: jest.Mock;
  };
  let accountModel: { findById: jest.Mock };
  let email: { sendStudioReportNotification: jest.Mock };

  beforeEach(async () => {
    reportModel = {
      create: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      countDocuments: jest.fn(),
    };
    accountModel = {
      findById: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({ name: 'Acme' }),
      }),
    };
    email = { sendStudioReportNotification: jest.fn().mockResolvedValue(undefined) };

    const moduleRef = await Test.createTestingModule({
      providers: [
        StudioReportsService,
        { provide: getModelToken(StudioReport.name), useValue: reportModel },
        { provide: getModelToken(StudioAccount.name), useValue: accountModel },
        { provide: StudioEmailService, useValue: email },
      ],
    }).compile();

    service = moduleRef.get(StudioReportsService);
  });

  it('creates a report for the workspace and notifies by email', async () => {
    reportModel.findOne.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      }),
    });

    const createdAt = new Date('2026-06-01T12:00:00.000Z');
    reportModel.create.mockResolvedValue({
      _id: { toString: () => 'report-1' },
      accountId,
      accountName: 'Acme',
      reporterUserId: userId,
      reporterEmail: 'user@example.com',
      reporterDisplayName: 'dev',
      type: StudioReportType.ISSUE,
      subject: 'Bug',
      message: 'Something broke in chat.',
      status: StudioReportStatus.OPEN,
      createdAt,
      updatedAt: createdAt,
    });

    const result = await service.create(ctx, {
      type: StudioReportType.ISSUE,
      subject: 'Bug',
      message: 'Something broke in chat.',
    });

    expect(result.id).toBe('report-1');
    expect(result.accountName).toBe('Acme');
    expect(email.sendStudioReportNotification).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'report-1', type: StudioReportType.ISSUE }),
    );
  });

  it('rejects a second report within one hour', async () => {
    const recentCreatedAt = new Date(Date.now() - 15 * 60 * 1000);
    reportModel.findOne.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          createdAt: recentCreatedAt,
        }),
      }),
    });

    await expect(
      service.create(
        ctx,
        {
          type: StudioReportType.FEEDBACK,
          message: 'Another report too soon.',
        },
      ),
    ).rejects.toBeInstanceOf(HttpException);

    expect(reportModel.create).not.toHaveBeenCalled();
  });

  it('includes retryAfterSeconds when the hourly limit is active', async () => {
    const recentCreatedAt = new Date(Date.now() - 15 * 60 * 1000);
    reportModel.findOne.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          createdAt: recentCreatedAt,
        }),
      }),
    });

    try {
      await service.create(ctx, {
        type: StudioReportType.ISSUE,
        message: 'Another report too soon.',
      });
      fail('Expected hourly report limit error');
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      const body = (error as HttpException).getResponse() as {
        errorCode: string;
        details?: { retryAfterSeconds?: number };
      };
      expect(body.errorCode).toBe(ErrorCode.REPORT_RATE_LIMIT);
      expect(body.details?.retryAfterSeconds).toBeGreaterThan(0);
    }
  });

  it('scopes getForAccount to the tenant account', async () => {
    reportModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });

    await expect(service.getForAccount(accountId, 'missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );

    expect(reportModel.findOne).toHaveBeenCalledWith({
      _id: 'missing',
      accountId,
    });
  });
});
