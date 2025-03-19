import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTwitterUserDto {
  @ApiProperty({ example: 'username' })
  @IsNotEmpty()
  @IsString()
  username: string;

  @ApiProperty({ example: 'password' })
  @IsNotEmpty()
  @IsString()
  password: string;

  @ApiProperty({ example: 'email@example.com' })
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  email: string;
}
