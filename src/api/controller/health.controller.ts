import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DataSource } from 'typeorm';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private dataSource: DataSource) {}

  @Get('')
  async healthCheck() {
    return 1;
  }
}
