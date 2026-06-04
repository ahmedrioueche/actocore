import { Eye, EyeOff } from "lucide-react";
import type { ReactNode } from "react";
import React, { forwardRef, useState } from "react";

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  className?: string;
  disabled?: boolean;
  error?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  width?: string;
}

const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  (
    {
      label,
      className = "",
      error,
      disabled = false,
      width,
      leftIcon,
      rightIcon,
      type,
      ...props
    },
    ref,
  ) => {
    const [showPassword, setShowPassword] = useState(false);

    // Handle password type toggle
    const isPassword = type === "password";
    const computedType = isPassword && showPassword ? "text" : type;

    // Default right icon for password fields
    const defaultRightIcon = isPassword ? (
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="cursor-pointer text-text-secondary hover:text-text-primary transition-colors duration-200 p-1"
      >
        {showPassword ? (
          <EyeOff className="h-5 w-5" />
        ) : (
          <Eye className="h-5 w-5" />
        )}
      </button>
    ) : null;

    const finalRightIcon = rightIcon || defaultRightIcon;

    // Base classes with hover effects and password reveal button disabled
    const baseClasses =
      "block w-full py-3 border rounded-xl bg-surface text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 hover:border-primary/50 [&::-ms-reveal]:hidden [&::-webkit-credentials-auto-fill-button]:hidden [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-70 [&::-webkit-calendar-picker-indicator]:hover:opacity-100";

    // Dynamic padding based on icons
    const paddingLeft = leftIcon ? "pl-10" : "pl-3";
    const paddingRight = finalRightIcon ? "pr-12" : "pr-3";

    // Conditional classes
    const disabledClasses = disabled
      ? "opacity-50 cursor-not-allowed hover:border-border"
      : "";
    const errorClasses = error
      ? "border-danger focus:ring-danger hover:border-danger/70"
      : "border-border";

    // Combine all classes
    const inputClasses = `${baseClasses} ${paddingLeft} ${paddingRight} ${disabledClasses} ${errorClasses} ${className}`;

    return (
      <div className="space-y-2" style={{ width }}>
        {label && (
          <label
            htmlFor={props.id}
            className="block text-sm font-medium text-text-primary"
          >
            {label}
          </label>
        )}

        <div className="relative group">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary group-hover:text-text-primary transition-colors duration-200">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={props.id}
            disabled={disabled}
            type={computedType}
            className={inputClasses}
            {...props}
          />

          {finalRightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              {finalRightIcon}
            </div>
          )}
        </div>

        {error && (
          <p className="text-danger text-sm flex items-center mt-1">
            <svg
              className="w-4 h-4 mr-1"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </p>
        )}
      </div>
    );
  },
);

InputField.displayName = "InputField";
export default InputField;
