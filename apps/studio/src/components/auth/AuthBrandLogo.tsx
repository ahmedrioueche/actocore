import { APP_DATA } from "@/constants/app";
import { cn } from "@/utils/helper";

interface AuthBrandLogoProps {
  compact?: boolean;
}

export function AuthBrandLogo({ compact = false }: AuthBrandLogoProps) {
  return (
    <div className={cn("flex items-center", compact ? "gap-2" : "gap-3")}>
      <span
        className={cn(
          "font-semibold tracking-tight text-primary-contrast",
          compact ? "text-base" : "text-2xl",
        )}
      >
        <span className="font-bold">{APP_DATA.brandName}</span>
        <span className="font-medium opacity-80"> {APP_DATA.shortName}</span>
      </span>
    </div>
  );
}
