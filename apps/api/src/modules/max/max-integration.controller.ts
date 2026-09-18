import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

import {
  MaxIntegrationService,
  type MaxIntegrationStatus,
} from './max-integration.service';

@ApiTags('integrations')
@Controller('integrations/max')
export class MaxIntegrationController {
  constructor(private readonly maxIntegrationService: MaxIntegrationService) {}

  @Get('status')
  @ApiOkResponse({
    description: 'MAX connection state without exposing credentials',
  })
  getStatus(): Promise<MaxIntegrationStatus> {
    return this.maxIntegrationService.getStatus();
  }
}
