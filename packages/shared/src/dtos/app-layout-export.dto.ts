import { Type } from 'class-transformer';
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
  ValidateNested,
} from 'class-validator';

import type { AppPageKind } from '../types/app-page';
import { APP_LAYOUT_EXPORT_FORMAT_VERSION } from '../types/app-layout-export';

const APP_PAGE_SLUG_PATTERN = /^[a-z][a-z0-9_-]{0,63}$/;
const FUNCTIONALITY_ID_PATTERN = /^[a-z][a-z0-9_-]{0,63}$/;

export class AppLayoutExportGraphPositionDto {
  @IsNumber()
  x!: number;

  @IsNumber()
  y!: number;
}

export class AppLayoutExportFunctionalityDto {
  @IsString()
  @MinLength(1)
  @Matches(FUNCTIONALITY_ID_PATTERN)
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
  linkedActionName?: string;
}

export class AppLayoutExportPageDto {
  @IsString()
  @MinLength(1)
  @Matches(APP_PAGE_SLUG_PATTERN)
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
  @IsNumber()
  order?: number;

  @IsOptional()
  @IsString()
  @Matches(APP_PAGE_SLUG_PATTERN)
  parentPageSlug?: string | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => AppLayoutExportGraphPositionDto)
  graphPosition?: AppLayoutExportGraphPositionDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AppLayoutExportFunctionalityDto)
  functionalities?: AppLayoutExportFunctionalityDto[];
}

export class AppLayoutExportLinkDto {
  @IsString()
  @MinLength(1)
  @Matches(APP_PAGE_SLUG_PATTERN)
  sourceSlug!: string;

  @IsString()
  @MinLength(1)
  @Matches(APP_PAGE_SLUG_PATTERN)
  targetSlug!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  label?: string;
}

export class AppLayoutExportV1Dto {
  @IsString()
  @IsIn([APP_LAYOUT_EXPORT_FORMAT_VERSION])
  formatVersion!: typeof APP_LAYOUT_EXPORT_FORMAT_VERSION;

  @IsString()
  exportedAt!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AppLayoutExportPageDto)
  pages!: AppLayoutExportPageDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AppLayoutExportLinkDto)
  links!: AppLayoutExportLinkDto[];

  @IsOptional()
  @IsObject()
  actionAssignments?: Record<string, string[]>;
}

export class ImportAppLayoutDto {
  @IsIn(['merge', 'replace'])
  mode!: 'merge' | 'replace';

  @IsOptional()
  @IsBoolean()
  includeActionAssignments?: boolean;

  @ValidateNested()
  @Type(() => AppLayoutExportV1Dto)
  layout!: AppLayoutExportV1Dto;
}
