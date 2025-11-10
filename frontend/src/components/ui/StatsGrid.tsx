import { type ReactNode } from 'react';
import { MetricCard } from './MetricCard';
import { Spinner } from './Spinner';
import { ErrorState } from './ErrorState';

export interface StatMetric {
  title: string;
  value: string | number;
  icon?: ReactNode;
  subtitle?: string;
  colorClass?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

interface StatsGridProps {
  metrics: StatMetric[];
  isLoading?: boolean;
  error?: Error | null;
  columns?: 2 | 3 | 4;
  errorTitle?: string;
  errorMessage?: string;
}

export const StatsGrid = ({
  metrics,
  isLoading = false,
  error = null,
  columns = 4,
  errorTitle = 'Error al cargar estadísticas',
  errorMessage = 'No se pudieron cargar las estadísticas. Por favor, intenta nuevamente.'
}: StatsGridProps) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title={errorTitle}
        message={errorMessage}
      />
    );
  }

  if (!metrics || metrics.length === 0) {
    return null;
  }

  const gridColsClass = {
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-2 lg:grid-cols-3',
    4: 'sm:grid-cols-2 lg:grid-cols-4'
  }[columns];

  return (
    <div className={`grid grid-cols-1 gap-6 ${gridColsClass}`}>
      {metrics.map((metric, index) => (
        <MetricCard
          key={`${metric.title}-${index}`}
          title={metric.title}
          value={metric.value}
          icon={metric.icon}
          subtitle={metric.subtitle}
          colorClass={metric.colorClass}
          trend={metric.trend}
        />
      ))}
    </div>
  );
};
