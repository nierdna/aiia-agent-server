import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ClassifierRule } from './botSetup.dto';

export class BotEditDto {
  @ApiProperty()
  @IsString()
  botId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  botName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  agentInstruction?: string;

  @ApiProperty({ type: [ClassifierRule], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ClassifierRule)
  classifierInstruction?: ClassifierRule[];

  @ApiProperty({ type: 'string', format: 'binary', required: false })
  file?: any;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  textData?: string;
}
