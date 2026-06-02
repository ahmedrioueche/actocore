import {
  formatActionValidationSummary,
  formatClarifyingQuestion,
} from './action-validation-message.util';

describe('formatActionValidationSummary', () => {
  it('formats missing required fields in plain language', () => {
    const schema = {
      type: 'object',
      properties: {
        email: { type: 'string', title: 'Email address' },
      },
      required: ['email'],
      additionalProperties: false,
    };

    const summary = formatActionValidationSummary('delete_user', schema, [
      {
        keyword: 'required',
        instancePath: '',
        schemaPath: '',
        params: { missingProperty: 'email' },
        message: "must have required property 'email'",
      } as never,
    ]);

    expect(summary.content).toContain('delete_user');
    expect(summary.content).toContain('Email address is required');
    expect(summary.issues[0]?.field).toBe('email');
  });

  it('formats conversational clarify for delete_user email', () => {
    const content = formatClarifyingQuestion('delete_user', [
      { field: 'email', label: 'Email address', message: 'Email address is required' },
    ]);
    expect(content).toContain('email');
    expect(content).not.toContain('#/required');
  });
});
