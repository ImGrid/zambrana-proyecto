import {
  CubeIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';
import { StatsGrid, type StatMetric } from '@/components/ui/StatsGrid';
import { useEstadisticasMateriales } from '../hooks/useMateriales';

export const MaterialesStatsGrid = () => {
  const { data: stats, isLoading, error } = useEstadisticasMateriales();

  if (!stats) {
    return null;
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const stockBajoTotal = stats.stock_critico + stats.stock_bajo;

  const metrics: StatMetric[] = [
    {
      title: 'Total de Materiales',
      value: stats.total_materiales,
      icon: <CubeIcon className="h-6 w-6" />,
      subtitle: `${stats.stock_normal} con stock normal`,
      colorClass: 'text-orange-500'
    },
    {
      title: 'Stock Bajo',
      value: stockBajoTotal,
      icon: <ExclamationTriangleIcon className="h-6 w-6" />,
      subtitle: `${stats.stock_critico} críticos`,
      colorClass: stockBajoTotal > 0 ? 'text-red-500' : 'text-green-500'
    },
    {
      title: 'Valor de Inventario',
      value: formatCurrency(stats.valor_total_inventario),
      icon: <CurrencyDollarIcon className="h-6 w-6" />,
      subtitle: 'Stock actual',
      colorClass: 'text-blue-500'
    },
    {
      title: 'Movimientos (30d)',
      value: stats.movimientos_ultimos_30dias,
      icon: <ArrowTrendingUpIcon className="h-6 w-6" />,
      subtitle: 'Últimos 30 días',
      colorClass: 'text-purple-500'
    }
  ];

  return (
    <StatsGrid
      metrics={metrics}
      isLoading={isLoading}
      error={error}
      columns={4}
      errorTitle="Error al cargar estadísticas de materiales"
      errorMessage="No se pudieron cargar las estadísticas de materiales. Por favor, intenta nuevamente."
    />
  );
};
