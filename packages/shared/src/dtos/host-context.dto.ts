import {
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class HostContextSelectedEntityDto {
  @IsString()
  @MinLength(1)
  type!: string;

  @IsString()
  @MinLength(1)
  id!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  label?: string;
}

export class HostContextDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  currentPage?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  route?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => HostContextSelectedEntityDto)
  selectedEntity?: HostContextSelectedEntityDto | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  openModal?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  userRole?: string;

  @IsOptional()
  @IsObject()
  custom?: Record<string, unknown>;
}
