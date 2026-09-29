import { z } from 'zod';

const environmentSchema = z.object({
  CORS_ORIGINS: z
    .string()
    .optional()
    .transform((value) =>
      value
        ? value
            .split(',')
            .map((origin) => origin.trim())
            .filter(Boolean)
        : [],
    ),
  APP_PUBLIC_URL: z.url().optional(),
  DATABASE_URL: z
    .url()
    .refine(
      (value) =>
        value.startsWith('postgresql://') || value.startsWith('postgres://'),
      'DATABASE_URL must use the PostgreSQL protocol',
    )
    .optional(),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),
  MAX_API_BASE_URL: z
    .url()
    .startsWith('https://')
    .default('https://platform-api2.max.ru'),
  MAX_API_TIMEOUT_MS: z.coerce
    .number()
    .int()
    .min(100)
    .max(30_000)
    .default(5000),
  MAX_BOT_TOKEN: z.string().min(1).optional(),
  MAX_BOT_USERNAME: z.string().min(1).optional(),
  MAX_WEBHOOK_SECRET: z
    .string()
    .regex(/^[a-zA-Z0-9_-]{5,256}$/)
    .optional(),
  OBJECT_STORAGE_ACCESS_KEY_ID: z.string().min(1).optional(),
  OBJECT_STORAGE_BUCKET: z.string().min(1).optional(),
  OBJECT_STORAGE_ENDPOINT: z.url().default('https://storage.yandexcloud.net'),
  OBJECT_STORAGE_REGION: z.string().default('ru-central1'),
  OBJECT_STORAGE_SECRET_ACCESS_KEY: z.string().min(1).optional(),
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().min(1).max(65_535).default(3000),
});

export type Environment = z.infer<typeof environmentSchema>;

export function parseEnvironment(environment: NodeJS.ProcessEnv): Environment {
  return environmentSchema.parse(environment);
}
