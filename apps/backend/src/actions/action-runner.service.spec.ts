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
    expect(result.action.status).toBe('pending');
    expect(result.action.actionName).toBe('deploy');
  });

  it('returns error when validation fails', () => {
    const strict = {
      ...action,
      inputSchema: {
        type: 'object',
        properties: { id: { type: 'string' } },
        required: ['id'],
      },
    };
    const result = runner.prepareExecution({ action: strict, input: {} });
    expect(result.action.status).toBe('error');
  });
});
