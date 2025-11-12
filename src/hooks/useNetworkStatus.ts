import { useState, useEffect } from 'react';
import { Platform } from 'react-native';

export function useNetworkStatus() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web') {
      // Web: Use navigator.onLine API
      const updateOnlineStatus = () => {
        if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
          setIsOffline(!navigator.onLine);
        }
      };

      // Set initial state
      updateOnlineStatus();

      // Listen for online/offline events
      if (typeof window !== 'undefined') {
        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);

        return () => {
          window.removeEventListener('online', updateOnlineStatus);
          window.removeEventListener('offline', updateOnlineStatus);
        };
      }
    } else {
      // Mobile: Try to use NetInfo if available, otherwise check with a fetch
      let mounted = true;
      
      const checkConnection = async () => {
        try {
          // Try to import NetInfo dynamically
          const NetInfo = require('@react-native-community/netinfo');
          const state = await NetInfo.fetch();
          if (mounted) {
            setIsOffline(!state.isConnected || state.isInternetReachable === false);
          }
          
          const unsubscribe = NetInfo.addEventListener((state: any) => {
            if (mounted) {
              setIsOffline(!state.isConnected || state.isInternetReachable === false);
            }
          });
          
          return () => {
            mounted = false;
            unsubscribe();
          };
        } catch (e) {
          // Fallback: check with a simple fetch
          const checkWithFetch = async () => {
            try {
              const response = await fetch('https://www.google.com/favicon.ico', {
                method: 'HEAD',
                mode: 'no-cors',
                cache: 'no-cache',
              });
              if (mounted) setIsOffline(false);
            } catch {
              if (mounted) setIsOffline(true);
            }
          };
          
          checkWithFetch();
          const interval = setInterval(checkWithFetch, 5000);
          
          return () => {
            mounted = false;
            clearInterval(interval);
          };
        }
      };
      
      const cleanup = checkConnection();
      return () => {
        mounted = false;
        if (cleanup && typeof cleanup.then === 'function') {
          cleanup.then((fn: any) => fn && fn());
        }
      };
    }
  }, []);

  return {
    isConnected: !isOffline,
    isOffline,
    isLoading: false,
  };
}

