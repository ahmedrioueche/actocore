import { Check } from "lucide-react";
import React from "react";

interface CheckboxProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  className?: string;
  disabled?: boolean;
}

const Checkbox: React.FC<CheckboxProps> = ({
  id,
  checked,
  onChange,
  label,
  description,
  className = "",
  disabled = false,
}) => {
  return (
    <div
      onClick={() => !disabled && onChange(!checked)}
      className={`
        relative flex items-start p-4 rounded-xl border transition-all duration-200 cursor-pointer group
        ${disabled ? "opacity-60 cursor-not-allowed" : "hover:border-[var(--color-primary)] hover:shadow-sm"}
        ${checked ? "bg-[var(--color-surface)] border-[var(--color-primary)]" : "bg-[var(--color-surface)] border-[var(--color-border)]"}
        ${className}
      `}
    >
      <div className="flex-1 min-w-0 mr-4">
        <label
          htmlFor={id}
          className={`font-medium text-[var(--color-text-primary)] ${
            disabled ? "cursor-not-allowed" : "cursor-pointer"
          }`}
        >
          {label}
        </label>
        {description && (
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            {description}
          </p>
        )}
      </div>

      <div className="relative flex items-center justify-center">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => !disabled && onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only"
        />
        <div
          className={`
            w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200
            ${
              checked
                ? "bg-[var(--color-primary)] border-[var(--color-primary)]"
                : "bg-transparent border-[var(--color-border)] group-hover:border-[var(--color-primary)]"
            }
          `}
        >
          <Check
            className={`w-4 h-4 text-white font-bold transition-all duration-200 ${
              checked ? "opacity-100 scale-100" : "opacity-0 scale-75"
            }`}
            strokeWidth={3}
          />
        </div>
      </div>
    </div>
  );
};

export default Checkbox;
