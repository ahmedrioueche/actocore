import { Injectable } from '@nestjs/common';
import type {
  ActionData,
  ActionExecutionResult,
} from '@ahmedrioueche/actocore-shared';
import { ActionSchemaValidator } from './action-schema.validator';
import {
  formatActionValidationIssues,
  formatActionValidationSummary,
  formatClarifyingQuestion,
} from './action-validation-message.util';
import type { ActionSelection } from './action-selector.service';

export type ActionPrepareResult = {
  content: string;
  action?: ActionExecutionResult;
  /** Use direct intent for clarifying questions (no confirm card). */
  intentOverride?: 'direct';
};

@Injectable()
export class ActionRunnerService {
  constructor(private readonly validator: ActionSchemaValidator) {}

  /**
   * Validates input and returns a pending result for the SDK to execute in the host app.
   * Core never runs customer application code.
   */
  prepareExecution(selection: ActionSelection): ActionPrepareResult {
    const { action, input } = selection;
    const validation = this.validator.validate(action.inputSchema, input);
    const ajvErrors = this.validator.getLastErrors();

    if (!validation.valid) {
      const issues = formatActionValidationIssues(
        action.inputSchema,
        ajvErrors,
      );

      if (isOnlyMissingRequired(ajvErrors) && issues.length > 0) {
        return {
          content: formatClarifyingQuestion(action.name, issues),
          intentOverride: 'direct',
        };
      }

      const summary = formatActionValidationSummary(
        action.name,
        action.inputSchema,
        ajvErrors,
      );
      return {
        content: summary.content,
        action: {
          actionId: action.id,
          actionName: action.name,
          status: 'error',
          input:
            input !== null && typeof input === 'object' && !Array.isArray(input)
              ? (input as Record<string, unknown>)
              : {},
          error: summary.error,
          validationIssues: summary.issues,
        },
      };
    }

    const validatedInput = validation.input ?? {};

    return {
      content: `Ready to run "${action.name}" in your application with the validated parameters below.`,
      action: {
        actionId: action.id,
        actionName: action.name,
        status: 'pending',
        input: validatedInput,
      },
    };
  }

  formatNoActionsMessage(): string {
    return 'No actions are configured for this project. Add actions in Studio to enable action mode.';
  }

  formatNoMatchMessage(actions: ActionData[]): string {
    const names = actions.map((a) => a.name).join(', ');
    return `I could not match your request to an action. Available actions: ${names}.`;
  }
}

function isOnlyMissingRequired(
  errors: import('ajv').ErrorObject[],
): boolean {
  return (
    errors.length > 0 &&
    errors.every((error) => error.keyword === 'required')
  );
}
