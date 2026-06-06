import { useTranslation } from 'react-i18next';

import ErrorSection from '@/components/ui/ErrorSection';

interface ErrorPageProps {
  message?: string;
  subtext?: string;
  onRetry?: () => void;
}

/** Full-page error route or fatal UI fallback. */
export default function ErrorPage({
  message,
  subtext,
  onRetry,
}: ErrorPageProps) {
  const { t } = useTranslation();

  return (
    <ErrorSection
      fullPage
      message={message ?? t('errorBoundary.title')}
      subtext={subtext ?? t('errorBoundary.message')}
      onRetry={onRetry}
    />
  );
}
