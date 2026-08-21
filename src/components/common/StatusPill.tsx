import React from 'react';

interface StatusPillProps {
  status: string;
  label?: string;
  size?: 'sm' | 'md';
}

export const StatusPill: React.FC<StatusPillProps> = ({ status, label, size = 'md' }) => {
  const normalized = (status || '').toLowerCase();

  let bgClass = 'bg-slate-100 text-slate-700 border-slate-200';
  let dotClass = 'bg-slate-500';
  let displayLabel = label || status;

  switch (normalized) {
    case 'present':
    case 'submitted':
    case 'active':
    case 'good':
    case 'confirmed':
      bgClass = 'bg-emerald-50 text-emerald-800 border-emerald-200';
      dotClass = 'bg-emerald-600';
      break;

    case 'absent':
    case 'not_submitted':
    case 'critical':
    case 'invalid':
    case 'urgent':
      bgClass = 'bg-rose-50 text-rose-800 border-rose-200';
      dotClass = 'bg-rose-600';
      break;

    case 'warning':
    case 'setup':
    case 'pending':
    case 'processing':
    case 'ready_for_review':
    case 'draft':
      bgClass = 'bg-amber-50 text-amber-800 border-amber-200';
      dotClass = 'bg-amber-600';
      break;

    case 'everyone':
    case 'published':
    case 'normal':
      bgClass = 'bg-sky-50 text-sky-800 border-sky-200';
      dotClass = 'bg-sky-600';
      break;

    case 'archived':
    case 'disabled':
      bgClass = 'bg-slate-100 text-slate-600 border-slate-200';
      dotClass = 'bg-slate-400';
      break;
  }

  // Pretty display overrides
  if (!label) {
    if (normalized === 'not_submitted') displayLabel = 'Not Submitted';
    if (normalized === 'submitted') displayLabel = 'Submitted';
    if (normalized === 'ready_for_review') displayLabel = 'Ready for Review';
  }

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border whitespace-nowrap ${bgClass} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotClass}`} />
      <span>{displayLabel}</span>
    </span>
  );
};
