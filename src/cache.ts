import Redis from 'ioredis';

// Connect to Redis at default localhost:6379
const redis = new Redis();

/**
 * Try to read JSON-parsed value from Redis.
 * @param key cache key
 */
export async function getCached<T>(key: string): Promise<T | null> {
  const raw = await redis.get(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
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
  await redis.set(key, str, 'EX', ttlSeconds);
}