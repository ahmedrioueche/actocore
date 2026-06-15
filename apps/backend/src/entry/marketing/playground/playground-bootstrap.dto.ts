import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class PlaygroundBootstrapDto {
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  visitorId!: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  projectName?: string;
}
