import Redis from "ioredis";

/**
 * lib/cache/redis.ts
 *
 * This module manages our high-speed, in-memory caching layer via Cloud Memorystore for Redis.
 * It implements a singleton client pattern to prevent socket exhaustion during Next.js hot-reloads
 * and includes a graceful, production-grade local bypass if the Redis server is unavailable.
 */

let redisClient: Redis | null = null;
let isRedisConnected = false;

/**
 * Initializes and returns a single, reused ioredis Client instance.
 * Uses standard host/port parameters matching Google Cloud Memorystore requirements.
 */
export function getRedisClient(): Redis | null {
  if (typeof window !== "undefined") {
    return null; // Ensure Redis never runs in client-side code
  }

  if (redisClient) {
    return redisClient;
  }

  const host = process.env.REDIS_HOST || "127.0.0.1";
  const port = parseInt(process.env.REDIS_PORT || "6379", 10);
  const password = process.env.REDIS_PASSWORD || undefined;

  try {
    console.log(`[Redis Cache] Attempting connection to ${host}:${port}...`);
    
    // Create a connection with max connection retry limits so local development doesn't hang
    redisClient = new Redis({
      host,
      port,
      password,
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
      showFriendlyErrorStack: true,
      retryStrategy(times) {
        // Stop retrying quickly in local development so the app stays functional without Redis
        if (times > 1) {
          console.warn(
            "[Redis Cache] Connection failed. Bypassing Redis cache layer in favor of direct database fallbacks."
          );
          isRedisConnected = false;
          return null; // Stop retrying
        }
        return 1000;
      },
    });

    redisClient.on("connect", () => {
      console.log(" [Redis Cache] Connection established successfully.");
      isRedisConnected = true;
    });

    redisClient.on("error", (err) => {
      // Graceful error logging to prevent server crash loops in development
      console.warn("[Redis Cache] Server error:", err.message);
      isRedisConnected = false;
    });

    return redisClient;
  } catch (error) {
    console.error("[Redis Cache] Failed to instantiate client:", error);
    return null;
  }
}

/**
 * Fetches JSON-deserialized cached data from Redis. 
 * Gracefully returns null if Redis is offline.
 */
export async function getCachedData<T>(key: string): Promise<T | null> {
  const client = getRedisClient();
  if (!client || !isRedisConnected) return null;

  try {
    const rawData = await client.get(key);
    if (!rawData) return null;
    return JSON.parse(rawData) as T;
  } catch (error) {
    console.warn(`[Redis Cache] Get operation failed for key "${key}":`, error);
    return null;
  }
}

/**
 * Caches data with an expiration Time-To-Live (TTL).
 * Gracefully ignores failures if Redis is offline.
 */
export async function setCachedData<T>(
  key: string,
  data: T,
  ttlSeconds = 1800 // Default to 30 minutes (Phase 2 requirement)
): Promise<void> {
  const client = getRedisClient();
  if (!client || !isRedisConnected) return;

  try {
    const serialized = JSON.stringify(data);
    await client.set(key, serialized, "EX", ttlSeconds);
  } catch (error) {
    console.warn(`[Redis Cache] Set operation failed for key "${key}":`, error);
  }
}

/**
 * Invalidates a specific cache key.
 */
export async function deleteCachedData(key: string): Promise<void> {
  const client = getRedisClient();
  if (!client || !isRedisConnected) return;

  try {
    await client.del(key);
  } catch (error) {
    console.warn(`[Redis Cache] Delete operation failed for key "${key}":`, error);
  }
}
