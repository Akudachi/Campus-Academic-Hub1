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
  accentColor?: 'navy' | 'blue' | 'amber' | 'green' | 'red' | 'slate';
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
  className = '',
}) => {
  const colorMap = {
    navy: 'bg-[#13284A]/5 text-[#13284A] border-[#13284A]/20',
    blue: 'bg-[#2E6FB0]/10 text-[#2E6FB0] border-[#2E6FB0]/20',
    amber: 'bg-[#E0982A]/10 text-[#E0982A] border-[#E0982A]/20',
    green: 'bg-[#1E8E5A]/10 text-[#1E8E5A] border-[#1E8E5A]/20',
    red: 'bg-[#C0392B]/10 text-[#C0392B] border-[#C0392B]/20',
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  return (
    <div
      id={id}
      className={`bg-white rounded-xl p-5 border border-[#DCE3ED] shadow-xs flex flex-col justify-between transition-all duration-150 hover:border-slate-300 ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#667085]">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl sm:text-3xl font-bold text-[#13284A] tracking-tight">{value}</h3>
            {trend && (
              <span
                className={`text-xs font-medium ${
                  trend.isPositive ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {trend.value}
              </span>
            )}
          </div>
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-lg shrink-0 ${colorMap[accentColor]}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      {subtitle && <p className="text-xs text-[#667085] mt-3 pt-2 border-t border-slate-100">{subtitle}</p>}
    </div>
  );
};
