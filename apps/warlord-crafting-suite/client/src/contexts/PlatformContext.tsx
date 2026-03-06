import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  PlatformInfo, 
  getPlatformInfo, 
  getOptimizedSettings,
  getAppId,
  getAppVersion,
  getPuterAppConfig
} from '@/lib/platform';

interface PlatformContextType {
  platform: PlatformInfo;
  settings: ReturnType<typeof getOptimizedSettings>;
  appId: string;
  appVersion: string;
  puterConfig: ReturnType<typeof getPuterAppConfig>;
  refreshPlatform: () => void;
}

const PlatformContext = createContext<PlatformContextType | null>(null);

export function PlatformProvider({ children }: { children: ReactNode }) {
  const [platform, setPlatform] = useState<PlatformInfo>(getPlatformInfo);
  
  const refreshPlatform = () => {
    setPlatform(getPlatformInfo());
  };

  useEffect(() => {
    const handleResize = () => {
      setPlatform(getPlatformInfo());
    };

    const handleOnline = () => {
      setPlatform(prev => ({ ...prev, isOnline: true }));
    };

    const handleOffline = () => {
      setPlatform(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const value: PlatformContextType = {
    platform,
    settings: getOptimizedSettings(platform),
    appId: getAppId(),
    appVersion: getAppVersion(),
    puterConfig: getPuterAppConfig(),
    refreshPlatform,
  };

  return (
    <PlatformContext.Provider value={value}>
      {children}
    </PlatformContext.Provider>
  );
}

export function usePlatform() {
  const context = useContext(PlatformContext);
  if (!context) {
    throw new Error('usePlatform must be used within a PlatformProvider');
  }
  return context;
}

export function useIsMobile() {
  const { platform } = usePlatform();
  return platform.platform === 'mobile';
}

export function useIsTablet() {
  const { platform } = usePlatform();
  return platform.platform === 'tablet';
}

export function useIsDesktop() {
  const { platform } = usePlatform();
  return platform.platform === 'desktop';
}

export function useIsPuter() {
  const { platform } = usePlatform();
  return platform.deployment === 'puter';
}

export function useIsOnline() {
  const { platform } = usePlatform();
  return platform.isOnline;
}
