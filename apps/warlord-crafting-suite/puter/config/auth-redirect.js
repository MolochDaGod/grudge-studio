const GRUDGE_AUTH = {
  AUTH_URL: 'https://grudge-auth-73v97.puter.site',
  SESSION_PREFIX: 'grudge_session_',
  
  redirectToLogin(returnUrl) {
    const url = new URL(this.AUTH_URL);
    url.searchParams.set('returnUrl', returnUrl || window.location.href);
    window.location.href = url.toString();
  },
  
  redirectToLogout(sessionCode, returnUrl) {
    const url = new URL(this.AUTH_URL);
    url.pathname = '/logout';
    if (sessionCode) url.searchParams.set('code', sessionCode);
    if (returnUrl) url.searchParams.set('returnUrl', returnUrl);
    window.location.href = url.toString();
  },
  
  getAuthParams() {
    const params = new URLSearchParams(window.location.search);
    return {
      authCode: params.get('auth_code'),
      role: params.get('role'),
      username: params.get('username')
    };
  },
  
  hasAuthCode() {
    return new URLSearchParams(window.location.search).has('auth_code');
  },
  
  async verifySession(code) {
    try {
      const data = await puter.kv.get(this.SESSION_PREFIX + code);
      if (!data) return null;
      const session = JSON.parse(data);
      if (session.expiresAt < Date.now()) return null;
      return session;
    } catch (e) {
      return null;
    }
  },
  
  clearAuthParams() {
    const url = new URL(window.location.href);
    url.searchParams.delete('auth_code');
    url.searchParams.delete('role');
    url.searchParams.delete('username');
    window.history.replaceState({}, '', url.toString());
  }
};

window.GRUDGE_AUTH = GRUDGE_AUTH;
