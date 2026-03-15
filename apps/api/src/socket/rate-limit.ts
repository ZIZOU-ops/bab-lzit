import type Redis from 'ioredis';

export async function checkSocketRateLimit(input: {
  redis: Redis;
  userId: string;
  eventName: string;
  limit: number;
  windowSeconds: number;
}) {
  const key = `socket:rl:${input.eventName}:${input.userId}`;
  const count = await input.redis.incr(key);
  if (count === 1) {
    await input.redis.expire(key, input.windowSeconds);
  }

  return count <= input.limit;
}
