import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  trend?: number;
  isPositive?: boolean;
  subtext?: string;
  icon?: React.ReactNode;
}

export function MetricCard({
  title,
  value,
  unit,
  trend,
  isPositive = true,
  subtext,
  icon,
}: MetricCardProps) {
  const trendIsGood = isPositive ? trend! > 0 : trend! < 0;

  return (
    <div className="rounded-xl border border-l-4 border-l-blue-500 border-gray-200 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {icon && <div className="p-2 rounded-lg bg-blue-50">{icon}</div>}
          <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        </div>
        {trend !== undefined && (
          <div
            className={`flex items-center gap-1 text-xs font-semibold ${
              trendIsGood ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {trendIsGood ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>

      <div className="mb-2">
        <p className="text-3xl font-bold text-gray-900">
          {value}
          {unit && <span className="text-lg text-gray-500 ml-1">{unit}</span>}
        </p>
      </div>

      {subtext && <p className="text-xs text-gray-500">{subtext}</p>}
    </div>
  );
}
