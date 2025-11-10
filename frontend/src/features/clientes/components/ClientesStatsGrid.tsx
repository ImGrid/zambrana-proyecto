import {
  UserGroupIcon,
  UsersIcon,
  UserPlusIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { StatsGrid, type StatMetric } from '@/components/ui/StatsGrid';
import { useEstadisticasClientes } from '../hooks/useClientes';

export const ClientesStatsGrid = () => {
  const { data: stats, isLoading, error } = useEstadisticasClientes();

  if (!stats) {
    return null;
  }

  const metrics: StatMetric[] = [
    {
      title: 'Total de Clientes',
      value: stats.total_clientes,
      icon: <UserGroupIcon className="h-6 w-6" />,
      subtitle: 'En sistema',
      colorClass: 'text-orange-500'
    },
    {
      title: 'Activos del Mes',
      value: stats.clientes_activos_mes,
      icon: <UsersIcon className="h-6 w-6" />,
      subtitle: 'Con pedidos este mes',
      colorClass: 'text-green-500'
    },
    {
      title: 'Nuevos del Mes',
      value: stats.clientes_nuevos_mes,
      icon: <UserPlusIcon className="h-6 w-6" />,
      subtitle: 'Registrados este mes',
      colorClass: 'text-blue-500'
    },
    {
      title: 'Inactivos (90d)',
      value: stats.clientes_inactivos_90dias,
      icon: <ExclamationTriangleIcon className="h-6 w-6" />,
      subtitle: 'Sin actividad',
      colorClass: stats.clientes_inactivos_90dias > 0 ? 'text-yellow-500' : 'text-green-500'
    }
  ];

  return (
    <StatsGrid
      metrics={metrics}
      isLoading={isLoading}
      error={error}
      columns={4}
      errorTitle="Error al cargar estadísticas de clientes"
      errorMessage="No se pudieron cargar las estadísticas de clientes. Por favor, intenta nuevamente."
    />
  );
};
