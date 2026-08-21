/**
 * Local Storage Service for Offline Caching & Academic Data Persistence
 * 
 * Caches student/teacher/admin dashboards, timetable schedules, attendance, 
 * coursework, and circulars to allow seamless offline access when the network is unavailable.
 */

export interface CacheMetadata<T> {
  data: T;
  cachedAt: number; // Timestamp (ms)
  key: string;
  version: string;
}

const CACHE_PREFIX = 'cah_offline_cache_v1_';
const SIMULATED_OFFLINE_KEY = 'cah_simulated_offline';
const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days default persistence for offline viewing

class LocalStorageService {
  private networkListeners: Set<(isOnline: boolean) => void> = new Set();
  private simulatedOffline: boolean = false;

  constructor() {
    // Read persisted simulated offline flag if present
    if (typeof window !== 'undefined') {
      this.simulatedOffline = localStorage.getItem(SIMULATED_OFFLINE_KEY) === 'true';

      window.addEventListener('online', this.handleOnlineStateChange);
      window.addEventListener('offline', this.handleOnlineStateChange);
    }
  }

  private handleOnlineStateChange = () => {
    const status = this.isOnline();
    this.networkListeners.forEach((listener) => listener(status));
  };

  /**
   * Check if the application currently has active network connectivity
   */
  public isOnline(): boolean {
    if (typeof navigator === 'undefined') return true;
    if (this.simulatedOffline) return false;
    return navigator.onLine;
  }

  /**
   * Toggle simulated offline mode for testing/demo purposes
   */
  public setSimulatedOffline(offline: boolean) {
    this.simulatedOffline = offline;
    if (typeof localStorage !== 'undefined') {
      if (offline) {
        localStorage.setItem(SIMULATED_OFFLINE_KEY, 'true');
      } else {
        localStorage.removeItem(SIMULATED_OFFLINE_KEY);
      }
    }
    this.handleOnlineStateChange();
  }

  public isSimulatedOffline(): boolean {
    return this.simulatedOffline;
  }

  /**
   * Subscribe to network connectivity changes
   */
  public subscribeToNetworkStatus(callback: (isOnline: boolean) => void): () => void {
    this.networkListeners.add(callback);
    // Initial emission
    callback(this.isOnline());
    return () => {
      this.networkListeners.delete(callback);
    };
  }

  /**
   * Save any arbitrary data payload to local storage with timestamp metadata
   */
  public save<T>(key: string, data: T): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const fullKey = `${CACHE_PREFIX}${key}`;
      const payload: CacheMetadata<T> = {
        data,
        cachedAt: Date.now(),
        key,
        version: '1.0',
      };
      localStorage.setItem(fullKey, JSON.stringify(payload));
    } catch (e) {
      console.warn('[LocalStorageService] Failed to cache data into localStorage:', e);
    }
  }

  /**
   * Retrieve cached data with timestamp metadata
   */
  public get<T>(key: string, maxAgeMs: number = DEFAULT_TTL_MS): { data: T; cachedAt: number; isStale: boolean } | null {
    if (typeof localStorage === 'undefined') return null;
    try {
      const fullKey = `${CACHE_PREFIX}${key}`;
      const itemStr = localStorage.getItem(fullKey);
      if (!itemStr) return null;

      const parsed: CacheMetadata<T> = JSON.parse(itemStr);
      const age = Date.now() - (parsed.cachedAt || 0);
      const isStale = age > maxAgeMs;

      return {
        data: parsed.data,
        cachedAt: parsed.cachedAt,
        isStale,
      };
    } catch (e) {
      console.warn('[LocalStorageService] Failed to read from localStorage cache:', e);
      return null;
    }
  }

  /**
   * Remove a specific cache item
   */
  public remove(key: string): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(`${CACHE_PREFIX}${key}`);
  }

  /**
   * Clear all offline cached data
   */
  public clearAll(): void {
    if (typeof localStorage === 'undefined') return;
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(CACHE_PREFIX)) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  }

  /**
   * Inspect cache metrics (for settings or status UI)
   */
  public getCacheMetrics(): { totalEntries: number; lastUpdated: number | null; approximateSizeBytes: number } {
    if (typeof localStorage === 'undefined') {
      return { totalEntries: 0, lastUpdated: null, approximateSizeBytes: 0 };
    }

    let totalEntries = 0;
    let latestTimestamp: number | null = null;
    let sizeBytes = 0;

    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(CACHE_PREFIX)) {
        totalEntries++;
        const val = localStorage.getItem(k) || '';
        sizeBytes += k.length + val.length;
        try {
          const parsed = JSON.parse(val);
          if (parsed.cachedAt && (!latestTimestamp || parsed.cachedAt > latestTimestamp)) {
            latestTimestamp = parsed.cachedAt;
          }
        } catch {}
      }
    }

    return {
      totalEntries,
      lastUpdated: latestTimestamp,
      approximateSizeBytes: sizeBytes * 2, // UTF-16 approximation
    };
  }

  /**
   * Format human-friendly time elapsed since cache
   */
  public formatTimeAgo(timestamp: number): string {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }
}

export const storageService = new LocalStorageService();
