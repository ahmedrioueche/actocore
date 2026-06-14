import {
  buildDeleteAccountOtpEmail,
  buildPasswordResetEmail,
  buildSubscriptionEventEmail,
  buildVerificationEmail,
} from './studio-email-templates';

describe('studio-email-templates', () => {
  it('builds verification email with CTA button and plain-text fallback', () => {
    const { html, text } = buildVerificationEmail(
      'https://studio.example/auth/verify-email?token=abc123',
    );

    expect(html).toContain('Verify email address');
    expect(html).toContain('href="https://studio.example/auth/verify-email?token=abc123"');
    expect(html).toContain('bgcolor="#4F46E5"');
    expect(html).toContain('class="cta-btn"');
    expect(html).toContain('border:14px solid #4F46E5');
    expect(html).toContain('font-size:16px');
    expect(html).toContain('text-decoration:none');
    expect(html).not.toContain('<!--[if mso]>');
    expect(html).not.toContain('<!--[if !mso]>');
    expect(text).toContain('abc123');
  });

  it('builds password reset email with CTA button', () => {
    const { html } = buildPasswordResetEmail(
      'https://studio.example/auth/reset-password?token=xyz',
    );

    expect(html).toContain('Reset password');
    expect(html).toContain('token=xyz');
  });

  it('builds delete-account OTP email with styled code block', () => {
    const { html, text } = buildDeleteAccountOtpEmail('482910');

    expect(html).toContain('482910');
    expect(html).toContain('Deletion confirmation code');
    expect(text).toContain('482910');
  });

  it('escapes HTML in verification URLs', () => {
    const { html } = buildVerificationEmail(
      'https://studio.example/auth/verify?token="><script>',
    );

    expect(html).not.toContain('<script>');
    expect(html).toContain('&quot;&gt;&lt;script&gt;');
  });

  it('builds subscription event email with billing CTA', () => {
    const { html, text } = buildSubscriptionEventEmail(
      'Subscription active',
      'Your Starter plan is active.',
      'https://studio.example',
    );

    expect(html).toContain('Subscription active');
    expect(html).toContain('Open billing in Studio');
    expect(html).toContain('https://studio.example/billing');
    expect(text).toContain('Your Starter plan is active.');
  });
});
