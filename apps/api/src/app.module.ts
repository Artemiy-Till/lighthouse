import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';

import { HealthModule } from './modules/health/health.module.js';
import { MaxIntegrationModule } from './modules/max/max-integration.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ cache: true, isGlobal: true }),
    LoggerModule.forRoot({
      pinoHttp: {
        redact: {
          paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'res.headers["set-cookie"]',
          ],
          censor: '[REDACTED]',
        },
      },
    }),
    HealthModule,
    MaxIntegrationModule,
  ],
})
export class AppModule {}
