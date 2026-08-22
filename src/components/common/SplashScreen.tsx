import React, { useState, useEffect } from 'react';
import { ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';
import { AppLogo } from './AppLogo';

interface SplashScreenProps {
  onComplete?: () => void;
  campusName?: string;
  campusCode?: string;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onComplete,
  campusName = "K.L.E. Society's KLE College of Engineering and Technology",
  campusCode = 'KLECET-2026',
}) => {
  const [progress, setProgress] = useState(15);
  const [stageText, setStageText] = useState('Initializing Institutional Workspace...');
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    // Stage 1
    const t1 = setTimeout(() => {
      setProgress(45);
      setStageText('Authenticating Academic Services...');
    }, 280);

    // Stage 2
    const t2 = setTimeout(() => {
      setProgress(80);
      setStageText('Loading Faculty & Student Registers...');
    }, 650);

    // Stage 3
    const t3 = setTimeout(() => {
      setProgress(100);
      setStageText('System Verified • Ready');
    }, 1050);

    // Auto-dismiss
    const t4 = setTimeout(() => {
      handleDismiss();
    }, 1450);

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
    }, 320);
  };

  return (
    <div
      id="app-splash-screen"
      onClick={handleDismiss}
      className={`fixed inset-0 z-9999 flex flex-col items-center justify-between p-6 sm:p-10 select-none overflow-hidden cursor-pointer transition-all duration-320 ease-out bg-[#0B1528] ${
        isClosing
          ? 'opacity-0 scale-98 pointer-events-none'
          : 'opacity-100 scale-100'
      }`}
      style={{
        background: 'radial-gradient(ellipse at 50% 30%, #13284A 0%, #0B1629 65%, #070E1A 100%)',
      }}
    >
      {/* Background Subtle Accent */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      {/* Top Header Badge */}
      <div className="w-full flex items-center justify-between max-w-md relative z-10 animate-fade-in">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-[11px] font-semibold text-slate-300 tracking-wider uppercase font-mono">
            {campusCode}
          </span>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleDismiss();
          }}
          className="text-xs font-semibold text-slate-400 hover:text-white px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <span>Skip</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Central Brand Identity */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-sm space-y-6 animate-fade-in my-auto">
        {/* Official Logo with Refined Glow */}
        <div className="relative">
          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl shadow-2xl overflow-hidden border border-white/20 relative group">
            <AppLogo className="w-full h-full" withSquircle={true} />
          </div>
        </div>

        {/* Institution Titles */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2E6FB0]/20 border border-[#2E6FB0]/40 text-[11px] font-bold text-[#8FC4F8] uppercase tracking-wider">
            <span>Academic Portal</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-heading leading-snug">
            {campusName}
          </h1>
          <p className="text-xs text-blue-200/70 font-medium">
            Campus Academic Management System
          </p>
        </div>

        {/* Streamlined Progress Indicator */}
        <div className="w-full space-y-2 pt-2">
          <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden backdrop-blur-xs p-[1px] border border-white/10">
            <div
              className="h-full rounded-full bg-linear-to-r from-[#2E6FB0] via-[#5B93D1] to-emerald-400 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-300 font-medium px-1">
            <span className="truncate max-w-[220px] text-left">{stageText}</span>
            <span className="font-mono text-slate-400">{progress}%</span>
          </div>
        </div>
      </div>

      {/* Bottom Footer Credits & Developer Attribution */}
      <div className="w-full max-w-md relative z-10 flex flex-col items-center text-center space-y-3 animate-fade-in">
        {/* Developed by Adarsh Kudachi Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs font-semibold text-slate-200">
            Developed by <span className="text-white font-bold tracking-wide">Adarsh Kudachi</span>
          </span>
        </div>

        <p className="text-[10px] text-slate-500">
          Tap anywhere to continue
        </p>
      </div>
    </div>
  );
};
