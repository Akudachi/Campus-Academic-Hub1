import React, { useState } from 'react';
import {
  GraduationCap,
  ShieldCheck,
  BookOpen,
  UserCheck,
  ArrowRight,
  Sparkles,
  Lock,
  Mail,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface LoginViewProps {
  onClose?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onClose }) => {
  const { login, personas, switchPersona } = useAuth();
  const [email, setEmail] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsProcessing(true);
    try {
      await login({ email });
      if (onClose) onClose();
    } catch {
      // Error handled by showToast in AuthContext
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePersonaSelect = async (userId: string) => {
    setIsProcessing(true);
    try {
      await switchPersona(userId);
      if (onClose) onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-[#13284A] text-white flex items-center justify-center mx-auto shadow-xs">
          <GraduationCap className="w-7 h-7 text-[#5B93D1]" />
        </div>
        <h2 className="text-xl font-bold text-[#13284A] font-serif">Campus Academic Hub</h2>
        <p className="text-xs text-[#667085] max-w-sm mx-auto">
          Centralized academic operations portal. Select an institutional persona below for instant access.
        </p>
      </div>

      {/* 1-Click Fast Persona Cards */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#667085]">
            Select Registered Account
          </label>
          <span className="text-[10px] text-slate-500 font-medium">
            {personas.length} active account{personas.length === 1 ? '' : 's'}
          </span>
        </div>
        <div className="grid grid-cols-1 gap-2.5 max-h-60 overflow-y-auto">
          {personas.map((p) => {
            const role = p.user.role;
            return (
              <button
                key={p.user.id}
                type="button"
                disabled={isProcessing}
                onClick={() => handlePersonaSelect(p.user.id)}
                className="w-full p-3 rounded-xl border border-[#DCE3ED] hover:border-[#13284A] hover:bg-slate-50 transition-all text-left flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      role === 'admin'
                        ? 'bg-[#13284A] text-white'
                        : role === 'teacher'
                        ? 'bg-[#2E6FB0] text-white'
                        : 'bg-[#1E8E5A] text-white'
                    }`}
                  >
                    {role === 'admin' ? (
                      <ShieldCheck className="w-5 h-5" />
                    ) : role === 'teacher' ? (
                      <BookOpen className="w-5 h-5" />
                    ) : (
                      <GraduationCap className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-xs text-[#13284A] flex items-center gap-2">
                      <span>{p.user.name}</span>
                      <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-slate-100 font-semibold text-slate-700">
                        {role}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#667085]">{p.displaySub}</p>
                  </div>
                </div>

                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#13284A] transition-colors" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Manual Login Form */}
      <form onSubmit={handleManualLogin} className="space-y-3 pt-3 border-t border-slate-100">
        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#667085]">
          Or Sign In with Email, USN, or Teacher Code
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="e.g. admin@campus.edu or 2KL23CS001"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#DCE3ED] focus:ring-1 focus:ring-[#2E6FB0] focus:outline-hidden"
            />
          </div>
          <button
            type="submit"
            disabled={isProcessing || !email.trim()}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#13284A] text-white hover:bg-[#13284A]/90 disabled:opacity-50 cursor-pointer"
          >
            Sign In
          </button>
        </div>
      </form>
    </div>
  );
};
