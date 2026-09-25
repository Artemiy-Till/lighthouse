import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { HealthModule } from './modules/health/health.module.js';
import { MarketplaceModule } from './modules/marketplace/marketplace.module.js';
import { MaxIntegrationModule } from './modules/max/max-integration.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ cache: true, isGlobal: true }),
    HealthModule,
    MaxIntegrationModule,
    MarketplaceModule,
  ],
})
export class AppModule {}
