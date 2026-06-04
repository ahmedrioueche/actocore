import React, { forwardRef } from "react";

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  className?: string;
  disabled?: boolean;
  error?: string;
  width?: string;
}

const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (
    { label, className = "", error, disabled = false, width, ...props },
    ref,
  ) => {
    const baseClasses =
      "block w-full px-4 py-3 border rounded-xl bg-surface text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 hover:border-primary/50";

    const disabledClasses = disabled
      ? "opacity-50 cursor-not-allowed hover:border-border"
      : "";
    const errorClasses = error
      ? "border-danger focus:ring-danger hover:border-danger/70"
      : "border-border";

    const textareaClasses = `${baseClasses} ${disabledClasses} ${errorClasses} ${className}`;

    return (
      <div className="space-y-2" style={{ width }}>
        {label && (
          <label className="block text-sm font-medium text-text-primary">
            {label}
          </label>
        )}

        <textarea
          ref={ref}
          disabled={disabled}
          className={textareaClasses}
          {...props}
        />

        {error && <p className="text-red-500 text-sm">{error}</p>}
      </div>
    );
  },
);

TextArea.displayName = "TextArea";
export default TextArea;
