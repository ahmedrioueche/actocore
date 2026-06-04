import { Zap } from "lucide-react";
import { useTranslation } from "react-i18next";
import "../../styles/animatedLogo.css";

const AnimatedLogo = ({
  height = "h-16",
  width = "w-full max-w-[400px]",
  logoSize = "w-12 h-12 md:w-16 md:h-16",
  textSize = "text-xl md:text-3xl",
  leftPosition = "50%",
  mobileLeftPosition,
  paddingTop = "pt-0",
  onClick,
  compact = false,
  gradientFrom = "from-primary",
  gradientTo = "to-secondary",
  animateOnce = false,
}: {
  height?: string;
  width?: string;
  logoSize?: string;
  textSize?: string;
  leftPosition?: string;
  mobileLeftPosition?: string;
  paddingTop?: string;
  onClick?: () => void;
  compact?: boolean;
  gradientFrom?: string;
  gradientTo?: string;
  animateOnce?: boolean;
}) => {
  const { t } = useTranslation();

  return (
    <div
      onClick={() => {
        if (onClick) onClick();
      }}
      className={`flex items-center justify-center mb-3 ${height} relative ${width} ${paddingTop} ${
        onClick ? "cursor-pointer" : " "
      }`}
    >
      {/* Zap Icon with smooth horizontal shift */}
      <div
        className="zap-container animate-zap-move"
        style={
          {
            "--left-position": leftPosition,
            "--mobile-left-position": mobileLeftPosition || leftPosition,
            animationIterationCount: animateOnce ? 1 : "infinite",
          } as React.CSSProperties
        }
      >
        <div
          className={`${logoSize} bg-gradient-to-br ${gradientFrom} ${gradientTo} rounded-xl flex items-center justify-center shadow-lg zap-shine`}
        >
          <Zap className="w-8 h-8 text-white" />
        </div>
      </div>

      {/* App Name with slide-in and shiny effect */}
      {!compact && (
        <span
          className={`${textSize} app-name animate-app-slide font-bold whitespace-nowrap text-transparent bg-clip-text bg-gradient-to-r ${gradientFrom} ${gradientTo}`}
          style={
            {
              "--left-position": leftPosition,
              "--mobile-left-position": mobileLeftPosition || leftPosition,
              animationIterationCount: animateOnce ? 1 : "infinite",
            } as React.CSSProperties
          }
        >
          {t("app.name")}
        </span>
      )}
    </div>
  );
};

export default AnimatedLogo;
