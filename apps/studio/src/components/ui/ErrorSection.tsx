import { AlertCircle, XCircle } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";

interface ErrorSectionProps {
  message: string;
  icon?: React.ReactNode;
  subtext?: string;
}

const ErrorSection: React.FC<ErrorSectionProps> = ({
  message,
  icon,
  subtext,
}) => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col items-center justify-center px-4">
      <div className="max-w-xl w-full text-center">
        {/* Error Icon Section */}
        <div className="mb-8 animate-bounce">
          {icon || (
            <div className="relative mx-auto w-32 h-32 mb-6">
              {/* Error icon with gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-danger via-danger-hover to-danger rounded-full flex items-center justify-center shadow-2xl shadow-danger/25">
                <XCircle className="w-12 h-12 text-white" />
              </div>
              {/* Decorative floating elements */}
              <div className="absolute -top-3 -right-3 w-8 h-8 bg-danger/70 rounded-full animate-pulse opacity-80 shadow-lg" />
              <div
                className="absolute -bottom-3 -left-3 w-6 h-6 bg-danger/50 rounded-full animate-pulse opacity-70 shadow-md"
                style={{ animationDelay: "0.5s" }}
              />
              <div
                className="absolute top-2 left-2 w-3 h-3 bg-danger/40 rounded-full animate-ping opacity-60"
                style={{ animationDelay: "1s" }}
              ></div>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold text-danger mb-4 tracking-tight">
            {message}
          </h2>

          {subtext && (
            <p className="text-lg text-text-secondary max-w-lg mx-auto leading-relaxed">
              {subtext}
            </p>
          )}

          {/* Action Button */}
          <div className="mt-8">
            <button
              onClick={() => window.history.back()}
              className="cursor-pointer group relative inline-flex items-center px-6 py-3 bg-gradient-to-r from-danger to-danger-hover text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:shadow-danger/25 transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0"
            >
              <AlertCircle className="w-5 h-5 mr-2" />
              {t("common.goBack")}
              <div className="absolute inset-0 bg-gradient-to-r from-danger-hover to-danger rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
            </button>
          </div>
        </div>

        {/* Floating Background Decorations */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
          {/* Large floating circles */}
          <div className="absolute top-20 left-10 w-4 h-4 bg-red-500 rounded-full animate-pulse opacity-30"></div>
          <div
            className="absolute top-1/3 right-16 w-6 h-6 bg-red-400 rounded-full animate-pulse opacity-25"
            style={{ animationDelay: "1s" }}
          ></div>
          <div
            className="absolute bottom-1/3 left-16 w-5 h-5 bg-red-300 rounded-full animate-pulse opacity-20"
            style={{ animationDelay: "1.5s" }}
          ></div>
          <div
            className="absolute bottom-24 right-12 w-3 h-3 bg-red-500 rounded-full animate-pulse opacity-35"
            style={{ animationDelay: "2s" }}
          ></div>

          {/* Large background gradient orbs */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-red-500/5 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-tl from-red-400/5 to-transparent rounded-full blur-3xl"></div>
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

export default ErrorSection;
