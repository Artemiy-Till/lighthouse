import { put } from '@vercel/blob';
import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

import type { UploadExperiencePhotoDto } from './marketplace.dto.js';

const allowedTypes = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
]);

const maximumPhotoBytes = 3 * 1024 * 1024;

@Injectable()
export class PhotoStorageService {
  async upload(maxUserId: string, input: UploadExperiencePhotoDto) {
    const match = /^data:([^;,]+);base64,([A-Za-z0-9+/=]+)$/.exec(
      input.dataUrl,
    );
    const contentType = match?.[1];
    const payload = match?.[2];
    const extension = contentType ? allowedTypes.get(contentType) : undefined;
    if (!match || !contentType || !payload || !extension) {
      throw new BadRequestException(
        'Only JPEG, PNG and WebP photos are allowed',
      );
    }

    const body = Buffer.from(payload, 'base64');
    if (body.length === 0 || body.length > maximumPhotoBytes) {
      throw new BadRequestException('Photo must be no larger than 3 MB');
    }

    const owner = maxUserId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `${randomUUID()}.${extension}`;
    if (process.env.PHOTO_STORAGE_PROVIDER === 'local') {
      const relativePath = `experiences/${owner}/${fileName}`;
      const destination = join(
        resolve(process.env.UPLOADS_DIR ?? './uploads'),
        relativePath,
      );
      await mkdir(join(destination, '..'), { recursive: true });
      await writeFile(destination, body, { flag: 'wx' });
      return { url: `/uploads/${relativePath}` };
    }

    const blob = await put(
      `experiences/${owner}/${fileName}`,
      body,
      {
        access: 'public',
        addRandomSuffix: true,
        contentType,
      },
    );

    return { url: blob.url };
  }
}
