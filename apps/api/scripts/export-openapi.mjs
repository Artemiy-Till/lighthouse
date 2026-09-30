import 'reflect-metadata';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import prettier from 'prettier';

import { AppModule } from '../dist/app.module.js';

const app = await NestFactory.create(AppModule, new FastifyAdapter(), {
  logger: false,
});

try {
  app.setGlobalPrefix('api/v1');
  await app.init();
  const config = new DocumentBuilder()
    .setTitle('Маяк API')
    .setDescription('API маркетплейса экскурсий в MAX')
    .setVersion('1.0.0')
    .addServer('https://111-88-243-251.sslip.io', 'Публичный адрес из README')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  document.components ??= {};
  document.components.securitySchemes = {
    ...document.components.securitySchemes,
    maxInitData: {
      type: 'apiKey',
      in: 'header',
      name: 'x-max-init-data',
      description: 'Свежие подписанные данные запуска MAX Mini App',
    },
  };

  for (const [path, operations] of Object.entries(document.paths)) {
    for (const operation of Object.values(operations)) {
      if (!operation || typeof operation !== 'object') continue;
      if (
        path.startsWith('/api/v1/bookings') ||
        path.startsWith('/api/v1/professional')
      ) {
        operation.security = [{ maxInitData: [] }];
        operation.parameters = (operation.parameters ?? []).filter(
          (parameter) => parameter.name !== 'x-max-init-data',
        );
        operation.responses['401'] = {
          description: 'Отсутствуют или недействительны данные запуска MAX',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['statusCode', 'message'],
                properties: {
                  statusCode: { type: 'integer', enum: [401] },
                  message: { type: 'string' },
                },
              },
            },
          },
        };
      }
    }
  }

  const cityQuery = document.paths[
    '/api/v1/experiences'
  ]?.get?.parameters?.find((parameter) => parameter.name === 'cityId');
  if (cityQuery) cityQuery.required = false;

  const webhook = document.paths['/api/v1/integrations/max/webhook']?.post;
  if (webhook) {
    webhook.parameters = [
      {
        in: 'header',
        name: 'x-max-bot-api-secret',
        required: true,
        schema: { type: 'string' },
      },
    ];
    webhook.requestBody = {
      required: true,
      content: {
        'application/json': {
          schema: { type: 'object', additionalProperties: true },
        },
      },
    };
  }

  const photos = document.paths['/api/v1/photos/{owner}/{filename}']?.get;
  if (photos) {
    photos.responses['200'] = {
      description: 'Бинарное изображение',
      content: { 'image/*': { schema: { type: 'string', format: 'binary' } } },
    };
  }

  const object = (properties, required = Object.keys(properties)) => ({
    type: 'object',
    properties,
    required,
  });
  const string = { type: 'string' };
  const integer = { type: 'integer' };
  const arrayOf = (items) => ({ type: 'array', items });
  const experience = object({
    id: string,
    cityId: string,
    title: string,
    intro: string,
    description: string,
    category: string,
    priceRub: integer,
    status: { type: 'string', enum: ['published'] },
    guide: object({ id: string, displayName: string, bio: string }),
    availableSlots: arrayOf(
      object({
        date: string,
        time: string,
        remaining: integer,
        status: string,
      }),
    ),
  });
  const booking = object({
    id: string,
    experienceId: string,
    date: string,
    time: string,
    participants: integer,
    totalPriceRub: integer,
    status: { type: 'string', enum: ['confirmed', 'completed', 'cancelled'] },
  });
  const responseSchemas = [
    ['get', '/api/v1/experiences', object({ items: arrayOf(experience) })],
    ['get', '/api/v1/experiences/{id}', experience],
    ['post', '/api/v1/professional/experiences', experience],
    ['put', '/api/v1/professional/experiences/{id}', experience],
    [
      'get',
      '/api/v1/professional/experiences',
      object({ items: arrayOf(experience) }),
    ],
    ['get', '/api/v1/bookings', object({ items: arrayOf(booking) })],
    ['post', '/api/v1/bookings', booking],
    [
      'delete',
      '/api/v1/bookings/{id}',
      object({ cancelled: { type: 'boolean' }, id: string }),
    ],
    [
      'post',
      '/api/v1/auth/max',
      object({
        authenticated: { type: 'boolean' },
        user: object({ id: string, firstName: string }, ['id', 'firstName']),
      }),
    ],
    [
      'put',
      '/api/v1/professional/profile',
      object({ id: string, displayName: string, bio: string }),
    ],
  ];
  for (const [method, path, schema] of responseSchemas) {
    const responses = document.paths[path]?.[method]?.responses;
    if (!responses) continue;
    const successCode =
      method === 'post' && path !== '/api/v1/auth/max' ? '201' : '200';
    responses[successCode] = {
      description: 'Успешный ответ',
      content: { 'application/json': { schema } },
    };
  }
  await writeFile(
    resolve('docs/api-check/openapi.json'),
    await prettier.format(JSON.stringify(document), { parser: 'json' }),
  );
} finally {
  await app.close();
}
