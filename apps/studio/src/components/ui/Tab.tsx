import { resetAllScrollers } from "@/utils/scroll";

interface TabProps {
  label: string;
  count?: number;
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
}

export default function Tab({
  label,
  count,
  isActive,
  onClick,
  className = "",
}: TabProps) {
  const handleClick = () => {
    resetAllScrollers();

    // 2. User callback
    onClick?.();
  };

  return (
    <button
      onClick={handleClick}
      className={`
        py-4 px-1 border-b-2 font-medium md:text-sm text-xs transition-colors
        ${
          isActive
            ? "border-primary text-primary"
            : "border-transparent text-text-secondary hover:text-text-primary hover:border-border-hover"
        }
        ${className}
      `}
    >
      {label}
      {count !== undefined && <span className="ml-1 rtl:mr-1">({count})</span>}
    </button>
  );
}
