import { useTranslation } from 'react-i18next';

import Button from '@/components/ui/Button';
import { useGoogleAuth } from '@/hooks/use-auth';

export function GoogleAuthButton() {
  const { t } = useTranslation();
  const googleAuth = useGoogleAuth();

  return (
    <Button
      type="button"
      variant="outline"
      color="primary"
      fullWidth
      loading={googleAuth.isPending}
      onClick={() => googleAuth.mutate()}
    >
      {t('auth.google')}
    </Button>
  );
}
