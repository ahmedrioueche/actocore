import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApiKeyGuard } from './api-key.guard';
import { ApiKeysService } from '../api-keys.service';

describe('ApiKeyGuard', () => {
  const apiKeys = {
    validateBearerToken: jest.fn(),
    recordUsage: jest.fn(),
  };

  const reflector = {
    getAllAndOverride: jest.fn().mockReturnValue(false),
  };

  const guard = new ApiKeyGuard(
    apiKeys as unknown as ApiKeysService,
    reflector as unknown as Reflector,
  );

  const context = {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({
        headers: { authorization: 'Bearer aco_test_key_value' },
      }),
    }),
  } as unknown as ExecutionContext;

  beforeEach(() => {
    jest.clearAllMocks();
    apiKeys.validateBearerToken.mockResolvedValue({
      id: 'key-1',
      projectId: 'proj-1',
      prefix: 'aco_test_key',
    });
    apiKeys.recordUsage.mockResolvedValue(undefined);
  });

  it('attaches apiKey to the request', async () => {
    const request = {
      headers: { authorization: 'Bearer aco_test_key_value' },
    };
    const ctx = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(request).toHaveProperty('apiKey.projectId', 'proj-1');
    expect(apiKeys.recordUsage).toHaveBeenCalledWith('key-1');
  });

  it('skips validation for public routes', async () => {
    reflector.getAllAndOverride.mockReturnValueOnce(true);
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(apiKeys.validateBearerToken).not.toHaveBeenCalled();
  });
});
