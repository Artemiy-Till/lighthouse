import helmet from '@fastify/helmet';
import fastifyStatic from '@fastify/static';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { resolve } from 'node:path';

import { AppModule } from './app.module.js';
import { parseEnvironment } from './config/environment.js';

async function bootstrap() {
  const environment = parseEnvironment(process.env);
  const adapter = new FastifyAdapter({
    bodyLimit: 4_400_000,
    trustProxy: true,
  });
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    adapter,
    { bufferLogs: true },
  );

  await app.register(helmet);
  if (environment.PHOTO_STORAGE_PROVIDER === 'local') {
    await app.register(fastifyStatic, {
      root: resolve(environment.UPLOADS_DIR),
      prefix: '/uploads/',
      decorateReply: false,
    });
  }
  app.enableShutdownHooks();
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
      whitelist: true,
    }),
  );

  const corsOrigins =
    environment.CORS_ORIGINS.length > 0
      ? environment.CORS_ORIGINS
      : environment.NODE_ENV === 'production'
        ? ['https://lighthouse-api-one.vercel.app']
        : [];

  if (corsOrigins.length > 0) {
    app.enableCors({
      credentials: true,
      methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      origin: corsOrigins,
    });
  }

  if (environment.NODE_ENV !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('MAX Travel Marketplace API')
      .setDescription('Development API documentation')
      .setVersion('1.0')
      .build();
    const documentFactory = () =>
      SwaggerModule.createDocument(app, swaggerConfig);

    SwaggerModule.setup('api/docs', app, documentFactory);
  }

  await app.listen(environment.PORT, '0.0.0.0');
}

void bootstrap();
