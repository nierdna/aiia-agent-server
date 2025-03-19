import { ApiProperty } from '@nestjs/swagger';

export class CreateMessageDto {
  @ApiProperty()
  threadId: string;

  @ApiProperty()
  question: string;

  @ApiProperty()
  answer?: string;
}
