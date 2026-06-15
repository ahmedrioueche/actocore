import CustomSelect, { type CustomSelectOption } from './CustomSelect';

export type SelectOption = CustomSelectOption;

export type SelectFieldProps = {
  label?: string;
  options: SelectOption[];
  value?: string;
  onChange?: (event: { target: { value: string } }) => void;
  disabled?: boolean;
  error?: string;
  id?: string;
  className?: string;
};

/** Form-friendly wrapper around {@link CustomSelect}. */
export default function SelectField({
  label,
  options,
  value = '',
  onChange,
  disabled = false,
  error,
  className,
}: SelectFieldProps) {
  return (
    <CustomSelect
      title={label}
      options={options}
      selectedOption={value}
      onChange={(next) => onChange?.({ target: { value: next } })}
      disabled={disabled}
      error={error}
      className={className}
    />
  );
}
