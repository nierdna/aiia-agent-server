import { ApiProperty } from '@nestjs/swagger';

export class TestBotDto {
  @ApiProperty()
  botId: string;

  @ApiProperty()
  question: string;
}
