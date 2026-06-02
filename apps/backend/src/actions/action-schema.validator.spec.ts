import { ActionSchemaValidator } from './action-schema.validator';

describe('ActionSchemaValidator', () => {
  const validator = new ActionSchemaValidator();

  const schema = {
    type: 'object',
    properties: {
      environment: { type: 'string' },
    },
    required: ['environment'],
    additionalProperties: false,
  };

  it('accepts valid input', () => {
    const result = validator.validate(schema, { environment: 'production' });
    expect(result.valid).toBe(true);
    expect(result.input).toEqual({ environment: 'production' });
  });

  it('rejects missing required fields', () => {
    const result = validator.validate(schema, {});
    expect(result.valid).toBe(false);
    expect(result.errors?.length).toBeGreaterThan(0);
  });
});
