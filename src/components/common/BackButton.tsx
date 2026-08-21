import React from 'react';
import { ChevronLeft } from 'lucide-react';

interface BackButtonProps {
  onClick: () => void;
  label?: string;
  className?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({
  onClick,
  label = 'Back',
  className = '',
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200/90 bg-white/95 backdrop-blur-xs text-[#13284A] hover:bg-slate-50 hover:border-[#2E6FB0] transition-all shadow-2xs active:scale-95 cursor-pointer shrink-0 ${className}`}
    >
      <ChevronLeft className="w-4 h-4 text-[#2E6FB0] stroke-[2.5]" />
      <span className="tracking-tight">{label}</span>
    </button>
  );
};

