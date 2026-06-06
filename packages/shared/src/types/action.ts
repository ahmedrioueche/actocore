/** JSON Schema (draft-07 subset) describing action input from the AI / SDK. */
export type ActionInputSchema = Record<string, unknown>;

/** Sentinel used by list filters to target actions with no section. */
export const UNCATEGORIZED_SECTION_ID = 'uncategorized';

export interface ActionData {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  inputSchema: ActionInputSchema;
  enabled: boolean;
  /** Owning section id, or undefined when uncategorized. */
  sectionId?: string;
  createdAt: string;
  updatedAt: string;
}

/** A flat, project-scoped folder that organizes actions. */
export interface ActionSectionData {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  /** Optional accent color (hex) for UI. */
  color?: string;
  /** When false, every action in the section is hidden from the AI at runtime. */
  enabled: boolean;
  /** Sort order within the project (ascending). */
  order: number;
  /** Number of actions assigned to this section (populated by list endpoints). */
  actionCount?: number;
  createdAt: string;
  updatedAt: string;
}

/** Result returned to the SDK for in-app execution (Core validates; host app runs). */
export type ActionExecutionStatus = 'pending' | 'success' | 'error';

export interface ActionValidationIssue {
  field: string;
  label: string;
  message: string;
}

export interface ActionExecutionResult {
  actionId: string;
  actionName: string;
  status: ActionExecutionStatus;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
  /** Present when status is `error` due to input validation. */
  validationIssues?: ActionValidationIssue[];
}
