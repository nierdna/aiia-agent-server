import { ApiProperty } from '@nestjs/swagger';

export class CreateThreadDto {
  @ApiProperty()
  telegramId: string;
}
