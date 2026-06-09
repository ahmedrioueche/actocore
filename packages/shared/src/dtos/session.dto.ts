import { Type } from 'class-transformer';
import { IsInt, IsMongoId, IsObject, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateSessionDto {
  @IsOptional()
  @IsString()
  externalUserId?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class ListSessionMessagesQuery {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  /** Load messages older than this message id (for “load more” at the top). */
  @IsOptional()
  @IsMongoId()
  before?: string;
}
