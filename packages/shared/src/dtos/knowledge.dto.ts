import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import type { KnowledgeSourceType } from '../types/knowledge';

export class CreateKnowledgeSourceDto {
  @IsEnum(['text', 'url', 'document', 'sitemap'])
  type!: KnowledgeSourceType;

  @IsString()
  @MinLength(1)
  title!: string;

  @ValidateIf((o: CreateKnowledgeSourceDto) => o.type === 'text')
  @IsString()
  @MinLength(1)
  content?: string;

  @ValidateIf(
    (o: CreateKnowledgeSourceDto) => o.type === 'url' || o.type === 'sitemap',
  )
  @IsUrl()
  url?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  pageIds?: string[];
}

export class UpdateKnowledgeSourceDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  pageIds?: string[];
}

export class KnowledgeRetrieveTestDto {
  @IsString()
  @MinLength(1)
  query!: string;

  @IsOptional()
  @IsString()
  currentPageId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  topK?: number;
}
