import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module.js';
import { MaxIntegrationModule } from '../max/max-integration.module.js';
import { MarketplaceController } from './marketplace.controller.js';
import { MarketplaceService } from './marketplace.service.js';
import { PhotoStorageService } from './photo-storage.service.js';

@Module({
  controllers: [MarketplaceController],
  imports: [DatabaseModule, MaxIntegrationModule],
  providers: [MarketplaceService, PhotoStorageService],
})
export class MarketplaceModule {}
