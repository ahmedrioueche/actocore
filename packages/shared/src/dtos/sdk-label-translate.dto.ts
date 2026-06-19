import {
  ArrayMinSize,
  IsArray,
  IsObject,
  IsString,
  MaxLength,
} from 'class-validator';

export class TranslateSdkCopyDto {
  @IsString()
  @MaxLength(35)
  sourceLocale!: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  targetLocales!: string[];

  /** Label field key → source-language string (e.g. headerTitle). */
  @IsObject()
  sourceLabels!: Record<string, string>;
}
