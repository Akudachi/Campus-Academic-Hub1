import React, { useState, useEffect } from 'react';
import {
  School,
  ArrowRight,
  AlertCircle,
  KeyRound,
  HelpCircle,
  Phone,
  Lock,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { AppLogo } from '../common/AppLogo';

interface LoginPageProps {
  onSuccess?: () => void;
  isModal?: boolean;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onSuccess,
  isModal = false,
}) => {
  const { login } = useAuth();

  // Single Universal Access Key / ID Input
  const [accessKey, setAccessKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const [campusInfo, setCampusInfo] = useState({
    institutionName: "K.L.E. Society's KLE College of Engineering and Technology",
    shortName: 'KLECET',
    campusCode: 'KLECET-2026',
    academicYear: '2026-2027',
    adminEmail: 'ecedept123456@gmail.com',
  });

  useEffect(() => {
    api.getCampusSettings()
      .then((res) => {
        if (res?.settings) {
          setCampusInfo({
            institutionName: res.settings.institutionName,
            shortName: res.settings.shortName || 'KLECET',
            campusCode: res.settings.campusCode,
            academicYear: res.settings.academicYear,
            adminEmail: res.settings.adminContactEmail || 'ecedept123456@gmail.com',
          });
        }
      })
      .catch(() => {});
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const input = accessKey.trim();
    if (!input) {
      setErrorMessage('Please enter your Institutional Access Key / ID.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ key: input });
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Invalid Access Key. Please verify your credentials or contact administration.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`w-full ${
        isModal
          ? 'py-1'
          : 'min-h-screen flex items-center justify-center p-3 sm:p-6 bg-[#EEF2F8]'
      }`}
    >
      <div
        className={`w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden transition-all ${
          isModal ? 'shadow-none border-none max-w-none' : ''
        }`}
      >
        {/* Institutional Branding Header */}
        <div className="bg-[#13284A] p-6 sm:p-8 text-white relative overflow-hidden text-center">
          {/* Subtle Institutional Background Pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff0d_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center space-y-3">
            <div className="w-16 h-16 rounded-2xl shadow-xl overflow-hidden border border-white/20">
              <AppLogo className="w-full h-full" withSquircle={true} />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[10px] sm:text-xs font-semibold tracking-wide text-blue-200 mb-2">
                <span>{campusInfo.campusCode}</span>
                <span>•</span>
                <span>AY {campusInfo.academicYear}</span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold font-heading tracking-tight leading-snug">
                {campusInfo.institutionName}
              </h1>
              <p className="text-xs text-blue-200/80 mt-1 max-w-xs mx-auto">
                Institutional Academic Portal
              </p>
            </div>
          </div>
        </div>

        {/* Single Unified Login Form */}
        <div className="p-6 sm:p-8 space-y-5">
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <div className="flex-1 leading-snug">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="universal-access-input"
                  className="block text-xs font-bold text-slate-700 uppercase tracking-wider"
                >
                  Access Key / ID
                </label>
                <button
                  type="button"
                  onClick={() => setShowHelpModal(!showHelpModal)}
                  className="text-[11px] text-[#2E6FB0] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Help Desk</span>
                </button>
              </div>

              <div className="relative">
                <div className="absolute left-3.5 top-3.5 text-slate-400 pointer-events-none">
                  <KeyRound className="w-5 h-5 text-slate-400" />
                </div>
                <input
                  id="universal-access-input"
                  type="text"
                  autoFocus
                  required
                  placeholder="Enter your Access Key / ID"
                  value={accessKey}
                  onChange={(e) => setAccessKey(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 text-sm sm:text-base font-mono tracking-wide rounded-2xl border-2 border-slate-200 focus:border-[#13284A] focus:ring-4 focus:ring-[#13284A]/10 focus:outline-hidden bg-slate-50/60 transition-all placeholder:text-slate-400 placeholder:font-sans placeholder:text-xs sm:placeholder:text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              id="universal-submit-btn"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 rounded-xl bg-[#13284A] hover:bg-[#1A3764] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="inline-block animate-pulse">Verifying...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Help Notice Accordion if opened */}
          {showHelpModal && (
            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-[#13284A] space-y-1.5 animate-slide-up">
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#2E6FB0]" />
                  Institutional Support & Helpdesk
                </span>
                <button
                  type="button"
                  onClick={() => setShowHelpModal(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold px-1"
                >
                  ✕
                </button>
              </div>
              <p className="text-slate-600">
                For login assistance, contact campus administration at{' '}
                <span className="font-semibold text-[#13284A]">{campusInfo.adminEmail}</span>.
              </p>
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200/80 text-center text-xs text-slate-500 space-y-2">
          <p className="font-semibold text-slate-700">{campusInfo.institutionName}</p>
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-600 font-medium pt-0.5">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>Developed by <strong className="text-slate-800 font-bold">Adarsh Kudachi</strong></span>
          </div>
          <p className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
            <Lock className="w-3 h-3 text-slate-400 inline" />
            <span>Authorized Institutional Access Only</span>
          </p>
        </div>
      </div>
    </div>
  );
};
