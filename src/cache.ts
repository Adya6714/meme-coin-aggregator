import Redis from 'ioredis';

// Connect to Redis at default localhost:6379
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

/**
 * Try to read JSON-parsed value from Redis.
 * @param key cache key
 */


export async function getCached<T>(key: string): Promise<T | null> {
  const value = await redis.get(key);
  return value ? JSON.parse(value) : null;
}

/**
 * Store JSON-stringified value in Redis with TTL (seconds).
 * @param key cache key
 * @param value any JSON-serializable value
 * @param ttlSeconds time-to-live in seconds
 */
export async function setCached(
  key: string,
  value: unknown,
  ttlSeconds = 30
): Promise<void> {
  const str = JSON.stringify(value);
  // EX = expire seconds
  await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
}