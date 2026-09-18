import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module.js';
import { MaxIntegrationModule } from '../max/max-integration.module.js';
import { MarketplaceController } from './marketplace.controller.js';
import { MarketplaceService } from './marketplace.service.js';

@Module({
  controllers: [MarketplaceController],
  imports: [DatabaseModule, MaxIntegrationModule],
  providers: [MarketplaceService],
})
export class MarketplaceModule {}
