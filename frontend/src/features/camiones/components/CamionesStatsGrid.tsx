import {
  TruckIcon,
  CheckCircleIcon,
  WrenchScrewdriverIcon,
  CubeIcon
} from '@heroicons/react/24/outline';
import { StatsGrid, type StatMetric } from '@/components/ui/StatsGrid';
import { useEstadisticasCamiones } from '../hooks/useCamiones';

export const CamionesStatsGrid = () => {
  const { data: stats, isLoading, error } = useEstadisticasCamiones();

  if (!stats) {
    return null;
  }

  const metrics: StatMetric[] = [
    {
      title: 'Total de Camiones',
      value: stats.total_camiones,
      icon: <TruckIcon className="h-6 w-6" />,
      subtitle: `${stats.camiones_activos} activos`,
      colorClass: 'text-coral-500'
    },
    {
      title: 'Disponibles',
      value: stats.camiones_disponibles,
      icon: <CheckCircleIcon className="h-6 w-6" />,
      subtitle: 'Listos para asignar',
      colorClass: 'text-success-500'
    },
    {
      title: 'En Mantenimiento',
      value: stats.camiones_en_mantenimiento,
      icon: <WrenchScrewdriverIcon className="h-6 w-6" />,
      subtitle: 'Fuera de servicio',
      colorClass: 'text-arena-500'
    },
    {
      title: 'Capacidad Total',
      value: `${stats.capacidad_total_m3} m³`,
      icon: <CubeIcon className="h-6 w-6" />,
      subtitle: 'Flota activa',
      colorClass: 'text-info-500'
    }
  ];

  return (
    <StatsGrid
      metrics={metrics}
      isLoading={isLoading}
      error={error}
      columns={4}
      errorTitle="Error al cargar estadísticas de camiones"
      errorMessage="No se pudieron cargar las estadísticas de camiones. Por favor, intenta nuevamente."
    />
  );
};
