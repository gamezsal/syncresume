import Redis from "ioredis";

/**
 * lib/cache/redis.ts
 *
 * High-speed in-memory caching layer via Cloud Memorystore for Redis.
 * Configured with strict Memorystore internal IP resolution and error-suppression
 * to ensure fail-fast behavior without throwing unhandled TCP socket errors.
 */

const host = process.env.REDIS_HOST || "10.197.50.115";
const port = parseInt(process.env.REDIS_PORT || "6379", 10);
const password = process.env.REDIS_PASSWORD || undefined;

// Construct explicit Memorystore connection target
const redisUrl = process.env.REDIS_URL || `redis://${host}:${port}`;

export const redis = new Redis(redisUrl, {
  password,
  enableOfflineQueue: false, // Prevents background TCP queuing error storms when offline/connecting
  connectTimeout: 2000,
  maxRetriesPerRequest: 1,
  showFriendlyErrorStack: true,
  retryStrategy(times) {
    if (times > 1) {
      return null; // Stop infinite reconnect loop on failure
    }
    return 1000;
  },
});

// Attach explicit error handler immediately to swallow unhandled error events
redis.on("error", (err) => {
  console.warn("[Redis Cache] Connection error (failing open):", err.message);
});

redis.on("connect", () => {
  console.log(" [Redis Cache] Connected successfully to Cloud Memorystore.");
});

// Helper function exports expected by redis-rate-limiter.ts and API routes
export function getRedisInstance(): Redis {
  return redis;
}

export function getRedisClient(): Redis {
  return redis;
}

export async function getCachedData<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  } catch (error: any) {
    console.warn(`[Redis Cache] Fetch failed for key "${key}":`, error.message);
    return null;
  }
}

export async function setCachedData(key: string, data: any, ttlSeconds = 1800): Promise<void> {
  try {
    await redis.set(key, JSON.stringify(data), "EX", ttlSeconds);
  } catch (error: any) {
    console.warn(`[Redis Cache] Set failed for key "${key}":`, error.message);
  }
}

export async function deleteCachedData(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch (error: any) {
    console.warn(`[Redis Cache] Delete failed for key "${key}":`, error.message);
  }
}
