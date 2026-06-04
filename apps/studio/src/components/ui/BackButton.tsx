import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";

interface BackButtonProps {
  onClick?: () => void;
  className?: string;
  label?: string;
}

const BackButton = ({ onClick, className = "" }: BackButtonProps) => {
  const { t } = useTranslation();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      window.history.back();
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`group inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors duration-200 ${className}`}
    >
      <div className="w-9 h-9 rounded-xl bg-zinc-800/50 border border-zinc-700/50 flex items-center justify-center transition-all duration-200 group-hover:bg-zinc-700/50 group-hover:border-zinc-600/50 group-hover:-translate-x-0.5">
        <ArrowLeft className="w-4 h-4" />
      </div>
      <span className="text-sm font-semibold">{t("common.goBack")}</span>
    </button>
  );
};

export default BackButton;
