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

  it('asks for project name when create_project has no params', () => {
    const createProject = {
      ...action,
      name: 'create_project',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', title: 'Project name' },
        },
        additionalProperties: false,
      },
    };
    const result = runner.prepareExecution({ action: createProject, input: {} });
    expect(result.action).toBeUndefined();
    expect(result.intentOverride).toBe('direct');
    expect(result.content).toContain('name the new project');
  });

  it('asks for project name when create_project schema is empty', () => {
    const createProject = {
      ...action,
      name: 'create_project',
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: false,
      },
    };
    const result = runner.prepareExecution({ action: createProject, input: {} });
    expect(result.action).toBeUndefined();
    expect(result.intentOverride).toBe('direct');
    expect(result.content).toContain('name the new project');
  });

  it('returns pending when create_project name is provided', () => {
    const createProject = {
      ...action,
      name: 'create_project',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', title: 'Project name' },
        },
        additionalProperties: false,
      },
    };
    const result = runner.prepareExecution({
      action: createProject,
      input: { name: 'GymPro' },
    });
    expect(result.action?.status).toBe('pending');
    expect(result.action?.input).toEqual({ name: 'GymPro' });
  });

  it('returns pending when create_project has empty schema but name is provided', () => {
    const createProject = {
      ...action,
      name: 'create_project',
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: false,
      },
    };
    const result = runner.prepareExecution({
      action: createProject,
      input: { name: 'GymPro' },
    });
    expect(result.action?.status).toBe('pending');
    expect(result.action?.input).toEqual({ name: 'GymPro' });
  });
});
