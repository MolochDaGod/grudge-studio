import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { isPuterAvailable, getPuter, type PuterUser } from '@/lib/puter';
import {
  authLogin, authRegister, authGuest, authPuter,
  setToken as setBackendToken, getToken as getBackendToken,
  loginWithDiscord as redirectDiscord,
  loginWithGoogle as redirectGoogle,
  loginWithGitHub as redirectGitHub,
  captureAuthCallback, getMyIdentity,
} from '@/lib/grudge-backend';

export type UserRole = 'admin' | 'developer' | 'ai_agent' | 'premium' | 'user' | 'guest';

export interface AuthUser {
  id: string;
  username: string;
  displayName?: string;
  email?: string;
  role: UserRole;
  puterUuid?: string;
  isPuterUser: boolean;
  createdAt: string;
  lastLogin: string;
}

interface AuthContextType {
  user: AuthUser | null;
  authToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isPuterAvailable: boolean;
  signInWithPuter: () => Promise<boolean>;
  signInWithCredentials: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signInWithDiscord: () => void;
  signInWithGoogle: () => void;
  signInWithGitHub: () => void;
  signOut: () => Promise<void>;
  continueAsGuest: () => void;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
  canAccessAdmin: boolean;
  canAccessDeveloper: boolean;
  canAccessPremium: boolean;
  getAuthHeaders: () => HeadersInit;
}

const AuthContext = createContext<AuthContextType | null>(null);

const AUTH_STORAGE_KEY = 'grudge_auth_user';

const ADMIN_USERNAMES = ['admin', 'grudgewarlord', 'outapps', 'grudachain'];
const DEVELOPER_USERNAMES = ['dev', 'developer'];

function determineRole(username: string, isPuterUser: boolean): UserRole {
  const lower = username.toLowerCase();
  if (ADMIN_USERNAMES.includes(lower)) return 'admin';
  if (DEVELOPER_USERNAMES.includes(lower)) return 'developer';
  if (isPuterUser) return 'premium';
  return 'user';
}

/** Map a VPS auth response to an AuthUser + save token */
function handleVpsAuthResponse(data: any, isPuter = false): AuthUser | null {
  if (!data?.token || !data?.user) return null;
  setBackendToken(data.token);
  const u = data.user;
  return {
    id: u.grudge_id || u.id || '',
    username: u.username || '',
    displayName: u.username,
    role: determineRole(u.username || '', isPuter),
    puterUuid: u.puter_id,
    isPuterUser: isPuter,
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(() => getBackendToken());
  const [isLoading, setIsLoading] = useState(true);
  const puterAvailable = isPuterAvailable();

  const getAuthHeaders = (): HeadersInit => {
    const token = getBackendToken();
    if (token) {
      return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
    }
    return { 'Content-Type': 'application/json' };
  };

  useEffect(() => {
    const initAuth = async () => {
      // Capture OAuth callback tokens from URL (?token=...&grudge_id=...&provider=...)
      const captured = captureAuthCallback();
      if (captured) {
        try {
          const identity = await getMyIdentity();
          const role = determineRole(identity.username || 'Player', false);
          const authUser: AuthUser = {
            id: captured.grudgeId || identity.grudge_id || '',
            username: identity.username || 'Player',
            displayName: identity.display_name || identity.username,
            role,
            isPuterUser: false,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
          };
          saveUser(authUser);
          setAuthToken(captured.token);
          setIsLoading(false);
          return;
        } catch {
          // Token might be invalid — fall through to normal init
        }
      }

      // Restore session from localStorage
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as AuthUser;
          setUser(parsed);
          setAuthToken(getBackendToken());
          setIsLoading(false);
          return;
        } catch {
          localStorage.removeItem(AUTH_STORAGE_KEY);
        }
      }

      // Auto-login via Puter if available
      if (puterAvailable) {
        try {
          const puter = getPuter();
          if (puter.auth.isSignedIn()) {
            const puterUser: PuterUser = await puter.auth.getUser();
            // Register/login with VPS using Puter identity
            try {
              const data = await authPuter(puterUser.uuid, puterUser.username);
              const authUser = handleVpsAuthResponse(data, true);
              if (authUser) {
                saveUser(authUser);
                setAuthToken(getBackendToken());
                console.log('[Auth] Auto-login via Puter → VPS:', puterUser.username);
                setIsLoading(false);
                return;
              }
            } catch {
              // VPS unavailable — fall back to local Puter identity
              const role = determineRole(puterUser.username, true);
              const authUser: AuthUser = {
                id: puterUser.uuid,
                username: puterUser.username,
                displayName: puterUser.username,
                role,
                puterUuid: puterUser.uuid,
                isPuterUser: true,
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
              };
              saveUser(authUser);
              console.log('[Auth] Puter local fallback:', puterUser.username);
            }
          }
        } catch (error) {
          console.error('[Auth] Puter auto-login check failed:', error);
        }
      }

      setIsLoading(false);
    };

    initAuth();
  }, [puterAvailable]);

  const saveUser = (authUser: AuthUser) => {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
    setUser(authUser);
  };

  const signInWithPuter = async (): Promise<boolean> => {
    if (!puterAvailable) return false;

    try {
      const puter = getPuter();
      if (!puter.auth.isSignedIn()) {
        await puter.auth.signIn();
      }

      const puterUser: PuterUser = await puter.auth.getUser();

      // Sync with VPS
      try {
        const data = await authPuter(puterUser.uuid, puterUser.username);
        const authUser = handleVpsAuthResponse(data, true);
        if (authUser) {
          saveUser(authUser);
          setAuthToken(getBackendToken());
          return true;
        }
      } catch {
        // VPS down — local fallback
        const role = determineRole(puterUser.username, true);
        saveUser({
          id: puterUser.uuid,
          username: puterUser.username,
          displayName: puterUser.username,
          role,
          puterUuid: puterUser.uuid,
          isPuterUser: true,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Puter sign-in failed:', error);
      return false;
    }
  };

  const signInWithCredentials = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const data = await authLogin(username, password);

      if (data.error) {
        return { success: false, error: data.error || 'Invalid credentials' };
      }

      const authUser = handleVpsAuthResponse(data);
      if (authUser) {
        saveUser(authUser);
        setAuthToken(getBackendToken());
        return { success: true };
      }

      return { success: false, error: 'Login failed' };
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, error: 'Unable to reach server' };
    }
  };

  const register = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (username.length < 3 || username.length > 20) {
      return { success: false, error: 'Username must be 3-20 characters' };
    }
    if (password.length < 4) {
      return { success: false, error: 'Password must be at least 4 characters' };
    }

    try {
      const data = await authRegister(username, password);

      if (data.error) {
        return { success: false, error: data.error };
      }

      const authUser = handleVpsAuthResponse(data);
      if (authUser) {
        saveUser(authUser);
        setAuthToken(getBackendToken());
        return { success: true };
      }

      return { success: false, error: 'Registration failed' };
    } catch (error) {
      console.error('Registration failed:', error);
      return { success: false, error: 'Unable to reach server' };
    }
  };

  const signOut = async () => {
    if (user?.isPuterUser && puterAvailable) {
      try {
        const puter = getPuter();
        await puter.auth.signOut();
      } catch (error) {
        console.error('Puter sign-out failed:', error);
      }
    }

    localStorage.removeItem(AUTH_STORAGE_KEY);
    setBackendToken(null);
    setAuthToken(null);
    setUser(null);
  };

  // ── OAuth redirect flows (browser redirect to Grudge backend) ────────
  const signInWithDiscord = () => redirectDiscord();
  const signInWithGoogle = () => redirectGoogle();
  const signInWithGitHub = () => redirectGitHub();

  const continueAsGuest = async () => {
    // Try VPS guest endpoint first
    try {
      const data = await authGuest();
      const authUser = handleVpsAuthResponse(data);
      if (authUser) {
        authUser.role = 'guest';
        saveUser(authUser);
        setAuthToken(getBackendToken());
        return;
      }
    } catch {
      // VPS unavailable
    }

    // Local fallback
    const guestUser: AuthUser = {
      id: `guest_${Date.now()}`,
      username: 'Guest',
      role: 'guest',
      isPuterUser: false,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };
    saveUser(guestUser);
  };

  const hasRole = (roles: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    const roleArray = Array.isArray(roles) ? roles : [roles];
    if (user.role === 'admin') return true;
    return roleArray.includes(user.role);
  };

  const canAccessAdmin = hasRole('admin');
  const canAccessDeveloper = hasRole(['admin', 'developer']);
  const canAccessPremium = hasRole(['admin', 'developer', 'premium']);

  return (
    <AuthContext.Provider
      value={{
        user,
        authToken,
        isLoading,
        isAuthenticated: !!user,
        isPuterAvailable: puterAvailable,
        signInWithPuter,
        signInWithCredentials,
        register,
        signInWithDiscord,
        signInWithGoogle,
        signInWithGitHub,
        signOut,
        continueAsGuest,
        hasRole,
        canAccessAdmin,
        canAccessDeveloper,
        canAccessPremium,
        getAuthHeaders,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
