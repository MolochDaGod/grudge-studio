import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { isPuterAvailable, getPuter, type PuterUser } from '@/lib/puter';

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
const AUTH_TOKEN_KEY = 'grudge_auth_token';
const USERS_STORAGE_KEY = 'grudge_users_db';

const ADMIN_USERNAMES = ['admin', 'grudgewarlord', 'outapps', 'grudachain'];
const DEVELOPER_USERNAMES = ['dev', 'developer'];

function determineRole(username: string, isPuterUser: boolean): UserRole {
  const lower = username.toLowerCase();
  if (ADMIN_USERNAMES.includes(lower)) return 'admin';
  if (DEVELOPER_USERNAMES.includes(lower)) return 'developer';
  if (isPuterUser) return 'premium';
  return 'user';
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

interface StoredUser {
  id: string;
  username: string;
  passwordHash: string;
  role: UserRole;
  createdAt: string;
  lastLogin: string;
}

async function getStoredUsers(): Promise<StoredUser[]> {
  if (isPuterAvailable()) {
    try {
      const puter = getPuter();
      const usersStr = await puter.kv.get(USERS_STORAGE_KEY) as string | null;
      return usersStr ? JSON.parse(usersStr) : [];
    } catch {
      return [];
    }
  }
  const stored = localStorage.getItem(USERS_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

async function saveStoredUsers(users: StoredUser[]): Promise<void> {
  if (isPuterAvailable()) {
    try {
      const puter = getPuter();
      await puter.kv.set(USERS_STORAGE_KEY, JSON.stringify(users));
    } catch (error) {
      console.error('Failed to save users to Puter:', error);
    }
  }
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(() => localStorage.getItem(AUTH_TOKEN_KEY));
  const [isLoading, setIsLoading] = useState(true);
  const puterAvailable = isPuterAvailable();

  const saveToken = (token: string | null) => {
    if (token) {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }
    setAuthToken(token);
  };

  const getAuthHeaders = (): HeadersInit => {
    if (authToken) {
      return { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' };
    }
    return { 'Content-Type': 'application/json' };
  };

  const verifySsoTokenWithBackend = async (token: string): Promise<{ valid: boolean; user?: { id: string; username: string; role: UserRole } }> => {
    try {
      const response = await fetch('/api/auth/sso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      
      const data = await response.json();
      
      if (data.success && data.user) {
        localStorage.setItem('grudge_sso_session_id', data.sessionId);
        return { valid: true, user: { ...data.user, role: data.user.role as UserRole } };
      }
      return { valid: false };
    } catch (error) {
      console.error('[Auth] Backend SSO verification failed:', error);
      return { valid: false };
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const params = new URLSearchParams(window.location.search);
      const ssoToken = params.get('sso_token');
      
      if (ssoToken) {
        const url = new URL(window.location.href);
        url.searchParams.delete('sso_token');
        window.history.replaceState({}, '', url.toString());
        
        const verification = await verifySsoTokenWithBackend(ssoToken);
        
        if (verification.valid && verification.user) {
          const authUser: AuthUser = {
            id: verification.user.id,
            username: verification.user.username,
            displayName: verification.user.username,
            role: verification.user.role,
            isPuterUser: true,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
          };
          
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
          setUser(authUser);
          console.log('[Auth] HMAC-verified SSO login:', verification.user.username);
          setIsLoading(false);
          return;
        } else {
          console.warn('[Auth] SSO token verification failed');
        }
      }
      
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as AuthUser;
          setUser(parsed);
          setIsLoading(false);
          return;
        } catch {
          localStorage.removeItem(AUTH_STORAGE_KEY);
        }
      }

      if (puterAvailable) {
        try {
          const puter = getPuter();
          if (puter.auth.isSignedIn()) {
            const puterUser: PuterUser = await puter.auth.getUser();
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
            
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
            setUser(authUser);
            console.log('[Auth] Auto-login via Puter:', puterUser.username);
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
      return true;
    } catch (error) {
      console.error('Puter sign-in failed:', error);
      return false;
    }
  };

  const signInWithCredentials = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        const users = await getStoredUsers();
        const storedUser = users.find(u => u.username.toLowerCase() === username.toLowerCase());
        
        if (!storedUser) {
          return { success: false, error: 'Account not found' };
        }
        
        if (storedUser.passwordHash !== simpleHash(password)) {
          return { success: false, error: 'Incorrect password' };
        }
        
        storedUser.lastLogin = new Date().toISOString();
        await saveStoredUsers(users);
        
        const authUser: AuthUser = {
          id: storedUser.id,
          username: storedUser.username,
          role: storedUser.role,
          isPuterUser: false,
          createdAt: storedUser.createdAt,
          lastLogin: storedUser.lastLogin,
        };
        
        saveUser(authUser);
        return { success: true };
      }
      
      const authUser: AuthUser = {
        id: data.user.id,
        username: data.user.username,
        displayName: data.user.displayName,
        role: determineRole(data.user.username, false),
        isPuterUser: false,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      };
      
      if (data.token) {
        saveToken(data.token);
      }
      saveUser(authUser);
      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, error: 'Login failed' };
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
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        const authUser: AuthUser = {
          id: data.user.id,
          username: data.user.username,
          displayName: data.user.displayName,
          role: determineRole(data.user.username, false),
          isPuterUser: false,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
        };
        
        if (data.token) {
          saveToken(data.token);
        }
        saveUser(authUser);
        return { success: true };
      }
      
      const users = await getStoredUsers();
      if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
        return { success: false, error: 'Username already exists' };
      }
      
      const newUser: StoredUser = {
        id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        username: username.trim(),
        passwordHash: simpleHash(password),
        role: determineRole(username, false),
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      };
      
      users.push(newUser);
      await saveStoredUsers(users);
      
      const authUser: AuthUser = {
        id: newUser.id,
        username: newUser.username,
        role: newUser.role,
        isPuterUser: false,
        createdAt: newUser.createdAt,
        lastLogin: newUser.lastLogin,
      };
      
      saveUser(authUser);
      return { success: true };
    } catch (error) {
      console.error('Registration failed:', error);
      return { success: false, error: 'Registration failed' };
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
    saveToken(null);
    setUser(null);
  };

  const continueAsGuest = () => {
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
