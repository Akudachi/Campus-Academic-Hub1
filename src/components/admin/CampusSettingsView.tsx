import React, { useState, useEffect, useRef } from 'react';
import {
  Building2,
  Server,
  Database,
  Save,
  Download,
  Upload,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Terminal,
  Cpu,
  Clock,
  ShieldCheck,
  Globe,
  Mail,
  Sliders,
  FileCode,
  Copy,
  Check,
  RefreshCw,
} from 'lucide-react';
import { api } from '../../lib/api';
import { CampusSettings, SystemStatusInfo } from '../../types';
import { MetricCard } from '../common/MetricCard';
import { StatusPill } from '../common/StatusPill';
import { Modal } from '../common/Modal';
import { useAuth } from '../../context/AuthContext';

export const CampusSettingsView: React.FC = () => {
  const { showToast } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'backup' | 'deploy'>('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // Settings State
  const [settings, setSettings] = useState<CampusSettings>({
    institutionName: 'Apex Institute of Technology',
    shortName: 'AIT',
    campusCode: 'AIT-2026',
    academicYear: '2025-2026',
    currentSemesterTerm: 'Even Semester (Sem 4 & 6)',
    minAttendanceWarning: 75,
    adminContactEmail: 'admin@campus.edu',
    systemStatus: 'operational',
  });

  // System Status State
  const [systemStatus, setSystemStatus] = useState<SystemStatusInfo | null>(null);
  const [refreshingStatus, setRefreshingStatus] = useState(false);

  // Restore file ref
  const restoreFileRef = useRef<HTMLInputElement | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [settingsRes, statusRes] = await Promise.all([
        api.getAdminCampusSettings(),
        api.getSystemStatus(),
      ]);
      setSettings(settingsRes.settings);
      setSystemStatus(statusRes.status);
    } catch (err: any) {
      showToast(err.message || 'Failed to load campus configuration', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.updateCampusSettings(settings);
      setSettings(res.settings);
      showToast('Campus configuration saved and active across all portals.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update campus settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadBackup = () => {
    window.open('/api/admin/backup', '_blank');
    showToast('Campus database backup download initiated.', 'success');
  };

  const handleRestoreFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsRestoring(true);
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const dataToRestore = json.data || json;

      await api.restoreDatabase(dataToRestore);
      showToast('Campus database restored successfully! Reloading configuration...', 'success');
      await fetchData();
    } catch (err: any) {
      showToast(err.message || 'Invalid backup JSON file', 'error');
    } finally {
      setIsRestoring(false);
      if (restoreFileRef.current) restoreFileRef.current.value = '';
    }
  };

  const [loadingSample, setLoadingSample] = useState(false);

  const handleResetDatabase = async () => {
    setResetting(true);
    try {
      await api.resetDatabase();
      showToast('All demo records cleared! Database reset to clean state.', 'info');
      setIsResetModalOpen(false);
      await fetchData();
    } catch (err: any) {
      showToast(err.message || 'Failed to reset database', 'error');
    } finally {
      setResetting(false);
    }
  };

  const handleLoadDemoDataset = async () => {
    setLoadingSample(true);
    try {
      await api.loadSampleDataset();
      showToast('Sample demo dataset loaded successfully.', 'success');
      await fetchData();
    } catch (err: any) {
      showToast(err.message || 'Failed to load sample dataset', 'error');
    } finally {
      setLoadingSample(false);
    }
  };

  const copyToClipboard = (text: string, sectionKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionKey);
    setTimeout(() => setCopiedSection(null), 2500);
    showToast('Command copied to clipboard', 'info');
  };

  const formatUptime = (seconds?: number) => {
    if (!seconds) return 'Active';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-[#DCE3ED] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-[#13284A] font-serif">Campus Configuration & Deployment</h2>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
              Production Ready
            </span>
          </div>
          <p className="text-xs text-[#667085] mt-1">
            Institutional branding, academic thresholds, database backups, and self-hosted campus deployment instructions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadBackup}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-[#DCE3ED] bg-white text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Download className="w-4 h-4 text-[#2E6FB0]" />
            Export Backup (.json)
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('deploy')}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#13284A] text-white hover:bg-[#13284A]/90 transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Server className="w-4 h-4 text-[#5B93D1]" />
            Deployment Center
          </button>
        </div>
      </div>

      {/* Subtabs Bar */}
      <div className="flex items-center gap-2 border-b border-[#DCE3ED] pb-3">
        <button
          onClick={() => setActiveSubTab('profile')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 ${
            activeSubTab === 'profile'
              ? 'bg-[#13284A] text-white shadow-xs'
              : 'bg-white text-slate-600 border border-[#DCE3ED] hover:bg-slate-50'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Institution & Academic Profile
        </button>

        <button
          onClick={() => setActiveSubTab('backup')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 ${
            activeSubTab === 'backup'
              ? 'bg-[#13284A] text-white shadow-xs'
              : 'bg-white text-slate-600 border border-[#DCE3ED] hover:bg-slate-50'
          }`}
        >
          <Database className="w-4 h-4" />
          Data Backup & Disaster Recovery
        </button>

        <button
          onClick={() => setActiveSubTab('deploy')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 ${
            activeSubTab === 'deploy'
              ? 'bg-[#13284A] text-white shadow-xs'
              : 'bg-white text-slate-600 border border-[#DCE3ED] hover:bg-slate-50'
          }`}
        >
          <Server className="w-4 h-4" />
          Campus Production Deployment & Health
        </button>
      </div>

      {loading ? (
        <div className="bg-white p-12 rounded-xl border border-[#DCE3ED] text-center text-xs text-[#667085]">
          Loading campus operational status...
        </div>
      ) : (
        <>
          {/* TAB 1: INSTITUTION PROFILE */}
          {activeSubTab === 'profile' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <form onSubmit={handleSaveSettings} className="bg-white p-6 rounded-xl border border-[#DCE3ED] shadow-xs space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="text-sm font-bold text-[#13284A]">Institutional Profile & Thresholds</h3>
                      <p className="text-xs text-[#667085] mt-0.5">
                        These parameters customize the portal titles, header branding, and alert levels for all users.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Institution / College Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={settings.institutionName}
                        onChange={(e) => setSettings({ ...settings, institutionName: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-[#DCE3ED] focus:ring-1 focus:ring-[#2E6FB0] focus:outline-hidden font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        College / Campus Code
                      </label>
                      <input
                        type="text"
                        required
                        value={settings.campusCode}
                        onChange={(e) => setSettings({ ...settings, campusCode: e.target.value })}
                        placeholder="e.g. AIT-2026 or VTU-CSE"
                        className="w-full px-3 py-2 text-xs font-mono font-bold uppercase rounded-lg border border-[#DCE3ED] focus:ring-1 focus:ring-[#2E6FB0] focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Short Abbreviation
                      </label>
                      <input
                        type="text"
                        required
                        value={settings.shortName}
                        onChange={(e) => setSettings({ ...settings, shortName: e.target.value })}
                        placeholder="e.g. AIT"
                        className="w-full px-3 py-2 text-xs uppercase font-bold rounded-lg border border-[#DCE3ED] focus:ring-1 focus:ring-[#2E6FB0] focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Active Academic Year
                      </label>
                      <input
                        type="text"
                        required
                        value={settings.academicYear}
                        onChange={(e) => setSettings({ ...settings, academicYear: e.target.value })}
                        placeholder="e.g. 2025-2026"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-[#DCE3ED] focus:ring-1 focus:ring-[#2E6FB0] focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Current Semester Term
                      </label>
                      <input
                        type="text"
                        required
                        value={settings.currentSemesterTerm}
                        onChange={(e) => setSettings({ ...settings, currentSemesterTerm: e.target.value })}
                        placeholder="e.g. Even Semester (Sem 4 & 6)"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-[#DCE3ED] focus:ring-1 focus:ring-[#2E6FB0] focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Minimum Attendance Warning Threshold (%)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min={50}
                          max={95}
                          required
                          value={settings.minAttendanceWarning}
                          onChange={(e) => setSettings({ ...settings, minAttendanceWarning: Number(e.target.value) })}
                          className="w-full px-3 py-2 text-xs rounded-lg border border-[#DCE3ED] focus:ring-1 focus:ring-[#2E6FB0] focus:outline-hidden font-bold text-[#13284A]"
                        />
                        <span className="absolute right-3 top-2 text-xs text-slate-400 font-bold">%</span>
                      </div>
                      <p className="text-[10px] text-[#667085] mt-1">
                        Students falling below this percentage are flagged critical in faculty & student dashboards.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Administrator Contact Email
                      </label>
                      <input
                        type="email"
                        required
                        value={settings.adminContactEmail}
                        onChange={(e) => setSettings({ ...settings, adminContactEmail: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-[#DCE3ED] focus:ring-1 focus:ring-[#2E6FB0] focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-slate-100">
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-5 py-2 text-xs font-semibold rounded-lg bg-[#13284A] text-white hover:bg-[#13284A]/90 transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                    >
                      <Save className="w-4 h-4 text-[#5B93D1]" />
                      {saving ? 'Saving Changes...' : 'Save Campus Profile'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Sidebar Preview Card */}
              <div className="space-y-4">
                <div className="bg-white p-5 rounded-xl border border-[#DCE3ED] shadow-xs space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <Building2 className="w-4 h-4 text-[#2E6FB0]" />
                    <h4 className="text-xs font-bold text-[#13284A]">Campus Identity Preview</h4>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <div>
                      <span className="text-[10px] font-bold text-[#667085] uppercase tracking-wider">Institution</span>
                      <p className="text-sm font-bold text-[#13284A]">{settings.institutionName}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] text-[#667085]">Code:</span>
                        <p className="font-mono font-bold text-slate-800">{settings.campusCode}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#667085]">Abbreviation:</span>
                        <p className="font-bold text-slate-800">{settings.shortName}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#667085]">Academic Year:</span>
                        <p className="font-semibold text-slate-700">{settings.academicYear}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#667085]">Min Attendance:</span>
                        <p className="font-bold text-rose-700">{settings.minAttendanceWarning}%</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Live sync active. Updates to campus codes or names propagate instantly to all faculty and students.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DATA BACKUP & DISASTER RECOVERY */}
          {activeSubTab === 'backup' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-6">
                {/* Export Card */}
                <div className="bg-white p-6 rounded-xl border border-[#DCE3ED] shadow-xs space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-[#2E6FB0]" />
                        <h3 className="text-sm font-bold text-[#13284A]">Full Campus Database Export</h3>
                      </div>
                      <p className="text-xs text-[#667085]">
                        Download a complete, structured JSON snapshot of all registered students, faculty, subjects, attendance sessions, test marks, assignments, and audit trails.
                      </p>
                    </div>
                    <button
                      onClick={handleDownloadBackup}
                      className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#13284A] text-white hover:bg-[#13284A]/90 transition-colors flex items-center gap-1.5 shadow-xs shrink-0"
                    >
                      <Download className="w-4 h-4 text-[#5B93D1]" />
                      Download Database (.json)
                    </button>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Students</span>
                      <p className="font-bold text-slate-800">{systemStatus?.databaseStats.studentsCount || 0}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Faculty</span>
                      <p className="font-bold text-slate-800">{systemStatus?.databaseStats.teachersCount || 0}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Attendance Logs</span>
                      <p className="font-bold text-slate-800">{systemStatus?.databaseStats.attendanceSessionsCount || 0}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Test Mark Sheets</span>
                      <p className="font-bold text-slate-800">{systemStatus?.databaseStats.testMarkSheetsCount || 0}</p>
                    </div>
                  </div>
                </div>

                {/* Restore Card */}
                <div className="bg-white p-6 rounded-xl border border-[#DCE3ED] shadow-xs space-y-4">
                  <div className="flex items-center gap-2">
                    <Upload className="w-4 h-4 text-[#2E6FB0]" />
                    <h3 className="text-sm font-bold text-[#13284A]">Restore from Backup File</h3>
                  </div>
                  <p className="text-xs text-[#667085]">
                    Upload a previously exported campus backup file (.json) to restore records or migrate from another campus server instance.
                  </p>

                  <input
                    ref={restoreFileRef}
                    type="file"
                    accept=".json"
                    onChange={handleRestoreFile}
                    className="hidden"
                  />

                  <div
                    onClick={() => restoreFileRef.current?.click()}
                    className="p-6 border-2 border-dashed border-[#DCE3ED] rounded-xl text-center cursor-pointer hover:bg-slate-50/80 transition-colors"
                  >
                    <Upload className="w-8 h-8 text-[#2E6FB0] mx-auto mb-2 opacity-80" />
                    <p className="text-xs font-bold text-slate-800">
                      {isRestoring ? 'Restoring Database...' : 'Click to select campus backup JSON file'}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Accepts campus_academic_backup_*.json files
                    </p>
                  </div>
                </div>
              </div>

              {/* Danger Zone: Factory Reset & Demo Pack */}
              <div className="space-y-4">
                <div className="bg-rose-50/50 p-5 rounded-xl border border-rose-200 shadow-xs space-y-3">
                  <div className="flex items-center gap-2 text-rose-800">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <h4 className="text-xs font-bold">Wipe Data & Reset to Clean State</h4>
                  </div>
                  <p className="text-xs text-rose-700 leading-relaxed">
                    Clear all attendance records, marks, assignments, uploaded timetables, and demo faculty/students so you can test with real campus data.
                  </p>
                  <button
                    onClick={() => setIsResetModalOpen(true)}
                    className="w-full px-3.5 py-2 text-xs font-bold rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Wipe to Clean Slate (0 Demo Records)
                  </button>
                </div>

                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center gap-2 text-[#13284A]">
                    <Layers className="w-4 h-4 text-[#2E6FB0]" />
                    <h4 className="text-xs font-bold">Sample Demo Pack (Optional)</h4>
                  </div>
                  <p className="text-xs text-[#667085] leading-relaxed">
                    Populate mock faculty, students, and attendance sheets for rapid feature demonstration and UI walkthroughs.
                  </p>
                  <button
                    disabled={loadingSample}
                    onClick={handleLoadDemoDataset}
                    className="w-full px-3.5 py-2 text-xs font-bold rounded-lg border border-[#13284A] text-[#13284A] hover:bg-slate-100 transition-colors flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingSample ? 'animate-spin' : ''}`} />
                    {loadingSample ? 'Loading Sample Pack...' : 'Load Sample Demo Pack'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DEPLOYMENT CENTER & HEALTH */}
          {activeSubTab === 'deploy' && (
            <div className="space-y-6">
              {/* Metric Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <MetricCard
                  title="Server State"
                  value="100% Operational"
                  subtitle={`Uptime: ${formatUptime(systemStatus?.uptimeSeconds)}`}
                  icon={Cpu}
                  accentColor="green"
                />
                <MetricCard
                  title="Node.js Engine"
                  value={systemStatus?.nodeVersion || 'v22.x'}
                  subtitle="TypeScript native execution"
                  icon={Server}
                  accentColor="navy"
                />
                <MetricCard
                  title="Gemini AI Extraction"
                  value={systemStatus?.geminiConfigured ? 'Connected' : 'Mock/Manual'}
                  subtitle="Timetable parser & automation"
                  icon={SparklesIcon}
                  accentColor="blue"
                />
                <MetricCard
                  title="Port Ingress"
                  value="Port 3000"
                  subtitle="Single-port reverse proxy ready"
                  icon={Globe}
                  accentColor="amber"
                />
              </div>

              {/* Ready to Deploy Guide */}
              <div className="bg-white p-6 rounded-xl border border-[#DCE3ED] shadow-xs space-y-6">
                <div>
                  <h3 className="text-base font-bold text-[#13284A] font-serif">Campus Production Deployment Guide</h3>
                  <p className="text-xs text-[#667085] mt-1">
                    Follow these step-by-step instructions to run Campus Academic Hub on your institution’s servers, Docker, or intranet VM.
                  </p>
                </div>

                {/* Step 1: Standalone Node / Intranet VM */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#13284A] text-white text-[11px] font-bold flex items-center justify-center">1</span>
                      <h4 className="text-xs font-bold text-slate-800">Production Build & Start (Campus Server / VPS / VM)</h4>
                    </div>
                    <button
                      onClick={() =>
                        copyToClipboard('npm run build\nnpm start', 'cmd-build')
                      }
                      className="px-2.5 py-1 text-[11px] font-semibold text-[#2E6FB0] hover:bg-blue-50 rounded border border-blue-200 flex items-center gap-1"
                    >
                      {copiedSection === 'cmd-build' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      Copy Script
                    </button>
                  </div>
                  <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg text-xs font-mono overflow-x-auto">
                    <code>{`# 1. Compile Vite frontend and bundle TypeScript backend to CommonJS (dist/server.cjs)
npm run build

# 2. Launch production server on port 3000 (binds to 0.0.0.0:3000)
npm start`}</code>
                  </pre>
                </div>

                {/* Step 2: Docker Container */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#13284A] text-white text-[11px] font-bold flex items-center justify-center">2</span>
                      <h4 className="text-xs font-bold text-slate-800">Docker Container Execution (Campus Local Network)</h4>
                    </div>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          'docker build -t campus-academic-hub .\ndocker run -d -p 3000:3000 -e GEMINI_API_KEY="YOUR_KEY" --name campus-app campus-academic-hub',
                          'cmd-docker'
                        )
                      }
                      className="px-2.5 py-1 text-[11px] font-semibold text-[#2E6FB0] hover:bg-blue-50 rounded border border-blue-200 flex items-center gap-1"
                    >
                      {copiedSection === 'cmd-docker' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      Copy Docker
                    </button>
                  </div>
                  <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg text-xs font-mono overflow-x-auto">
                    <code>{`# Build Container Image
docker build -t campus-academic-hub .

# Run Container bound to Port 3000
docker run -d -p 3000:3000 -e NODE_ENV=production -e GEMINI_API_KEY="YOUR_KEY" --name campus-app campus-academic-hub`}</code>
                  </pre>
                </div>

                {/* Step 3: Nginx Reverse Proxy for Campus Intranet */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#13284A] text-white text-[11px] font-bold flex items-center justify-center">3</span>
                      <h4 className="text-xs font-bold text-slate-800">Campus Intranet Nginx Reverse Proxy (e.g. portal.campus.edu)</h4>
                    </div>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          `server {\n  listen 80;\n  server_name portal.campus.edu;\n\n  location / {\n    proxy_pass http://127.0.0.1:3000;\n    proxy_http_version 1.1;\n    proxy_set_header Upgrade $http_upgrade;\n    proxy_set_header Connection 'upgrade';\n    proxy_set_header Host $host;\n    proxy_cache_bypass $http_upgrade;\n  }\n}`,
                          'cmd-nginx'
                        )
                      }
                      className="px-2.5 py-1 text-[11px] font-semibold text-[#2E6FB0] hover:bg-blue-50 rounded border border-blue-200 flex items-center gap-1"
                    >
                      {copiedSection === 'cmd-nginx' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      Copy Nginx Config
                    </button>
                  </div>
                  <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg text-xs font-mono overflow-x-auto">
                    <code>{`server {
  listen 80;
  server_name portal.campus.edu;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}`}</code>
                  </pre>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Reset Confirmation Modal */}
      <Modal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        title="Confirm Campus Database Reset"
        subtitle="This action resets all attendance records, test marks, assignments, and timetable uploads to the initial institutional baseline."
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>
              Warning: All modifications created during the active session will be replaced by the default clean dataset.
            </span>
          </div>

          <p className="text-xs text-[#667085]">
            If you want to preserve your current faculty, student rosters, and attendance logs, please download a <strong>Backup (.json)</strong> first before confirming.
          </p>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsResetModalOpen(false)}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-[#DCE3ED] hover:bg-slate-50 text-slate-600"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={resetting}
              onClick={handleResetDatabase}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-rose-600 text-white hover:bg-rose-700 flex items-center gap-1.5 disabled:opacity-50 shadow-xs"
            >
              <RotateCcw className="w-4 h-4" />
              {resetting ? 'Resetting...' : 'Yes, Reset Database'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

function SparklesIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  );
}
