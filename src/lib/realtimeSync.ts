/**
 * Real-time Database Synchronization Engine for Web & Android App
 * 
 * Ensures continuous, bi-directional data synchronization between the Android App,
 * Web Portal, and Backend Database (Supabase PostgreSQL / Disk Store).
 */

import { api, getApiBaseUrl, getCustomServerUrl, isNativeMobileApp, setCustomServerUrl } from './api';
import { storageService } from './storageService';

export interface SyncStatus {
  isOnline: boolean;
  isConnected: boolean;
  isSyncing: boolean;
  lastSyncTimestamp: number | null;
  latencyMs: number | null;
  serverUrl: string;
  isCustomUrl: boolean;
  isNativeApp: boolean;
  error?: string;
  stats?: {
    studentsCount: number;
    teachersCount: number;
    attendanceCount: number;
    assignmentsCount: number;
    marksCount: number;
    noticesCount: number;
  };
}

export type SyncEventListener = (status: SyncStatus) => void;
export type DataUpdateListener = () => void;

class RealtimeSyncService {
  private syncListeners: Set<SyncEventListener> = new Set();
  private dataUpdateListeners: Set<DataUpdateListener> = new Set();
  private syncIntervalId: any = null;
  private isSyncing: boolean = false;
  private lastSyncTimestamp: number | null = Date.now();
  private lastKnownServerModified: number = 0;
  private lastLatencyMs: number | null = null;
  private lastError?: string = undefined;
  private lastStats?: any = undefined;

  constructor() {
    if (typeof window !== 'undefined') {
      // 1. Initial network & connectivity sync
      this.initListeners();

      // 2. Start periodic background polling (every 12 seconds when online)
      this.startPolling(12000);

      // 3. Trigger immediate initial sync
      setTimeout(() => {
        this.syncNow().catch(() => {});
      }, 800);
    }
  }

  private initListeners() {
    if (typeof window === 'undefined') return;

    // Sync on window focus / app resume
    window.addEventListener('focus', () => {
      this.checkAndSync();
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.checkAndSync();
      }
    });

    // Sync on network recovery
    window.addEventListener('online', () => {
      this.syncNow();
    });
  }

  public startPolling(intervalMs: number = 12000) {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
    }
    this.syncIntervalId = setInterval(() => {
      if (storageService.isOnline() && document.visibilityState !== 'hidden') {
        this.checkAndSync();
      }
    }, intervalMs);
  }

  public stopPolling() {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
      this.syncIntervalId = null;
    }
  }

  /**
   * Fast check if server data has changed, and if so, trigger full sync
   */
  public async checkAndSync(): Promise<boolean> {
    if (this.isSyncing || !storageService.isOnline()) return false;

    try {
      const startTime = performance.now();
      const statusRes = await api.getSyncStatus();
      this.lastLatencyMs = Math.round(performance.now() - startTime);

      if (statusRes && statusRes.lastModified) {
        this.lastStats = statusRes.stats;
        this.lastError = undefined;

        if (statusRes.lastModified > this.lastKnownServerModified) {
          this.lastKnownServerModified = statusRes.lastModified;
          await this.syncNow();
          return true;
        }
      }
      this.emitStatus();
      return false;
    } catch (err: any) {
      this.lastError = err.message || 'Sync check failed';
      this.emitStatus();
      return false;
    }
  }

  /**
   * Explicitly trigger a complete bidirectional synchronization
   */
  public async syncNow(): Promise<{
    success: boolean;
    actionTaken: string;
    latencyMs: number;
    lastModified: number;
    error?: string;
  }> {
    if (this.isSyncing) {
      return {
        success: true,
        actionTaken: 'in_progress',
        latencyMs: this.lastLatencyMs || 0,
        lastModified: this.lastSyncTimestamp || Date.now(),
      };
    }

    this.isSyncing = true;
    this.emitStatus();

    const startTime = performance.now();
    try {
      const syncResult = await api.syncDatabaseState();
      const latency = Math.round(performance.now() - startTime);

      this.lastLatencyMs = latency;
      this.lastSyncTimestamp = Date.now();
      this.lastError = undefined;
      this.lastKnownServerModified = syncResult.lastModified;

      // Invalidate local query caches so all views fetch fresh server data
      storageService.invalidateQueryCache();

      // Notify all data listeners that database has refreshed
      this.notifyDataUpdated();

      this.isSyncing = false;
      this.emitStatus();

      return {
        success: syncResult.success,
        actionTaken: syncResult.actionTaken,
        latencyMs: latency,
        lastModified: syncResult.lastModified,
      };
    } catch (err: any) {
      this.isSyncing = false;
      this.lastError = err.message || 'Synchronization failed';
      this.emitStatus();

      return {
        success: false,
        actionTaken: 'error',
        latencyMs: Math.round(performance.now() - startTime),
        lastModified: this.lastSyncTimestamp || Date.now(),
        error: err.message,
      };
    }
  }

  /**
   * Test connection to a specific backend server URL
   */
  public async testServerUrl(url: string): Promise<{
    success: boolean;
    latencyMs: number;
    statusText: string;
    stats?: any;
    error?: string;
  }> {
    const cleanUrl = url.trim().replace(/\/+$/, '');
    const startTime = performance.now();

    try {
      const healthUrl = `${cleanUrl}/api/health`;
      const res = await fetch(healthUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(8000),
      });

      const latencyMs = Math.round(performance.now() - startTime);

      if (!res.ok) {
        return {
          success: false,
          latencyMs,
          statusText: `HTTP ${res.status}: ${res.statusText}`,
          error: `Server responded with status ${res.status}`,
        };
      }

      // Try fetching sync status as well
      let stats = undefined;
      try {
        const syncRes = await fetch(`${cleanUrl}/api/db/sync-status`, {
          signal: AbortSignal.timeout(5000),
        });
        if (syncRes.ok) {
          const syncJson = await syncRes.json();
          stats = syncJson.stats;
        }
      } catch {}

      return {
        success: true,
        latencyMs,
        statusText: 'Connected & Responsive',
        stats,
      };
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - startTime);
      return {
        success: false,
        latencyMs,
        statusText: 'Connection Failed',
        error: err.message || 'Could not reach server. Verify URL and network.',
      };
    }
  }

  public getStatus(): SyncStatus {
    const isOnline = storageService.isOnline();
    return {
      isOnline,
      isConnected: isOnline && !this.lastError,
      isSyncing: this.isSyncing,
      lastSyncTimestamp: this.lastSyncTimestamp,
      latencyMs: this.lastLatencyMs,
      serverUrl: getApiBaseUrl(),
      isCustomUrl: Boolean(getCustomServerUrl()),
      isNativeApp: isNativeMobileApp(),
      error: this.lastError,
      stats: this.lastStats,
    };
  }

  public subscribeToSyncStatus(listener: SyncEventListener): () => void {
    this.syncListeners.add(listener);
    // Initial emit
    listener(this.getStatus());
    return () => {
      this.syncListeners.delete(listener);
    };
  }

  public subscribeToDataUpdates(listener: DataUpdateListener): () => void {
    this.dataUpdateListeners.add(listener);
    return () => {
      this.dataUpdateListeners.delete(listener);
    };
  }

  private emitStatus() {
    const status = this.getStatus();
    this.syncListeners.forEach((listener) => {
      try {
        listener(status);
      } catch (e) {
        console.warn('[RealtimeSync] Listener error:', e);
      }
    });
  }

  private notifyDataUpdated() {
    this.dataUpdateListeners.forEach((listener) => {
      try {
        listener();
      } catch (e) {
        console.warn('[RealtimeSync] Data update listener error:', e);
      }
    });
  }
}

export const realtimeSync = new RealtimeSyncService();
