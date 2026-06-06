import { Check } from 'lucide-react';

import { SECTION_COLOR_PRESETS } from '@/constants/actions';

interface SectionColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
}

export default function SectionColorPicker({
  value,
  onChange,
  label,
}: SectionColorPickerProps) {
  return (
    <div className="space-y-2">
      {label ? (
        <label className="block text-sm font-medium text-text-primary">
          {label}
        </label>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {SECTION_COLOR_PRESETS.map((color) => {
          const selected = color.toLowerCase() === value.toLowerCase();
          return (
            <button
              key={color}
              type="button"
              onClick={() => onChange(color)}
              aria-label={color}
              aria-pressed={selected}
              className={`flex h-8 w-8 items-center justify-center rounded-full transition-transform duration-150 hover:scale-110 ${
                selected ? 'ring-2 ring-offset-2 ring-offset-surface' : ''
              }`}
              style={{ backgroundColor: color, ...(selected ? { boxShadow: `0 0 0 2px ${color}` } : {}) }}
            >
              {selected ? <Check className="h-4 w-4 text-white" /> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
