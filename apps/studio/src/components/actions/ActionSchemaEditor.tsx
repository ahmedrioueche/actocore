import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { ActionInputSchema } from '@ahmedrioueche/actocore-shared';

import { ActionParameterBuilder } from '@/components/actions/ActionParameterBuilder';
import CustomSelect from '@/components/ui/CustomSelect';
import TextArea from '@/components/ui/TextArea';
import ToggleSwitch from '@/components/ui/ToggleSwitch';
import {
  ACTION_TEMPLATE_IDS,
  cloneTemplateFields,
  type ActionTemplateId,
} from '@/constants/action-templates';
import { formatInputSchema } from '@/constants/actions';
import type { ActionParameterField } from '@/utils/action-schema-builder';
import {
  fieldsToInputSchema,
  inputSchemaToFields,
} from '@/utils/action-schema-builder';

export interface ActionSchemaEditorValue {
  advancedMode: boolean;
  schemaText: string;
  fields: ActionParameterField[];
  templateId: ActionTemplateId;
}

interface ActionSchemaEditorProps {
  value: ActionSchemaEditorValue;
  onChange: (value: ActionSchemaEditorValue) => void;
  disabled?: boolean;
  /** When true, user cannot leave advanced mode (complex schema on edit). */
  advancedLocked?: boolean;
  showTemplatePicker?: boolean;
  showAdvancedToggle?: boolean;
}

export function ActionSchemaEditor({
  value,
  onChange,
  disabled = false,
  advancedLocked = false,
  showTemplatePicker = true,
  showAdvancedToggle = true,
}: ActionSchemaEditorProps) {
  const { t } = useTranslation();
  const [templateId, setTemplateId] = useState<ActionTemplateId>(
    value.templateId,
  );

  useEffect(() => {
    setTemplateId(value.templateId);
  }, [value.templateId]);

  const templateOptions = useMemo(
    () =>
      ACTION_TEMPLATE_IDS.map((id) => ({
        value: id,
        label: t(`projectActions.templates.${id}.label`),
      })),
    [t],
  );

  const setAdvancedMode = (advancedMode: boolean) => {
    if (advancedLocked && !advancedMode) {
      return;
    }

    if (advancedMode) {
      onChange({
        ...value,
        advancedMode: true,
        schemaText: formatInputSchema(fieldsToInputSchema(value.fields)),
      });
      return;
    }

    try {
      const parsed = JSON.parse(value.schemaText) as ActionInputSchema;
      const parsedFields = inputSchemaToFields(parsed);
      if (parsedFields) {
        onChange({
          ...value,
          advancedMode: false,
          fields: parsedFields,
        });
      }
    } catch {
      // Keep advanced mode when JSON cannot be parsed into simple fields.
    }
  };

  const applyTemplate = (id: ActionTemplateId) => {
    setTemplateId(id);
    onChange({
      ...value,
      templateId: id,
      fields: cloneTemplateFields(id),
      advancedMode: false,
      schemaText: formatInputSchema(fieldsToInputSchema(cloneTemplateFields(id))),
    });
  };

  const handleTemplateChange = (id: ActionTemplateId) => {
    applyTemplate(id);
  };

  const handleFieldsChange = (fields: ActionParameterField[]) => {
    onChange({
      ...value,
      fields,
      templateId: 'custom',
      schemaText: formatInputSchema(fieldsToInputSchema(fields)),
    });
    setTemplateId('custom');
  };

  return (
    <div className="space-y-4">
      {showTemplatePicker && !value.advancedMode ? (
        <div>
          <CustomSelect
            title={t('projectActions.templates.title')}
            options={templateOptions}
            selectedOption={templateId}
            onChange={handleTemplateChange}
            disabled={disabled}
            showIcon={false}
          />
          <p className="mt-1.5 text-xs text-text-secondary">
            {t(`projectActions.templates.${templateId}.description`)}
          </p>
        </div>
      ) : null}

      {showAdvancedToggle ? (
        <ToggleSwitch
          checked={value.advancedMode || advancedLocked}
          onChange={setAdvancedMode}
          disabled={disabled || advancedLocked}
          label={t('projectActions.advancedMode')}
        />
      ) : null}

      {value.advancedMode || advancedLocked ? (
        <div>
          <TextArea
            label={t('projectActions.fields.inputSchema')}
            value={value.schemaText}
            onChange={(e) =>
              onChange({ ...value, schemaText: e.target.value })
            }
            rows={10}
            spellCheck={false}
            className="font-mono text-xs"
            disabled={disabled}
          />
          <p className="mt-1.5 text-xs text-text-secondary">
            {advancedLocked
              ? t('projectActions.advancedModeLockedHint')
              : t('projectActions.advancedModeHint')}
          </p>
        </div>
      ) : (
        <ActionParameterBuilder
          fields={value.fields}
          onChange={handleFieldsChange}
          disabled={disabled}
        />
      )}
    </div>
  );
}

export function createInitialSchemaEditorValue(
  templateId: ActionTemplateId = 'no_params',
): ActionSchemaEditorValue {
  const fields = cloneTemplateFields(templateId);
  return {
    advancedMode: false,
    fields,
    templateId,
    schemaText: formatInputSchema(fieldsToInputSchema(fields)),
  };
}

export function schemaEditorValueFromInputSchema(
  schema: Parameters<typeof inputSchemaToFields>[0],
): ActionSchemaEditorValue {
  const fields = inputSchemaToFields(schema);
  if (fields) {
    return {
      advancedMode: false,
      fields,
      templateId: 'custom',
      schemaText: formatInputSchema(schema),
    };
  }

  return {
    advancedMode: true,
    fields: [],
    templateId: 'custom',
    schemaText: formatInputSchema(schema),
  };
}

export function isSchemaEditorAdvancedLocked(
  schema: Parameters<typeof inputSchemaToFields>[0],
): boolean {
  return inputSchemaToFields(schema) === null;
}
