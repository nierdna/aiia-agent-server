import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';
import { IsString } from 'class-validator';
import { IsNotEmpty } from 'class-validator';

export class CreateUserDto {
  @ApiProperty()
  telegramId: string;
}

export class SaveUserDto {
  @ApiProperty()
  telegramId: string;

  @ApiProperty()
  userId: string;
}

export class UpdateUserDto {
  @ApiProperty()
  telegramId?: string;
}

export class LoginDto {
  @ApiProperty({ required: true, description: 'Signature' })
  @IsString()
  @IsNotEmpty()
  signature: string;

  @ApiProperty({ required: true, description: 'Address' })
  @IsString()
  @IsNotEmpty()
  address: string;
}

export class GetNoneDto {
  @ApiProperty({ required: true, description: 'ChainId' })
  @IsNotEmpty()
  chain_id: number;
}
