import { type ReactNode } from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  subtitle?: string;
  colorClass?: string;
}

export const MetricCard = ({
  title,
  value,
  icon,
  trend,
  subtitle,
  colorClass = 'text-coral-500'
}: MetricCardProps) => {
  return (
    <div className="bg-white rounded-lg border border-piedra-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-cemento-600">{title}</p>
          <p className={`mt-2 text-3xl font-semibold ${colorClass}`}>
            {value}
          </p>
          {subtitle && (
            <p className="mt-1 text-sm text-cemento-500">{subtitle}</p>
          )}
          {trend && (
            <div className="mt-2 flex items-center gap-1">
              <span
                className={`text-sm font-medium ${
                  trend.isPositive ? 'text-success-600' : 'text-error-600'
                }`}
              >
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-cemento-500">vs período anterior</span>
            </div>
          )}
        </div>
        {icon && (
          <div className={`rounded-lg bg-cemento-50 p-3 ${colorClass}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};
