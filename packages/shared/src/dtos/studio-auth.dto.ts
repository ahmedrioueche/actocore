import {
  IsArray,
  IsEmail,
  IsIn,
  IsMongoId,
  IsOptional,
  IsString,
  Matches,
  MinLength,
  MaxLength,
  ArrayMinSize,
  ValidateIf,
} from 'class-validator';

export class StudioSignupDto {
  @IsString()
  @MinLength(2)
  accountName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsOptional()
  @IsString()
  displayName?: string;
}

export class StudioLoginDto {
  /** Workspace owner/admin: email + password. */
  @ValidateIf((o: StudioLoginDto) => !o.workspaceId && !o.username)
  @IsEmail()
  email?: string;

  /** Workspace seat: account id from admin + seat username + password. */
  @ValidateIf((o: StudioLoginDto) => Boolean(o.workspaceId || o.username))
  @IsMongoId()
  workspaceId?: string;

  @ValidateIf((o: StudioLoginDto) => Boolean(o.workspaceId || o.username))
  @IsString()
  @MinLength(2)
  @MaxLength(32)
  @Matches(/^[a-zA-Z0-9][a-zA-Z0-9_-]*[a-zA-Z0-9]$|^[a-zA-Z0-9]{2}$/)
  username?: string;

  @IsString()
  @MinLength(1)
  password!: string;
}

export class StudioRefreshDto {
  @IsOptional()
  @IsString()
  refreshToken?: string;
}

export class StudioVerifyEmailDto {
  @IsString()
  @MinLength(1)
  token!: string;
}

export class StudioResendVerificationDto {
  @IsEmail()
  email!: string;
}

export class StudioForgotPasswordDto {
  @IsEmail()
  email!: string;
}

export class StudioResetPasswordDto {
  @IsString()
  @MinLength(1)
  token!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

export class StudioChangePasswordDto {
  @IsString()
  @MinLength(1)
  currentPassword!: string;

  @IsString()
  @MinLength(8)
  newPassword!: string;
}

export class StudioConfirmDeleteAccountDto {
  @IsString()
  @MinLength(6)
  otp!: string;
}

export class CreateStudioMemberDto {
  @IsString()
  @MinLength(2)
  @MaxLength(32)
  @Matches(/^[a-zA-Z0-9][a-zA-Z0-9_-]*[a-zA-Z0-9]$|^[a-zA-Z0-9]{2}$/)
  username!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsOptional()
  @IsString()
  displayName?: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  projectIds!: string[];

  @IsOptional()
  @IsIn(['user_editor'])
  role?: 'user_editor';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];
}

export class UpdateStudioMemberDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(32)
  @Matches(/^[a-zA-Z0-9][a-zA-Z0-9_-]*[a-zA-Z0-9]$|^[a-zA-Z0-9]{2}$/)
  username?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  projectIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];
}
