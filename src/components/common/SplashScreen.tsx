import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';

interface SplashScreenProps {
  onComplete?: () => void;
  brandTitle?: string;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onComplete,
  brandTitle = 'KLECET',
}) => {
  // Timeline Stages:
  // 0–1s: 'ambient' - KLECET Deep Institutional Navy (#0D1E3A / #13284A) with ambient blue/gold aura
  // 1–2s: 'line-sweep' - Sapphire & Sky Azure luminous beam sweeps through center
  // 2–3s: 'logo-assembly' - Official KLECET Logo (Squircle, node stems, 3 peripheral nodes, center golden disk, graduation cap) forms kinetically
  // 3–4s: 'revealed' - Clean white typography slides in beneath the logo
  // 4–5s: 'color-shift-hold' - Wordmark transitions into radiant KLECET gold/sapphire hues + gentle breathing aura
  // 5s+: 'fade-out' - Buttery smooth cinematic crossfade into the main dashboard
  const [stage, setStage] = useState<'ambient' | 'line-sweep' | 'logo-assembly' | 'revealed' | 'color-shift-hold' | 'fade-out'>('ambient');
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Stage 1: Line sweep starts at 900ms
    const t1 = setTimeout(() => {
      setStage('line-sweep');
    }, 900);

    // Stage 2: Logo assembly starts at 1800ms
    const t2 = setTimeout(() => {
      setStage('logo-assembly');
    }, 1800);

    // Stage 3: App name reveals at 2900ms
    const t3 = setTimeout(() => {
      setStage('revealed');
    }, 2900);

    // Stage 4: Text color shifts to vibrant brand colors + breathing glow at 3900ms
    const t4 = setTimeout(() => {
      setStage('color-shift-hold');
    }, 3900);

    // Stage 5: Smooth fade out at 4900ms
    const t5 = setTimeout(() => {
      setStage('fade-out');
    }, 4900);

    // Complete handoff to application at 5400ms
    const t6 = setTimeout(() => {
      handleHandoff();
    }, 5400);

    // Keyboard trigger (Enter, Space, Esc) for instant skip
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        handleHandoff();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
      clearTimeout(t6);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleHandoff = () => {
    if (isDismissed) return;
    setIsDismissed(true);
    setTimeout(() => {
      if (onComplete) onComplete();
    }, 350);
  };

  // Subtle floating light particles matched to Dashboard palette (#E59E27, #2E6FB0, #5B93D1, #FFFFFF)
  const particles = [
    { top: '34%', left: '40%', size: '3px', delay: '0ms', duration: '2200ms', color: '#E59E27' },
    { top: '30%', left: '58%', size: '2px', delay: '300ms', duration: '2400ms', color: '#5B93D1' },
    { top: '48%', left: '34%', size: '3px', delay: '600ms', duration: '2000ms', color: '#2E6FB0' },
    { top: '54%', left: '64%', size: '2.5px', delay: '150ms', duration: '2500ms', color: '#FCD34D' },
    { top: '26%', left: '50%', size: '3.5px', delay: '450ms', duration: '2100ms', color: '#FFFFFF' },
    { top: '42%', left: '70%', size: '2px', delay: '750ms', duration: '2300ms', color: '#5B93D1' },
    { top: '58%', left: '42%', size: '3px', delay: '900ms', duration: '2600ms', color: '#E59E27' },
  ];

  return (
    <div
      id="app-splash-screen"
      onClick={handleHandoff}
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-between p-6 sm:p-12 select-none overflow-hidden cursor-pointer transition-all duration-700 ease-in-out ${
        stage === 'fade-out' || isDismissed ? 'opacity-0 pointer-events-none scale-102' : 'opacity-100 scale-100'
      }`}
      style={{
        // Main Dashboard KLECET Navy & Sapphire Color Gradient
        background: 'radial-gradient(ellipse at 50% 45%, #13284A 0%, #0D1E3A 45%, #081326 100%)',
      }}
    >
      {/* Volumetric Brand Aura (KLE Sapphire #2E6FB0 & Golden Amber #E59E27) */}
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] sm:w-[700px] sm:h-[700px] rounded-full pointer-events-none transition-all duration-1000 ${
          stage === 'ambient'
            ? 'opacity-25 scale-90'
            : stage === 'line-sweep'
            ? 'opacity-55 scale-100'
            : 'opacity-80 scale-110'
        }`}
        style={{
          background: 'radial-gradient(circle, rgba(46, 111, 176, 0.32) 0%, rgba(91, 147, 209, 0.15) 40%, rgba(229, 158, 39, 0.08) 60%, transparent 75%)',
          filter: 'blur(60px)',
        }}
      />

      {/* Floating Luminous Knowledge Particles */}
      {stage !== 'ambient' && stage !== 'line-sweep' && (
        <div className="absolute inset-0 pointer-events-none">
          {particles.map((p, idx) => (
            <div
              key={idx}
              className="absolute rounded-full"
              style={{
                top: p.top,
                left: p.left,
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
                boxShadow: `0 0 8px ${p.color}, 0 0 16px ${p.color}`,
                animation: `floatingParticle ${p.duration} ease-in-out infinite`,
                animationDelay: p.delay,
              }}
            />
          ))}
        </div>
      )}

      {/* Stage 1 (1–2s): Center Horizontal Luminous Line Sweep with Dashboard Sapphire Hue */}
      {stage === 'line-sweep' && (
        <div
          className="absolute top-1/2 left-1/2 -translate-y-1/2 h-[2.5px] pointer-events-none z-20 overflow-visible"
          style={{
            animation: 'lineSweepInitial 0.9s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
          }}
        >
          <div className="w-full h-full bg-gradient-to-r from-transparent via-[#5B93D1] to-transparent shadow-[0_0_20px_#2E6FB0,0_0_40px_#FFFFFF]" />
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full blur-[2px] shadow-[0_0_15px_#FFFFFF,0_0_30px_#5B93D1]" />
        </div>
      )}

      {/* Top spacer for balanced vertical framing */}
      <div className="w-full h-6" />

      {/* Center 9:16 Core Lockup: Official App Logo + Title */}
      <div
        className={`relative z-10 flex flex-col items-center justify-center text-center my-auto transition-all duration-700 ${
          stage === 'color-shift-hold' ? 'animate-breathing-glow' : ''
        }`}
      >
        {/* Official App Logo with Dynamic Kinetic Assembly */}
        {stage !== 'ambient' && stage !== 'line-sweep' && (
          <div className="relative w-28 h-28 sm:w-36 sm:h-36 flex items-center justify-center">
            {/* Ambient Backlight Glow behind Logo */}
            <div
              className={`absolute inset-0 rounded-3xl blur-2xl transition-opacity duration-700 ${
                stage === 'revealed' || stage === 'color-shift-hold' ? 'opacity-90' : 'opacity-40'
              }`}
              style={{
                background: 'radial-gradient(circle, rgba(46, 111, 176, 0.45) 0%, rgba(229, 158, 39, 0.25) 50%, transparent 75%)',
              }}
            />

            {/* Official KLECET App Logo Vector with Step-by-Step Formation */}
            <svg
              viewBox="0 0 512 512"
              className="w-full h-full select-none overflow-visible filter drop-shadow-[0_16px_36px_rgba(8,19,38,0.7)]"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-label="KLECET Official Logo"
            >
              {/* Deep Navy Squircle Background Container (#0D1E3A - Exact App Logo container) */}
              <rect
                width="512"
                height="512"
                rx="115"
                fill="#0D1E3A"
                stroke="rgba(220, 227, 237, 0.3)"
                strokeWidth="6"
                style={{
                  animation: 'appLogoSquircle 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                }}
              />

              {/* Network Node Connector Stems */}
              <g
                stroke="#7D90A8"
                strokeWidth="18"
                strokeLinecap="round"
                strokeDasharray="200"
                strokeDashoffset="0"
                style={{
                  animation: 'nodeStemDraw 0.75s ease-out 0.25s forwards',
                }}
              >
                {/* Top Node Connector */}
                <line x1="256" y1="256" x2="256" y2="100" />
                {/* Bottom-Left Node Connector */}
                <line x1="256" y1="256" x2="120" y2="335" />
                {/* Bottom-Right Node Connector */}
                <line x1="256" y1="256" x2="392" y2="335" />
              </g>

              {/* Top Node (Pure White Beacon) */}
              <circle
                cx="256"
                cy="100"
                r="35"
                fill="#FFFFFF"
                style={{
                  animation: 'nodeCirclePop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.45s forwards',
                }}
              />

              {/* Bottom-Left Node (KLE Royal Blue - #2563EB) */}
              <circle
                cx="120"
                cy="335"
                r="40"
                fill="#2563EB"
                style={{
                  animation: 'nodeCirclePop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.55s forwards',
                }}
              />

              {/* Bottom-Right Node (Sky Azure Blue - #5B93D1) */}
              <circle
                cx="392"
                cy="335"
                r="40"
                fill="#5B93D1"
                style={{
                  animation: 'nodeCirclePop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.65s forwards',
                }}
              />

              {/* Center Golden Circle (Brand Amber Sun - #E59E27) */}
              <circle
                cx="256"
                cy="256"
                r="76"
                fill="#E59E27"
                style={{
                  animation: 'centerAmberBurst 0.65s cubic-bezier(0.34, 1.56, 0.64, 1) 0.75s forwards',
                }}
              />

              {/* Graduation Cap / Mortarboard Emblem inside Golden Center */}
              <g
                fill="#0D1E3A"
                style={{
                  animation: 'capEmblemSnap 0.55s cubic-bezier(0.2, 0.9, 0.3, 1.2) 0.95s forwards',
                }}
              >
                {/* Diamond Mortarboard Top */}
                <polygon points="256,214 304,238 256,262 208,238" />

                {/* Skull Cap Lower Band */}
                <path d="M228 248 v15 c0 15 56 15 56 0 v-15 c-10 6 -46 6 -56 0 Z" />

                {/* Hanging Tassel */}
                <path
                  d="M290 246 v32"
                  stroke="#0D1E3A"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                  fill="none"
                />
                <circle cx="290" cy="282" r="4.5" />
              </g>
            </svg>
          </div>
        )}

        {/* Clean, Bold App Title Matched with Dashboard Brand Colors */}
        {(stage === 'revealed' || stage === 'color-shift-hold') && (
          <div
            className="mt-6 flex flex-col items-center select-none"
            style={{
              animation: 'titleSlideFadeIn 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            }}
          >
            {/* Title Wordmark: Shifts from pure white to rich Amber Gold + White gradient */}
            <div className="flex items-center justify-center gap-1.5 transition-all duration-700">
              <span
                className={`text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-[0.14em] uppercase font-sans transition-all duration-700 ${
                  stage === 'color-shift-hold'
                    ? 'text-transparent bg-clip-text bg-gradient-to-r from-white via-amber-200 to-amber-400 drop-shadow-[0_0_25px_rgba(229,158,39,0.7)]'
                    : 'text-white drop-shadow-[0_2px_15px_rgba(255,255,255,0.4)]'
                }`}
              >
                {brandTitle}
              </span>
              <span
                className={`text-sm sm:text-base font-bold font-mono tracking-widest px-1.5 py-0.5 rounded transition-all duration-700 ${
                  stage === 'color-shift-hold'
                    ? 'bg-[#E59E27]/25 text-[#FCD34D] border border-[#E59E27]/50 shadow-[0_0_12px_rgba(229,158,39,0.5)]'
                    : 'bg-white/10 text-white/90 border border-white/20'
                }`}
              >
                HUB
              </span>
            </div>

            {/* Subtitle Matched to Main Dashboard Header Info */}
            <p
              className={`mt-2 text-xs font-semibold tracking-wider transition-colors duration-700 ${
                stage === 'color-shift-hold' ? 'text-amber-200/90' : 'text-[#93C5FD]'
              }`}
            >
              K.L.E. College of Engineering & Technology
            </p>
          </div>
        )}
      </div>

      {/* Developed by Adarsh Kudachi (Bottom Attribution Tag) */}
      <div
        className={`w-full max-w-sm relative z-10 flex items-center justify-center transition-all duration-700 ${
          stage === 'revealed' || stage === 'color-shift-hold'
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-3'
        }`}
      >
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0D1E3A]/70 border border-[#2E6FB0]/30 backdrop-blur-md shadow-md shadow-black/30 transition-all duration-500">
          <Sparkles className="w-3 h-3 text-[#E59E27] animate-pulse" />
          <span className="text-[10.5px] font-normal text-slate-300">
            Developed by{' '}
            <strong className="text-white font-medium tracking-wide">
              Adarsh Kudachi
            </strong>
          </span>
        </div>
      </div>
    </div>
  );
};
