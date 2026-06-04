import React from "react";
import { useTranslation } from "react-i18next";

interface NotFoundProps {
  text?: string;
  icon?: React.ReactNode;
  subtext?: string;
  bgColor?: string;
}

const NotFound: React.FC<NotFoundProps> = ({
  text,
  icon,
  subtext,
  bgColor,
}) => {
  const { t } = useTranslation();

  // Use provided text or fallback to translation or default
  const displayText = text || t("general.page_not_found");
  const displaySubtext = subtext || t("general.page_not_found_desc");

  return (
    <div
      className={`min-h-screen ${bgColor} text-text-primary flex items-center justify-center px-4`}
    >
      <div className="max-w-xl w-full text-center">
        {/* Icon Section */}
        <div className="mb-8 animate-bounce">
          {icon || (
            <div className="relative mx-auto w-32 h-32 mb-6">
              {/* Default 404 icon with gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary via-secondary to-accent rounded-full flex items-center justify-center shadow-2xl shadow-primary/20">
                <span className="text-4xl font-bold text-white">404</span>
              </div>
              {/* Decorative floating elements */}
              <div className="absolute -top-3 -right-3 w-8 h-8 bg-secondary rounded-full animate-pulse opacity-80 shadow-lg"></div>
              <div
                className="absolute -bottom-3 -left-3 w-6 h-6 bg-accent rounded-full animate-pulse opacity-70 shadow-md"
                style={{ animationDelay: "0.5s" }}
              ></div>
              {/* Additional decorative dots */}
              <div
                className="absolute top-2 left-2 w-3 h-3 bg-primary rounded-full animate-ping opacity-60"
                style={{ animationDelay: "1s" }}
              ></div>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="space-y-6">
          <h2 className="text-5xl md:text-6xl font-bold text-text-primary mb-4 tracking-tight">
            {displayText}
          </h2>

          {displaySubtext && (
            <p className="text-xl text-text-secondary max-w-lg mx-auto leading-relaxed font-medium">
              {displaySubtext}
            </p>
          )}

          {/* Action Button */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => window.history.back()}
              className="w-full sm:w-auto cursor-pointer group relative inline-flex items-center justify-center px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-white/20 transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0"
            >
              <span className="mr-2">←</span>
              {t("actions.go_back")}
            </button>
            <button
              onClick={() => (window.location.href = "/")}
              className="w-full sm:w-auto cursor-pointer group relative inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:shadow-primary/25 transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0"
            >
              <span className="mr-2">🏠</span>
              {t("actions.go_home")}
              <div className="absolute inset-0 bg-gradient-to-r from-secondary to-accent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
            </button>
          </div>
        </div>

        {/* Floating Background Decorations */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
          {/* Large floating circles */}
          <div className="absolute top-20 left-10 w-4 h-4 bg-primary rounded-full animate-pulse opacity-30"></div>
          <div
            className="absolute top-1/3 right-16 w-6 h-6 bg-secondary rounded-full animate-pulse opacity-25"
            style={{ animationDelay: "1s" }}
          ></div>
          <div
            className="absolute bottom-1/3 left-16 w-5 h-5 bg-accent rounded-full animate-pulse opacity-20"
            style={{ animationDelay: "1.5s" }}
          ></div>
          <div
            className="absolute bottom-24 right-12 w-3 h-3 bg-primary rounded-full animate-pulse opacity-35"
            style={{ animationDelay: "2s" }}
          ></div>

          {/* Large background gradient orbs */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-tl from-secondary/5 to-transparent rounded-full blur-3xl"></div>
        </div>

        {/* Subtle grid pattern overlay */}
        <div
          className="fixed inset-0 pointer-events-none opacity-[0.02] -z-20"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
            backgroundSize: "32px 32px",
          }}
        ></div>
      </div>
    </div>
  );
};

export default NotFound;
