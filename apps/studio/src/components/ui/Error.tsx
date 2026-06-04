import { AlertCircle, XCircle } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";

interface ErrorComponentProps {
  error?: string;
  showIcon?: boolean;
  compact?: boolean;
}

const ErrorComponent: React.FC<ErrorComponentProps> = ({
  error,
  showIcon = true,
  compact = false,
}) => {
  const { t } = useTranslation();

  return (
    <div className="w-full text-center flex flex-col items-center justify-center mt-22">
      {/* Error Icon Section */}
      {showIcon && (
        <div className={`${compact ? "mb-4" : "mb-6"} animate-bounce`}>
          <div
            className={`relative mx-auto ${compact ? "w-20 h-20" : "w-24 h-24"}`}
          >
            {/* Error icon with gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-red-500 via-red-600 to-red-700 rounded-full flex items-center justify-center shadow-xl shadow-red-500/20">
              <XCircle
                className={`${compact ? "w-8 h-8" : "w-10 h-10"} text-white`}
              />
            </div>
            {/* Decorative floating elements */}
            <div
              className={`absolute -top-2 -right-2 ${compact ? "w-5 h-5" : "w-6 h-6"} bg-red-400 rounded-full animate-pulse opacity-80 shadow-lg`}
            ></div>
            <div
              className={`absolute -bottom-2 -left-2 ${compact ? "w-4 h-4" : "w-5 h-5"} bg-red-300 rounded-full animate-pulse opacity-70 shadow-md`}
              style={{ animationDelay: "0.5s" }}
            ></div>
            <div
              className={`absolute top-1 left-1 ${compact ? "w-2 h-2" : "w-3 h-3"} bg-red-200 rounded-full animate-ping opacity-60`}
              style={{ animationDelay: "1s" }}
            ></div>
          </div>
        </div>
      )}

      {/* Content Section */}
      <div className="space-y-4">
        <h3
          className={`${compact ? "text-xl md:text-2xl" : "text-2xl md:text-3xl"} font-bold text-red-600 dark:text-red-400 tracking-tight`}
        >
          {error || t("common.error")}
        </h3>

        <div className="mt-6">
          <button
            onClick={() => window.location.reload()}
            className="cursor-pointer group relative inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:shadow-red-500/25 transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0"
          >
            <AlertCircle className="w-4 h-4 mr-2" />
            {t("common.retry")}
            <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorComponent;
