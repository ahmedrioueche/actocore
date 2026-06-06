import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import type { SdkThemeMode, SdkVoiceInputMode } from '../types/sdk-config';

export class SdkI18nConfigDto {
  @IsOptional()
  @IsString()
  @MaxLength(35)
  locale?: string;

  @IsOptional()
  @IsObject()
  translations?: Record<string, Record<string, unknown>>;
}

export class SdkThemeConfigDto {
  @IsOptional()
  @IsEnum(['light', 'dark', 'system'])
  mode?: SdkThemeMode;

  @IsOptional()
  @IsObject()
  tokens?: Record<string, string>;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  className?: string;
}

export class SdkSecurityConfigDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(64, { each: true })
  allowedActionNames?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(64, { each: true })
  allowedSectionIds?: string[];

  @IsOptional()
  @IsBoolean()
  enforceActionAllowlist?: boolean;
}

export class SdkUiTextOverridesDto {
  @IsOptional() @IsString() @MaxLength(200) headerTitle?: string;
  @IsOptional() @IsString() @MaxLength(400) headerSubtitle?: string;
  @IsOptional() @IsString() @MaxLength(200) emptyTitle?: string;
  @IsOptional() @IsString() @MaxLength(600) emptyDescription?: string;
  @IsOptional() @IsString() @MaxLength(600) actionsHint?: string;
  @IsOptional() @IsString() @MaxLength(200) placeholder?: string;
  @IsOptional() @IsString() @MaxLength(80) send?: string;
  @IsOptional() @IsString() @MaxLength(80) open?: string;
}

export class SdkLauncherConfigDto {
  @IsOptional() @IsUrl() iconUrl?: string;
  @IsOptional() @IsString() @MaxLength(120) ariaLabel?: string;
}

export class SdkUiConfigDto {
  @IsOptional() @IsBoolean() showSources?: boolean;
  @IsOptional() @IsBoolean() showIntentBadge?: boolean;
  @IsOptional() @IsBoolean() showActionsHint?: boolean;
  @IsOptional() @IsBoolean() showActionPicker?: boolean;
  @IsOptional() @IsInt() @Min(1) @Max(12) composerMinRows?: number;
  @IsOptional() @IsInt() @Min(1) @Max(12) composerMaxRows?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => SdkUiTextOverridesDto)
  text?: SdkUiTextOverridesDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => SdkLauncherConfigDto)
  launcher?: SdkLauncherConfigDto;
}

export class SdkVoiceConfigDto {
  @IsOptional() @IsBoolean() input?: boolean;
  @IsOptional() @IsBoolean() output?: boolean;
  @IsOptional() @IsEnum(['browser', 'server', 'auto']) inputMode?: SdkVoiceInputMode;
  @IsOptional() @IsBoolean() autoSendOnFinalize?: boolean;
  @IsOptional() @IsString() @MaxLength(35) language?: string;
}

/** PATCH body — partial update; server increments sdkConfigVersion. */
export class UpdateSdkProjectConfigDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => SdkI18nConfigDto)
  i18n?: SdkI18nConfigDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => SdkThemeConfigDto)
  theme?: SdkThemeConfigDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => SdkSecurityConfigDto)
  security?: SdkSecurityConfigDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => SdkUiConfigDto)
  ui?: SdkUiConfigDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => SdkVoiceConfigDto)
  voice?: SdkVoiceConfigDto;
}
