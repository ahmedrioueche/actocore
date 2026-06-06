import { ChevronDown } from 'lucide-react';
import React, { forwardRef } from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
}

const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ label, options, error, className = '', disabled = false, ...props }, ref) => {
    const baseClasses =
      'block w-full appearance-none rounded-xl border bg-surface px-4 py-3 pr-10 text-text-primary transition-all duration-200 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary hover:border-primary/50';
    const disabledClasses = disabled
      ? 'opacity-50 cursor-not-allowed hover:border-border'
      : '';
    const errorClasses = error
      ? 'border-danger focus:ring-danger hover:border-danger/70'
      : 'border-border';

    return (
      <div className="space-y-2">
        {label ? (
          <label className="block text-sm font-medium text-text-primary">
            {label}
          </label>
        ) : null}
        <div className="relative">
          <select
            ref={ref}
            disabled={disabled}
            className={`${baseClasses} ${disabledClasses} ${errorClasses} ${className}`}
            {...props}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
        </div>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
      </div>
    );
  },
);

SelectField.displayName = 'SelectField';
export default SelectField;
