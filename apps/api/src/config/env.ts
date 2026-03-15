import { z } from 'zod';

const DEFAULT_JWT_SECRET = 'dev-secret-change-me-min-32-chars!!';

const envSchema = z.object({
  DATABASE_URL: z
    .string()
    .default('postgresql://babloo:babloo_dev@localhost:5432/babloo_dev')
    .refine(
      (value) => value.startsWith('postgresql://') || value.startsWith('postgres://'),
      { message: 'Must start with \"postgresql://\" or \"postgres://\"' },
    ),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  JWT_SECRET: z.string().default(DEFAULT_JWT_SECRET),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('30d'),
  BCRYPT_ROUNDS: z.coerce.number().int().default(12),
  OTP_TTL_MINUTES: z.coerce.number().int().default(5),
  OTP_MAX_ATTEMPTS: z.coerce.number().int().default(5),
  OTP_RATE_LIMIT_PER_15MIN: z.coerce.number().int().default(3),
  SMS_PROVIDER: z.enum(['mock', 'twilio']).default('mock'),
  PORT: z.coerce.number().int().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGINS: z.string().default('http://localhost:8081'),
  SENTRY_DSN: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

if (parsed.data.NODE_ENV === 'production') {
  if (parsed.data.JWT_SECRET === DEFAULT_JWT_SECRET) {
    // eslint-disable-next-line no-console
    console.error('Invalid production JWT_SECRET: default value is forbidden in production.');
    process.exit(1);
  }

  if (parsed.data.JWT_SECRET.length < 32) {
    // eslint-disable-next-line no-console
    console.error('Invalid production JWT_SECRET: must be at least 32 characters long.');
    process.exit(1);
  }

  if (parsed.data.BCRYPT_ROUNDS < 10) {
    // eslint-disable-next-line no-console
    console.error('Invalid production BCRYPT_ROUNDS: must be >= 10.');
    process.exit(1);
  }
}

export const env = {
  ...parsed.data,
  DEFAULT_JWT_SECRET,
};
