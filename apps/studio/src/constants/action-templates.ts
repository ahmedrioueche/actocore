import type { ActionParameterField } from '@/utils/action-schema-builder';
import { createParameterFieldId } from '@/utils/action-schema-builder';

export type ActionTemplateId =
  | 'no_params'
  | 'single_email'
  | 'single_id'
  | 'search_query'
  | 'create_record'
  | 'update_record'
  | 'custom';

export const ACTION_TEMPLATE_IDS: ActionTemplateId[] = [
  'no_params',
  'single_email',
  'single_id',
  'search_query',
  'create_record',
  'update_record',
  'custom',
];

function field(
  partial: Omit<ActionParameterField, 'id'>,
): ActionParameterField {
  return { id: createParameterFieldId(), ...partial };
}

export const ACTION_TEMPLATE_FIELDS: Record<
  ActionTemplateId,
  ActionParameterField[]
> = {
  no_params: [],
  single_email: [
    field({
      name: 'email',
      type: 'string',
      description: "The recipient's email address",
      required: true,
    }),
  ],
  single_id: [
    field({
      name: 'id',
      type: 'string',
      description: 'The record identifier',
      required: true,
    }),
  ],
  search_query: [
    field({
      name: 'query',
      type: 'string',
      description: 'The search term',
      required: true,
    }),
  ],
  create_record: [
    field({
      name: 'title',
      type: 'string',
      description: 'Record title or name',
      required: true,
    }),
  ],
  update_record: [
    field({
      name: 'name',
      type: 'string',
      description: 'Record name',
      required: true,
    }),
    field({
      name: 'data',
      type: 'string',
      description: 'Updated record data (describe your shape, e.g. Gym fields to change)',
      required: true,
    }),
  ],
  custom: [],
};

/** Clone template fields so edits do not mutate presets. */
export function cloneTemplateFields(
  templateId: ActionTemplateId,
): ActionParameterField[] {
  return ACTION_TEMPLATE_FIELDS[templateId].map((f) => ({
    ...f,
    id: createParameterFieldId(),
  }));
}
