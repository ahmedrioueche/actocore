import { IsObject, IsOptional, IsString } from 'class-validator';

export class CreateSessionDto {
  @IsOptional()
  @IsString()
  externalUserId?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
