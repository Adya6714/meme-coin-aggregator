import { Redis } from '@upstash/redis';

// Automatically uses UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN from env
export const redis = Redis.fromEnv();

/**
 * Try to read JSON-parsed value from Redis.
 * @param key cache key
 */
export async function getCached<T>(key: string): Promise<T | null> {
  const value = await redis.get(key);
  return value ? JSON.parse(value as string) : null;
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
  await redis.setex(key, ttlSeconds, str); // Upstash supports EX
}