import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

const redis = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null

const ipStore = new Map<string, { count: number; resetAt: number }>()

export function checkInMemoryRateLimit(
  identifier: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const record = ipStore.get(identifier)

  if (!record || now > record.resetAt) {
    ipStore.set(identifier, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: maxRequests - 1, resetAt: now + windowMs }
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: record.resetAt }
  }

  record.count++
  return { allowed: true, remaining: maxRequests - record.count, resetAt: record.resetAt }
}

const upstashLimiters = redis
  ? {
      login: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, "15 m"),
        analytics: true,
      }),
      crearUsuario: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(3, "1 h"),
        analytics: true,
      }),
      resetPassword: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(2, "1 h"),
        analytics: true,
      }),
      contacto: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, "1 h"),
        analytics: true,
      }),
    }
  : null

export const rateLimiters = {
  login: (identifier: string) =>
    upstashLimiters
      ? upstashLimiters.login.limit(identifier).then((r) => ({
          allowed: r.success,
          remaining: r.remaining,
          resetAt: Date.now() + (r.reset - Date.now()),
        }))
      : Promise.resolve(checkInMemoryRateLimit(identifier, 5, 15 * 60 * 1000)),

  crearUsuario: (identifier: string) =>
    upstashLimiters
      ? upstashLimiters.crearUsuario.limit(identifier).then((r) => ({
          allowed: r.success,
          remaining: r.remaining,
          resetAt: Date.now() + (r.reset - Date.now()),
        }))
      : Promise.resolve(checkInMemoryRateLimit(identifier, 3, 60 * 60 * 1000)),

  resetPassword: (identifier: string) =>
    upstashLimiters
      ? upstashLimiters.resetPassword.limit(identifier).then((r) => ({
          allowed: r.success,
          remaining: r.remaining,
          resetAt: Date.now() + (r.reset - Date.now()),
        }))
      : Promise.resolve(checkInMemoryRateLimit(identifier, 2, 60 * 60 * 1000)),

  contacto: (identifier: string) =>
    upstashLimiters
      ? upstashLimiters.contacto.limit(identifier).then((r) => ({
          allowed: r.success,
          remaining: r.remaining,
          resetAt: Date.now() + (r.reset - Date.now()),
        }))
      : Promise.resolve(checkInMemoryRateLimit(identifier, 10, 60 * 60 * 1000)),
}
