/** Masks an email for logs (e.g. jo***@example.com). */
export function maskEmail(email: string): string {
  const trimmed = email.trim();
  const at = trimmed.indexOf('@');
  if (at <= 0) {
    return '***';
  }
  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1);
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}***@${domain}`;
}
