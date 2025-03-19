import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, Max, Min } from 'class-validator';
import {
  MIN_PAGINATION_TAKEN,
  PAGINATION_TAKEN,
} from '../shared/constants/constants';
import { MAX_PAGINATION_TAKEN } from '../shared/constants/constants';
import { IPaginateRequest } from '../shared/pagination/pagination.interface';

export enum ESortType {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class PaginateDto implements IPaginateRequest {
  @ApiPropertyOptional({
    name: 'take',
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Max(MAX_PAGINATION_TAKEN)
  @Min(MIN_PAGINATION_TAKEN)
  take?: number = PAGINATION_TAKEN;

  @ApiPropertyOptional({
    name: 'page',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = MIN_PAGINATION_TAKEN;

  @ApiPropertyOptional()
  sort_field: string;

  @ApiPropertyOptional({
    enum: ESortType,
  })
  @IsOptional()
  sort_type?: ESortType = ESortType.DESC;
}
