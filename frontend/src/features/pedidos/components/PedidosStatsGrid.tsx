import {
  ShoppingCartIcon,
  ClockIcon,
  CheckCircleIcon,
  TruckIcon
} from '@heroicons/react/24/outline';
import { StatsGrid, type StatMetric } from '@/components/ui/StatsGrid';
import { useEstadisticasPedidos } from '../hooks/usePedidos';

interface PedidosStatsGridProps {
  dias?: number;
}

export const PedidosStatsGrid = ({ dias = 30 }: PedidosStatsGridProps) => {
  const { data: stats, isLoading, error } = useEstadisticasPedidos(dias);

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
    ? ((stats.pedidos_entregados / stats.total_pedidos) * 100).toFixed(1)
    : '0.0';

  const metrics: StatMetric[] = [
    {
      title: 'Total de Pedidos',
      value: stats.total_pedidos,
      icon: <ShoppingCartIcon className="h-6 w-6" />,
      subtitle: `${stats.pedidos_pendientes} pendientes`,
      colorClass: 'text-coral-500'
    },
    {
      title: 'Pedidos Activos',
      value: stats.pedidos_confirmados + stats.pedidos_en_camino,
      icon: <TruckIcon className="h-6 w-6" />,
      subtitle: `${stats.pedidos_en_camino} en ruta`,
      colorClass: 'text-info-500'
    },
    {
      title: 'Tasa de Entrega',
      value: `${tasaEntrega}%`,
      icon: <CheckCircleIcon className="h-6 w-6" />,
      subtitle: `${stats.pedidos_entregados} entregados`,
      colorClass: 'text-success-500'
    },
    {
      title: `Ingresos (${dias}d)`,
      value: formatCurrency(stats.monto_total_mes),
      icon: <ClockIcon className="h-6 w-6" />,
      subtitle: `${stats.volumen_total_mes_m3} m³ totales`,
      colorClass: 'text-tierra-500'
    }
  ];

  return (
    <StatsGrid
      metrics={metrics}
      isLoading={isLoading}
      error={error}
      columns={4}
      errorTitle="Error al cargar estadísticas de pedidos"
      errorMessage="No se pudieron cargar las estadísticas de pedidos. Por favor, intenta nuevamente."
    />
  );
};
