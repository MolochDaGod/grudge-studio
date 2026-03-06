/**
 * Simple in-memory rate limiter
 * Good for Vercel serverless (per-instance limiting)
 * For production scale, swap with Redis-backed limiter
 */

const buckets = new Map();

// Clean up stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (now - bucket.windowStart > 120_000) {
      buckets.delete(key);
    }
  }
}, 300_000);

/**
 * Create rate limit middleware
 * @param {object} options
 * @param {number} options.windowMs - Time window in milliseconds (default 60s)
 * @param {number} options.max - Max requests per window (default 100)
 * @param {string} options.message - Error message on limit exceeded
 */
export function rateLimit(options = {}) {
  const windowMs = options.windowMs || 60_000;
  const max = options.max || 100;
  const message = options.message || 'Too many requests, please try again later.';

  return (req, res, next) => {
    const key = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const now = Date.now();

    let bucket = buckets.get(key);

    if (!bucket || now - bucket.windowStart > windowMs) {
      bucket = { count: 0, windowStart: now };
      buckets.set(key, bucket);
    }

    bucket.count++;

    // Set rate limit headers
    res.set('X-RateLimit-Limit', max);
    res.set('X-RateLimit-Remaining', Math.max(0, max - bucket.count));
    res.set('X-RateLimit-Reset', Math.ceil((bucket.windowStart + windowMs) / 1000));

    if (bucket.count > max) {
      return res.status(429).json({
        error: 'rate_limit_exceeded',
        message,
        retryAfter: Math.ceil((bucket.windowStart + windowMs - now) / 1000)
      });
    }

    next();
  };
}

/**
 * Stricter rate limit for AI endpoints
 */
export const aiRateLimit = rateLimit({
  windowMs: 60_000,
  max: 20,
  message: 'AI query rate limit exceeded. Max 20 requests per minute.'
});

/**
 * Standard API rate limit
 */
export const apiRateLimit = rateLimit({
  windowMs: 60_000,
  max: 200,
  message: 'API rate limit exceeded. Max 200 requests per minute.'
});
