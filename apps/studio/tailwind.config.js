/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "var(--ac-color-primary)",
          hover: "var(--ac-color-primary-hover)",
          contrast: "var(--ac-color-primary-contrast)",
          muted: "var(--ac-color-primary-muted)",
        },
        secondary: {
          DEFAULT: "var(--ac-color-secondary)",
          hover: "var(--ac-color-secondary-hover)",
        },
        accent: "var(--ac-color-accent)",
        background: "var(--ac-color-bg)",
        surface: {
          DEFAULT: "var(--ac-color-surface)",
          secondary: "var(--ac-color-surface-secondary)",
          hover: "var(--ac-color-surface-hover)",
          elevated: "var(--ac-color-surface-elevated)",
        },
        border: {
          DEFAULT: "var(--ac-color-border)",
          hover: "var(--ac-color-border-hover)",
        },
        muted: "var(--ac-color-muted)",
        "text-primary": "var(--ac-color-text)",
        "text-secondary": "var(--ac-color-text-muted)",
        danger: {
          DEFAULT: "var(--ac-color-danger)",
          hover: "var(--ac-color-danger-hover)",
          surface: "var(--ac-color-danger-surface)",
        },
        success: {
          DEFAULT: "var(--ac-color-success)",
          hover: "var(--ac-color-success-hover)",
          surface: "var(--ac-color-success-surface)",
        },
        warning: {
          DEFAULT: "var(--ac-color-warning)",
          surface: "var(--ac-color-warning-surface)",
        },
        toast: {
          "success-bg": "var(--ac-color-toast-success-bg)",
          "success-border": "var(--ac-color-toast-success-border)",
          "error-bg": "var(--ac-color-toast-error-bg)",
          "error-border": "var(--ac-color-toast-error-border)",
          "info-bg": "var(--ac-color-toast-info-bg)",
          "info-border": "var(--ac-color-toast-info-border)",
        },
      },
      fontFamily: {
        sans: ["var(--ac-font-family)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        sm: "var(--ac-radius-sm)",
        md: "var(--ac-radius-md)",
        lg: "var(--ac-radius-lg)",
        xl: "var(--ac-radius-xl)",
      },
      boxShadow: {
        sm: "var(--ac-shadow-sm)",
        md: "var(--ac-shadow-md)",
        brand: "var(--ac-shadow-brand)",
      },
      backgroundImage: {
        "brand-gradient": "var(--ac-gradient-brand)",
        "brand-gradient-soft": "var(--ac-gradient-brand-soft)",
      },
      animation: {
        "soft-pulse": "soft-pulse 3s ease-in-out infinite",
        "gradient-shift": "gradient-shift 2s ease infinite",
      },
      keyframes: {
        "soft-pulse": {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "0.8" },
        },
        "gradient-shift": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
      },
    },
  },
  plugins: [],
};
