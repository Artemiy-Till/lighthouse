import { Module } from '@nestjs/common';

import { MaxAuthController } from './max-auth.controller.js';
import { MaxAuthService } from './max-auth.service.js';
import { MaxApiClient } from './max-api.client.js';
import { MaxApiTransport } from './max-api.transport.js';
import { MaxIntegrationController } from './max-integration.controller.js';
import { MaxIntegrationService } from './max-integration.service.js';

@Module({
  controllers: [MaxAuthController, MaxIntegrationController],
  providers: [
    MaxApiClient,
    MaxApiTransport,
    MaxAuthService,
    MaxIntegrationService,
  ],
})
export class MaxIntegrationModule {}
