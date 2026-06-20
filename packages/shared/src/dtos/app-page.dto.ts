import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

import type { AppPageKind } from '../types/app-page';

const APP_PAGE_SLUG_PATTERN = /^[a-z][a-z0-9_-]{0,63}$/;
const FUNCTIONALITY_ID_PATTERN = /^[a-z][a-z0-9_-]{0,63}$/;

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

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  route?: string;

  @IsOptional()
  @IsIn(['screen', 'container'] satisfies AppPageKind[])
  pageKind?: AppPageKind;

  @IsOptional()
  @IsString()
  @MaxLength(400)
  description?: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsString()
  parentPageId?: string;
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

export class AppPageGraphPositionDto {
  @IsNumber()
  x!: number;

  @IsNumber()
  y!: number;
}

export class UpdateAppPageGraphLayoutDto {
  @IsObject()
  positions!: Record<string, AppPageGraphPositionDto>;
}

export class CreateAppPageFunctionalityDto {
  @IsString()
  @MinLength(1)
  @Matches(FUNCTIONALITY_ID_PATTERN, {
    message:
      'id must be a lowercase slug (letters, numbers, hyphens, underscores)',
  })
  id!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(400)
  description?: string;

  @IsOptional()
  @IsString()
  linkedActionId?: string;
}

export class UpdateAppPageFunctionalityDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(400)
  description?: string;

  @IsOptional()
  @IsString()
  linkedActionId?: string | null;
}

export class CreateAppPageLinkDto {
  @IsString()
  sourcePageId!: string;

  @IsString()
  targetPageId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  label?: string;
}

export class UpdateAppPageLinkDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  label?: string;
}
