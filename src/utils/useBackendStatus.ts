import { useState, useEffect } from 'react';
import {
  BackendHealthInfo,
  getBackendStatus,
  subscribeBackendStatus,
  checkBackendHealth,
  clearCache,
} from '../services/apiCache';

export const useBackendStatus = () => {
  const [status, setStatus] = useState<BackendHealthInfo>(getBackendStatus());

  useEffect(() => {
    const unsubscribe = subscribeBackendStatus((newStatus) => {
      setStatus(newStatus);
    });
    return () => unsubscribe();
  }, []);

  const refresh = async () => {
    clearCache();
    return await checkBackendHealth(true);
  };

  return {
    ...status,
    refresh,
    isConnected: status.state === 'connected',
    isConnecting: status.state === 'connecting',
    isOffline: status.state === 'offline',
  };
};
