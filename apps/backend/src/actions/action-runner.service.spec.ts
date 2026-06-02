import { ActionSchemaValidator } from './action-schema.validator';
import { ActionRunnerService } from './action-runner.service';

describe('ActionRunnerService', () => {
  const runner = new ActionRunnerService(new ActionSchemaValidator());

  const action = {
    id: 'a1',
    projectId: 'p1',
    name: 'deploy',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
    enabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it('returns pending execution for valid input', () => {
    const result = runner.prepareExecution({ action, input: {} });
    expect(result.action?.status).toBe('pending');
    expect(result.action?.actionName).toBe('deploy');
  });

  it('asks conversationally when required fields are missing', () => {
    const deleteUser = {
      ...action,
      name: 'delete_user',
      inputSchema: {
        type: 'object',
        properties: {
          email: { type: 'string', title: 'Email address' },
        },
        required: ['email'],
        additionalProperties: false,
      },
    };
    const result = runner.prepareExecution({ action: deleteUser, input: {} });
    expect(result.action).toBeUndefined();
    expect(result.intentOverride).toBe('direct');
    expect(result.content).toContain('email');
  });

  it('returns error when validation fails on invalid values', () => {
    const strict = {
      ...action,
      inputSchema: {
        type: 'object',
        properties: { id: { type: 'string', minLength: 3 } },
        required: ['id'],
        additionalProperties: false,
      },
    };
    const result = runner.prepareExecution({
      action: strict,
      input: { id: 'x' },
    });
    expect(result.action?.status).toBe('error');
  });
});
