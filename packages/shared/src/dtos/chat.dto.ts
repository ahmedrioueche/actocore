import { IsOptional, IsString, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { HostContextDto } from './host-context.dto';

export class SendChatMessageDto {
  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsString()
  @MinLength(1)
  message!: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => HostContextDto)
  hostContext?: HostContextDto;
}
