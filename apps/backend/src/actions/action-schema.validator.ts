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
      return { valid: true, input: candidate };
    }

    return {
      valid: false,
      errors: (validate.errors ?? []).map(formatAjvError),
    };
  }
}

function formatAjvError(error: ErrorObject): string {
  const path = error.instancePath || error.schemaPath;
  return path ? `${path}: ${error.message}` : String(error.message);
}
