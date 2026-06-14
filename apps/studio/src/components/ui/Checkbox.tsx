import { Check } from 'lucide-react';
import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';

import { cn } from '@/utils/helper';

export type CheckboxVariant = 'card' | 'inline';

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: ReactNode;
  description?: ReactNode;
  descriptionClassName?: string;
  variant?: CheckboxVariant;
  className?: string;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      id,
      checked,
      onChange,
      label,
      description,
      descriptionClassName,
      variant = 'card',
      className,
      disabled = false,
      ...inputProps
    },
    ref,
  ) => {
    return (
      <label
        htmlFor={id}
        className={cn(
          'group flex cursor-pointer items-start gap-3 rounded-xl transition-all duration-200',
          variant === 'card' && [
            'border p-3',
            checked
              ? 'border-primary bg-primary/5 shadow-sm'
              : 'border-border bg-surface hover:border-primary/40 hover:bg-surface-hover/50',
          ],
          variant === 'inline' && 'py-1',
          disabled && 'cursor-not-allowed opacity-50',
          className,
        )}
      >
        <span className="relative mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
          <input
            ref={ref}
            id={id}
            type="checkbox"
            checked={checked}
            disabled={disabled}
            onChange={(event) => onChange(event.target.checked)}
            className="peer sr-only"
            {...inputProps}
          />
          <span
            aria-hidden
            className={cn(
              'flex h-5 w-5 items-center justify-center rounded-md border-2 transition-all duration-200',
              'border-border bg-surface',
              'peer-checked:border-primary peer-checked:bg-primary',
              'peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-surface',
              'peer-disabled:cursor-not-allowed',
              'group-hover:border-primary/50 peer-checked:group-hover:border-primary',
            )}
          >
            <Check
              className={cn(
                'h-3.5 w-3.5 text-white transition-all duration-150',
                checked ? 'scale-100 opacity-100' : 'scale-75 opacity-0',
              )}
              strokeWidth={3}
            />
          </span>
        </span>

        <span className="min-w-0 flex-1 pt-px">
          <span className="block text-sm font-medium leading-snug text-text-primary">
            {label}
          </span>
          {description ? (
            <span
              className={cn(
                'mt-0.5 block text-xs leading-relaxed text-text-secondary',
                descriptionClassName,
              )}
            >
              {description}
            </span>
          ) : null}
        </span>
      </label>
    );
  },
);

Checkbox.displayName = 'Checkbox';

export default Checkbox;
