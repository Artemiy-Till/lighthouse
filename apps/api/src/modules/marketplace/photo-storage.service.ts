import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';

import type { UploadExperiencePhotoDto } from './marketplace.dto.js';

const allowedTypes = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
]);

const maximumPhotoBytes = 3 * 1024 * 1024;

@Injectable()
export class PhotoStorageService {
  private s3Client?: S3Client;

  constructor(private readonly configService: ConfigService) {}

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
    const bucket = this.configService.get<string>('OBJECT_STORAGE_BUCKET');
    const accessKeyId = this.configService.get<string>(
      'OBJECT_STORAGE_ACCESS_KEY_ID',
    );
    const secretAccessKey = this.configService.get<string>(
      'OBJECT_STORAGE_SECRET_ACCESS_KEY',
    );
    if (!bucket || !accessKeyId || !secretAccessKey) {
      throw new InternalServerErrorException('Photo storage is not configured');
    }

    const endpoint = this.configService.get<string>(
      'OBJECT_STORAGE_ENDPOINT',
      'https://storage.yandexcloud.net',
    );
    const key = `experiences/${owner}/${randomUUID()}.${extension}`;
    const s3Client = (this.s3Client ??= new S3Client({
      credentials: { accessKeyId, secretAccessKey },
      endpoint,
      forcePathStyle: true,
      region: this.configService.get<string>(
        'OBJECT_STORAGE_REGION',
        'ru-central1',
      ),
    }));

    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Body: body,
        ContentType: contentType,
        Key: key,
      }),
    );

    const publicBaseUrl = this.configService.get<string>('APP_PUBLIC_URL');
    if (!publicBaseUrl) {
      throw new InternalServerErrorException(
        'Public app URL is not configured',
      );
    }

    return {
      url: `${publicBaseUrl.replace(/\/$/, '')}/api/v1/photos/${key.replace(/^experiences\//, '')}`,
    };
  }

  async download(owner: string, filename: string) {
    if (
      !/^[a-zA-Z0-9_-]{1,128}$/.test(owner) ||
      !/^[0-9a-f-]{36}\.(jpg|png|webp)$/.test(filename)
    ) {
      throw new NotFoundException('Photo not found');
    }

    const bucket = this.configService.get<string>('OBJECT_STORAGE_BUCKET');
    const client = this.getClient();
    try {
      const object = await client.send(
        new GetObjectCommand({
          Bucket: bucket,
          Key: `experiences/${owner}/${filename}`,
        }),
      );
      if (!object.Body) throw new NotFoundException('Photo not found');
      return {
        body: Buffer.from(await object.Body.transformToByteArray()),
        contentType: object.ContentType ?? 'application/octet-stream',
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new NotFoundException('Photo not found');
    }
  }

  private getClient() {
    if (this.s3Client) return this.s3Client;
    const accessKeyId = this.configService.get<string>(
      'OBJECT_STORAGE_ACCESS_KEY_ID',
    );
    const secretAccessKey = this.configService.get<string>(
      'OBJECT_STORAGE_SECRET_ACCESS_KEY',
    );
    if (!accessKeyId || !secretAccessKey) {
      throw new InternalServerErrorException('Photo storage is not configured');
    }
    this.s3Client = new S3Client({
      credentials: { accessKeyId, secretAccessKey },
      endpoint: this.configService.get<string>(
        'OBJECT_STORAGE_ENDPOINT',
        'https://storage.yandexcloud.net',
      ),
      forcePathStyle: true,
      region: this.configService.get<string>(
        'OBJECT_STORAGE_REGION',
        'ru-central1',
      ),
    });
    return this.s3Client;
  }
}
