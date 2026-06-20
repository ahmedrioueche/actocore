import { Eye, EyeOff, Search, X } from "lucide-react";
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
  /** Accessible label for the search clear control when `type="search"`. */
  searchClearLabel?: string;
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
      value,
      onChange,
      searchClearLabel = "Clear search",
      ...props
    },
    ref,
  ) => {
    const [showPassword, setShowPassword] = useState(false);

    const isPassword = type === "password";
    const isSearch = type === "search";
    const computedType = isPassword && showPassword ? "text" : type;

    const hasSearchValue =
      value !== undefined && value !== null && String(value).length > 0;

    const handleClearSearch = () => {
      if (disabled || !onChange) {
        return;
      }
      onChange({
        target: { value: "" },
        currentTarget: { value: "" },
      } as React.ChangeEvent<HTMLInputElement>);
    };

    const defaultLeftIcon =
      isSearch && leftIcon === undefined ? (
        <Search className="h-5 w-5" />
      ) : null;

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
    ) : isSearch && hasSearchValue && rightIcon === undefined ? (
      <button
        type="button"
        onClick={handleClearSearch}
        disabled={disabled}
        aria-label={searchClearLabel}
        className="cursor-pointer rounded-full p-1 text-text-secondary transition-colors duration-200 hover:bg-danger/10 hover:text-danger disabled:cursor-not-allowed disabled:opacity-50"
      >
        <X className="h-4 w-4" />
      </button>
    ) : null;

    const effectiveLeftIcon = leftIcon ?? defaultLeftIcon;
    const effectiveRightIcon = rightIcon ?? defaultRightIcon;

    // Base classes with hover effects and password reveal button disabled
    const baseClasses =
      "block w-full py-3 border rounded-xl bg-surface text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 hover:border-primary/50 [&::-ms-reveal]:hidden [&::-webkit-credentials-auto-fill-button]:hidden [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-70 [&::-webkit-calendar-picker-indicator]:hover:opacity-100";

    const searchClasses = isSearch
      ? "[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
      : "";

    // Dynamic padding based on icons
    const paddingLeft = effectiveLeftIcon ? "pl-10" : "pl-3";
    const paddingRight = effectiveRightIcon ? "pr-12" : "pr-3";

    // Conditional classes
    const disabledClasses = disabled
      ? "opacity-50 cursor-not-allowed hover:border-border"
      : "";
    const errorClasses = error
      ? "border-danger focus:ring-danger hover:border-danger/70"
      : "border-border";

    // Combine all classes
    const inputClasses = `${baseClasses} ${searchClasses} ${paddingLeft} ${paddingRight} ${disabledClasses} ${errorClasses} ${className}`;

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
          {effectiveLeftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary group-hover:text-text-primary transition-colors duration-200">
              {effectiveLeftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={props.id}
            disabled={disabled}
            type={computedType}
            value={value}
            onChange={onChange}
            className={inputClasses}
            {...props}
          />

          {effectiveRightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              {effectiveRightIcon}
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
