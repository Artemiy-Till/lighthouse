import {
  Injectable,
  OnModuleDestroy,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, type QueryResultRow } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly pool: Pool | null;

  constructor(configService: ConfigService) {
    const connectionString = configService.get<string>('DATABASE_URL');
    if (!connectionString) {
      this.pool = null;
      return;
    }

    const hostname = new URL(connectionString).hostname;
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
    this.pool = new Pool({
      connectionString,
      max: 5,
      ssl: isLocal ? false : { rejectUnauthorized: false },
    });
  }

  get configured() {
    return this.pool !== null;
  }

  async query<Row extends QueryResultRow>(
    text: string,
    values: readonly unknown[] = [],
  ) {
    if (!this.pool) {
      throw new ServiceUnavailableException(
        'Professional accounts require a configured database',
      );
    }

    return this.pool.query<Row>(text, [...values]);
  }

  async onModuleDestroy() {
    await this.pool?.end();
  }
}
