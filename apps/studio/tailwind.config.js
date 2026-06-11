import brandPreset from "../../packages/brand/tailwind.preset.js";

/** @type {import('tailwindcss').Config} */
export default {
  presets: [brandPreset],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  plugins: [],
};
