import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class PostTweetDto {
  @ApiProperty({
    description: 'The content of the tweet',
  })
  @IsString()
  @IsNotEmpty()
  content: string;
}
