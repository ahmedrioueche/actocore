import type { ElementType } from "react";

import { cn } from "@/utils/helper";

interface IconButtonProps {
  onClick: () => void;
  ariaLabel?: string;
  ariaPressed?: boolean;
  icon: ElementType;
  disabled?: boolean;
  className?: string;
}

const IconButton = ({
  onClick,
  ariaLabel,
  ariaPressed,
  icon: Icon,
  disabled,
  className,
}: IconButtonProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "p-2 rounded-lg transition-colors duration-200 text-text-primary",
        ariaPressed
          ? "bg-primary-muted ring-2 ring-primary"
          : "bg-surface-secondary hover:bg-surface-hover border border-border",
        disabled && "opacity-50 cursor-not-allowed",
        className,
      )}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
    >
      <Icon size={20} />
    </button>
  );
};

export default IconButton;
