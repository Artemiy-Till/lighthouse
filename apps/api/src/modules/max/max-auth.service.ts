import {
  Injectable,
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
  language_code: z.string().min(1).optional(),
  last_name: z.string().optional(),
  photo_url: z.url().optional(),
  username: z.string().min(1).optional(),
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
  constructor(private readonly configService: ConfigService) {}

  authenticate(initData: string): MaxAuthenticationResult {
    const botToken = this.configService.get<string>('MAX_BOT_TOKEN');

    if (!botToken) {
      throw new ServiceUnavailableException(
        'MAX authentication is unavailable',
      );
    }

    const params = new URLSearchParams(initData);
    const suppliedHashes = params.getAll('hash');

    if (suppliedHashes.length !== 1) {
      throw new UnauthorizedException('Invalid MAX launch data');
    }

    const suppliedHash = suppliedHashes[0] ?? '';
    if (!/^[a-f\d]{64}$/i.test(suppliedHash)) {
      throw new UnauthorizedException('Invalid MAX launch data');
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
      throw new UnauthorizedException('Invalid MAX launch data');
    }

    const authDate = Number(params.get('auth_date'));
    const now = Math.floor(Date.now() / 1000);
    if (
      !Number.isInteger(authDate) ||
      authDate > now + MAX_INIT_DATA_CLOCK_SKEW_SECONDS ||
      now - authDate > MAX_INIT_DATA_TTL_SECONDS
    ) {
      throw new UnauthorizedException('Expired MAX launch data');
    }

    const rawUser = params.get('user');
    if (!rawUser) {
      throw new UnauthorizedException('MAX user is missing');
    }

    let parsedUser: unknown;
    try {
      parsedUser = JSON.parse(rawUser);
    } catch {
      throw new UnauthorizedException('Invalid MAX user');
    }

    const user = maxUserSchema.safeParse(parsedUser);
    if (!user.success) {
      throw new UnauthorizedException('Invalid MAX user');
    }

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
}
