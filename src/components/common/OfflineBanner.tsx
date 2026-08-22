import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw, Database, CheckCircle2, AlertCircle } from 'lucide-react';
import { storageService } from '../../lib/storageService';
import { getFullApiUrl } from '../../lib/api';

interface OfflineBannerProps {
  onRefreshData?: () => void;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({ onRefreshData }) => {
  const [isOnline, setIsOnline] = useState<boolean>(storageService.isOnline());
  const [isSimulated, setIsSimulated] = useState<boolean>(storageService.isSimulatedOffline());
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [cacheMetrics, setCacheMetrics] = useState(storageService.getCacheMetrics());

  useEffect(() => {
    const unsubscribe = storageService.subscribeToNetworkStatus((status) => {
      setIsOnline(status);
      setIsSimulated(storageService.isSimulatedOffline());
      setCacheMetrics(storageService.getCacheMetrics());
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleCheckConnection = async () => {
    setIsChecking(true);
    try {
      if (isSimulated) {
        storageService.setSimulatedOffline(false);
      }
      const res = await fetch(getFullApiUrl('/api/settings'), { method: 'GET', cache: 'no-store' });
      if (res.ok) {
        setIsOnline(true);
        if (onRefreshData) onRefreshData();
      }
    } catch {
      // Still offline
    } finally {
      setIsChecking(false);
      setCacheMetrics(storageService.getCacheMetrics());
    }
  };

  const handleToggleSimulation = () => {
    const nextState = !isSimulated;
    storageService.setSimulatedOffline(nextState);
    setIsSimulated(nextState);
    setIsOnline(!nextState && navigator.onLine);
    setCacheMetrics(storageService.getCacheMetrics());
  };

  // If online, don't show the main warning banner (we'll render a subtle test pill if needed)
  if (isOnline) {
    return null;
  }

  const lastUpdatedStr = cacheMetrics.lastUpdated
    ? storageService.formatTimeAgo(cacheMetrics.lastUpdated)
    : 'recently';

  return (
    <div
      id="offline-status-banner"
      role="alert"
      className="bg-[#13284A] border-b border-amber-400/30 text-white px-4 py-2.5 shadow-md relative z-40 transition-all animate-fade-in"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-4 text-xs">
        {/* Status Text */}
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300 shrink-0 border border-amber-400/30 flex items-center justify-center">
            <WifiOff className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-amber-300 uppercase tracking-wider text-[11px]">
                You are offline
              </span>
              <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded font-mono text-slate-300">
                Local Storage Mode
              </span>
              {isSimulated && (
                <span className="text-[9px] bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-400/40">
                  Simulated
                </span>
              )}
            </div>
            <p className="text-slate-300 text-[11px] mt-0.5">
              Viewing cached academic records, dashboard & timetable schedules (cached {lastUpdatedStr} • {cacheMetrics.totalEntries} cached stores).
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <button
            onClick={handleCheckConnection}
            disabled={isChecking}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold transition-colors flex items-center gap-1.5 text-[11px] disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
            <span>{isChecking ? 'Checking...' : 'Check Connection'}</span>
          </button>

          {isSimulated ? (
            <button
              onClick={handleToggleSimulation}
              className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-400/30 hover:bg-amber-500/30 font-semibold transition-colors text-[11px]"
            >
              Disable Offline Sim
            </button>
          ) : (
            <button
              onClick={handleToggleSimulation}
              title="Test offline local caching behavior"
              className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 font-medium text-[10px]"
            >
              Test Offline
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
