import { ApiProperty } from '@nestjs/swagger';

export class TestBotDto {
  @ApiProperty({ required: true })
  botName: string;

  @ApiProperty({ required: true })
  question: string;
}
