import { useTranslation } from 'react-i18next';

import { ThemeModePicker } from '@/components/ui/ThemeModePicker';
import { useTheme } from '@/context/ThemeContext';
import { cn } from '@/utils/helper';

interface ThemeModeSelectProps {
  variant?: 'field' | 'inline';
  className?: string;
}

export function ThemeModeSelect({
  variant = 'field',
  className,
}: ThemeModeSelectProps) {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();

  return (
    <ThemeModePicker
      value={theme}
      onChange={setTheme}
      label={t('theme.label')}
      hint={t('theme.hint')}
      size={variant === 'inline' ? 'compact' : 'default'}
      className={cn(variant === 'inline' && 'px-2 py-1', className)}
    />
  );
}
