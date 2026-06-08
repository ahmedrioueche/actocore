import { APP_DATA } from '@/constants/app';
import { ActocoreIcon } from '@/components/ui/ActocoreIcon';

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <ActocoreIcon className="h-8 w-8 rounded-lg" />
      <span className="text-2xl font-bold text-brand-gradient">
        {APP_DATA.name}
      </span>
    </div>
  );
}

export default Logo;
