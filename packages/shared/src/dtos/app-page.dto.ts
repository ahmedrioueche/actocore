import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

const APP_PAGE_SLUG_PATTERN = /^[a-z][a-z0-9_-]{0,63}$/;

export class CreateAppPageDto {
  @IsString()
  @MinLength(1)
  @Matches(APP_PAGE_SLUG_PATTERN, {
    message:
      'slug must be a lowercase slug (letters, numbers, hyphens, underscores)',
  })
  slug!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  title!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  route!: string;

  @IsOptional()
  @IsString()
  @MaxLength(400)
  description?: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

export class UpdateAppPageDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  route?: string;

  @IsOptional()
  @IsString()
  @MaxLength(400)
  description?: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

export class ReorderAppPagesDto {
  @IsArray()
  @IsString({ each: true })
  pageIds!: string[];
}

export class AssignAppPageActionsDto {
  /** Full list of action ids assigned to this page (replaces prior assignment). */
  @IsArray()
  @IsString({ each: true })
  actionIds!: string[];
}
