import type { LucideIcon } from "lucide-react";
import { MessageCircle } from "lucide-react";
import React, { type ElementType } from "react";
import { useTranslation } from "react-i18next";

interface ActionButton {
  label: string;
  icon?: ElementType;
  onClick: () => void;
  className?: string;
}

interface NoDataProps {
  icon?: LucideIcon;
  emoji?: string;
  title?: string;
  description?: string;
  actionButton?: ActionButton;
  className?: string;
  iconBg?: string;
}

const NoData: React.FC<NoDataProps> = ({
  icon: Icon,
  emoji,
  title,
  description,
  actionButton,
  className = "bg-surface border border-border rounded-3xl p-12 md:p-20 shadow-sm",
  iconBg = "bg-primary/5",
}) => {
  const { t } = useTranslation();

  const IconComponent = Icon || MessageCircle;
  const displayTitle = title || t("general.no_data");
  const displayDescription = description || t("general.no_data_desc");
  const ActionIcon = actionButton?.icon;

  return (
    <div
      className={`relative overflow-hidden flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95 duration-500 ${className}`}
    >
      <div className="relative mb-8">
        {/* Subtle glow behind icon/emoji */}
        <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full opacity-40 scale-150" />

        <div
          className={`relative z-10 ${
            emoji
              ? "text-7xl md:text-8xl drop-shadow-2xl animate-float"
              : `w-20 h-20 md:w-24 md:h-24 rounded-[2rem] flex items-center justify-center shadow-inner ${iconBg}`
          }`}
        >
          {emoji ? (
            <span>{emoji}</span>
          ) : (
            <IconComponent className="w-10 h-10 md:w-12 md:h-12 text-primary opacity-80" />
          )}
        </div>
      </div>

      <div className="max-w-sm mx-auto relative z-10">
        <h3 className="text-xl md:text-2xl font-black text-text-primary tracking-tight mb-2 uppercase">
          {displayTitle}
        </h3>
        <p className="text-sm md:text-base text-text-secondary leading-relaxed opacity-70 mb-8 px-4">
          {displayDescription}
        </p>
      </div>

      {actionButton && (
        <div className="w-full md:w-auto relative z-10">
          <button
            onClick={actionButton.onClick}
            className={
              actionButton.className ||
              "w-full md:w-auto group inline-flex items-center justify-center gap-2 rounded-xl px-8 py-3.5 text-[11px] font-black uppercase tracking-[0.15em] text-white bg-primary hover:opacity-90 shadow-lg shadow-primary/20 active:scale-95 transition-all duration-300"
            }
          >
            {ActionIcon && <ActionIcon size={16} className="stroke-[2.5]" />}
            {actionButton.label}
          </button>
        </div>
      )}
    </div>
  );
};

export default NoData;
