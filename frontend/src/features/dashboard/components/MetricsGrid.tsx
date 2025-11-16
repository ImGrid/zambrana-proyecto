import {
  ShoppingCartIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { MetricCard } from '@/components/ui/MetricCard';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { useEstadisticasPedidos } from '@/features/pedidos/hooks/usePedidos';

interface MetricsGridProps {
  dias?: number;
}

export const MetricsGrid = ({ dias = 30 }: MetricsGridProps) => {
  const { data: stats, isLoading, error } = useEstadisticasPedidos(dias);

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
        title="Error al cargar métricas"
        message="No se pudieron cargar las métricas del dashboard. Por favor, intenta nuevamente."
      />
    );
  }

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

  const tasaEntrega = stats.total_pedidos > 0
    ? (stats.pedidos_entregados / stats.total_pedidos) * 100
    : 0;

  const diasDelMes = new Date().getDate();
  const promedioDiario = diasDelMes > 0 ? stats.monto_total_mes / diasDelMes : 0;

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="Total de Pedidos"
        value={stats.total_pedidos}
        icon={<ShoppingCartIcon className="h-6 w-6" />}
        subtitle="Todos los pedidos"
        colorClass="text-coral-500"
      />

      <MetricCard
        title="Tasa de Entrega"
        value={`${tasaEntrega.toFixed(1)}%`}
        icon={<CheckCircleIcon className="h-6 w-6" />}
        subtitle="Pedidos entregados"
        colorClass="text-success-500"
      />

      <MetricCard
        title="Ingresos del Mes"
        value={formatCurrency(stats.monto_total_mes)}
        icon={<CurrencyDollarIcon className="h-6 w-6" />}
        subtitle="Mes actual"
        colorClass="text-info-500"
      />

      <MetricCard
        title="Promedio Diario"
        value={formatCurrency(promedioDiario)}
        icon={<ChartBarIcon className="h-6 w-6" />}
        subtitle="Ingresos por día"
        colorClass="text-tierra-500"
      />
    </div>
  );
};
