import { IsOptional, IsString, MinLength } from 'class-validator';

export class SendChatMessageDto {
  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsString()
  @MinLength(1)
  message!: string;
}
