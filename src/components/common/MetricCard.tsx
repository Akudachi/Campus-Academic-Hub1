import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  id?: string;
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  accentColor?: 'navy' | 'blue' | 'amber' | 'green' | 'red' | 'purple' | 'slate';
  onClick?: () => void;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  id,
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  accentColor = 'navy',
  onClick,
  className = '',
}) => {
  const colorMap = {
    navy: 'bg-[#13284A] text-white shadow-2xs',
    blue: 'bg-[#2E6FB0] text-white shadow-2xs',
    amber: 'bg-[#E0982A] text-slate-950 shadow-2xs',
    green: 'bg-[#1E8E5A] text-white shadow-2xs',
    red: 'bg-[#C0392B] text-white shadow-2xs',
    purple: 'bg-purple-600 text-white shadow-2xs',
    slate: 'bg-slate-700 text-white shadow-2xs',
  };

  return (
    <div
      id={id}
      onClick={onClick}
      className={`bg-white rounded-2xl p-4 sm:p-5 border border-[#DCE3ED] shadow-2xs flex flex-col justify-between transition-all duration-200 ${
        onClick ? 'cursor-pointer active:scale-[0.98] hover:border-slate-300 hover:shadow-xs' : ''
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#667085] truncate">{title}</p>
          <div className="flex items-baseline gap-2 flex-wrap">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-[#13284A] tracking-tight font-display">{value}</h3>
            {trend && (
              <span
                className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
                  trend.isPositive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}
              >
                {trend.value}
              </span>
            )}
          </div>
        </div>
        {Icon && (
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colorMap[accentColor]}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      {subtitle && <p className="text-xs text-[#667085] mt-2.5 pt-2 border-t border-slate-100 font-medium">{subtitle}</p>}
    </div>
  );
};
