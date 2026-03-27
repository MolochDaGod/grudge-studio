/** grudge-auth.js — Grudge Auth Integration: https://id.grudge-studio.com */
export const GRUDGE_GATEWAY_URL = 'https://id.grudge-studio.com';
export const GRUDGE_API_URL = 'https://api.grudge-studio.com';
export function getGrudgeToken() { return localStorage.getItem('grudge_auth_token') || null; }
export function getGrudgeUser() {
  const t = getGrudgeToken();
  if (!t) return null;
  try {
    const stored = localStorage.getItem('grudge_user');
    if (stored) return JSON.parse(stored);
  } catch {}
  return { token: t, userId: localStorage.getItem('grudge_user_id') || null, grudgeId: localStorage.getItem('grudge_id') || null, username: localStorage.getItem('grudge_username') || 'Player' };
}
export function isGrudgeAuthenticated() { return !!getGrudgeToken(); }
export function redirectToGrudgeLogin(returnUrl) {
  window.location.href = `${GRUDGE_GATEWAY_URL}/auth/sso-check?return=${encodeURIComponent(returnUrl || window.location.href)}`;
}
// Legacy alias kept for backward compat
export const redirectToGrudgeGateway = redirectToGrudgeLogin;
export function requireGrudgeAuth(r) { if (!isGrudgeAuthenticated()) redirectToGrudgeLogin(r); }
export function grudgeSignOut() {
  ['grudge_auth_token','grudge_user','grudge_user_id','grudge_id','grudge_username','grudge_session_token','grudge-session'].forEach(k => localStorage.removeItem(k));
}
export function grudgeAuthHeaders() {
  const t = getGrudgeToken();
  return t ? { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}