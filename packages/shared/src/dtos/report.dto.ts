import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

import { StudioReportStatus, StudioReportType } from '../types/report';

export class CreateStudioReportDto {
  @IsIn([StudioReportType.ISSUE, StudioReportType.FEEDBACK])
  type!: StudioReportType;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  subject?: string;

  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  message!: string;
}

export class UpdateStudioReportStatusDto {
  @IsIn([StudioReportStatus.OPEN, StudioReportStatus.RESOLVED])
  status!: StudioReportStatus;
}
