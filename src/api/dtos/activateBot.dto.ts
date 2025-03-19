import { ApiProperty } from '@nestjs/swagger';
import { Platform } from '../shared/constants/enum';

export class ActivateBotDto {
  @ApiProperty()
  botId: string;

  @ApiProperty()
  platform: Platform;
}
