import {
  IsArray,
  IsBoolean,
  IsHexColor,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import type { ActionInputSchema } from '../types/action';

const ACTION_NAME_PATTERN = /^[a-z][a-z0-9_-]{0,63}$/;

export class CreateActionDto {
  @IsString()
  @MinLength(1)
  @Matches(ACTION_NAME_PATTERN, {
    message:
      'name must be a lowercase slug (letters, numbers, hyphens, underscores)',
  })
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsObject()
  inputSchema!: ActionInputSchema;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  /** Section to assign the action to. Null/omitted leaves it uncategorized. */
  @IsOptional()
  @IsString()
  sectionId?: string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  pageIds?: string[];
}

export class UpdateActionDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  inputSchema?: ActionInputSchema;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  /** Pass null to move the action back to uncategorized. */
  @IsOptional()
  @IsString()
  sectionId?: string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  pageIds?: string[];
}

export class CreateActionSectionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(400)
  description?: string;

  @IsOptional()
  @IsHexColor()
  color?: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

export class UpdateActionSectionDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(400)
  description?: string;

  @IsOptional()
  @IsHexColor()
  color?: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

export class ReorderActionSectionsDto {
  /** Section ids in the desired display order. */
  @IsArray()
  @IsString({ each: true })
  sectionIds!: string[];
}
