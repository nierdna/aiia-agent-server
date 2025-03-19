import { ApiPropertyOptional } from '@nestjs/swagger';

export interface IPaginateRequest {
  take?: number;
  page?: number;
}

export class PaginationResponse {
  @ApiPropertyOptional()
  total?: number;

  @ApiPropertyOptional()
  current_page?: number;

  @ApiPropertyOptional()
  total_pages?: number;

  @ApiPropertyOptional()
  take?: number;
}
