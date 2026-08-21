import React, { useState, useEffect } from 'react';
import { GraduationCap, Sparkles, ShieldCheck, Zap, ArrowRight, Layers, School } from 'lucide-react';

interface SplashScreenProps {
  onComplete?: () => void;
  campusName?: string;
  campusCode?: string;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onComplete,
  campusName = 'Apex Institute of Technology',
  campusCode = 'AIT-2026',
}) => {
  const [progress, setProgress] = useState(12);
  const [stageText, setStageText] = useState('Initializing campus core...');
  const [isClosing, setIsClosing] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Stage 1
    const t1 = setTimeout(() => {
      setProgress(38);
      setStageText('Connecting Academic Cloud & Firebase Engine...');
    }, 320);

    // Stage 2
    const t2 = setTimeout(() => {
      setProgress(74);
      setStageText('Synchronizing Faculty Allocations & Semesters...');
    }, 780);

    // Stage 3
    const t3 = setTimeout(() => {
      setProgress(100);
      setStageText('System Verified • Ready');
      setIsReady(true);
    }, 1250);

    // Auto-dismiss
    const t4 = setTimeout(() => {
      handleDismiss();
    }, 1650);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, []);

  const handleDismiss = () => {
    setIsClosing(true);
    setTimeout(() => {
      if (onComplete) onComplete();
    }, 380);
  };

  return (
    <div
      id="app-splash-screen"
      onClick={handleDismiss}
      className={`fixed inset-0 z-9999 flex flex-col items-center justify-between p-6 sm:p-10 select-none overflow-hidden cursor-pointer transition-all duration-380 ease-out bg-[#0B1528] ${
        isClosing
          ? 'opacity-0 scale-102 pointer-events-none'
          : 'opacity-100 scale-100'
      }`}
      style={{
        background: 'radial-gradient(circle at 50% 35%, #152B4D 0%, #0B1528 70%, #060D1A 100%)',
      }}
    >
      {/* Background Ambient Glowing Rings */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="w-[500px] h-[500px] rounded-full bg-blue-500/10 blur-3xl animate-pulse" />
        <div className="w-[320px] h-[320px] rounded-full bg-indigo-500/10 blur-2xl animate-pulse delay-300" />
      </div>

      {/* Top Header Badge */}
      <div className="w-full flex items-center justify-between max-w-md relative z-10 animate-fade-in">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-[11px] font-semibold text-slate-300 tracking-wide font-mono">
            LIVE CAMPUS OS
          </span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDismiss();
          }}
          className="text-xs font-semibold text-slate-400 hover:text-white px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors flex items-center gap-1"
        >
          <span>Skip</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* Central Brand Icon & Identity */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-sm space-y-6 animate-fade-in my-auto">
        {/* Glowing App Icon Frame */}
        <div className="relative group">
          <div className="absolute -inset-2 bg-gradient-to-r from-[#2E6FB0] via-[#5B93D1] to-[#E0982A] rounded-3xl blur-md opacity-70 group-hover:opacity-100 transition-opacity animate-pulse" />
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-linear-to-br from-[#1E3A63] to-[#0D1C33] border-2 border-white/20 shadow-2xl flex items-center justify-center text-white">
            <GraduationCap className="w-12 h-12 sm:w-14 sm:h-14 text-white drop-shadow-md" />
            <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-[#E0982A] border-2 border-[#0D1C33] flex items-center justify-center shadow-md">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
          </div>
        </div>

        {/* Typography */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#2E6FB0]/20 border border-[#2E6FB0]/40 text-[11px] font-bold text-[#8FC4F8] uppercase tracking-wider">
            Academic Operations Platform
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-display">
            Campus Academic Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-medium">
            {campusName}
          </p>
          <p className="text-[11px] text-slate-400 font-mono">
            {campusCode} • Enterprise Academic Cloud
          </p>
        </div>

        {/* Progress Bar & Status Text */}
        <div className="w-full space-y-2 pt-3">
          <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden backdrop-blur-xs p-[1px] border border-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#2E6FB0] via-[#5B93D1] to-emerald-400 transition-all duration-300 ease-out shadow-sm"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-300 font-medium px-0.5">
            <span className="truncate max-w-[240px] text-left">{stageText}</span>
            <span className="font-mono text-slate-400">{progress}%</span>
          </div>
        </div>
      </div>

      {/* Bottom Footer Info */}
      <div className="w-full max-w-md relative z-10 flex flex-col items-center text-center space-y-2 animate-fade-in">
        <div className="flex items-center gap-4 text-[11px] text-slate-400 font-medium">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Role Guard Active
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Real-time Sync
          </span>
        </div>
        <p className="text-[10px] text-slate-500">
          Tap anywhere to continue
        </p>
      </div>
    </div>
  );
};
