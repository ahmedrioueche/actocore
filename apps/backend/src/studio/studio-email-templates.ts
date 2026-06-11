/** ActoCore Studio transactional email HTML (inline CSS for client compatibility). */

const BRAND = {
  primary: '#4f46e5',
  primaryDark: '#4338ca',
  secondary: '#7c3aed',
  text: '#0f172a',
  textMuted: '#64748b',
  muted: '#94a3b8',
  bg: '#f8fafc',
  surface: '#ffffff',
  border: '#e2e8f0',
  danger: '#dc2626',
  dangerSurface: '#fef2f2',
} as const;

const FONT =
  '"Inter", system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

export type StudioEmailLayoutOptions = {
  preheader?: string;
  title: string;
  bodyHtml: string;
  footerNote?: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function plainTextToHtml(text: string): string {
  return escapeHtml(text)
    .split(/\n{2,}/)
    .map((block) => `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${BRAND.textMuted};">${block.replace(/\n/g, '<br>')}</p>`)
    .join('');
}

export function renderStudioEmailLayout(options: StudioEmailLayoutOptions): string {
  const preheader = options.preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;">${escapeHtml(options.preheader)}</div>`
    : '';
  const footer = options.footerNote ?? 'You received this email because of activity on your ActoCore Studio account.';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${escapeHtml(options.title)}</title>
  <style>
    @media only screen and (max-width: 620px) {
      .email-shell { width: 100% !important; }
      .email-body { padding-left: 24px !important; padding-right: 24px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${BRAND.bg};font-family:${FONT};-webkit-font-smoothing:antialiased;">
  ${preheader}
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:${BRAND.bg};">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" class="email-shell" width="600" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;background-color:${BRAND.surface};border-radius:16px;border:1px solid ${BRAND.border};overflow:hidden;box-shadow:0 8px 24px rgba(15,23,42,0.08);">
          <tr>
            <td style="height:4px;background:linear-gradient(90deg,${BRAND.primary} 0%,${BRAND.secondary} 100%);font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <tr>
            <td class="email-body" style="padding:32px 40px 8px;">
              <p style="margin:0 0 8px;font-size:13px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:${BRAND.primary};">ActoCore Studio</p>
              <h1 style="margin:0;font-size:24px;line-height:1.3;font-weight:700;color:${BRAND.text};">${escapeHtml(options.title)}</h1>
            </td>
          </tr>
          <tr>
            <td class="email-body" style="padding:8px 40px 32px;">
              ${options.bodyHtml}
            </td>
          </tr>
          <tr>
            <td class="email-body" style="padding:20px 40px 28px;background-color:${BRAND.bg};border-top:1px solid ${BRAND.border};">
              <p style="margin:0;font-size:12px;line-height:1.5;color:${BRAND.muted};">${escapeHtml(footer)}</p>
              <p style="margin:12px 0 0;font-size:12px;line-height:1.5;color:${BRAND.muted};">&copy; ${new Date().getFullYear()} ActoCore</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function renderPrimaryButton(href: string, label: string): string {
  const safeHref = escapeHtml(href);
  const safeLabel = escapeHtml(label);

  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:28px 0 8px;">
  <tr>
    <td align="center" style="border-radius:10px;background-color:${BRAND.primary};">
      <a href="${safeHref}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:14px 28px;font-family:${FONT};font-size:15px;font-weight:600;line-height:1;color:#ffffff;text-decoration:none;border-radius:10px;background-color:${BRAND.primary};border:1px solid ${BRAND.primaryDark};">${safeLabel}</a>
    </td>
  </tr>
</table>
<p style="margin:16px 0 0;font-size:13px;line-height:1.5;color:${BRAND.muted};">Or copy and paste this link into your browser:<br><a href="${safeHref}" style="color:${BRAND.primary};word-break:break-all;">${safeHref}</a></p>`;
}

function renderOtpCode(code: string): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;">
  <tr>
    <td align="center" style="padding:20px 24px;background-color:${BRAND.bg};border:1px dashed ${BRAND.border};border-radius:12px;">
      <p style="margin:0 0 8px;font-size:12px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:${BRAND.textMuted};">Confirmation code</p>
      <p style="margin:0;font-family:ui-monospace,'Cascadia Code','Segoe UI Mono',monospace;font-size:32px;font-weight:700;letter-spacing:0.2em;color:${BRAND.text};">${escapeHtml(code)}</p>
    </td>
  </tr>
</table>`;
}

export function buildVerificationEmail(verifyUrl: string): { html: string; text: string } {
  const text = [
    'Verify your email to activate your ActoCore Studio account.',
    '',
    verifyUrl,
    '',
    'This link expires in 24 hours. If you did not create an account, you can ignore this email.',
  ].join('\n');

  const html = renderStudioEmailLayout({
    preheader: 'Confirm your email to start using ActoCore Studio.',
    title: 'Verify your email',
    bodyHtml: `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${BRAND.textMuted};">Thanks for signing up. Tap the button below to confirm your email address and activate your account.</p>
${renderPrimaryButton(verifyUrl, 'Verify email address')}
<p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:${BRAND.muted};">This link expires in <strong style="color:${BRAND.text};">24 hours</strong>. If you did not create an account, you can safely ignore this email.</p>`,
  });

  return { html, text };
}

export function buildPasswordResetEmail(resetUrl: string): { html: string; text: string } {
  const text = [
    'Reset your ActoCore Studio password using the link below.',
    '',
    resetUrl,
    '',
    'This link expires in 1 hour. If you did not request a reset, ignore this email.',
  ].join('\n');

  const html = renderStudioEmailLayout({
    preheader: 'Reset your ActoCore Studio password.',
    title: 'Reset your password',
    bodyHtml: `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${BRAND.textMuted};">We received a request to reset the password for your account. Click the button below to choose a new password.</p>
${renderPrimaryButton(resetUrl, 'Reset password')}
<p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:${BRAND.muted};">This link expires in <strong style="color:${BRAND.text};">1 hour</strong>. If you did not request a password reset, you can safely ignore this email.</p>`,
  });

  return { html, text };
}

export function buildDeleteAccountOtpEmail(otp: string): { html: string; text: string } {
  const text = [
    'Your confirmation code to delete your ActoCore Studio account is:',
    '',
    otp,
    '',
    'This code expires in 15 minutes. If you did not request this, ignore this email.',
  ].join('\n');

  const html = renderStudioEmailLayout({
    preheader: 'Confirm account deletion with your one-time code.',
    title: 'Confirm account deletion',
    footerNote:
      'Account deletion is permanent. If you did not request this, secure your account and ignore this email.',
    bodyHtml: `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${BRAND.textMuted};">Enter this code in Studio to permanently delete your account and associated data.</p>
${renderOtpCode(otp)}
<p style="margin:0;font-size:13px;line-height:1.5;color:${BRAND.danger};background-color:${BRAND.dangerSurface};padding:12px 14px;border-radius:8px;">This code expires in <strong>15 minutes</strong>. Never share it with anyone.</p>`,
  });

  return { html, text };
}

export function buildQuotaAlertEmail(
  subject: string,
  body: string,
  studioAppUrl: string,
): { html: string; text: string } {
  const text = [body, '', `Open Studio: ${studioAppUrl}`].join('\n');
  const billingUrl = `${studioAppUrl.replace(/\/$/, '')}/billing`;

  const html = renderStudioEmailLayout({
    preheader: subject,
    title: subject,
    bodyHtml: `${plainTextToHtml(body)}
${renderPrimaryButton(billingUrl, 'Open billing in Studio')}`,
  });

  return { html, text };
}
