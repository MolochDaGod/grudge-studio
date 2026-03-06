/**
 * CORS Configuration for Grudge Studio API
 * Allows requests from Puter apps, grudgewarlords.com, and local dev
 */

import cors from 'cors';

const ALLOWED_ORIGINS = [
  // Production
  /\.puter\.site$/,
  /grudgewarlords\.com$/,
  /\.grudgewarlords\.com$/,
  /\.vercel\.app$/,
  // Local development
  /^http:\/\/localhost:\d+$/,
  /^http:\/\/127\.0\.0\.1:\d+$/,
];

export function createCorsMiddleware() {
  return cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (server-to-server, curl, etc.)
      if (!origin) {
        return callback(null, true);
      }

      const allowed = ALLOWED_ORIGINS.some(pattern => {
        if (pattern instanceof RegExp) return pattern.test(origin);
        return origin === pattern;
      });

      if (allowed) {
        callback(null, true);
      } else {
        console.warn(`[CORS] Blocked origin: ${origin}`);
        callback(null, false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Source', 'X-Request-ID'],
    exposedHeaders: ['X-Total-Count', 'X-Cache-Status'],
    maxAge: 86400 // 24 hours preflight cache
  });
}
