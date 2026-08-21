import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'lg',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      {/* Backdrop without blur to ensure crisp, razor-sharp modal content */}
      <div
        className="fixed inset-0 bg-slate-900/60 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Center container with explicit relative z-10 */}
      <div className="relative z-10 flex min-h-full items-center justify-center p-2.5 sm:p-6 text-center">
        <div
          className={`w-full ${maxWidthClasses[maxWidth]} transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-2xl border border-slate-200 transition-all my-4 sm:my-8`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-200 px-4 py-3 sm:px-6 sm:py-4 bg-slate-50">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#13284A] font-serif tracking-tight">{title}</h3>
              {subtitle && <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 font-sans">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 sm:p-6 max-h-[78vh] overflow-y-auto text-slate-900">{children}</div>
        </div>
      </div>
    </div>
  );
};
