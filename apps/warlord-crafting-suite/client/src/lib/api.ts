/**
 * GRUDGE Warlords API Client
 * 
 * Smart routing between:
 * - Express Backend (PostgreSQL) - Game data, characters, inventory
 * - Puter Worker (Puter KV) - AI features, sessions, sprites
 */

// Environment detection
const isPuterEnvironment = typeof window !== 'undefined' && window.location.hostname.includes('puter');

// API Configuration
export const API_CONFIG = {
  // Express Backend (PostgreSQL, game logic)
  EXPRESS_URL: import.meta.env.VITE_BACKEND_URL || 'https://api.grudge-studio.com',
  
  // Puter Worker (AI, sessions, sprites)
  PUTER_WORKER_URL: import.meta.env.VITE_PUTER_WORKER_URL || 'https://grudge-server.puter.site',
  
  // Environment info
  IS_PUTER: isPuterEnvironment,
};

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface HealthResponse {
  status: string;
  app: string;
  version: string;
  timestamp: string;
  services?: {
    database?: string;
    kv?: string;
    ai?: string;
  };
}

export interface AdminStats {
  totalUsers: number;
  totalCharacters: number;
  onlinePlayers: number;
  newPlayersToday: number;
  totalSessions: number;
  activeJobs: number;
}

export interface UserStats {
  id: string;
  username: string;
  role: string;
  createdAt: number;
  lastLogin?: number;
  characterCount?: number;
  isPuterUser?: boolean;
}

/**
 * Determine which backend to use for an endpoint
 */
function getBackendUrl(endpoint: string): string {
  // Puter Worker endpoints
  const puterEndpoints = [
    '/api/ai/',
    '/api/sprites/',
    '/api/npc/chat',
    '/api/jobs/',
    '/api/admin/users', // Puter KV users
  ];
  
  const isPuterEndpoint = puterEndpoints.some(prefix => endpoint.startsWith(prefix));
  
  return isPuterEndpoint ? API_CONFIG.PUTER_WORKER_URL : API_CONFIG.EXPRESS_URL;
}

/**
 * Make an API request with smart routing
 */
export async function apiCall<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const baseUrl = getBackendUrl(endpoint);
  const url = `${baseUrl}${endpoint}`;
  
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  // Add auth token if available
  const authToken = localStorage.getItem('authToken');
  if (authToken) {
    defaultHeaders['Authorization'] = `Bearer ${authToken}`;
  }
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    credentials: 'include',
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error (${response.status}): ${error}`);
  }
  
  return response.json();
}

/**
 * Health check for both backends
 */
export async function checkHealth(): Promise<{
  express: HealthResponse;
  puter: HealthResponse;
}> {
  const [express, puter] = await Promise.all([
    fetch(`${API_CONFIG.EXPRESS_URL}/api/health`).then(r => r.json()),
    fetch(`${API_CONFIG.PUTER_WORKER_URL}/api/health`).then(r => r.json()),
  ]);
  
  return { express, puter };
}

/**
 * Get admin statistics from both backends
 */
export async function getAdminStats(): Promise<AdminStats> {
  try {
    // Get data from both backends
    const [expressHealth, puterUsers, expressChars] = await Promise.all([
      apiCall<HealthResponse>('/api/health'),
      apiCall<{ success: boolean; users: UserStats[] }>('/api/admin/users'),
      apiCall<any[]>('/api/characters?userId=all').catch(() => []), // May not be implemented
    ]);
    
    // Calculate stats
    const totalUsers = puterUsers.users?.length || 0;
    const totalCharacters = expressChars?.length || 0;
    
    // Get new players today (last 24 hours)
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    const newPlayersToday = puterUsers.users?.filter(
      u => u.createdAt && u.createdAt > oneDayAgo
    ).length || 0;
    
    // Get online players (last 5 minutes)
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    const onlinePlayers = puterUsers.users?.filter(
      u => u.lastLogin && u.lastLogin > fiveMinutesAgo
    ).length || 0;
    
    return {
      totalUsers,
      totalCharacters,
      onlinePlayers,
      newPlayersToday,
      totalSessions: 0, // TODO: Add session tracking
      activeJobs: 0, // TODO: Add job tracking
    };
  } catch (error) {
    console.error('Failed to get admin stats:', error);
    return {
      totalUsers: 0,
      totalCharacters: 0,
      onlinePlayers: 0,
      newPlayersToday: 0,
      totalSessions: 0,
      activeJobs: 0,
    };
  }
}

/**
 * Get all users from Puter KV
 */
export async function getUsers(): Promise<UserStats[]> {
  const response = await apiCall<{ success: boolean; users: UserStats[] }>('/api/admin/users');
  return response.users || [];
}

/**
 * Get all characters from Express backend
 */
export async function getAllCharacters(): Promise<any[]> {
  try {
    // This endpoint may need to be added to Express backend
    return await apiCall('/api/admin/characters');
  } catch {
    return [];
  }
}

/**
 * Get online players (from Puter KV sessions)
 */
export async function getOnlinePlayers(): Promise<any[]> {
  try {
    // This endpoint needs to be added to Puter Worker
    return await apiCall('/api/admin/online');
  } catch {
    return [];
  }
}

/**
 * Get recent activity logs
 */
export async function getRecentActivity(limit = 50): Promise<any[]> {
  try {
    const response = await apiCall(`/api/sync/activity?limit=${limit}`);
    return response.logs || response || [];
  } catch {
    return [];
  }
}

/**
 * Get KV storage stats (Puter Worker)
 */
export async function getKVStats(): Promise<{
  totalKeys: number;
  sessions: number;
  users: number;
  characters: number;
  jobs: number;
}> {
  try {
    return await apiCall('/api/admin/kv-stats');
  } catch {
    return {
      totalKeys: 0,
      sessions: 0,
      users: 0,
      characters: 0,
      jobs: 0,
    };
  }
}

/**
 * Get database stats (Express backend)
 */
export async function getDBStats(): Promise<{
  users: number;
  characters: number;
  inventory: number;
  craftedItems: number;
}> {
  try {
    return await apiCall('/api/admin/db-stats');
  } catch {
    return {
      users: 0,
      characters: 0,
      inventory: 0,
      craftedItems: 0,
    };
  }
}

export default {
  call: apiCall,
  checkHealth,
  getAdminStats,
  getUsers,
  getAllCharacters,
  getOnlinePlayers,
  getRecentActivity,
  getKVStats,
  getDBStats,
  config: API_CONFIG,
};

