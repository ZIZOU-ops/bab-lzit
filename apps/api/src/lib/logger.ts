import pino from 'pino';
import { env } from '../config/env';

const redactionPaths = [
  'req.headers.authorization',
  '*.password',
  '*.passwordHash',
  '*.token',
  '*.refreshToken',
  '*.codeHash',
  '*.hash',
  '*.otp',
  '*.code',
] as const;

export const logger = pino(
  {
    level: env.NODE_ENV === 'development' ? 'debug' : 'info',
    base: { service: 'babloo-api' },
    redact: { paths: [...redactionPaths], censor: '[REDACTED]' },
  },
  env.NODE_ENV === 'development'
    ? pino.transport({
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      })
    : undefined,
);

export function createChildLogger(bindings: Record<string, unknown>) {
  return logger.child(bindings);
}
