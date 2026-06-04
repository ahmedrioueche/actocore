import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { StudioAuthConfig } from '../config/studio-auth.config';
import { buildStudioAppUrl } from './utils/studio-redirect.util';

@Injectable()
export class StudioEmailService {
  private readonly logger = new Logger(StudioEmailService.name);

  constructor(private readonly config: ConfigService) {}

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verifyUrl = buildStudioAppUrl(this.cfg().studioAppUrl, '/auth/verify-email', {
      token,
    });
    await this.send(
      email,
      'Verify your ActoCore Studio email',
      `Verify your email to activate your account:\n\n${verifyUrl}\n\nThis link expires in 24 hours.`,
    );
  }

  async sendDeleteAccountOtp(email: string, otp: string): Promise<void> {
    await this.send(
      email,
      'Confirm ActoCore Studio account deletion',
      `Your confirmation code to delete your Studio account is: ${otp}\n\nThis code expires in 15 minutes. If you did not request this, ignore this email.`,
    );
  }

  async sendQuotaAlert(to: string, subject: string, text: string): Promise<void> {
    await this.send(to, `ActoCore Studio — ${subject}`, text);
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetUrl = buildStudioAppUrl(this.cfg().studioAppUrl, '/auth/reset-password', {
      token,
    });
    await this.send(
      email,
      'Reset your ActoCore Studio password',
      `Reset your password using this link:\n\n${resetUrl}\n\nThis link expires in 1 hour.`,
    );
  }

  private async send(to: string, subject: string, text: string): Promise<void> {
    const cfg = this.cfg();
    if (!cfg.smtpHost) {
      this.logger.log(
        `[Studio email] To: ${to} | Subject: ${subject}\n${text}`,
      );
      return;
    }

    const nodemailer = await import('nodemailer');
    const transport = nodemailer.createTransport({
      host: cfg.smtpHost,
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
      text,
    });
  }

  private cfg(): StudioAuthConfig {
    return this.config.getOrThrow<StudioAuthConfig>('studioAuth');
  }
}
