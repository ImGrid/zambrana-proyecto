import {
  UserGroupIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  IdentificationIcon
} from '@heroicons/react/24/outline';
import { StatsGrid, type StatMetric } from '@/components/ui/StatsGrid';
import { useEstadisticasConductores } from '../hooks/useConductores';

export const ConductoresStatsGrid = () => {
  const { data: stats, isLoading, error } = useEstadisticasConductores();

  if (!stats) {
    return null;
  }

  const licenciasConProblemas = stats.licencias_por_vencer_30dias + stats.licencias_vencidas;

  const metrics: StatMetric[] = [
    {
      title: 'Total de Conductores',
      value: stats.total_conductores,
      icon: <UserGroupIcon className="h-6 w-6" />,
      subtitle: `${stats.conductores_activos} activos`,
      colorClass: 'text-coral-500'
    },
    {
      title: 'Conductores Activos',
      value: stats.conductores_activos,
      icon: <CheckCircleIcon className="h-6 w-6" />,
      subtitle: 'Disponibles',
      colorClass: 'text-success-500'
    },
    {
      title: 'Licencias por Vencer',
      value: stats.licencias_por_vencer_30dias,
      icon: <ExclamationCircleIcon className="h-6 w-6" />,
      subtitle: 'Próximos 30 días',
      colorClass: stats.licencias_por_vencer_30dias > 0 ? 'text-arena-500' : 'text-success-500'
    },
    {
      title: 'Licencias Vencidas',
      value: stats.licencias_vencidas,
      icon: <IdentificationIcon className="h-6 w-6" />,
      subtitle: 'Requiere atención',
      colorClass: stats.licencias_vencidas > 0 ? 'text-error-500' : 'text-success-500'
    }
  ];

  return (
    <StatsGrid
      metrics={metrics}
      isLoading={isLoading}
      error={error}
      columns={4}
      errorTitle="Error al cargar estadísticas de conductores"
      errorMessage="No se pudieron cargar las estadísticas de conductores. Por favor, intenta nuevamente."
    />
  );
};
