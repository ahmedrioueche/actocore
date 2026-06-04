import { Sparkles } from "lucide-react";
import { APP_DATA } from "@/constants/app";

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <Sparkles className="w-8 h-8 text-primary" aria-hidden />
      <span className="text-2xl font-bold text-brand-gradient">
        {APP_DATA.name}
      </span>
    </div>
  );
}

export default Logo;
