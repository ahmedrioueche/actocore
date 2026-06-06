interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  /** Accessible label when no visible text label is rendered. */
  ariaLabel?: string;
}

export default function ToggleSwitch({
  checked,
  onChange,
  disabled = false,
  label,
  ariaLabel,
}: ToggleSwitchProps) {
  const button = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel ?? label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-surface ${
        checked ? 'bg-primary' : 'bg-surface-hover'
      } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  if (!label) {
    return button;
  }

  return (
    <label className="flex items-center gap-3">
      {button}
      <span className="text-sm font-medium text-text-primary">{label}</span>
    </label>
  );
}
