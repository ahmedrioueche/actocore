import { Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import CustomSelect from '@/components/ui/CustomSelect';
import InputField from '@/components/ui/InputField';
import ToggleSwitch from '@/components/ui/ToggleSwitch';
import type {
  ActionParameterField,
  ActionParameterType,
} from '@/utils/action-schema-builder';
import {
  createEmptyParameterField,
  isValidParameterName,
} from '@/utils/action-schema-builder';

interface ActionParameterBuilderProps {
  fields: ActionParameterField[];
  onChange: (fields: ActionParameterField[]) => void;
  disabled?: boolean;
}

const TYPE_OPTIONS: { value: ActionParameterType; labelKey: string }[] = [
  { value: 'string', labelKey: 'string' },
  { value: 'number', labelKey: 'number' },
  { value: 'boolean', labelKey: 'boolean' },
];

export function ActionParameterBuilder({
  fields,
  onChange,
  disabled = false,
}: ActionParameterBuilderProps) {
  const { t } = useTranslation();

  const typeSelectOptions = TYPE_OPTIONS.map((opt) => ({
    value: opt.value,
    label: t(`projectActions.parameters.types.${opt.labelKey}`),
  }));

  const updateField = (
    id: string,
    patch: Partial<ActionParameterField>,
  ) => {
    onChange(
      fields.map((field) =>
        field.id === id ? { ...field, ...patch } : field,
      ),
    );
  };

  const removeField = (id: string) => {
    onChange(fields.filter((field) => field.id !== id));
  };

  const addField = () => {
    onChange([...fields, createEmptyParameterField()]);
  };

  return (
    <div className="space-y-3">
      {fields.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-surface-secondary px-4 py-6 text-center text-sm text-text-secondary">
          {t('projectActions.parameters.empty')}
        </p>
      ) : (
        <ul className="space-y-3">
          {fields.map((field, index) => {
            const nameInvalid =
              field.name.trim().length > 0 &&
              !isValidParameterName(field.name.trim());
            return (
              <li
                key={field.id}
                className="rounded-xl border border-border bg-surface-secondary p-4 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                    {t('projectActions.parameters.fieldLabel', {
                      index: index + 1,
                    })}
                  </span>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => removeField(field.id)}
                    className="rounded-lg p-1.5 text-text-secondary transition-colors hover:bg-danger-surface hover:text-danger disabled:opacity-50"
                    aria-label={t('projectActions.parameters.removeField')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <InputField
                    label={t('projectActions.parameters.name')}
                    value={field.name}
                    onChange={(e) =>
                      updateField(field.id, { name: e.target.value })
                    }
                    placeholder={t('projectActions.parameters.namePlaceholder')}
                    disabled={disabled}
                    error={
                      nameInvalid
                        ? t('projectActions.parameters.errors.invalidName')
                        : undefined
                    }
                  />
                  <CustomSelect
                    title={t('projectActions.parameters.type')}
                    options={typeSelectOptions}
                    selectedOption={field.type}
                    onChange={(value) =>
                      updateField(field.id, { type: value })
                    }
                    disabled={disabled}
                    showIcon={false}
                  />
                </div>

                <InputField
                  label={t('projectActions.parameters.description')}
                  value={field.description ?? ''}
                  onChange={(e) =>
                    updateField(field.id, { description: e.target.value })
                  }
                  placeholder={t(
                    'projectActions.parameters.descriptionPlaceholder',
                  )}
                  disabled={disabled}
                />

                <ToggleSwitch
                  checked={field.required}
                  onChange={(required) => updateField(field.id, { required })}
                  disabled={disabled}
                  label={t('projectActions.parameters.required')}
                />
              </li>
            );
          })}
        </ul>
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={addField}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-2.5 text-sm font-medium text-text-secondary transition-colors hover:border-primary/50 hover:text-text-primary disabled:opacity-50"
      >
        <Plus className="h-4 w-4" />
        {t('projectActions.parameters.addField')}
      </button>
    </div>
  );
}
