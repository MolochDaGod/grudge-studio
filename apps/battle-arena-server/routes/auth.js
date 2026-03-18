/**
 * Battle Arena Auth Routes — Proxy to Grudge Backend
 *
 * All authentication is handled by id.grudge-studio.com.
 * No local bcrypt, no local token tables — everything proxied.
 */
import express from 'express';

const router = express.Router();
const GRUDGE_AUTH_URL = process.env.GRUDGE_AUTH_URL || process.env.VPS_AUTH_URL || 'https://id.grudge-studio.com';

// ── Proxy helper ────────────────────────────────────────────────────────────

async function proxy(path, req, res, opts = {}) {
  const { method = 'POST', forwardBody = true } = opts;
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (req.headers.authorization) headers.Authorization = req.headers.authorization;

    const fetchOpts = { method, headers };
    if (forwardBody && method !== 'GET') {
      fetchOpts.body = JSON.stringify(req.body || {});
    }

    const upstream = await fetch(`${GRUDGE_AUTH_URL}${path}`, fetchOpts);

    if (upstream.status >= 300 && upstream.status < 400) {
      const location = upstream.headers.get('location');
      if (location) return res.redirect(upstream.status, location);
    }

    const ct = upstream.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      return res.status(upstream.status).json(await upstream.json());
    }
    return res.status(upstream.status).send(await upstream.text());
  } catch (err) {
    console.error(`[BattleArena auth proxy ${path}]`, err.message);
    res.status(502).json({ error: 'Grudge auth backend unavailable' });
  }
}

// ── Auth endpoints (all proxy to grudge-backend) ────────────────────────────

router.post('/register', (req, res) => proxy('/auth/register', req, res));
router.post('/login', (req, res) => proxy('/auth/login', req, res));
router.post('/guest', (req, res) => proxy('/auth/guest', req, res));
router.post('/wallet', (req, res) => proxy('/auth/wallet', req, res));
router.post('/puter', (req, res) => proxy('/auth/puter', req, res));
router.post('/verify', (req, res) => proxy('/auth/verify', req, res));

// Discord OAuth
router.get('/discord', (req, res) => proxy('/auth/discord', req, res, { method: 'GET', forwardBody: false }));
router.get('/discord/callback', (req, res) => {
  const qs = req.url.includes('?') ? req.url.split('?')[1] : '';
  proxy(`/auth/discord/callback?${qs}`, req, res, { method: 'GET', forwardBody: false });
});
router.post('/discord/exchange', (req, res) => proxy('/auth/discord/exchange', req, res));

// Google / GitHub exchanges
router.post('/google/exchange', (req, res) => proxy('/auth/google/exchange', req, res));
router.post('/github/exchange', (req, res) => proxy('/auth/github/exchange', req, res));

console.log(`✅ Battle Arena auth proxy → ${GRUDGE_AUTH_URL}`);

// ── Token verification helper (for game rooms) ──────────────────────────────

export async function verifyAuthToken(token) {
  if (!token) return null;
  try {
    const result = await fetch(`${GRUDGE_AUTH_URL}/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    const data = await result.json();
    if (data.valid && data.payload) {
      return {
        userId: data.payload.grudge_id || data.payload.grudgeId,
        username: data.payload.username,
        grudgeId: data.payload.grudge_id || data.payload.grudgeId,
      };
    }
  } catch (e) {
    console.warn('[BattleArena] Token verify failed:', e.message);
  }
  return null;
}

export function generateGrudgeId(userId) {
  return userId; // Grudge IDs are managed by the backend
}

export async function updateLastLogin() {
  // Handled by grudge-backend on auth
}

export default router;
