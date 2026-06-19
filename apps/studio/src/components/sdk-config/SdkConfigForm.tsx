import { SdkConfigAppearanceSection } from "@/components/sdk-config/SdkConfigAppearanceSection";
import { SdkConfigChatBehaviorSection } from "@/components/sdk-config/SdkConfigChatBehaviorSection";
import { SdkConfigCopySection } from "@/components/sdk-config/SdkConfigCopySection";
import { SdkConfigInlineSection } from "@/components/sdk-config/SdkConfigInlineSection";
import { SdkConfigSidebar } from "@/components/sdk-config/SdkConfigSidebar";
import { SdkConfigWidgetSection } from "@/components/sdk-config/SdkConfigWidgetSection";
import type { SdkConfigFormState } from "@/utils/sdk-config-form";

interface SdkConfigFormProps {
  value: SdkConfigFormState;
  onChange: (value: SdkConfigFormState) => void;
  disabled?: boolean;
}

export function SdkConfigForm({
  value,
  onChange,
  disabled = false,
}: SdkConfigFormProps) {
  return (
    <div className="flex flex-col gap-8 md:flex-row md:items-start">
      <SdkConfigSidebar />
      <div className="min-w-0 flex-1 space-y-6">
        <SdkConfigAppearanceSection
          value={value}
          onChange={onChange}
          disabled={disabled}
        />

        <SdkConfigWidgetSection
          value={value}
          onChange={onChange}
          disabled={disabled}
        />
        <SdkConfigInlineSection
          value={value}
          onChange={onChange}
          disabled={disabled}
        />
        <SdkConfigChatBehaviorSection
          value={value}
          onChange={onChange}
          disabled={disabled}
        />
        <SdkConfigCopySection
          value={value}
          onChange={onChange}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
