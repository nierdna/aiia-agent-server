import { ApiProperty } from '@nestjs/swagger';

export class AgentDiscordDto {
  @ApiProperty()
  question: string;
}
