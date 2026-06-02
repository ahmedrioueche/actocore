import {
  IsBoolean,
  IsObject,
  IsOptional,
  IsString,
  Matches,
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
}
