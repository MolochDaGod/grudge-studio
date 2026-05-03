import type { VercelRequest, VercelResponse } from '@vercel/node';

const AUTH_URL = process.env.GRUDGE_AUTH_URL || 'https://id.grudge-studio.com';
const ALLOWED_ORIGINS = [
  'https://grudgewarlords.com',
  'https://www.grudgewarlords.com',
  'https://grudge-studio.com',
  'https://id.grudge-studio.com',
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // ── CORS ──────────────────────────────────────────────────────────
  const origin = req.headers.origin as string | undefined;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { token } = (req.body ?? {}) as { token?: string };
  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: 'token is required' });
  }

  try {
    const upstream = await fetch(`${AUTH_URL}/api/auth/session/exchange`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Tell The-ENGINE the request is coming from grudgewarlords.com
        // so it passes the allowlist check and mints a session cookie
        // scoped to .grudge-studio.com.
        'Origin': 'https://grudgewarlords.com',
      },
      body: JSON.stringify({ token }),
    });

    const data = await upstream.json() as Record<string, unknown>;

    if (!upstream.ok) {
      return res.status(upstream.status).json(data);
    }

    // ── Set a lightweight grudgewarlords.com session cookie ───────────
    // This is just for UI-state / SSR convenience; the real auth lives on
    // .grudge-studio.com. We base64-encode the public player object (no secrets).
    const sessionValue = Buffer.from(JSON.stringify({
      id: data.id,
      username: data.username,
      grudgeId: data.grudgeId,
      displayName: data.displayName,
      avatarUrl: data.avatarUrl,
      role: data.role,
    })).toString('base64url');

    res.setHeader('Set-Cookie',
      `gw_player=${sessionValue}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800; Secure`,
    );

    return res.status(200).json(data);
  } catch (err) {
    console.error('[auth/exchange] upstream error:', err);
    return res.status(500).json({ error: 'Auth exchange failed. Please try again.' });
  }
}
