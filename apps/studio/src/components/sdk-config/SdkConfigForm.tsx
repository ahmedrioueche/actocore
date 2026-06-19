import { useEffect, useRef, useState } from "react";

import { SdkConfigAppearanceSection } from "@/components/sdk-config/SdkConfigAppearanceSection";
import { SdkConfigChatBehaviorSection } from "@/components/sdk-config/SdkConfigChatBehaviorSection";
import { SdkConfigCopySection } from "@/components/sdk-config/SdkConfigCopySection";
import { SdkConfigInlineSection } from "@/components/sdk-config/SdkConfigInlineSection";
import { SdkConfigLoadingSection } from "@/components/sdk-config/SdkConfigLoadingSection";
import { SdkConfigSidebar } from "@/components/sdk-config/SdkConfigSidebar";
import { SdkConfigWidgetSection } from "@/components/sdk-config/SdkConfigWidgetSection";
import {
  readSdkConfigSectionFromHash,
  type SdkConfigSectionId,
} from "@/constants/sdk-config-nav";
import type { SdkConfigFormState } from "@/utils/sdk-config-form";
import type { SdkProjectConfigData } from "@ahmedrioueche/actocore-shared";

interface SdkConfigFormProps {
  projectId: string;
  value: SdkConfigFormState;
  onChange: (value: SdkConfigFormState) => void;
  disabled?: boolean;
  savedConfig?: SdkProjectConfigData;
}

export function SdkConfigForm({
  projectId,
  value,
  onChange,
  disabled = false,
  savedConfig,
}: SdkConfigFormProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState<SdkConfigSectionId>(
    readSdkConfigSectionFromHash,
  );

  useEffect(() => {
    const sync = () => setActiveSection(readSdkConfigSectionFromHash());
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const handleSectionChange = (id: SdkConfigSectionId) => {
    setActiveSection(id);
    window.location.hash = id;
    contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const sectionProps = { value, onChange, disabled };

  return (
    <div className="flex flex-col gap-8 md:flex-row md:items-start">
      <SdkConfigSidebar
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
      />
      <div ref={contentRef} className="min-w-0 flex-1">
        {activeSection === "appearance" && (
          <SdkConfigAppearanceSection {...sectionProps} />
        )}
        {activeSection === "widget" && (
          <SdkConfigWidgetSection
            {...sectionProps}
            savedConfig={savedConfig}
          />
        )}
        {activeSection === "inline" && (
          <SdkConfigInlineSection {...sectionProps} />
        )}
        {activeSection === "chat-behavior" && (
          <SdkConfigChatBehaviorSection {...sectionProps} />
        )}
        {activeSection === "loading" && (
          <SdkConfigLoadingSection {...sectionProps} />
        )}
        {activeSection === "languages" && (
          <SdkConfigCopySection {...sectionProps} projectId={projectId} />
        )}
      </div>
    </div>
  );
}
