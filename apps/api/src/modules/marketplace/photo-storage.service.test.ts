import { put } from '@vercel/blob';
import { BadRequestException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PhotoStorageService } from './photo-storage.service.js';

vi.mock('@vercel/blob', () => ({ put: vi.fn() }));

describe('PhotoStorageService', () => {
  beforeEach(() => vi.mocked(put).mockReset());

  it('uploads a supported image to a public random blob path', async () => {
    vi.mocked(put).mockResolvedValue({
      contentDisposition: 'inline',
      contentType: 'image/jpeg',
      downloadUrl: 'https://blob.example/photo.jpg?download=1',
      etag: 'etag',
      pathname: 'experiences/42/photo.jpg',
      url: 'https://blob.example/photo.jpg',
    });
    const service = new PhotoStorageService();

    await expect(
      service.upload('42', {
        dataUrl: `data:image/jpeg;base64,${Buffer.from('photo').toString('base64')}`,
        filename: 'photo.jpg',
      }),
    ).resolves.toEqual({ url: 'https://blob.example/photo.jpg' });

    expect(put).toHaveBeenCalledWith(
      expect.stringMatching(/^experiences\/42\/.+\.jpg$/),
      expect.any(Buffer),
      expect.objectContaining({
        access: 'public',
        addRandomSuffix: true,
        contentType: 'image/jpeg',
      }),
    );
  });

  it('rejects unsupported content types', async () => {
    const service = new PhotoStorageService();
    await expect(
      service.upload('42', {
        dataUrl: 'data:text/plain;base64,dGVzdA==',
        filename: 'test.txt',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
