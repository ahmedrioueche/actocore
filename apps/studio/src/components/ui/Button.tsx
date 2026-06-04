import { Loader } from "lucide-react";
import React from "react";

type ButtonProps = {
  className?: string;
  variant?: "filled" | "outline" | "ghost";
  color?: "primary" | "secondary" | "accent" | "success" | "warning" | "danger";
  size?: "default" | "sm" | "lg";
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  loading?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = "",
      variant = "filled",
      color = "primary",
      size = "default",
      fullWidth = false,
      icon,
      iconPosition = "left",
      loading = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 transform active:scale-95";

    const variants = {
      filled: {
        primary:
          "bg-primary text-white hover:brightness-110 focus:ring-primary shadow-md",
        secondary:
          "bg-secondary text-white hover:brightness-110 focus:ring-secondary shadow-md",
        accent:
          "bg-accent text-white hover:brightness-110 focus:ring-accent shadow-md",
        success:
          "bg-success text-white hover:brightness-110 focus:ring-success shadow-md",
        warning:
          "bg-warning text-white hover:brightness-110 focus:ring-warning shadow-md",
        danger:
          "bg-danger text-white hover:brightness-110 focus:ring-danger shadow-md",
      },
      outline: {
        primary:
          "border-2 border-primary text-primary bg-transparent hover:bg-primary/10 hover:text-primary focus:ring-primary",
        secondary:
          "border-2 border-secondary text-secondary bg-transparent hover:bg-secondary/10 hover:text-secondary focus:ring-secondary",
        accent:
          "border-2 border-accent text-accent bg-transparent hover:bg-accent/10 hover:text-accent focus:ring-accent",
        success:
          "border-2 border-success text-success bg-transparent hover:bg-success/10 hover:text-success focus:ring-success",
        warning:
          "border-2 border-warning text-warning bg-transparent hover:bg-warning/10 hover:text-warning focus:ring-warning",
        danger:
          "border-2 border-danger text-danger bg-transparent hover:bg-danger/10 hover:text-danger focus:ring-danger",
      },
      ghost: {
        primary:
          "text-primary bg-transparent hover:bg-primary/10 focus:ring-primary",
        secondary:
          "text-secondary bg-transparent hover:bg-secondary/10 focus:ring-secondary",
        accent:
          "text-accent bg-transparent hover:bg-accent/10 focus:ring-accent",
        success:
          "text-success bg-transparent hover:bg-success/10 focus:ring-success",
        warning:
          "text-warning bg-transparent hover:bg-warning/10 focus:ring-warning",
        danger:
          "text-danger bg-transparent hover:bg-danger/10 focus:ring-danger",
      },
    };

    const sizes = {
      sm: "h-8 px-3 text-sm",
      default: "h-10 px-5",
      lg: "h-12 px-6 text-lg",
    };

    const widthClass = fullWidth ? "w-full" : "";

    const iconElement = loading ? (
      <Loader className="animate-spin w-4 h-4 mr-2 text-white" />
    ) : (
      icon
    );

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${baseStyles} ${variants[variant][color]} ${sizes[size]} ${widthClass} ${className} flex items-center justify-center gap-2`}
        {...props}
      >
        {iconElement && iconPosition === "left" && iconElement}
        {children}
        {iconElement && iconPosition === "right" && !loading && iconElement}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
