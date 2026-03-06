export type PlatformType = 'mobile' | 'tablet' | 'desktop' | 'unknown';
export type OSType = 'ios' | 'android' | 'windows' | 'macos' | 'linux' | 'unknown';
export type DeploymentMode = 'puter' | 'replit' | 'standalone' | 'local';

export interface PlatformInfo {
  platform: PlatformType;
  os: OSType;
  deployment: DeploymentMode;
  isTouchDevice: boolean;
  isOnline: boolean;
  screenWidth: number;
  screenHeight: number;
  pixelRatio: number;
  isPWA: boolean;
  appVersion: string;
}

const APP_VERSION = '2.1.0';
const APP_ID = 'GRUDACHAIN_WARLORDS';
const PUTER_APP_ID = 'app-9e2484c4-7f72-4e31-a7df-341564f3d512';

export function detectPlatform(): PlatformType {
  if (typeof window === 'undefined') return 'unknown';
  
  const ua = navigator.userAgent.toLowerCase();
  const width = window.innerWidth;
  
  const isMobileUA = /android|webos|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua);
  const isTabletUA = /ipad|tablet|playbook|silk/i.test(ua) || (ua.includes('android') && !ua.includes('mobile'));
  
  if (isMobileUA && width < 768) return 'mobile';
  if (isTabletUA || (width >= 768 && width < 1024)) return 'tablet';
  if (width >= 1024) return 'desktop';
  
  return 'unknown';
}

export function detectOS(): OSType {
  if (typeof window === 'undefined') return 'unknown';
  
  const ua = navigator.userAgent.toLowerCase();
  const platform = navigator.platform?.toLowerCase() || '';
  
  if (/iphone|ipad|ipod/.test(ua) || platform.includes('mac') && 'ontouchend' in document) {
    return 'ios';
  }
  if (/android/.test(ua)) return 'android';
  if (/win/.test(platform) || /windows/.test(ua)) return 'windows';
  if (/mac/.test(platform)) return 'macos';
  if (/linux/.test(platform) || /linux/.test(ua)) return 'linux';
  
  return 'unknown';
}

export function detectDeployment(): DeploymentMode {
  if (typeof window === 'undefined') return 'local';
  
  if (typeof window.puter !== 'undefined') return 'puter';
  
  const hostname = window.location.hostname;
  if (hostname.includes('replit') || hostname.includes('.repl.co')) return 'replit';
  if (hostname === 'localhost' || hostname === '127.0.0.1') return 'local';
  
  return 'standalone';
}

export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

export function isPWAMode(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as unknown as { standalone?: boolean }).standalone === true;
}

export function getPlatformInfo(): PlatformInfo {
  return {
    platform: detectPlatform(),
    os: detectOS(),
    deployment: detectDeployment(),
    isTouchDevice: isTouchDevice(),
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    screenWidth: typeof window !== 'undefined' ? window.innerWidth : 0,
    screenHeight: typeof window !== 'undefined' ? window.innerHeight : 0,
    pixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio : 1,
    isPWA: isPWAMode(),
    appVersion: APP_VERSION,
  };
}

export function getAppId(): string {
  return APP_ID;
}

export function getAppVersion(): string {
  return APP_VERSION;
}

export function getOptimizedSettings(info: PlatformInfo): {
  animationsEnabled: boolean;
  particleEffects: boolean;
  highQualityGraphics: boolean;
  touchOptimized: boolean;
  compactUI: boolean;
} {
  const isLowEnd = info.pixelRatio < 2 && info.screenWidth < 400;
  const isMobile = info.platform === 'mobile';
  
  return {
    animationsEnabled: !isLowEnd,
    particleEffects: !isLowEnd && info.platform === 'desktop',
    highQualityGraphics: info.platform === 'desktop' && info.pixelRatio >= 2,
    touchOptimized: info.isTouchDevice || isMobile,
    compactUI: isMobile || info.screenWidth < 640,
  };
}

export function getPuterAppConfig() {
  return {
    appId: APP_ID,
    puterAppId: PUTER_APP_ID,
    appName: 'GRUDGE Warlords',
    version: APP_VERSION,
    description: 'Crafting & Progression System for GRUDACHAIN',
    author: 'GRUDGE Studio',
    permissions: ['kv', 'ai', 'auth'],
    theme: 'dark',
    icon: '/favicon.png',
  };
}

export function getPuterAppId(): string {
  return PUTER_APP_ID;
}

let cachedPlatformInfo: PlatformInfo | null = null;

export function usePlatformInfo(): PlatformInfo {
  if (!cachedPlatformInfo) {
    cachedPlatformInfo = getPlatformInfo();
    
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', () => {
        cachedPlatformInfo = getPlatformInfo();
      });
      window.addEventListener('online', () => {
        if (cachedPlatformInfo) cachedPlatformInfo.isOnline = true;
      });
      window.addEventListener('offline', () => {
        if (cachedPlatformInfo) cachedPlatformInfo.isOnline = false;
      });
    }
  }
  return cachedPlatformInfo;
}
