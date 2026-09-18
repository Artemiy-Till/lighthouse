import { Module } from '@nestjs/common';

import { MaxApiClient } from './max-api.client';
import { MaxIntegrationController } from './max-integration.controller';
import { MaxIntegrationService } from './max-integration.service';

@Module({
  controllers: [MaxIntegrationController],
  providers: [MaxApiClient, MaxIntegrationService],
})
export class MaxIntegrationModule {}
