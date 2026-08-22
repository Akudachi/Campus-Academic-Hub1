import React from 'react';

interface AppLogoProps {
  className?: string;
  size?: number | string;
  withSquircle?: boolean;
}

export const AppLogo: React.FC<AppLogoProps> = ({
  className = 'w-10 h-10',
  size,
  withSquircle = true,
}) => {
  const style = size ? { width: size, height: size } : undefined;

  return (
    <svg
      viewBox="0 0 512 512"
      className={`shrink-0 select-none ${className}`}
      style={style}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="KLECET Official Logo"
    >
      {/* Deep Navy Squircle Background */}
      {withSquircle && (
        <rect width="512" height="512" rx="115" fill="#0D1E3A" />
      )}

      {/* Network Nodes Connector Stems */}
      <g stroke="#7D90A8" strokeWidth="18" strokeLinecap="round">
        {/* Top Node Connector */}
        <line x1="256" y1="256" x2="256" y2="100" />
        {/* Bottom-Left Node Connector */}
        <line x1="256" y1="256" x2="120" y2="335" />
        {/* Bottom-Right Node Connector */}
        <line x1="256" y1="256" x2="392" y2="335" />
      </g>

      {/* Top Node (Pure White) */}
      <circle cx="256" cy="100" r="35" fill="#FFFFFF" />

      {/* Bottom-Left Node (Royal Blue) */}
      <circle cx="120" cy="335" r="40" fill="#2563EB" />

      {/* Bottom-Right Node (Sky Azure Blue) */}
      <circle cx="392" cy="335" r="40" fill="#5B93D1" />

      {/* Center Circle (Golden Amber / Honey Yellow) */}
      <circle cx="256" cy="256" r="76" fill="#E59E27" />

      {/* Graduation Cap / Mortarboard Emblem in Dark Navy */}
      <g fill="#0D1E3A">
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
  );
};
