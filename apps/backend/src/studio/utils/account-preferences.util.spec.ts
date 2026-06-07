import { normalizeAccountPreferences } from './account-preferences.util';

describe('normalizeAccountPreferences', () => {
  it('derives warning and exhausted from legacy quotaAlertEmails', () => {
    expect(
      normalizeAccountPreferences({
        quotaAlertEmails: false,
        billingEmails: true,
        productEmails: false,
      }),
    ).toMatchObject({
      quotaWarningEmails: false,
      quotaExhaustedEmails: false,
      failureAlertEmails: true,
    });
  });

  it('prefers explicit split flags over legacy value', () => {
    expect(
      normalizeAccountPreferences({
        quotaAlertEmails: false,
        quotaWarningEmails: true,
        quotaExhaustedEmails: false,
        billingEmails: true,
        productEmails: false,
      }),
    ).toMatchObject({
      quotaWarningEmails: true,
      quotaExhaustedEmails: false,
    });
  });
});
