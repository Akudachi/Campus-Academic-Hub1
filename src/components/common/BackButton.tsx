import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  onClick: () => void;
  label?: string;
  className?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({
  onClick,
  label = 'Back to Overview',
  className = '',
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border border-[#DCE3ED] bg-white text-[#13284A] hover:bg-slate-50 hover:border-[#2E6FB0] transition-all shadow-2xs active:scale-98 cursor-pointer shrink-0 ${className}`}
    >
      <ArrowLeft className="w-3.5 h-3.5 text-[#2E6FB0]" />
      <span>{label}</span>
    </button>
  );
};
