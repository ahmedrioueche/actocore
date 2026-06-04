interface RadioOption {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

interface RadioGroupProps {
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  name: string;
  className?: string;
  disabled?: boolean;
}

const RadioGroup: React.FC<RadioGroupProps> = ({
  options,
  value,
  onChange,
  name,
  className,
  disabled,
}) => {
  return (
    <div
      className={`grid gap-4 ${className} ${
        disabled ? "opacity-70 pointer-events-none" : ""
      }`}
      style={{
        gridTemplateColumns: `repeat(auto-fit, minmax(${
          options[0]?.description ? "200px" : "100px"
        }, 1fr))`,
      }}
    >
      {options.map((option) => (
        <label
          key={option.id}
          className={`relative flex flex-col p-4 rounded-xl border-2 transition-all duration-200 ${
            value === option.id
              ? "border-light-primary dark:border-dark-primary bg-light-primary/5 dark:bg-dark-primary/10"
              : "border-light-border dark:border-dark-border"
          } ${
            !disabled
              ? "cursor-pointer hover:border-light-primary/50 dark:hover:border-dark-primary/50"
              : ""
          }`}
        >
          <input
            type="radio"
            name={name}
            value={option.id}
            checked={value === option.id}
            onChange={(e) => !disabled && onChange(e.target.value)}
            className="sr-only"
            disabled={disabled}
          />
          <div className="flex items-center space-x-3">
            {option.icon && (
              <span className={disabled ? "opacity-70" : ""}>
                {option.icon}
              </span>
            )}
            <div>
              <p
                className={`font-medium ${
                  disabled
                    ? "text-light-foreground/70 dark:text-dark-foreground/70"
                    : "text-light-foreground dark:text-dark-foreground"
                }`}
              >
                {option.label}
              </p>
              {option.description && (
                <p
                  className={`text-sm ${
                    disabled
                      ? "text-gray-500 dark:text-gray-400"
                      : "text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {option.description}
                </p>
              )}
            </div>
          </div>
        </label>
      ))}
    </div>
  );
};

export default RadioGroup;
