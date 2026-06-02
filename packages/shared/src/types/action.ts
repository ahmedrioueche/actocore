/** JSON Schema (draft-07 subset) describing action input from the AI / SDK. */
export type ActionInputSchema = Record<string, unknown>;

export interface ActionData {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  inputSchema: ActionInputSchema;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Result returned to the SDK for in-app execution (Core validates; host app runs). */
export type ActionExecutionStatus = 'pending' | 'success' | 'error';

export interface ActionExecutionResult {
  actionId: string;
  actionName: string;
  status: ActionExecutionStatus;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
}
