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
  Cpu,
  Clock,
  ShieldCheck,
  Globe,
  Mail,
  Sliders,
  Calendar,
  Sparkles,
  ArrowRightLeft,
  Check,
} from 'lucide-react';
import { api } from '../../lib/api';
import { CampusSettings, SystemStatusInfo } from '../../types';
import { Modal } from '../common/Modal';
import { BackButton } from '../common/BackButton';
import { useAuth } from '../../context/AuthContext';
import { DepartmentManagerView } from './DepartmentManagerView';

interface CampusSettingsViewProps {
  onBack?: () => void;
  onNavigate?: (tabId: string) => void;
}

export const CampusSettingsView: React.FC<CampusSettingsViewProps> = ({ onBack }) => {
  const { showToast } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'departments' | 'backup' | 'system'>('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

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
  const [switchingTerm, setSwitchingTerm] = useState(false);

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

  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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

  const handleQuickSwitchTerm = async (termType: 'even' | 'odd') => {
    const customName =
      termType === 'even'
        ? 'Even Semester (Semesters 2, 4, 6, 8)'
        : 'Odd Semester (Semesters 1, 3, 5, 7)';

    setSettings({
      ...settings,
      semesterTermType: termType,
      currentSemesterTerm: customName,
    });

    setSwitchingTerm(true);
    try {
      const res = await api.switchSemesterTerm({
        termType,
        academicYear: settings.academicYear,
        customTermName: customName,
        activateMatchingSemesters: true,
      });
      setSettings(res.settings);
      showToast(
        `Switched campus term to ${termType === 'even' ? 'Even Semester (2, 4, 6, 8)' : 'Odd Semester (1, 3, 5, 7)'}!`,
        'success'
      );
    } catch (err: any) {
      showToast(err.message || 'Failed to switch semester term', 'error');
    } finally {
      setSwitchingTerm(false);
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

  return (
    <div className="space-y-3.5 max-w-full overflow-x-hidden animate-fade-in pb-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-xl border border-[#DCE3ED] shadow-2xs">
        <div className="flex items-center gap-2.5">
          {onBack && <BackButton onClick={onBack} label="Back" />}
          <div>
            <h1 className="text-base font-bold text-[#13284A]">Campus Settings & Config</h1>
            <p className="text-[11px] text-slate-500">Configure college details, semester cycles, departments, and backups.</p>
          </div>
        </div>

        {/* 1-Tap Save Button */}
        <button
          onClick={() => handleSaveSettings()}
          disabled={saving}
          className="px-4 py-1.5 text-xs font-bold rounded-lg bg-[#13284A] text-white hover:bg-[#2E6FB0] transition-colors flex items-center justify-center gap-1.5 shadow-2xs disabled:opacity-50"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{saving ? 'Saving...' : 'Save Settings'}</span>
        </button>
      </div>

      {/* Clean Tab Switcher */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          onClick={() => setActiveSubTab('profile')}
          className={`p-3 rounded-xl border text-left transition-all ${
            activeSubTab === 'profile'
              ? 'bg-[#13284A] text-white border-[#13284A] shadow-2xs'
              : 'bg-white text-slate-700 border-[#DCE3ED] hover:border-[#2E6FB0]'
          }`}
        >
          <Building2 className={`w-4 h-4 mb-1.5 ${activeSubTab === 'profile' ? 'text-amber-300' : 'text-[#2E6FB0]'}`} />
          <span className="text-xs font-bold block truncate">Institution & Term</span>
          <span className={`text-[10px] block truncate ${activeSubTab === 'profile' ? 'text-slate-300' : 'text-slate-500'}`}>
            Name, cycle & threshold
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('departments')}
          className={`p-3 rounded-xl border text-left transition-all ${
            activeSubTab === 'departments'
              ? 'bg-[#13284A] text-white border-[#13284A] shadow-2xs'
              : 'bg-white text-slate-700 border-[#DCE3ED] hover:border-[#2E6FB0]'
          }`}
        >
          <Layers className={`w-4 h-4 mb-1.5 ${activeSubTab === 'departments' ? 'text-amber-300' : 'text-indigo-600'}`} />
          <span className="text-xs font-bold block truncate">Departments</span>
          <span className={`text-[10px] block truncate ${activeSubTab === 'departments' ? 'text-slate-300' : 'text-slate-500'}`}>
            CSE, ECE, ISE, MECH
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('backup')}
          className={`p-3 rounded-xl border text-left transition-all ${
            activeSubTab === 'backup'
              ? 'bg-[#13284A] text-white border-[#13284A] shadow-2xs'
              : 'bg-white text-slate-700 border-[#DCE3ED] hover:border-[#2E6FB0]'
          }`}
        >
          <Database className={`w-4 h-4 mb-1.5 ${activeSubTab === 'backup' ? 'text-amber-300' : 'text-emerald-600'}`} />
          <span className="text-xs font-bold block truncate">Backup & Restore</span>
          <span className={`text-[10px] block truncate ${activeSubTab === 'backup' ? 'text-slate-300' : 'text-slate-500'}`}>
            JSON export & reset
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('system')}
          className={`p-3 rounded-xl border text-left transition-all ${
            activeSubTab === 'system'
              ? 'bg-[#13284A] text-white border-[#13284A] shadow-2xs'
              : 'bg-white text-slate-700 border-[#DCE3ED] hover:border-[#2E6FB0]'
          }`}
        >
          <Server className={`w-4 h-4 mb-1.5 ${activeSubTab === 'system' ? 'text-amber-300' : 'text-amber-600'}`} />
          <span className="text-xs font-bold block truncate">System Status</span>
          <span className={`text-[10px] block truncate ${activeSubTab === 'system' ? 'text-slate-300' : 'text-slate-500'}`}>
            Health & uptime
          </span>
        </button>
      </div>

      {/* TAB 1: INSTITUTION & TERM */}
      {activeSubTab === 'profile' && (
        <form onSubmit={handleSaveSettings} className="space-y-3.5 text-xs">
          {/* Quick Term Switcher Box */}
          <div className="bg-white p-4 rounded-xl border border-[#DCE3ED] shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-[#13284A] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#2E6FB0]" />
                Active Semester Term Cycle
              </span>
              <span className="text-[11px] font-bold text-[#2E6FB0]">{settings.currentSemesterTerm}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleQuickSwitchTerm('even')}
                disabled={switchingTerm}
                className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                  settings.semesterTermType === 'even'
                    ? 'bg-blue-50 border-[#2E6FB0] text-[#13284A]'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div>
                  <span className="font-bold text-xs block">Even Semesters</span>
                  <span className="text-[10px] text-slate-500 block">Sem 2, 4, 6 & 8</span>
                </div>
                {settings.semesterTermType === 'even' && <Check className="w-4 h-4 text-[#2E6FB0]" />}
              </button>

              <button
                type="button"
                onClick={() => handleQuickSwitchTerm('odd')}
                disabled={switchingTerm}
                className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                  settings.semesterTermType === 'odd'
                    ? 'bg-blue-50 border-[#2E6FB0] text-[#13284A]'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div>
                  <span className="font-bold text-xs block">Odd Semesters</span>
                  <span className="text-[10px] text-slate-500 block">Sem 1, 3, 5 & 7</span>
                </div>
                {settings.semesterTermType === 'odd' && <Check className="w-4 h-4 text-[#2E6FB0]" />}
              </button>
            </div>
          </div>

          {/* Profile Form Fields */}
          <div className="bg-white p-4 rounded-xl border border-[#DCE3ED] shadow-2xs space-y-3">
            <h2 className="font-bold text-xs text-[#13284A] uppercase tracking-wider">Institution Profile</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">College / Institution Name</label>
                <input
                  type="text"
                  value={settings.institutionName}
                  onChange={(e) => setSettings({ ...settings, institutionName: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#DCE3ED] text-xs font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">College Short Code / Abbreviation</label>
                <input
                  type="text"
                  value={settings.shortName}
                  onChange={(e) => setSettings({ ...settings, shortName: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#DCE3ED] text-xs font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Campus Code</label>
                <input
                  type="text"
                  value={settings.campusCode}
                  onChange={(e) => setSettings({ ...settings, campusCode: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#DCE3ED] text-xs font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Current Academic Year</label>
                <input
                  type="text"
                  value={settings.academicYear}
                  onChange={(e) => setSettings({ ...settings, academicYear: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#DCE3ED] text-xs font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Admin Contact Email</label>
                <input
                  type="email"
                  value={settings.adminContactEmail}
                  onChange={(e) => setSettings({ ...settings, adminContactEmail: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#DCE3ED] text-xs"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">
                  Minimum Attendance Shortage Threshold (%): <span className="text-[#2E6FB0] font-mono">{settings.minAttendanceWarning}%</span>
                </label>
                <input
                  type="range"
                  min="50"
                  max="90"
                  step="5"
                  value={settings.minAttendanceWarning}
                  onChange={(e) => setSettings({ ...settings, minAttendanceWarning: Number(e.target.value) })}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#2E6FB0]"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>50%</span>
                  <span>75% (Standard)</span>
                  <span>90%</span>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* TAB 2: DEPARTMENTS */}
      {activeSubTab === 'departments' && (
        <DepartmentManagerView onBack={() => setActiveSubTab('profile')} />
      )}

      {/* TAB 3: BACKUP & RESTORE */}
      {activeSubTab === 'backup' && (
        <div className="space-y-3 text-xs">
          {/* Download JSON Backup Card */}
          <div className="bg-white p-4 rounded-xl border border-[#DCE3ED] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-xs text-[#13284A] flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5 text-[#2E6FB0]" />
                Export Campus JSON Backup
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Download a complete snapshot of all students, faculty, timetables, and attendance logs.
              </p>
            </div>
            <button
              onClick={handleDownloadBackup}
              className="px-4 py-2 rounded-lg bg-[#13284A] text-white font-bold hover:bg-[#2E6FB0] transition-colors flex items-center justify-center gap-1.5 shadow-2xs shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download JSON Backup</span>
            </button>
          </div>

          {/* Restore Backup Card */}
          <div className="bg-white p-4 rounded-xl border border-[#DCE3ED] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-xs text-[#13284A] flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-emerald-600" />
                Restore from JSON File
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Import a previous campus backup file to restore database state.
              </p>
            </div>
            <div>
              <input
                ref={restoreFileRef}
                type="file"
                accept=".json"
                onChange={handleRestoreFile}
                className="hidden"
              />
              <button
                onClick={() => restoreFileRef.current?.click()}
                disabled={isRestoring}
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1.5 shadow-2xs shrink-0 disabled:opacity-50"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{isRestoring ? 'Restoring...' : 'Choose JSON File'}</span>
              </button>
            </div>
          </div>

          {/* Reset Database Card */}
          <div className="bg-rose-50/60 p-4 rounded-xl border border-rose-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-xs text-rose-900 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                Reset Database to Clean State
              </h2>
              <p className="text-[11px] text-rose-700 mt-0.5">
                Wipes all temporary session records and initializes a fresh slate.
              </p>
            </div>
            <button
              onClick={() => setIsResetModalOpen(true)}
              className="px-4 py-2 rounded-lg bg-rose-600 text-white font-bold hover:bg-rose-700 transition-colors flex items-center justify-center gap-1.5 shadow-2xs shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Database</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: SYSTEM STATUS */}
      {activeSubTab === 'system' && (
        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white p-4 rounded-xl border border-[#DCE3ED] shadow-2xs text-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
              <span className="text-[10px] text-slate-500 font-semibold uppercase block">System Health</span>
              <span className="text-sm font-bold text-emerald-700">100% Operational</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-[#DCE3ED] shadow-2xs text-center">
              <Server className="w-6 h-6 text-[#2E6FB0] mx-auto mb-1" />
              <span className="text-[10px] text-slate-500 font-semibold uppercase block">Server Environment</span>
              <span className="text-sm font-bold text-slate-800">Node.js + Express API</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-[#DCE3ED] shadow-2xs text-center">
              <Clock className="w-6 h-6 text-indigo-600 mx-auto mb-1" />
              <span className="text-[10px] text-slate-500 font-semibold uppercase block">Uptime</span>
              <span className="text-sm font-bold text-indigo-700">Active</span>
            </div>
          </div>
        </div>
      )}

      {/* RESET CONFIRMATION MODAL */}
      <Modal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        title="Reset Database"
        maxWidth="sm"
      >
        <div className="space-y-3 text-xs">
          <p className="text-slate-700">
            Are you sure you want to reset the database to a clean state? This will clear all attendance logs and temporary sessions.
          </p>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              onClick={() => setIsResetModalOpen(false)}
              className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 font-bold"
            >
              Cancel
            </button>
            <button
              onClick={handleResetDatabase}
              disabled={resetting}
              className="px-4 py-1.5 rounded-lg bg-rose-600 text-white font-bold hover:bg-rose-700 shadow-2xs disabled:opacity-50"
            >
              {resetting ? 'Resetting...' : 'Confirm Reset'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
