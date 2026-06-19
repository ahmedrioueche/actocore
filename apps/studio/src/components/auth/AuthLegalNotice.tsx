import { useTranslation } from 'react-i18next';

import { getLegalLinks } from '@/constants/legal';

export function AuthLegalNotice() {
  const { t, i18n } = useTranslation();
  const legalLinks = getLegalLinks(i18n.language);

  return (
      <p className="mt-4 text-center text-sm text-text-secondary">
      {t('auth.signup.legalPrefix')}{' '}
      <a
        href={legalLinks.terms}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:underline"
      >
        {t('auth.signup.termsLink')}
      </a>{' '}
      {t('auth.signup.legalAnd')}{' '}
      <a
        href={legalLinks.privacy}
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
