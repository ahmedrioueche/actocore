import { Eye, EyeOff } from 'lucide-react';
import { forwardRef, useState, type InputHTMLAttributes, type ReactNode } from 'react';

import { cn } from '@/lib/utils';

export type InputFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  width?: string;
};

const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  (
    {
      label,
      className,
      error,
      disabled = false,
      width,
      leftIcon,
      rightIcon,
      type,
      id,
      ...props
    },
    ref,
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const computedType = isPassword && showPassword ? 'text' : type;

    const defaultRightIcon = isPassword ? (
      <button
        type="button"
        onClick={() => setShowPassword((value) => !value)}
        className="cursor-pointer p-1 text-text-secondary transition-colors hover:text-text-primary"
      >
        {showPassword ? (
          <EyeOff className="h-5 w-5" aria-hidden />
        ) : (
          <Eye className="h-5 w-5" aria-hidden />
        )}
      </button>
    ) : null;

    const finalRightIcon = rightIcon ?? defaultRightIcon;

    return (
      <div className="space-y-2" style={{ width }}>
        {label ? (
          <label htmlFor={id} className="block text-sm font-medium text-text-primary">
            {label}
          </label>
        ) : null}

        <div className="group relative">
          {leftIcon ? (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-text-secondary transition-colors group-hover:text-text-primary">
              {leftIcon}
            </div>
          ) : null}

          <input
            ref={ref}
            id={id}
            disabled={disabled}
            type={computedType}
            className={cn(
              'block w-full rounded-xl border bg-surface py-2.5 text-text-primary placeholder:text-text-secondary',
              'transition-all duration-200 hover:border-primary/50',
              'focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary',
              '[&::-ms-reveal]:hidden [&::-webkit-credentials-auto-fill-button]:hidden',
              'pl-3 pr-3',
              leftIcon && 'pl-10',
              finalRightIcon && 'pr-12',
              disabled && 'cursor-not-allowed opacity-50 hover:border-border',
              error
                ? 'border-danger focus:ring-danger hover:border-danger/70'
                : 'border-border',
              className,
            )}
            {...props}
          />

          {finalRightIcon ? (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              {finalRightIcon}
            </div>
          ) : null}
        </div>

        {error ? <p className="text-sm text-danger">{error}</p> : null}
      </div>
    );
  },
);

InputField.displayName = 'InputField';

export default InputField;
