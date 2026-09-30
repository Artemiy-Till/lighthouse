import {
  FastifyAdapter,
  type NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { describe, expect, it, vi } from 'vitest';

import { MaxAuthService } from '../max/max-auth.service.js';
import { MarketplaceController } from './marketplace.controller.js';
import { MarketplaceService } from './marketplace.service.js';
import { PhotoStorageService } from './photo-storage.service.js';

describe('MarketplaceController', () => {
  it('serves stored photos as images through Fastify', async () => {
    const body = Buffer.from([0xff, 0xd8, 0xff, 0xd9]);
    const download = vi.fn().mockResolvedValue({
      body,
      contentType: 'image/jpeg',
    });
    const module = await Test.createTestingModule({
      controllers: [MarketplaceController],
      providers: [
        { provide: MarketplaceService, useValue: {} },
        { provide: MaxAuthService, useValue: {} },
        { provide: PhotoStorageService, useValue: { download } },
      ],
    }).compile();
    const app = module.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    app.setGlobalPrefix('api/v1');

    try {
      await app.init();
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/photos/42/12345678-1234-1234-1234-123456789abc.jpg',
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toContain('image/jpeg');
      expect(response.headers['cache-control']).toBe(
        'public, max-age=86400, immutable',
      );
      expect(response.rawPayload).toEqual(body);
      expect(download).toHaveBeenCalledWith(
        '42',
        '12345678-1234-1234-1234-123456789abc.jpg',
      );
    } finally {
      await app.close();
    }
  });
});
