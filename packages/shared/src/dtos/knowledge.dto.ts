import {
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  MinLength,
  ValidateIf,
} from 'class-validator';
import type { KnowledgeSourceType } from '../types/knowledge';

export class CreateKnowledgeSourceDto {
  @IsEnum(['text', 'url', 'document'])
  type!: KnowledgeSourceType;

  @IsString()
  @MinLength(1)
  title!: string;

  @ValidateIf((o: CreateKnowledgeSourceDto) => o.type === 'text')
  @IsString()
  @MinLength(1)
  content?: string;

  @ValidateIf((o: CreateKnowledgeSourceDto) => o.type === 'url')
  @IsUrl()
  url?: string;
}
