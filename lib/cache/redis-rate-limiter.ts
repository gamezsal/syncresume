import { getRedisClient } from "./redis";

// Atomic server-side Lua script for Sliding Window Log Rate Limiting
const LUA_SLIDING_WINDOW = `
local key = KEYS[1]
local max_requests = tonumber(ARGV[1])
local window_seconds = tonumber(ARGV[2])
local now = tonumber(ARGV[3])
local member = ARGV[4]

local window_start = now - window_seconds * 1000

-- 1. Remove stale timestamps outside the sliding window
redis.call('ZREMRANGEBYSCORE', key, 0, window_start)

-- 2. Count current active requests within the window
local count = redis.call('ZCARD', key)

-- 3. Branching logic: Allow if strictly under the limit
if count < max_requests then
  redis.call('ZADD', key, now, member)
  redis.call('EXPIRE', key, window_seconds)
  return { 1, max_requests - count - 1, 0 }
end

-- 4. If denied: Find the oldest request score to calculate precise retry-after time (in ms)
local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
local retry_after_ms = window_seconds * 1000
if #oldest >= 2 then
  retry_after_ms = tonumber(oldest[2]) + window_seconds * 1000 - now
end

return { 0, 0, retry_after_ms }
`;

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * High-performance, production-grade Sliding Window Log rate limiter using Redis Lua scripting.
 * Prevents race conditions and prevents database bloating under spam conditions.
 *
 * @param identifier Client IP address or unique session ID
 * @param limit Max requests allowed in the sliding window (default: 10)
 * @param windowSeconds Window duration in seconds (default: 60)
 */
export async function isRateLimited(
  identifier: string,
  limit: number = 10,
  windowSeconds: number = 60
): Promise<RateLimitResult> {
  const client = getRedisClient();

  // If Redis is offline, fail-open to preserve client availability
  if (!client) {
    console.warn("[Rate Limiter] Redis client is offline or unavailable. Failing open.");
    return {
      success: true,
      limit,
      remaining: limit,
      reset: 0,
    };
  }

  const key = `ratelimit:${identifier}`;
  const now = Date.now();
  const member = `${now}:${Math.random()}`; // Appending random suffix prevents millisecond collisions

  try {
    // Execute atomic Lua script on the Redis server
    const result = (await client.eval(
      LUA_SLIDING_WINDOW,
      1, // Number of keys
      key,
      limit.toString(),
      windowSeconds.toString(),
      now.toString(),
      member
    )) as number[];

    const allowed = result[0] === 1;
    const remaining = result[1];
    const retryAfterMs = result[2];

    return {
      success: allowed,
      limit,
      remaining,
      reset: allowed ? windowSeconds : Math.ceil(Math.max(0, retryAfterMs / 1000)),
    };
  } catch (error: any) {
    console.error("[Rate Limiter] Evaluation failure, bypassing rate limiting:", error.message);
    // Fail-open strategy to prevent crashing Next.js if Redis errors out
    return {
      success: true,
      limit,
      remaining: limit,
      reset: 0,
    };
  }
}
