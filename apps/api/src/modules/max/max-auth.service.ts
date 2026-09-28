import {
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';

const MAX_INIT_DATA_TTL_SECONDS = 60 * 60;
const MAX_INIT_DATA_CLOCK_SKEW_SECONDS = 60;

const maxUserSchema = z.object({
  first_name: z.string().min(1),
  id: z.union([z.string().min(1), z.number().int()]),
  language_code: z.string().min(1).nullish(),
  last_name: z.string().nullish(),
  photo_url: z.url().nullish(),
  username: z.string().min(1).nullish(),
});

export interface AuthenticatedMaxUser {
  readonly firstName: string;
  readonly id: string;
  readonly languageCode: string | null;
  readonly lastName: string | null;
  readonly photoUrl: string | null;
  readonly username: string | null;
}

export interface MaxAuthenticationResult {
  readonly authenticated: true;
  readonly user: AuthenticatedMaxUser;
}

@Injectable()
export class MaxAuthService {
  private readonly logger = new Logger(MaxAuthService.name);

  constructor(private readonly configService: ConfigService) {}

  authenticate(initData: string): MaxAuthenticationResult {
    this.logger.log('MAX launch data verification started');
    const botToken = this.configService.get<string>('MAX_BOT_TOKEN');

    if (!botToken) {
      throw new ServiceUnavailableException(
        'MAX authentication is unavailable',
      );
    }

    const params = new URLSearchParams(initData);
    const suppliedHashes = params.getAll('hash');

    if (suppliedHashes.length !== 1) {
      return this.reject('Invalid MAX launch data', 'hash_count');
    }

    const suppliedHash = suppliedHashes[0] ?? '';
    if (!/^[a-f\d]{64}$/i.test(suppliedHash)) {
      return this.reject('Invalid MAX launch data', 'hash_format');
    }

    const dataCheckString = [...params.entries()]
      .filter(([key]) => key !== 'hash')
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
    const secretKey = createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest();
    const expectedHash = createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest();
    const suppliedHashBuffer = Buffer.from(suppliedHash, 'hex');

    if (
      suppliedHashBuffer.length !== expectedHash.length ||
      !timingSafeEqual(suppliedHashBuffer, expectedHash)
    ) {
      return this.reject('Invalid MAX launch data', 'signature_mismatch');
    }

    const authDate = Number(params.get('auth_date'));
    const now = Math.floor(Date.now() / 1000);
    if (
      !Number.isInteger(authDate) ||
      authDate > now + MAX_INIT_DATA_CLOCK_SKEW_SECONDS ||
      now - authDate > MAX_INIT_DATA_TTL_SECONDS
    ) {
      return this.reject('Expired MAX launch data', 'auth_date');
    }

    const rawUser = params.get('user');
    if (!rawUser) {
      return this.reject('MAX user is missing', 'user_missing');
    }

    let parsedUser: unknown;
    try {
      parsedUser = JSON.parse(rawUser);
    } catch {
      return this.reject('Invalid MAX user', 'user_json');
    }

    const user = maxUserSchema.safeParse(parsedUser);
    if (!user.success) {
      return this.reject('Invalid MAX user', 'user_shape');
    }

    this.logger.log('MAX launch data verified');
    return {
      authenticated: true,
      user: {
        firstName: user.data.first_name,
        id: String(user.data.id),
        languageCode: user.data.language_code ?? null,
        lastName: user.data.last_name ?? null,
        photoUrl: user.data.photo_url ?? null,
        username: user.data.username ?? null,
      },
    };
  }

  private reject(message: string, reason: string): never {
    this.logger.warn(`MAX launch data rejected: ${reason}`);
    throw new UnauthorizedException(message);
  }
}
