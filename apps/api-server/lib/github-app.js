/**
 * GitHub App Client for Grudge Studio
 * Handles JWT signing, installation token management, and repo operations
 * for the gruda-projects GitHub App (owner: @GrudgeDaDev)
 */

import { readFileSync } from 'fs';
import { createSign } from 'crypto';

const APP_ID = process.env.GITHUB_APP_ID;
const PRIVATE_KEY_PATH = process.env.GITHUB_PRIVATE_KEY_PATH;
const PAT = process.env.GRUDGEDADEV_GITHUB_TOKEN; // fallback PAT
const GITHUB_API = 'https://api.github.com';
const OWNER = 'GrudgeDaDev';

// --- Token Cache ---
let _installationToken = null;
let _installationTokenExpiry = 0;
let _privateKey = null;

/**
 * Load the PEM private key from disk (cached after first read)
 */
function getPrivateKey() {
  if (_privateKey) return _privateKey;
  if (!PRIVATE_KEY_PATH) {
    throw new Error('GITHUB_PRIVATE_KEY_PATH not set');
  }
  _privateKey = readFileSync(PRIVATE_KEY_PATH, 'utf8');
  return _privateKey;
}

/**
 * Create a JWT for GitHub App authentication
 * JWTs are valid for max 10 minutes
 */
function createAppJWT() {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iat: now - 60,        // issued at (60s in the past to handle clock drift)
    exp: now + (9 * 60),  // expires in 9 minutes
    iss: APP_ID
  };

  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');

  const sign = createSign('RSA-SHA256');
  sign.update(`${header}.${body}`);
  const signature = sign.sign(getPrivateKey(), 'base64url');

  return `${header}.${body}.${signature}`;
}

/**
 * Get the installation ID for the GrudgeDaDev org/user
 */
async function getInstallationId() {
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
  const install = installations.find(i =>
    i.account && (i.account.login === OWNER || i.account.login === 'MolochDaGod')
  );

  if (!install) {
    throw new Error(`No installation found for ${OWNER}`);
  }

  return install.id;
}

/**
 * Get an installation access token (cached, refreshes when expired)
 */
export async function getInstallationToken() {
  // Return cached token if still valid (with 5 min buffer)
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

  return _installationToken;
}

/**
 * Make an authenticated GitHub API request
 * Uses installation token if App is configured, falls back to PAT
 */
async function githubFetch(path, options = {}) {
  let token;
  try {
    token = await getInstallationToken();
  } catch (e) {
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

/**
 * List repos for the GrudgeDaDev account
 */
export async function listRepos(opts = {}) {
  const { page = 1, perPage = 30, sort = 'updated' } = opts;
  return githubFetch(`/users/${OWNER}/repos?page=${page}&per_page=${perPage}&sort=${sort}`);
}

/**
 * Get repo details
 */
export async function getRepo(name) {
  return githubFetch(`/repos/${OWNER}/${name}`);
}

/**
 * Get file/directory contents from a repo
 */
export async function getRepoContents(repo, path = '', ref = 'main') {
  return githubFetch(`/repos/${OWNER}/${repo}/contents/${path}?ref=${ref}`);
}

/**
 * List issues for a repo
 */
export async function listIssues(repo, opts = {}) {
  const { state = 'open', page = 1, perPage = 20 } = opts;
  return githubFetch(`/repos/${OWNER}/${repo}/issues?state=${state}&page=${page}&per_page=${perPage}`);
}

/**
 * Create an issue
 */
export async function createIssue(repo, title, body = '', labels = []) {
  return githubFetch(`/repos/${OWNER}/${repo}/issues`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, body, labels })
  });
}

/**
 * Trigger a GitHub Actions workflow dispatch
 */
export async function triggerWorkflow(repo, workflowId, ref = 'main', inputs = {}) {
  return githubFetch(`/repos/${OWNER}/${repo}/actions/workflows/${workflowId}/dispatches`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ref, inputs })
  });
}

/**
 * List recent workflow runs
 */
export async function listWorkflowRuns(repo, opts = {}) {
  const { page = 1, perPage = 10 } = opts;
  return githubFetch(`/repos/${OWNER}/${repo}/actions/runs?page=${page}&per_page=${perPage}`);
}

/**
 * Get App connection status
 */
export async function getStatus() {
  const hasAppId = !!APP_ID;
  const hasKey = !!PRIVATE_KEY_PATH;
  const hasPAT = !!PAT;

  let appAuthenticated = false;
  let installationId = null;

  if (hasAppId && hasKey) {
    try {
      installationId = await getInstallationId();
      appAuthenticated = true;
    } catch (e) {
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
