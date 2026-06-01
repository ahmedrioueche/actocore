import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateApiKeyDto {
  @IsString()
  @MinLength(1)
  projectId!: string;

  @IsOptional()
  @IsString()
  name?: string;
}
