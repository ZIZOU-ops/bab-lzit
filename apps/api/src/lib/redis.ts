import Redis from 'ioredis';
import { env } from '../config/env';
import { logger } from './logger';

const globalForRedis = globalThis as unknown as {
  redis?: Redis;
};

export const redis =
  globalForRedis.redis ??
  new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    enableAutoPipelining: true,
  });

redis.on('connect', () => logger.info('Redis connecting'));
redis.on('ready', () => logger.info('Redis ready'));
redis.on('error', (error) => logger.error({ error }, 'Redis error'));
redis.on('close', () => logger.warn('Redis connection closed'));

if (env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis;
}
