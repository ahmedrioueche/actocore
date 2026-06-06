import { useTranslation } from 'react-i18next';

import { LEGAL_LINKS } from '@/constants/legal';

export function AuthLegalNotice() {
  const { t } = useTranslation();

  return (
      <p className="mt-4 text-center text-sm text-text-secondary">
      {t('auth.signup.legalPrefix')}{' '}
      <a
        href={LEGAL_LINKS.terms}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:underline"
      >
        {t('auth.signup.termsLink')}
      </a>{' '}
      {t('auth.signup.legalAnd')}{' '}
      <a
        href={LEGAL_LINKS.privacy}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:underline"
      >
        {t('auth.signup.privacyLink')}
      </a>
      .
    </p>
  );
}
