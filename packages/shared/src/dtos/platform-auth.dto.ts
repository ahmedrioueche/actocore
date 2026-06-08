import {
  ArrayNotEmpty,
  IsArray,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  ALL_PLATFORM_PERMISSIONS,
  type PlatformPermission,
} from '../constants/platform-permissions';

export class PlatformLoginDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(32)
  username?: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;
}

export class PlatformRefreshDto {
  @IsString()
  @MinLength(1)
  refreshToken!: string;
}

export class CreatePlatformManagerDto {
  @IsString()
  @MinLength(2)
  @MaxLength(32)
  username!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  displayName?: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsIn(ALL_PLATFORM_PERMISSIONS, { each: true })
  permissions!: PlatformPermission[];
}

export class UpdatePlatformManagerDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  displayName?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password?: string;

  @IsOptional()
  @IsArray()
  @IsIn(ALL_PLATFORM_PERMISSIONS, { each: true })
  permissions?: PlatformPermission[];
}

export class PlatformChangePasswordDto {
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  currentPassword!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  newPassword!: string;
}
