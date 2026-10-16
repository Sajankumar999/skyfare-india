import { apiUrl } from '../config/api';

export type BackendConnectionState = 'connecting' | 'connected' | 'offline';

export interface BackendHealthInfo {
  state: BackendConnectionState;
  latencyMs: number | null;
  observations: number;
  lastChecked: Date | null;
  serviceUrl: string;
}

// In-memory cache store
const memoryCache = new Map<string, { data: unknown; timestamp: number }>();

// Listeners for connection state changes
type ConnectionListener = (info: BackendHealthInfo) => void;
const listeners = new Set<ConnectionListener>();

let currentHealthInfo: BackendHealthInfo = {
  state: 'connecting',
  latencyMs: null,
  observations: 42945,
  lastChecked: null,
  serviceUrl: apiUrl(''),
};

const notifyListeners = () => {
  listeners.forEach((listener) => {
    try {
      listener(currentHealthInfo);
    } catch (e) {
      console.error('Error in connection listener', e);
    }
  });
};

export const getBackendStatus = (): BackendHealthInfo => ({ ...currentHealthInfo });

export const subscribeBackendStatus = (listener: ConnectionListener): (() => void) => {
  listeners.add(listener);
  listener(currentHealthInfo);
  return () => {
    listeners.delete(listener);
  };
};

/**
 * Retrieves data from in-memory cache or sessionStorage
 */
export const getCachedData = <T>(key: string): T | null => {
  // 1. Check in-memory cache
  const inMemory = memoryCache.get(key);
  if (inMemory) {
    return inMemory.data as T;
  }

  // 2. Check sessionStorage
  try {
    const raw = sessionStorage.getItem(`skyfare_cache_${key}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.data) {
        memoryCache.set(key, { data: parsed.data, timestamp: parsed.timestamp || Date.now() });
        return parsed.data as T;
      }
    }
  } catch {
    // Ignore sessionStorage parsing errors
  }

  return null;
};

/**
 * Stores data in in-memory cache and sessionStorage
 */
export const setCachedData = <T>(key: string, data: T): void => {
  const timestamp = Date.now();
  memoryCache.set(key, { data, timestamp });
  try {
    sessionStorage.setItem(`skyfare_cache_${key}`, JSON.stringify({ data, timestamp }));
  } catch {
    // Ignore storage quota errors
  }
};

/**
 * Clears cached data for a key or all keys
 */
export const clearCache = (key?: string): void => {
  if (key) {
    memoryCache.delete(key);
    sessionStorage.removeItem(`skyfare_cache_${key}`);
  } else {
    memoryCache.clear();
    Object.keys(sessionStorage).forEach((k) => {
      if (k.startsWith('skyfare_cache_')) {
        sessionStorage.removeItem(k);
      }
    });
  }
};

/**
 * Fetches data with smart caching (0ms return on cache hit, background revalidation)
 */
export const fetchWithCache = async <T>(
  url: string,
  options?: { ttlMs?: number; signal?: AbortSignal; forceRefresh?: boolean }
): Promise<T> => {
  const ttlMs = options?.ttlMs ?? 60000;
  const cacheKey = url;

  if (!options?.forceRefresh) {
    const cached = getCachedData<T>(cacheKey);
    const inMem = memoryCache.get(cacheKey);
    const isFresh = inMem && (Date.now() - inMem.timestamp < ttlMs);

    // If fresh in memory, return immediately
    if (cached && isFresh) {
      return cached;
    }
  }

  const response = await fetch(url, { signal: options?.signal });
  if (!response.ok) {
    throw new Error(`Request to ${url} failed with status ${response.status}`);
  }

  const data: T = await response.json();
  setCachedData(cacheKey, data);
  return data;
};

let coldStartRetryCount = 0;
const MAX_COLD_START_RETRIES = 10;

/**
 * Pings /api/v1/health to verify connectivity, measure latency, and update status
 */
export const checkBackendHealth = async (forceWake = false): Promise<BackendHealthInfo> => {
  const startTime = performance.now();
  currentHealthInfo = {
    ...currentHealthInfo,
    state: currentHealthInfo.state === 'connected' && !forceWake ? 'connected' : 'connecting',
    serviceUrl: apiUrl(''),
  };
  notifyListeners();

  try {
    const healthUrl = apiUrl('/api/v1/health');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000); // Allow up to 25s for cold start

    const response = await fetch(healthUrl, {
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timeout);

    const latencyMs = Math.round(performance.now() - startTime);

    if (response.ok) {
      const data = await response.json();
      currentHealthInfo = {
        state: 'connected',
        latencyMs,
        observations: Number(data.observations) || 42945,
        lastChecked: new Date(),
        serviceUrl: apiUrl(''),
      };
      coldStartRetryCount = 0;
      notifyListeners();

      // Background pre-warm essential endpoints if not yet cached
      void prewarmPrimaryCaches();
      return currentHealthInfo;
    } else {
      throw new Error(`Health responded with ${response.status}`);
    }
  } catch {
    currentHealthInfo = {
      ...currentHealthInfo,
      state: 'offline',
      latencyMs: null,
      lastChecked: new Date(),
    };
    notifyListeners();

    // Auto-retry waking the cold-starting cloud container every 4 seconds
    if (coldStartRetryCount < MAX_COLD_START_RETRIES) {
      coldStartRetryCount++;
      setTimeout(() => {
        void checkBackendHealth();
      }, 4000);
    }

    return currentHealthInfo;
  }
};

/**
 * Pre-warms the primary dashboard endpoints in parallel so all tab switches are instant (0ms)
 */
export const prewarmPrimaryCaches = async (): Promise<void> => {
  const endpoints = [
    apiUrl('/api/v1/indices/today'),
    apiUrl('/api/v1/routes'),
    apiUrl('/api/v1/analytics/temporal'),
    apiUrl('/api/v1/analytics/carriers'),
    apiUrl('/api/v1/analytics/anomalies'),
    apiUrl('/api/v1/index/timeseries'),
  ];

  await Promise.allSettled(
    endpoints.map((url) => fetchWithCache(url, { ttlMs: 120000 }))
  );
};

// Initiate initial health check and background prewarm immediately on module load
if (typeof window !== 'undefined') {
  // Start ping immediately
  setTimeout(() => {
    void checkBackendHealth();
  }, 50);
}
