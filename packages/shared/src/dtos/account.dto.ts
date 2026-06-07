import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateStudioAccountDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsEmail()
  billingEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  timezone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  defaultLocale?: string;
}

export class UpdateStudioAccountPreferencesDto {
  /** @deprecated Sets both quotaWarningEmails and quotaExhaustedEmails. */
  @IsOptional()
  @IsBoolean()
  quotaAlertEmails?: boolean;

  @IsOptional()
  @IsBoolean()
  quotaWarningEmails?: boolean;

  @IsOptional()
  @IsBoolean()
  quotaExhaustedEmails?: boolean;

  @IsOptional()
  @IsBoolean()
  failureAlertEmails?: boolean;

  @IsOptional()
  @IsBoolean()
  billingEmails?: boolean;

  @IsOptional()
  @IsBoolean()
  productEmails?: boolean;

  /** HTTPS URL for quota threshold webhooks (optional). */
  @IsOptional()
  @IsString()
  quotaWebhookUrl?: string;
}

export class UpdateStudioProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  displayName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  picture?: string;
}
