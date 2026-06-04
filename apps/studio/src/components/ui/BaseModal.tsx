import { Edit3, X } from "lucide-react";
import React, { type ElementType, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

interface FooterButton {
  label?: string;
  onClick?: (e?: React.MouseEvent) => void;
  icon?: ElementType;
  iconPosition?: "left" | "right";
  loading?: boolean;
  disabled?: boolean;
  type?: "button" | "submit";
  form?: string;
  variant?: "default" | "primary" | "danger" | "ghost";
  className?: string;
}

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  icon?: ElementType;
  children: ReactNode;

  // Edit mode support
  isEditMode?: boolean;
  editTitle?: string;
  onTitleChange?: (title: string) => void;
  onEditClick?: () => void;
  showEditButton?: boolean;

  // Header configuration
  customHeader?: ReactNode; // Completely replaces the default header
  hideHeader?: boolean;

  // Footer configuration
  footer?: ReactNode; // Custom footer (overrides button props)
  showFooter?: boolean;

  // Secondary button (left)
  showSecondaryButton?: boolean;
  secondaryButton?: FooterButton;

  // Tertiary button (middle/left of primary)
  tertiaryButton?: FooterButton;

  // Primary button (right) - only renders if primaryButton is provided
  primaryButton?: FooterButton;

  // Sizing
  maxWidth?: string;
  // Display options
  hideCloseButton?: boolean;
  noPadding?: boolean;
}

const BaseModal: React.FC<BaseModalProps> = ({
  isOpen,
  onClose,
  title = "",
  subtitle,
  icon: Icon,
  children,
  isEditMode = false,
  editTitle,
  onTitleChange,
  onEditClick,
  showEditButton = false,
  customHeader,
  hideHeader = false,
  footer,
  showFooter = true,
  showSecondaryButton = true,
  secondaryButton,
  tertiaryButton,
  primaryButton,
  maxWidth = "max-w-3xl",
  hideCloseButton = false,
  noPadding = false,
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  const displayTitle =
    isEditMode && editTitle !== undefined ? editTitle : title;

  // Helper to get button classes based on variant
  const getButtonClasses = (
    variant: FooterButton["variant"] = "default",
    disabled?: boolean,
    loading?: boolean,
    className?: string,
  ) => {
    const baseClasses =
      "px-4 md:px-6 py-2.5 md:py-3 rounded-xl font-semibold text-sm md:text-base transition-all duration-300 flex items-center justify-center gap-2";

    if (disabled || loading) {
      return `${baseClasses} bg-muted cursor-auto opacity-50 shadow-none ring-0 text-primary-contrast ${className || ""}`;
    }

    switch (variant) {
      case "primary":
        return `${baseClasses} bg-brand-gradient hover:opacity-95 text-primary-contrast ring-1 ring-primary/30 hover:shadow-brand ${className || ""}`;
      case "danger":
        return `${baseClasses} bg-danger hover:bg-danger-hover text-white shadow-sm hover:shadow-md ${className || ""}`;
      case "ghost":
        return `${baseClasses} bg-transparent hover:bg-surface-hover text-text-secondary hover:text-text-primary ${className || ""}`;
      case "default":
      default:
        return `${baseClasses} text-text-secondary bg-surface hover:bg-surface/50 border-2 border-border hover:border-primary/30 ${className || ""}`;
    }
  };

  // Default button configurations
  const secondaryConfig: FooterButton = {
    label: secondaryButton?.label || t("common.cancel"),
    onClick: onClose,
    type: "button",
    variant: "default",
    ...secondaryButton,
  };

  const primaryConfig: FooterButton | undefined = primaryButton
    ? {
        label: t("common.confirm"),
        type: "button",
        variant: "primary",
        disabled: primaryButton.disabled,
        ...primaryButton,
      }
    : undefined;

  const tertiaryConfig: FooterButton | undefined = tertiaryButton
    ? {
        type: "button",
        variant: "danger",
        ...tertiaryButton,
      }
    : undefined;

  const PrimaryIcon = primaryConfig?.icon;
  const TertiaryIcon = tertiaryConfig?.icon;

  // Footer shows if: custom footer provided, or secondary/tertiary/primary button shown
  const hasFooter =
    showFooter &&
    (footer || showSecondaryButton || tertiaryButton || primaryButton);

  return createPortal(
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-end md:items-center justify-center p-0 md:p-4"
      onClick={hideCloseButton ? undefined : onClose}
    >
      <div
        className={`bg-surface shadow-2xl ${maxWidth} w-full border-t-2 md:border-2 border-primary/30 overflow-hidden animate-in fade-in duration-300 flex flex-col
          rounded-t-2xl md:rounded-2xl
          max-h-[92vh] md:max-h-[95vh]
          slide-in-from-bottom-4 md:slide-in-from-bottom-0 md:zoom-in`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {!hideHeader &&
          (customHeader ? (
            customHeader
          ) : (
            <div className="bg-gradient-to-r from-primary to-secondary p-3 md:p-4 flex-shrink-0">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 md:gap-4 min-w-0">
                  {Icon && (
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 shadow-inner border border-white/20">
                      <Icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                    </div>
                  )}
                  <div className="min-w-0">
                    {isEditMode && onTitleChange ? (
                      <input
                        type="text"
                        value={displayTitle}
                        onChange={(e) => onTitleChange(e.target.value)}
                        className="text-lg md:text-xl font-bold text-white bg-white/20 rounded-lg px-2 md:px-3 py-1 border border-white/30 outline-none focus:border-white/50 mb-0.5 w-full"
                      />
                    ) : (
                      <h2 className="text-lg md:text-xl font-bold text-white mb-0.5 truncate">
                        {displayTitle}
                      </h2>
                    )}
                    {subtitle && (
                      <p className="text-white/90 text-xs md:text-sm truncate">
                        {subtitle}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
                  {showEditButton && !isEditMode && onEditClick && (
                    <button
                      onClick={onEditClick}
                      className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                      title={t("common.edit")}
                    >
                      <Edit3 className="w-4 h-4 md:w-5 md:h-5 text-white" />
                    </button>
                  )}
                  {!hideCloseButton && (
                    <button
                      onClick={onClose}
                      className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                    >
                      <X className="w-4 h-4 md:w-5 md:h-5 text-white" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

        {/* Content */}
        <div className="flex-1 overflow-y-auto hide-scrollbar">
          <div className={noPadding ? "" : "p-4 md:p-6"}>{children}</div>
        </div>

        {/* Footer */}
        {hasFooter && (
          <div className="p-3 md:p-6 bg-surface-secondary border-t-2 border-border flex-shrink-0">
            {footer ? (
              footer
            ) : (
              <div
                className={`flex gap-2 md:gap-3 ${!primaryConfig ? "justify-end" : ""}`}
              >
                {showSecondaryButton && (
                  <button
                    type={secondaryConfig.type}
                    form={secondaryConfig.form}
                    onClick={secondaryConfig.onClick}
                    className={getButtonClasses(
                      secondaryConfig.variant,
                      secondaryConfig.disabled,
                      secondaryConfig.loading,
                      `${primaryConfig ? "flex-1" : ""} ${secondaryConfig.className}`,
                    )}
                    disabled={
                      secondaryConfig.disabled || secondaryConfig.loading
                    }
                  >
                    {secondaryConfig.loading ? (
                      <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    ) : (
                      <>
                        {secondaryConfig.icon &&
                          secondaryConfig.iconPosition !== "right" && (
                            <secondaryConfig.icon className="w-4 h-4 md:w-5 md:h-5" />
                          )}
                        {secondaryConfig.label}
                        {secondaryConfig.icon &&
                          secondaryConfig.iconPosition === "right" && (
                            <secondaryConfig.icon className="w-4 h-4 md:w-5 md:h-5" />
                          )}
                      </>
                    )}
                  </button>
                )}

                {tertiaryConfig && (
                  <button
                    type={tertiaryConfig.type}
                    form={tertiaryConfig.form}
                    onClick={tertiaryConfig.onClick}
                    className={getButtonClasses(
                      tertiaryConfig.variant,
                      tertiaryConfig.disabled,
                      tertiaryConfig.loading,
                      `flex-1 ${tertiaryConfig.className}`,
                    )}
                    disabled={tertiaryConfig.disabled || tertiaryConfig.loading}
                  >
                    {tertiaryConfig.loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        {TertiaryIcon &&
                          tertiaryConfig.iconPosition !== "right" && (
                            <TertiaryIcon className="w-4 h-4 md:w-5 md:h-5" />
                          )}
                        {tertiaryConfig.label}
                        {TertiaryIcon &&
                          tertiaryConfig.iconPosition === "right" && (
                            <TertiaryIcon className="w-4 h-4 md:w-5 md:h-5" />
                          )}
                      </>
                    )}
                  </button>
                )}

                {primaryConfig && (
                  <button
                    type={primaryConfig.type}
                    form={primaryConfig.form}
                    onClick={primaryConfig.onClick}
                    disabled={primaryConfig.disabled || primaryConfig.loading}
                    className={getButtonClasses(
                      primaryConfig.variant,
                      primaryConfig.disabled,
                      primaryConfig.loading,
                      `flex-1 ${primaryConfig.className}`,
                    )}
                  >
                    {primaryConfig.loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {t("common.loading")}
                      </>
                    ) : (
                      <>
                        {PrimaryIcon &&
                          primaryConfig.iconPosition !== "right" && (
                            <PrimaryIcon className="w-4 h-4 md:w-5 md:h-5" />
                          )}
                        {primaryConfig.label}
                        {PrimaryIcon &&
                          primaryConfig.iconPosition === "right" && (
                            <PrimaryIcon className="w-4 h-4 md:w-5 md:h-5" />
                          )}
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
};

export default BaseModal;
