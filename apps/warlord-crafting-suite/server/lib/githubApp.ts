/**
 * GitHub App Client for Grudge Studio
 * Handles JWT signing, installation token management, and repo operations
 * for the gruda-projects GitHub App (owner: @GrudgeDaDev)
 * Ported from apps/api-server/lib/github-app.js
 */

import { readFileSync } from 'fs';
import { createSign } from 'crypto';

const APP_ID = process.env.GITHUB_APP_ID;
const PRIVATE_KEY_PATH = process.env.GITHUB_PRIVATE_KEY_PATH;
const PAT = process.env.GRUDGEDADEV_GITHUB_TOKEN; // fallback PAT
const GITHUB_API = 'https://api.github.com';
const OWNER = 'MolochDaGod';

// --- Token Cache ---
let _installationToken: string | null = null;
let _installationTokenExpiry = 0;
let _privateKey: string | null = null;

function getPrivateKey(): string {
  if (_privateKey) return _privateKey;
  if (!PRIVATE_KEY_PATH) throw new Error('GITHUB_PRIVATE_KEY_PATH not set');
  _privateKey = readFileSync(PRIVATE_KEY_PATH, 'utf8');
  return _privateKey;
}

function createAppJWT(): string {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iat: now - 60,
    exp: now + (9 * 60),
    iss: APP_ID
  };

  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');

  const sign = createSign('RSA-SHA256');
  sign.update(`${header}.${body}`);
  const signature = sign.sign(getPrivateKey(), 'base64url');

  return `${header}.${body}.${signature}`;
}

async function getInstallationId(): Promise<number> {
  const jwt = createAppJWT();
  const res = await fetch(`${GITHUB_API}/app/installations`, {
    headers: {
      Authorization: `Bearer ${jwt}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'GrudgeStudio-API'
    }
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to list installations: ${res.status} ${text}`);
  }

  const installations = await res.json();
  const install = installations.find((i: any) =>
    i.account && (i.account.login === OWNER || i.account.login === 'GrudgeDaDev')
  );

  if (!install) throw new Error(`No installation found for ${OWNER}`);
  return install.id;
}

export async function getInstallationToken(): Promise<string> {
  if (_installationToken && Date.now() < _installationTokenExpiry - 300000) {
    return _installationToken;
  }

  const installId = await getInstallationId();
  const jwt = createAppJWT();

  const res = await fetch(`${GITHUB_API}/app/installations/${installId}/access_tokens`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${jwt}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'GrudgeStudio-API'
    }
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to create installation token: ${res.status} ${text}`);
  }

  const data = await res.json();
  _installationToken = data.token;
  _installationTokenExpiry = new Date(data.expires_at).getTime();
  return _installationToken!;
}

async function githubFetch(path: string, options: RequestInit = {}): Promise<any> {
  let token: string;
  try {
    token = await getInstallationToken();
  } catch (e: any) {
    if (PAT) {
      console.warn('GitHub App auth failed, using PAT fallback:', e.message);
      token = PAT;
    } else {
      throw e;
    }
  }

  const url = path.startsWith('http') ? path : `${GITHUB_API}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'GrudgeStudio-API',
      ...(options.headers || {})
    }
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API ${res.status}: ${text}`);
  }

  return res.json();
}

// --- Public API ---

export async function listRepos(opts: { page?: number; perPage?: number; sort?: string } = {}) {
  const { page = 1, perPage = 30, sort = 'updated' } = opts;
  return githubFetch(`/users/${OWNER}/repos?page=${page}&per_page=${perPage}&sort=${sort}`);
}

export async function getRepo(name: string) {
  return githubFetch(`/repos/${OWNER}/${name}`);
}

export async function getRepoContents(repo: string, path = '', ref = 'main') {
  return githubFetch(`/repos/${OWNER}/${repo}/contents/${path}?ref=${ref}`);
}

export async function listIssues(repo: string, opts: { state?: string; page?: number; perPage?: number } = {}) {
  const { state = 'open', page = 1, perPage = 20 } = opts;
  return githubFetch(`/repos/${OWNER}/${repo}/issues?state=${state}&page=${page}&per_page=${perPage}`);
}

export async function createIssue(repo: string, title: string, body = '', labels: string[] = []) {
  return githubFetch(`/repos/${OWNER}/${repo}/issues`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, body, labels })
  });
}

export async function triggerWorkflow(repo: string, workflowId: string, ref = 'main', inputs: Record<string, any> = {}) {
  return githubFetch(`/repos/${OWNER}/${repo}/actions/workflows/${workflowId}/dispatches`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ref, inputs })
  });
}

export async function listWorkflowRuns(repo: string, opts: { page?: number; perPage?: number } = {}) {
  const { page = 1, perPage = 10 } = opts;
  return githubFetch(`/repos/${OWNER}/${repo}/actions/runs?page=${page}&per_page=${perPage}`);
}

export async function getStatus() {
  const hasAppId = !!APP_ID;
  const hasKey = !!PRIVATE_KEY_PATH;
  const hasPAT = !!PAT;

  let appAuthenticated = false;
  let installationId: number | null = null;

  if (hasAppId && hasKey) {
    try {
      installationId = await getInstallationId();
      appAuthenticated = true;
    } catch (e: any) {
      console.warn('GitHub App auth check failed:', e.message);
    }
  }

  return {
    configured: hasAppId && (hasKey || hasPAT),
    appAuthenticated,
    installationId,
    owner: OWNER,
    appId: APP_ID || null,
    hasPATFallback: hasPAT
  };
}
