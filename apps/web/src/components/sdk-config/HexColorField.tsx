import InputField from '@/components/ui/InputField';
import { cn } from '@/lib/utils';
import { normalizeHexColor } from '@/utils/hex-color';

interface HexColorFieldProps {
  label: string;
  value: string;
  defaultHint?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
}

export function HexColorField({
  label,
  value,
  defaultHint,
  onChange,
  disabled = false,
  error,
}: HexColorFieldProps) {
  const normalized = normalizeHexColor(value);
  const pickerValue = normalized ?? defaultHint ?? '#000000';

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-text-primary">
        {label}
      </label>
      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          <span
            className={cn(
              'block h-10 w-10 rounded-xl border border-border shadow-sm',
              disabled && 'opacity-50',
            )}
            style={{ backgroundColor: normalized ?? defaultHint ?? 'transparent' }}
            aria-hidden
          />
          <input
            type="color"
            value={pickerValue}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
            aria-label={label}
          />
        </div>
        <div className="min-w-0 flex-1">
          <InputField
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={defaultHint ?? '#4f46e5'}
            disabled={disabled}
            error={error}
            spellCheck={false}
            className="font-mono text-sm"
          />
        </div>
      </div>
    </div>
  );
}
