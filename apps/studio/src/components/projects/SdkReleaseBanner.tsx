import { SDK_RELEASES } from '@ahmedrioueche/actocore-shared';
import { useNavigate } from '@tanstack/react-router';
import { Info, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import Button from '@/components/ui/Button';
import Tip from '@/components/ui/Tip';
import { useSdkReleaseBanner } from '@/hooks/use-sdk-release-banner';

interface SdkReleaseBannerProps {
  projectId: string;
}

export function SdkReleaseBanner({ projectId }: SdkReleaseBannerProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isVisible, dismiss, latestVersion } = useSdkReleaseBanner();

  if (!isVisible) {
    return null;
  }

  const latestRelease = SDK_RELEASES[0];
  const summary = latestRelease?.summary ?? '';

  const handleViewUpdates = () => {
    void navigate({
      to: '/projects/$projectId/docs',
      params: { projectId },
      hash: 'sdk-updates',
    });
  };

  return (
    <div className="relative">
      <Tip variant="info" icon={Info}>
        <div className="space-y-3">
          <div className="pr-8">
            <p className="font-medium text-text-primary">
              {t('sdkReleaseBanner.title', { version: latestVersion })}
            </p>
            {summary ? (
              <p className="mt-1 text-sm text-text-secondary">{summary}</p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={handleViewUpdates}>
              {t('sdkReleaseBanner.viewUpdates')}
            </Button>
            <Button size="sm" variant="ghost" onClick={dismiss}>
              {t('sdkReleaseBanner.dismiss')}
            </Button>
          </div>
        </div>
      </Tip>
      <button
        type="button"
        onClick={dismiss}
        className="absolute right-3 top-3 rounded-lg p-1 text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
        aria-label={t('sdkReleaseBanner.dismiss')}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
