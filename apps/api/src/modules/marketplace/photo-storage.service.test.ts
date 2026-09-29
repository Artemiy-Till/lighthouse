import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { BadRequestException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PhotoStorageService } from './photo-storage.service.js';

const { send } = vi.hoisted(() => ({ send: vi.fn() }));

vi.mock('@aws-sdk/client-s3', () => ({
  GetObjectCommand: vi.fn(function (input: unknown) {
    return { input };
  }),
  PutObjectCommand: vi.fn(function (input: unknown) {
    return { input };
  }),
  S3Client: vi.fn(function () {
    return { send };
  }),
}));

const config = {
  get: (key: string, fallback?: string) =>
    ({
      OBJECT_STORAGE_ACCESS_KEY_ID: 'access-key',
      OBJECT_STORAGE_BUCKET: 'marketplace-photos',
      OBJECT_STORAGE_ENDPOINT: 'https://storage.yandexcloud.net',
      OBJECT_STORAGE_REGION: 'ru-central1',
      OBJECT_STORAGE_SECRET_ACCESS_KEY: 'secret-key',
      APP_PUBLIC_URL: 'https://app.example.ru',
    })[key] ?? fallback,
} as ConfigService;

describe('PhotoStorageService', () => {
  beforeEach(() => send.mockReset());

  it('uploads a supported image to a random object storage path', async () => {
    const service = new PhotoStorageService(config);

    const uploaded = await service.upload('42', {
      dataUrl: `data:image/jpeg;base64,${Buffer.from('photo').toString('base64')}`,
      filename: 'photo.jpg',
    });
    expect(uploaded.url).toMatch(
      /^https:\/\/app\.example\.ru\/api\/v1\/photos\/42\/[0-9a-f-]+\.jpg$/,
    );

    expect(S3Client).toHaveBeenCalledWith({
      credentials: {
        accessKeyId: 'access-key',
        secretAccessKey: 'secret-key',
      },
      endpoint: 'https://storage.yandexcloud.net',
      forcePathStyle: true,
      region: 'ru-central1',
    });
    const commandInput = vi.mocked(PutObjectCommand).mock.calls[0]?.[0];
    expect(commandInput?.Bucket).toBe('marketplace-photos');
    expect(commandInput?.Body).toBeInstanceOf(Buffer);
    expect(commandInput?.ContentType).toBe('image/jpeg');
    expect(commandInput?.Key).toMatch(/^experiences\/42\/.+\.jpg$/);
    expect(send).toHaveBeenCalledOnce();
  });

  it('rejects unsupported content types', async () => {
    const service = new PhotoStorageService(config);
    await expect(
      service.upload('42', {
        dataUrl: 'data:text/plain;base64,dGVzdA==',
        filename: 'test.txt',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
