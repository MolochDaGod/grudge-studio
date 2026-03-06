/**
 * Puter AI Client for Grudge Studio API Server
 * Wraps Puter REST API for server-side AI chat, image generation, KV store, and cloud storage.
 * Token loaded from PUTER_API_KEY env var or auto-resolved from puter-cli config.
 */

import fs from 'fs';
import path from 'path';

const PUTER_API = 'https://api.puter.com';

let _token = null;

/**
 * Get the Puter auth token. Tries:
 * 1. PUTER_API_KEY env var
 * 2. puter-cli saved config
 */
function getToken() {
  if (_token) return _token;

  // 1. Env var
  if (process.env.PUTER_API_KEY) {
    _token = process.env.PUTER_API_KEY;
    return _token;
  }

  // 2. puter-cli config
  try {
    const home = process.env.HOME || process.env.USERPROFILE;
    const configPath = path.join(home, 'AppData/Roaming/puter-cli-nodejs/Config/config.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const profile = config.profiles?.find(p => p.uuid === config.selected_profile);
    if (profile?.token) {
      _token = profile.token;
      return _token;
    }
  } catch {
    // Try linux/mac path
    try {
      const home = process.env.HOME || process.env.USERPROFILE;
      const configPath = path.join(home, '.config/puter-cli-nodejs/Config/config.json');
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      const profile = config.profiles?.find(p => p.uuid === config.selected_profile);
      if (profile?.token) {
        _token = profile.token;
        return _token;
      }
    } catch { /* ignore */ }
  }

  throw new Error('No Puter auth token found. Set PUTER_API_KEY or run: puter login --save');
}

function headers(contentType = 'application/json') {
  return {
    'Authorization': `Bearer ${getToken()}`,
    'Content-Type': contentType,
  };
}

// ============================================
// AI Chat
// ============================================

/**
 * Send a chat message to a Puter AI model.
 * @param {string|Array} message - The prompt or message array
 * @param {Object} options
 * @param {string} options.model - Model name (default: 'claude-3-5-sonnet')
 * @param {string} options.systemPrompt - System prompt for agent behavior
 * @param {number} options.temperature - Temperature (0-1)
 * @param {boolean} options.stream - Whether to stream response
 * @returns {Promise<string>} The AI response text
 */
export async function chat(message, options = {}) {
  const {
    model = 'claude-3-5-sonnet',
    systemPrompt,
    temperature,
    stream = false,
  } = options;

  const messages = Array.isArray(message)
    ? message
    : [{ role: 'user', content: message }];

  if (systemPrompt) {
    messages.unshift({ role: 'system', content: systemPrompt });
  }

  const body = {
    model,
    messages,
  };
  if (temperature !== undefined) body.temperature = temperature;
  if (stream) body.stream = true;

  const resp = await fetch(`${PUTER_API}/drivers/call`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      interface: 'puter-chat-completion',
      driver: 'ai-chat',
      method: 'complete',
      args: body,
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Puter AI error (${resp.status}): ${err}`);
  }

  const data = await resp.json();

  // Handle various response shapes
  if (data?.result?.message?.content) return data.result.message.content;
  if (data?.message?.content) return data.message.content;
  if (typeof data?.result === 'string') return data.result;
  if (typeof data === 'string') return data;

  return JSON.stringify(data);
}

// ============================================
// Key-Value Store
// ============================================

export const kv = {
  async set(key, value) {
    const resp = await fetch(`${PUTER_API}/drivers/call`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        interface: 'puter-kvstore',
        driver: 'kv',
        method: 'set',
        args: { key, value: typeof value === 'string' ? value : JSON.stringify(value) },
      }),
    });
    if (!resp.ok) throw new Error(`KV set failed: ${resp.status}`);
    return resp.json();
  },

  async get(key) {
    const resp = await fetch(`${PUTER_API}/drivers/call`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        interface: 'puter-kvstore',
        driver: 'kv',
        method: 'get',
        args: { key },
      }),
    });
    if (!resp.ok) throw new Error(`KV get failed: ${resp.status}`);
    const data = await resp.json();
    try { return JSON.parse(data.result); } catch { return data.result; }
  },

  async list(pattern) {
    const resp = await fetch(`${PUTER_API}/drivers/call`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        interface: 'puter-kvstore',
        driver: 'kv',
        method: 'list',
        args: pattern ? { pattern } : {},
      }),
    });
    if (!resp.ok) throw new Error(`KV list failed: ${resp.status}`);
    return resp.json();
  },

  async del(key) {
    const resp = await fetch(`${PUTER_API}/drivers/call`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        interface: 'puter-kvstore',
        driver: 'kv',
        method: 'del',
        args: { key },
      }),
    });
    if (!resp.ok) throw new Error(`KV del failed: ${resp.status}`);
    return resp.json();
  },
};

// ============================================
// Verify Connection
// ============================================

export async function whoami() {
  const resp = await fetch(`${PUTER_API}/whoami`, { headers: headers() });
  if (!resp.ok) throw new Error(`Puter auth failed: ${resp.status}`);
  return resp.json();
}

/**
 * Check if Puter is configured and token is valid.
 * @returns {Promise<{ok: boolean, username?: string, error?: string}>}
 */
export async function healthCheck() {
  try {
    const user = await whoami();
    return { ok: true, username: user.username };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

export default { chat, kv, whoami, healthCheck };
