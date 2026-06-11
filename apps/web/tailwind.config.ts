import type { Config } from 'tailwindcss';
import brandPreset from '../../packages/brand/tailwind.preset.js';

const config: Config = {
  presets: [brandPreset],
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  plugins: [],
};

export default config;
