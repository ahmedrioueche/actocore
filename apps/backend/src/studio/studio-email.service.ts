import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { StudioAuthConfig } from '../config/studio-auth.config';
import {
  buildContactInquiryEmail,
  buildDeleteAccountOtpEmail,
  buildPasswordResetEmail,
  buildQuotaAlertEmail,
  buildStudioReportEmail,
  buildSubscriptionEventEmail,
  buildPlatformActivityEmail,
  buildVerificationEmail,
} from './studio-email-templates';
import { buildStudioAppUrl } from './utils/studio-redirect.util';

const RESEND_API_URL = 'https://api.resend.com/emails';

type EmailSendOptions = {
  replyTo?: string;
};

@Injectable()
export class StudioEmailService {
  private readonly logger = new Logger(StudioEmailService.name);

  constructor(private readonly config: ConfigService) {}

  /** True when Resend API or SMTP is configured (real delivery, not console-only). */
  isEmailConfigured(): boolean {
    const cfg = this.cfg();
    return Boolean(cfg.resendApiKey || cfg.smtpHost);
  }

  /** @deprecated Use {@link isEmailConfigured} */
  isSmtpConfigured(): boolean {
    return this.isEmailConfigured();
  }

  buildVerificationUrl(token: string): string {
    return buildStudioAppUrl(this.cfg().studioAppUrl, '/auth/verify-email', {
      token,
    });
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verifyUrl = this.buildVerificationUrl(token);
    const content = buildVerificationEmail(verifyUrl);
    await this.send(email, 'Verify your ActoCore Studio email', content);
  }

  async sendDeleteAccountOtp(email: string, otp: string): Promise<void> {
    const content = buildDeleteAccountOtpEmail(otp);
    await this.send(email, 'Confirm ActoCore Studio account deletion', content);
  }

  async sendQuotaAlert(to: string, subject: string, text: string): Promise<void> {
    const content = buildQuotaAlertEmail(
      subject,
      text,
      this.cfg().studioAppUrl,
    );
    await this.send(to, `ActoCore Studio — ${subject}`, content);
  }

  async sendSubscriptionEvent(
    to: string,
    subject: string,
    text: string,
  ): Promise<void> {
    const content = buildSubscriptionEventEmail(
      subject,
      text,
      this.cfg().studioAppUrl,
    );
    await this.send(to, `ActoCore Studio — ${subject}`, content);
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetUrl = buildStudioAppUrl(this.cfg().studioAppUrl, '/auth/reset-password', {
      token,
    });
    const content = buildPasswordResetEmail(resetUrl);
    await this.send(email, 'Reset your ActoCore Studio password', content);
  }

  async sendContactInquiry(input: {
    name: string;
    email: string;
    subject?: string;
    message: string;
  }): Promise<void> {
    const cfg = this.cfg();
    const subjectLine = input.subject?.trim() || 'ActoCore inquiry';
    const content = buildContactInquiryEmail(input);
    await this.send(
      cfg.contactInboxEmail,
      `[ActoCore Contact] ${subjectLine}`,
      content,
      { replyTo: input.email },
    );
  }

  async sendPlatformActivity(
    to: string,
    eventLabel: string,
    lines: string[],
  ): Promise<void> {
    const cfg = this.cfg();
    const content = buildPlatformActivityEmail({
      eventLabel,
      lines,
      studioAppUrl: cfg.studioAppUrl,
    });
    await this.send(to, `[ActoCore Platform] ${eventLabel}`, content);
  }

  async sendStudioReportNotification(report: {
    id: string;
    type: string;
    accountName: string;
    reporterEmail?: string;
    reporterDisplayName?: string;
    subject?: string;
    message: string;
  }): Promise<void> {
    const cfg = this.cfg();
    const subjectLine = report.subject?.trim() || report.type;
    const content = buildStudioReportEmail(report);
    await this.send(
      cfg.reportsInboxEmail,
      `[ActoCore Report] ${report.type} — ${report.accountName}`,
      content,
      report.reporterEmail ? { replyTo: report.reporterEmail } : undefined,
    );
  }

  private async send(
    to: string,
    subject: string,
    content: { text: string; html: string },
    options?: EmailSendOptions,
  ): Promise<void> {
    const cfg = this.cfg();

    if (cfg.resendApiKey) {
      await this.sendViaResend(cfg, to, subject, content, options);
      return;
    }

    if (cfg.smtpHost) {
      await this.sendViaSmtp(cfg, to, subject, content, options);
      return;
    }

    this.logger.log(
      `[Studio email] To: ${to} | Subject: ${subject}\n${content.text}`,
    );
  }

  private async sendViaResend(
    cfg: StudioAuthConfig,
    to: string,
    subject: string,
    content: { text: string; html: string },
    options?: EmailSendOptions,
  ): Promise<void> {
    const body: Record<string, unknown> = {
      from: cfg.emailFrom,
      to: [to],
      subject,
      text: content.text,
      html: content.html,
    };
    if (options?.replyTo) {
      body.reply_to = options.replyTo;
    }

    const res = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cfg.resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const body = await res.text();
      const detail = parseResendError(body);
      this.logger.error(
        `Resend API failed (${res.status}): from=${cfg.emailFrom} ${detail}`,
      );
      throw new Error(`Failed to send email via Resend (${res.status}): ${detail}`);
    }
  }

  private async sendViaSmtp(
    cfg: StudioAuthConfig,
    to: string,
    subject: string,
    content: { text: string; html: string },
    options?: EmailSendOptions,
  ): Promise<void> {
    const nodemailer = await import('nodemailer');
    const transport = nodemailer.createTransport({
      host: cfg.smtpHost!,
      port: cfg.smtpPort,
      secure: cfg.smtpPort === 465,
      auth:
        cfg.smtpUser && cfg.smtpPass
          ? { user: cfg.smtpUser, pass: cfg.smtpPass }
          : undefined,
    });

    await transport.sendMail({
      from: cfg.emailFrom,
      to,
      subject,
      text: content.text,
      html: content.html,
      ...(options?.replyTo ? { replyTo: options.replyTo } : {}),
    });
  }

  private cfg(): StudioAuthConfig {
    return this.config.getOrThrow<StudioAuthConfig>('studioAuth');
  }
}

function parseResendError(body: string): string {
  try {
    const parsed = JSON.parse(body) as { message?: string };
    if (parsed.message) {
      return parsed.message;
    }
  } catch {
    // keep raw body
  }
  return body;
}
