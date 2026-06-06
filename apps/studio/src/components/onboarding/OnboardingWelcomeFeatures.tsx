import { BookOpen, Code2, FolderKanban } from "lucide-react";
import { useTranslation } from "react-i18next";

const FEATURES = [
  { icon: FolderKanban, key: "pointProjects" as const },
  { icon: BookOpen, key: "pointKnowledge" as const },
  { icon: Code2, key: "pointSdk" as const },
];

export function OnboardingWelcomeFeatures() {
  const { t } = useTranslation();

  return (
    <ul className="divide-y divide-border">
      {FEATURES.map(({ icon: Icon, key }) => (
        <li key={key} className="flex gap-4 py-4 first:pt-0 last:pb-0">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-gradient-soft text-primary">
            <Icon className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
          </span>
          <p className="pt-2 text-sm leading-relaxed text-text-secondary">
            {t(`onboarding.welcome.${key}`)}
          </p>
        </li>
      ))}
    </ul>
  );
}
