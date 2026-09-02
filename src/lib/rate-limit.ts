if (!process.env.UPSTASH_REDIS_REST_URL && process.env.NODE_ENV === 'production') {
  console.warn(
    '[rate-limit] UPSTASH_REDIS_REST_URL no configurado en producción. ' +
      'El rate limiting in-memory NO funciona en serverless (Vercel/Netlify). ' +
      'Configura UPSTASH_REDIS_REST_URL y UPSTASH_REDIS_REST_TOKEN.'
  );
}

const ipStore = new Map<string, { count: number; resetAt: number }>();

export function checkInMemoryRateLimit(
  identifier: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const record = ipStore.get(identifier);

  if (!record || now > record.resetAt) {
    ipStore.set(identifier, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetAt: now + windowMs };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: record.resetAt };
  }

  record.count++;
  return { allowed: true, remaining: maxRequests - record.count, resetAt: record.resetAt };
}

async function limitWithUpstash(identifier: string, windowMs: number, maxRequests: number) {
  const { Ratelimit } = await import('@upstash/ratelimit');
  const { Redis } = await import('@upstash/redis');

  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });

  const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(maxRequests, `${Math.ceil(windowMs / 60000)} m`),
    analytics: true,
  });

  const result = await ratelimit.limit(identifier);
  return {
    allowed: result.success,
    remaining: result.remaining,
    resetAt: Date.now() + (result.reset - Date.now()),
  };
}

function inMemoryFallback(maxRequests: number, windowMs: number) {
  return (identifier: string) =>
    Promise.resolve(checkInMemoryRateLimit(identifier, maxRequests, windowMs));
}

function createLimiter(maxRequests: number, windowMs: number) {
  if (process.env.UPSTASH_REDIS_REST_URL) {
    return (identifier: string) => limitWithUpstash(identifier, windowMs, maxRequests);
  }
  return inMemoryFallback(maxRequests, windowMs);
}

export const rateLimiters = {
  login: createLimiter(5, 15 * 60 * 1000),
  crearUsuario: createLimiter(3, 60 * 60 * 1000),
  resetPassword: createLimiter(2, 60 * 60 * 1000),
  contacto: createLimiter(10, 60 * 60 * 1000),
  enviarConvocatoria: createLimiter(5, 60 * 60 * 1000),
};
