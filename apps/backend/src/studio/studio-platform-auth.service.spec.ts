import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { StudioAccount } from './schemas/studio-account.schema';
import { StudioMembership } from './schemas/studio-membership.schema';
import { StudioUser } from './schemas/studio-user.schema';
import { StudioPlatformAuthService } from './studio-platform-auth.service';
import { StudioPlatformBootstrapService } from './studio-platform-bootstrap.service';

describe('StudioPlatformAuthService', () => {
  let service: StudioPlatformAuthService;

  const platformAccountId = '507f1f77bcf86cd799439011';
  const masterUserId = '507f1f77bcf86cd799439012';

  const bootstrap = {
    getPlatformAccountId: jest.fn(() => platformAccountId),
    isPlatformAccount: jest.fn((id: string) => id === platformAccountId),
    isMasterUser: jest.fn((user: { isPlatformMaster?: boolean }) =>
      Boolean(user.isPlatformMaster),
    ),
  };

  const masterUser = {
    _id: { toString: () => masterUserId },
    email: 'platform-master@actocore.local',
    isPlatformMaster: true,
    emailVerified: true,
    tokenVersion: 0,
  };

  const accountDoc = {
    _id: { toString: () => platformAccountId },
    name: 'ActoCore Platform',
  };

  const membershipDoc = {
    userId: masterUser._id,
    accountId: { toString: () => platformAccountId },
    role: 'super_admin',
    permissions: [],
    projectIds: [],
  };

  const mockUserModel = {
    findOne: jest.fn(() => ({ exec: async () => masterUser })),
    findById: jest.fn(() => ({ exec: async () => masterUser })),
  };
  const mockAccountModel = {
    findById: jest.fn(() => ({ exec: async () => accountDoc })),
  };
  const mockMembershipModel = {
    findOne: jest.fn(() => ({ exec: async () => membershipDoc })),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudioPlatformAuthService,
        { provide: StudioPlatformBootstrapService, useValue: bootstrap },
        { provide: getModelToken(StudioUser.name), useValue: mockUserModel },
        { provide: getModelToken(StudioAccount.name), useValue: mockAccountModel },
        { provide: getModelToken(StudioMembership.name), useValue: mockMembershipModel },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(async () => 'token'),
            verifyAsync: jest.fn(async () => ({
              sub: masterUserId,
              aid: platformAccountId,
              role: 'super_admin',
              tv: 0,
            })),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: (key: string) => {
              if (key === 'platformAuth') {
                return {
                  masterEmail: 'platform-master@actocore.local',
                  masterPassword: 'dev-platform-master-change-me',
                };
              }
              return {
                jwtSecret: 'secret',
                jwtRefreshSecret: 'refresh',
                jwtAccessExpiresIn: '15m',
                jwtRefreshExpiresIn: '7d',
                passwordPepper: 'pepper',
              };
            },
          },
        },
      ],
    }).compile();

    service = module.get(StudioPlatformAuthService);
  });

  it('logs in master with env credentials', async () => {
    const session = await service.login({
      email: 'platform-master@actocore.local',
      password: 'dev-platform-master-change-me',
    });

    expect(session.isPlatformMaster).toBe(true);
    expect(session.platformPermissions.length).toBeGreaterThan(0);
  });

  it('rejects invalid master credentials', async () => {
    await expect(
      service.login({
        email: 'platform-master@actocore.local',
        password: 'wrong-password',
      }),
    ).rejects.toMatchObject({ status: 401 });
  });
});
