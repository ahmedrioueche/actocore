import { useTranslation } from "react-i18next";

import {
  persistStudioLanguage,
  STUDIO_LANGUAGES,
  type StudioLanguage,
} from "@/constants/languages";

export default function LanguagesDropdown() {
  const { i18n } = useTranslation();

  const handleChange = (lang: StudioLanguage) => {
    persistStudioLanguage(lang);
    void i18n.changeLanguage(lang);
  };

  return (
    <select
      value={i18n.language as StudioLanguage}
      onChange={(e) => handleChange(e.target.value as StudioLanguage)}
      className="border border-border rounded-lg px-2 py-1 bg-surface text-text-primary text-sm"
      aria-label="Language"
    >
      {Object.entries(STUDIO_LANGUAGES).map(([code, { label }]) => (
        <option key={code} value={code}>
          {label}
        </option>
      ))}
    </select>
  );
}
