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

const FONT = 'Arial, Helvetica, sans-serif';

/** Shared CTA styles — uppercase hex + border-padding survives Gmail/Outlook stripping. */
const CTA = {
  bg: '#4F46E5',
  border: '#4338CA',
  text: '#FFFFFF',
  padY: '14px',
  padX: '28px',
  fontSize: '16px',
  lineHeight: '20px',
  radius: '12px',
} as const;

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
    .cta-btn,
    .cta-btn:link,
    .cta-btn:visited,
    .cta-btn:hover,
    .cta-btn:active {
      color: ${CTA.text} !important;
      text-decoration: none !important;
    }
    u + .body .cta-btn,
    u + .body .cta-btn span {
      color: ${CTA.text} !important;
      text-decoration: none !important;
    }
    #MessageViewBody a.cta-btn {
      color: ${CTA.text} !important;
      text-decoration: none !important;
    }
    @media only screen and (max-width: 620px) {
      .email-shell { width: 100% !important; }
      .email-body { padding-left: 24px !important; padding-right: 24px !important; }
      .cta-btn { font-size: 15px !important; border-width: 12px 22px !important; }
    }
  </style>
</head>
<body class="body" style="margin:0;padding:0;background-color:${BRAND.bg};font-family:${FONT};-webkit-font-smoothing:antialiased;">
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

  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:40px 0 20px;">
  <tr>
    <td align="center">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
        <tr>
          <td align="center" bgcolor="${CTA.bg}" style="background-color:${CTA.bg};border-radius:${CTA.radius};border:2px solid ${CTA.border};mso-padding-alt:${CTA.padY} ${CTA.padX};">
            <a href="${safeHref}" class="cta-btn" target="_blank" rel="noopener noreferrer" style="background-color:${CTA.bg};border:${CTA.padY} solid ${CTA.bg};border-radius:${CTA.radius};color:${CTA.text};display:inline-block;font-family:${FONT};font-size:${CTA.fontSize};font-weight:700;line-height:${CTA.lineHeight};text-align:center;text-decoration:none;text-decoration-line:none;white-space:nowrap;box-sizing:border-box;">
              <span style="color:${CTA.text};text-decoration:none;font-size:${CTA.fontSize};font-weight:700;line-height:${CTA.lineHeight};">${safeLabel}</span>
            </a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
<p style="margin:28px 0 0;font-size:13px;line-height:1.6;color:${BRAND.muted};text-align:center;">Or copy and paste this link into your browser:</p>
<p style="margin:8px 0 0;font-size:13px;line-height:1.6;text-align:center;word-break:break-all;"><span style="color:${BRAND.primary};">${safeHref}</span></p>`;
}

function renderOtpCode(code: string, caption = 'Confirmation code'): string {
  const digits = escapeHtml(code)
    .split('')
    .map(
      (digit) =>
        `<td style="width:44px;height:52px;text-align:center;vertical-align:middle;font-family:ui-monospace,'Cascadia Code','Segoe UI Mono',monospace;font-size:28px;font-weight:700;color:${BRAND.text};background-color:${BRAND.surface};border:1px solid ${BRAND.border};border-radius:10px;">${digit}</td>`,
    )
    .join(`<td style="width:8px;font-size:0;line-height:0;">&nbsp;</td>`);

  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:28px 0;">
  <tr>
    <td align="center" style="padding:24px 20px;background-color:${BRAND.bg};border:1px solid ${BRAND.border};border-radius:16px;">
      <p style="margin:0 0 16px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${BRAND.textMuted};">${escapeHtml(caption)}</p>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
        <tr>${digits}</tr>
      </table>
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
    bodyHtml: `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${BRAND.textMuted};">You requested to delete your ActoCore Studio account. Enter this code in Settings to confirm — your workspace and data will be permanently removed.</p>
${renderOtpCode(otp, 'Deletion confirmation code')}
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0;">
  <tr>
    <td style="padding:14px 16px;border-radius:10px;background-color:${BRAND.dangerSurface};border:1px solid rgba(220,38,38,0.2);">
      <p style="margin:0;font-size:13px;line-height:1.6;color:${BRAND.danger};"><strong>Expires in 15 minutes.</strong> Never share this code. If you did not request deletion, change your password and ignore this email.</p>
    </td>
  </tr>
</table>`,
  });

  return { html, text };
}

export function buildQuotaAlertEmail(
  subject: string,
  body: string,
  studioAppUrl: string,
): { html: string; text: string } {
  return buildStudioBillingEmail(subject, subject, body, studioAppUrl);
}

export function buildSubscriptionEventEmail(
  subject: string,
  body: string,
  studioAppUrl: string,
): { html: string; text: string } {
  return buildStudioBillingEmail(subject, subject, body, studioAppUrl);
}

function buildStudioBillingEmail(
  preheader: string,
  title: string,
  body: string,
  studioAppUrl: string,
): { html: string; text: string } {
  const text = [body, '', `Open Studio: ${studioAppUrl}`].join('\n');
  const billingUrl = `${studioAppUrl.replace(/\/$/, '')}/billing`;

  const html = renderStudioEmailLayout({
    preheader,
    title,
    bodyHtml: `${plainTextToHtml(body)}
${renderPrimaryButton(billingUrl, 'Open billing in Studio')}`,
  });

  return { html, text };
}

export function buildContactInquiryEmail(input: {
  name: string;
  email: string;
  subject?: string;
  message: string;
}): { html: string; text: string } {
  const subjectLine = input.subject?.trim() || 'ActoCore inquiry';
  const text = [
    `Name: ${input.name}`,
    `Email: ${input.email}`,
    `Subject: ${subjectLine}`,
    '',
    input.message,
  ].join('\n');

  const bodyHtml = `
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 20px;">
  <tr><td style="padding:8px 0;font-size:14px;color:${BRAND.textMuted};"><strong style="color:${BRAND.text};">From:</strong> ${escapeHtml(input.name)} &lt;${escapeHtml(input.email)}&gt;</td></tr>
  <tr><td style="padding:8px 0;font-size:14px;color:${BRAND.textMuted};"><strong style="color:${BRAND.text};">Subject:</strong> ${escapeHtml(subjectLine)}</td></tr>
</table>
${plainTextToHtml(input.message)}`;

  const html = renderStudioEmailLayout({
    preheader: `New contact form message from ${input.name}`,
    title: 'New contact form message',
    bodyHtml,
    footerNote: 'You received this email from the ActoCore marketing site contact form.',
  });

  return { html, text };
}
