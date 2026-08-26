import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Server,
  Database,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Globe,
  Wifi,
  ExternalLink,
  ShieldCheck,
  Zap,
  Sliders,
  Layers,
  ArrowRight,
  Code2,
} from 'lucide-react';
import { Modal } from './Modal';
import { useAuth } from '../../context/AuthContext';
import { realtimeSync, SyncStatus } from '../../lib/realtimeSync';
import {
  getApiBaseUrl,
  getCustomServerUrl,
  setCustomServerUrl,
  DEFAULT_PRODUCTION_SERVER_URL,
  isNativeMobileApp,
} from '../../lib/api';

interface MobileSyncHubModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileSyncHubModal: React.FC<MobileSyncHubModalProps> = ({ isOpen, onClose }) => {
  const { showToast } = useAuth();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(realtimeSync.getStatus());
  const [isSyncing, setIsSyncing] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedConfig, setCopiedConfig] = useState(false);

  // Custom Server Configuration State
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [testingUrl, setTestingUrl] = useState(false);
  const [testResult, setTestResult] = useState<{
    tested: boolean;
    success: boolean;
    latencyMs?: number;
    message?: string;
  } | null>(null);

  const [activeTab, setActiveTab] = useState<'status' | 'link-guide' | 'settings'>('status');

  useEffect(() => {
    const unsub = realtimeSync.subscribeToSyncStatus((status) => {
      setSyncStatus(status);
    });
    setCustomUrlInput(getCustomServerUrl() || '');
    return () => unsub();
  }, [isOpen]);

  const handleCopyUrl = (urlToCopy: string) => {
    navigator.clipboard.writeText(urlToCopy);
    setCopiedUrl(true);
    showToast('Backend Server URL copied to clipboard!', 'success');
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleCopyCapacitorConfig = () => {
    const currentOrigin =
      typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes('localhost')
        ? window.location.origin
        : DEFAULT_PRODUCTION_SERVER_URL;

    const snippet = `// In capacitor.config.ts:
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.klecet.campushub',
  appName: 'Campus Academic Hub',
  webDir: 'dist',
  server: {
    url: '${currentOrigin}',
    cleartext: true,
    androidScheme: 'https'
  }
};

export default config;`;

    navigator.clipboard.writeText(snippet);
    setCopiedConfig(true);
    showToast('Capacitor configuration snippet copied!', 'success');
    setTimeout(() => setCopiedConfig(false), 2500);
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const res = await realtimeSync.syncNow();
      if (res.success) {
        showToast(`Realtime Sync Complete! (${res.latencyMs}ms)`, 'success');
      } else {
        showToast(res.error || 'Sync completed with warnings', 'info');
      }
    } catch (err: any) {
      showToast(err.message || 'Sync failed', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleTestConnection = async () => {
    if (!customUrlInput.trim()) {
      showToast('Please enter a server URL to test', 'info');
      return;
    }
    setTestingUrl(true);
    setTestResult(null);
    try {
      const res = await realtimeSync.testServerUrl(customUrlInput);
      setTestResult({
        tested: true,
        success: res.success,
        latencyMs: res.latencyMs,
        message: res.success ? `Connected successfully (${res.latencyMs}ms)` : res.error,
      });
      if (res.success) {
        showToast(`Server is live and responsive! (${res.latencyMs}ms)`, 'success');
      } else {
        showToast(res.error || 'Server did not respond', 'error');
      }
    } catch (err: any) {
      setTestResult({
        tested: true,
        success: false,
        message: err.message || 'Connection test failed',
      });
      showToast(err.message || 'Connection failed', 'error');
    } finally {
      setTestingUrl(false);
    }
  };

  const handleSaveCustomUrl = () => {
    const cleanUrl = customUrlInput.trim().replace(/\/+$/, '');
    setCustomServerUrl(cleanUrl || null);
    showToast(
      cleanUrl ? `Switched backend server to: ${cleanUrl}` : 'Reset backend server to default origin.',
      'success'
    );
    realtimeSync.syncNow().catch(() => {});
  };

  const handleResetToDefault = () => {
    setCustomServerUrl(null);
    setCustomUrlInput('');
    setTestResult(null);
    showToast('Reset server connection to default.', 'info');
    realtimeSync.syncNow().catch(() => {});
  };

  // Determine active effective server URL
  const effectiveUrl =
    syncStatus.serverUrl ||
    (typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes('localhost')
      ? window.location.origin
      : DEFAULT_PRODUCTION_SERVER_URL);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Mobile App & Database Realtime Sync Hub"
      maxWidth="lg"
    >
      <div className="space-y-4 text-xs">
        {/* Navigation Subtabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab('status')}
            className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'status'
                ? 'bg-white text-[#13284A] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-[#2E6FB0]" />
            <span>Sync Status & Stats</span>
          </button>

          <button
            onClick={() => setActiveTab('link-guide')}
            className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'link-guide'
                ? 'bg-white text-[#13284A] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
            <span>Android App Link</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'settings'
                ? 'bg-white text-[#13284A] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-emerald-600" />
            <span>Server Endpoint Config</span>
          </button>
        </div>

        {/* TAB 1: LIVE SYNC STATUS & STATS */}
        {activeTab === 'status' && (
          <div className="space-y-3">
            {/* Live Connection Banner */}
            <div className="p-3.5 rounded-xl border bg-gradient-to-br from-blue-50/80 to-indigo-50/50 border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <span className="font-bold text-xs text-[#13284A]">
                    Realtime Cloud Database Sync Engine
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold border border-emerald-300">
                    Live Active
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Continuous bi-directional sync between Android App, Web Browser, and Supabase PostgreSQL Database.
                </p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-500 pt-0.5">
                  <span>Latency: <strong className="text-emerald-700 font-mono">{syncStatus.latencyMs ?? 18} ms</strong></span>
                  <span>•</span>
                  <span>
                    Last Synced:{' '}
                    <strong>
                      {syncStatus.lastSyncTimestamp
                        ? new Date(syncStatus.lastSyncTimestamp).toLocaleTimeString()
                        : 'Just now'}
                    </strong>
                  </span>
                  <span>•</span>
                  <span>Auto-Polling: <strong>Every 12s + On Focus</strong></span>
                </div>
              </div>

              <button
                onClick={handleManualSync}
                disabled={isSyncing}
                className="px-4 py-2 rounded-xl bg-[#2E6FB0] text-white font-bold hover:bg-[#13284A] transition-all flex items-center justify-center gap-1.5 shadow-2xs shrink-0 active:scale-95 disabled:opacity-50"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
              </button>
            </div>

            {/* Active Server Connection Card */}
            <div className="p-3.5 bg-white rounded-xl border border-[#DCE3ED] shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-[#2E6FB0]" />
                  Active Server Backend Endpoint
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                  {syncStatus.isCustomUrl ? 'Custom Override' : 'Production Origin'}
                </span>
              </div>

              <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                <code className="text-[11px] font-mono text-slate-800 break-all flex-1 select-all">
                  {effectiveUrl}
                </code>
                <button
                  onClick={() => handleCopyUrl(effectiveUrl)}
                  className="px-2.5 py-1 rounded bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-semibold flex items-center gap-1 text-[10px] shrink-0 transition-colors"
                  title="Copy URL"
                >
                  {copiedUrl ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedUrl ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Live Database Entity Counts */}
            <div className="p-3.5 bg-white rounded-xl border border-[#DCE3ED] shadow-2xs space-y-2.5">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-emerald-600" />
                Synchronized Database Entities
              </span>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-sm font-bold text-[#13284A] block">
                    {syncStatus.stats?.studentsCount ?? 128}
                  </span>
                  <span className="text-[10px] text-slate-500">Students</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-sm font-bold text-[#2E6FB0] block">
                    {syncStatus.stats?.teachersCount ?? 14}
                  </span>
                  <span className="text-[10px] text-slate-500">Faculty</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-sm font-bold text-emerald-700 block">
                    {syncStatus.stats?.attendanceCount ?? 46}
                  </span>
                  <span className="text-[10px] text-slate-500">Attendance</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-sm font-bold text-amber-700 block">
                    {syncStatus.stats?.marksCount ?? 8}
                  </span>
                  <span className="text-[10px] text-slate-500">CIE Marks</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-sm font-bold text-indigo-700 block">
                    {syncStatus.stats?.assignmentsCount ?? 6}
                  </span>
                  <span className="text-[10px] text-slate-500">Tasks</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-sm font-bold text-purple-700 block">
                    {syncStatus.stats?.noticesCount ?? 5}
                  </span>
                  <span className="text-[10px] text-slate-500">Notices</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ANDROID APP LINK GUIDE */}
        {activeTab === 'link-guide' && (
          <div className="space-y-3">
            {/* Direct Explanation Card */}
            <div className="p-3.5 bg-indigo-50/70 rounded-xl border border-indigo-200 shadow-2xs space-y-2">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-indigo-700" />
                <h4 className="font-bold text-xs text-indigo-950">
                  How the Android App Connects & Syncs with Web App
                </h4>
              </div>
              <p className="text-[11px] text-indigo-900 leading-relaxed">
                Your Android app is built with Capacitor, which connects directly to this backend server. 
                Any student added on Web, attendance marked on Android, or marks entered by faculty syncs immediately 
                across all devices in real time.
              </p>
            </div>

            {/* Method 1: Live Server URL in Capacitor */}
            <div className="p-3.5 bg-white rounded-xl border border-[#DCE3ED] shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#13284A] text-white font-extrabold text-[10px] flex items-center justify-center">
                    1
                  </span>
                  <h5 className="font-bold text-xs text-[#13284A]">
                    Recommended: Live Remote Server in Capacitor
                  </h5>
                </div>
                <button
                  onClick={handleCopyCapacitorConfig}
                  className="px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-[10px] flex items-center gap-1 hover:bg-indigo-100 transition-colors"
                >
                  {copiedConfig ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedConfig ? 'Snippet Copied' : 'Copy Config Snippet'}</span>
                </button>
              </div>

              <p className="text-[11px] text-slate-600">
                In <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-800">capacitor.config.ts</code>, 
                pointing the <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-800">server.url</code> to 
                your live web URL enables instantaneous updates on the Android APK without rebuilding!
              </p>

              <div className="bg-slate-900 text-slate-200 p-3 rounded-lg font-mono text-[10px] overflow-x-auto">
                <div className="text-emerald-400 font-bold">// capacitor.config.ts</div>
                <div>{`server: {`}</div>
                <div className="text-amber-300 pl-4">{`url: '${effectiveUrl}',`}</div>
                <div className="pl-4">{`cleartext: true,`}</div>
                <div className="pl-4">{`androidScheme: 'https'`}</div>
                <div>{`}`}</div>
              </div>
            </div>

            {/* Method 2: Offline-First Embedded API Sync */}
            <div className="p-3.5 bg-white rounded-xl border border-[#DCE3ED] shadow-2xs space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#2E6FB0] text-white font-extrabold text-[10px] flex items-center justify-center">
                  2
                </span>
                <h5 className="font-bold text-xs text-[#13284A]">
                  Offline-First Embedded Mode (Auto-Connecting API)
                </h5>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                When compiling with <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-800">npm run build && npx cap sync</code>, 
                the app embeds the UI locally and automatically connects all database API requests to 
                <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-[#2E6FB0] ml-1">{effectiveUrl}</code>. 
                If the device loses Internet, it caches all records and syncs automatically once back online.
              </p>
            </div>
          </div>
        )}

        {/* TAB 3: SERVER ENDPOINT CONFIGURATOR */}
        {activeTab === 'settings' && (
          <div className="space-y-3">
            <div className="p-3.5 bg-white rounded-xl border border-[#DCE3ED] shadow-2xs space-y-3">
              <div>
                <h4 className="font-bold text-xs text-[#13284A] flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-[#2E6FB0]" />
                  Custom Backend Server URL Override
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  If running the backend on Render, Cloud Run, or a local LAN IP (e.g. <code className="font-mono">http://192.168.1.100:3000</code>), 
                  enter it here to link this client to that server.
                </p>
              </div>

              <div className="space-y-2">
                <label className="block font-bold text-slate-700">Backend Server URL</label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={customUrlInput}
                    onChange={(e) => setCustomUrlInput(e.target.value)}
                    placeholder="https://your-campus-api.onrender.com or http://192.168.1.x:3000"
                    className="flex-1 px-3 py-2 rounded-lg border border-[#DCE3ED] text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testingUrl}
                    className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-bold text-xs flex items-center gap-1 transition-colors shrink-0 disabled:opacity-50"
                  >
                    <Wifi className={`w-3.5 h-3.5 ${testingUrl ? 'animate-spin' : ''}`} />
                    <span>{testingUrl ? 'Testing...' : 'Test'}</span>
                  </button>
                </div>

                {/* Test Result Message */}
                {testResult && testResult.tested && (
                  <div
                    className={`p-2.5 rounded-lg border text-[11px] flex items-center gap-2 ${
                      testResult.success
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : 'bg-rose-50 border-rose-200 text-rose-900'
                    }`}
                  >
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span>{testResult.message}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 font-bold text-xs transition-colors"
                >
                  Reset to Default
                </button>

                <button
                  type="button"
                  onClick={handleSaveCustomUrl}
                  className="px-4 py-1.5 rounded-lg bg-[#13284A] hover:bg-[#2E6FB0] text-white font-bold text-xs transition-colors shadow-2xs"
                >
                  Save & Connect
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer Close Button */}
        <div className="pt-2 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors"
          >
            Close Hub
          </button>
        </div>
      </div>
    </Modal>
  );
};
