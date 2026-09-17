import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { HealthService, type HealthStatus } from './health.service';

@ApiTags('system')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOkResponse({
    schema: {
      example: { service: 'api', status: 'ok' },
      properties: {
        service: { type: 'string' },
        status: { type: 'string' },
      },
      required: ['service', 'status'],
      type: 'object',
    },
  })
  getHealth(): HealthStatus {
    return this.healthService.getHealth();
  }
}
