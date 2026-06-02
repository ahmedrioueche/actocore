import { Injectable } from '@nestjs/common';
import Ajv, { type ErrorObject } from 'ajv';
import type { ActionInputSchema } from '@ahmedrioueche/actocore-shared';

export interface ActionInputValidationResult {
  valid: boolean;
  input?: Record<string, unknown>;
  errors?: string[];
}

@Injectable()
export class ActionSchemaValidator {
  private readonly ajv = new Ajv({ allErrors: true, strict: false });
  private lastErrors: import('ajv').ErrorObject[] = [];

  assertCompilable(schema: ActionInputSchema): void {
    try {
      this.ajv.compile(schema);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Invalid JSON Schema';
      throw new Error(message);
    }
  }

  validate(
    schema: ActionInputSchema,
    input: unknown,
  ): ActionInputValidationResult {
    const validate = this.ajv.compile(schema);
    const candidate =
      input !== null && typeof input === 'object' && !Array.isArray(input)
        ? (input as Record<string, unknown>)
        : {};

    if (validate(candidate)) {
      this.lastErrors = [];
      return { valid: true, input: candidate };
    }

    this.lastErrors = validate.errors ?? [];
    return {
      valid: false,
      errors: this.lastErrors.map(formatAjvError),
    };
  }

  getLastErrors(): import('ajv').ErrorObject[] {
    return this.lastErrors;
  }
}

function formatAjvError(error: ErrorObject): string {
  const path = error.instancePath || error.schemaPath;
  return path ? `${path}: ${error.message}` : String(error.message);
}
