import { forwardRef, type TextareaHTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

export type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string;
  width?: string;
};

const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, className, error, disabled = false, width, id, ...props }, ref) => {
    return (
      <div className="space-y-2" style={{ width }}>
        {label ? (
          <label htmlFor={id} className="block text-sm font-medium text-text-primary">
            {label}
          </label>
        ) : null}

        <textarea
          ref={ref}
          id={id}
          disabled={disabled}
          className={cn(
            'block w-full rounded-xl border bg-surface px-3 py-2.5 text-sm text-text-primary placeholder:text-text-secondary',
            'transition-all duration-200 hover:border-primary/50',
            'focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary',
            disabled && 'cursor-not-allowed opacity-50 hover:border-border',
            error
              ? 'border-danger focus:ring-danger hover:border-danger/70'
              : 'border-border',
            className,
          )}
          {...props}
        />

        {error ? <p className="text-sm text-danger">{error}</p> : null}
      </div>
    );
  },
);

TextArea.displayName = 'TextArea';

export default TextArea;
