import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class ContactInquiryDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  subject?: string;

  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  message!: string;
}
