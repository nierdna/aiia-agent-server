import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginateDto } from './paginate.dto';
import { IsString, IsArray, ValidateNested, IsBoolean } from 'class-validator';
import { IsOptional } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class ClassifierRule {
  @ApiProperty()
  @IsString()
  rule: string;

  @ApiProperty()
  @IsBoolean()
  value: boolean;

  @ApiProperty()
  @IsString()
  content: string;
}

export class BotSetupDto {
  @ApiProperty()
  botName: string;

  @ApiProperty()
  agentInstruction: string;

  @ApiProperty({ type: [ClassifierRule] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ClassifierRule)
  @Transform(({ value }) => {
    try {
      return typeof value === 'string' ? JSON.parse(value) : value;
    } catch (error) {
      return value;
    }
  })
  classifierInstruction: ClassifierRule[];

  @ApiProperty({ type: 'string', format: 'binary', required: false })
  file?: any;

  @ApiProperty({ required: false })
  textData?: string;
}

export class GetBotsQuery extends PaginateDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search: string;
}

export class FileQuery {
  @ApiProperty()
  @IsString()
  filePath: string;
}
