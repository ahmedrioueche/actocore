import { Injectable } from '@nestjs/common';
import type {
  ActionData,
  ActionExecutionResult,
} from '@ahmedrioueche/actocore-shared';
import { ActionSchemaValidator } from './action-schema.validator';
import type { ActionSelection } from './action-selector.service';

@Injectable()
export class ActionRunnerService {
  constructor(private readonly validator: ActionSchemaValidator) {}

  /**
   * Validates input and returns a pending result for the SDK to execute in the host app.
   * Core never runs customer application code.
   */
  prepareExecution(selection: ActionSelection): {
    content: string;
    action: ActionExecutionResult;
  } {
    const { action, input } = selection;
    const validation = this.validator.validate(action.inputSchema, input);

    if (!validation.valid) {
      const error = validation.errors?.join('; ') ?? 'Invalid input';
      return {
        content: `Could not run "${action.name}": ${error}`,
        action: {
          actionId: action.id,
          actionName: action.name,
          status: 'error',
          input:
            input !== null && typeof input === 'object' && !Array.isArray(input)
              ? (input as Record<string, unknown>)
              : {},
          error,
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
