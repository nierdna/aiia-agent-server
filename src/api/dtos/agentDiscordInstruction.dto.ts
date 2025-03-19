import { ApiProperty } from '@nestjs/swagger';

export class AgentDiscordInstructionDto {
  @ApiProperty()
  systemPrompt: string;
}
