import {
  TruckIcon,
  ExclamationTriangleIcon,
  StarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { StatsGrid, type StatMetric } from '@/components/ui/StatsGrid';
import { useEstadisticasCamiones } from '@/features/camiones/hooks/useCamiones';
import { useEstadisticasConductores } from '@/features/conductores/hooks/useConductores';
import { useEstadisticasMateriales } from '@/features/materiales/hooks/useMateriales';
import { useEstadisticasPedidos } from '@/features/pedidos/hooks/usePedidos';

interface OperationalStatsGridProps {
  dias?: number;
}

export const OperationalStatsGrid = ({ dias = 30 }: OperationalStatsGridProps) => {
  const { data: statsCamiones, isLoading: loadingCamiones } = useEstadisticasCamiones();
  const { data: statsConductores, isLoading: loadingConductores } = useEstadisticasConductores();
  const { data: statsMateriales, isLoading: loadingMateriales } = useEstadisticasMateriales();
  const { data: statsPedidos, isLoading: loadingPedidos } = useEstadisticasPedidos(dias);

  const isLoading = loadingCamiones || loadingConductores || loadingMateriales || loadingPedidos;

  if (!statsCamiones || !statsConductores || !statsMateriales || !statsPedidos) {
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

  // Capacidad Operativa: verde si ambos >70%, amarillo si alguno <70%, rojo si alguno <50%
  const capacidadCamiones = (statsCamiones.camiones_disponibles / statsCamiones.total_camiones) * 100;
  const capacidadConductores = (statsConductores.conductores_activos / statsConductores.total_conductores) * 100;
  const capacidadMinima = Math.min(capacidadCamiones, capacidadConductores);
  const capacidadColor = capacidadMinima >= 70 ? 'text-green-500' : capacidadMinima >= 50 ? 'text-yellow-500' : 'text-red-500';

  // Alertas Críticas: rojo si hay problemas, verde si todo ok
  const stockBajo = statsMateriales.stock_critico + statsMateriales.stock_bajo;
  const licenciasProblema = statsConductores.licencias_vencidas + statsConductores.licencias_por_vencer_30dias;
  const tieneAlertas = stockBajo > 0 || licenciasProblema > 0;
  const alertasColor = tieneAlertas ? 'text-red-500' : 'text-green-500';
  const alertasTexto = tieneAlertas
    ? `${stockBajo} stock bajo, ${licenciasProblema} licencias`
    : 'Todo en orden';

  // Cliente Top
  const clienteTop = statsPedidos.cliente_top_mes
    ? `${statsPedidos.cliente_top_mes.razon_social}`
    : 'Sin datos';
  const clienteTopMonto = statsPedidos.cliente_top_mes
    ? formatCurrency(statsPedidos.cliente_top_mes.monto_total)
    : formatCurrency(0);

  // Pedidos Pendientes: naranja si >5, verde si <=5
  const pedidosPendientesColor = statsPedidos.pedidos_pendientes > 5 ? 'text-orange-500' : 'text-green-500';

  const metrics: StatMetric[] = [
    {
      title: 'Capacidad Operativa',
      value: `${statsCamiones.camiones_disponibles} / ${statsConductores.conductores_activos}`,
      icon: <TruckIcon className="h-6 w-6" />,
      subtitle: 'Camiones / Conductores',
      colorClass: capacidadColor
    },
    {
      title: 'Alertas Críticas',
      value: tieneAlertas ? stockBajo + licenciasProblema : '0',
      icon: <ExclamationTriangleIcon className="h-6 w-6" />,
      subtitle: alertasTexto,
      colorClass: alertasColor
    },
    {
      title: 'Cliente Top del Mes',
      value: clienteTop,
      icon: <StarIcon className="h-6 w-6" />,
      subtitle: clienteTopMonto,
      colorClass: 'text-purple-500'
    },
    {
      title: 'Pedidos Pendientes',
      value: statsPedidos.pedidos_pendientes,
      icon: <ClockIcon className="h-6 w-6" />,
      subtitle: 'Requieren asignación',
      colorClass: pedidosPendientesColor
    }
  ];

  return (
    <StatsGrid
      metrics={metrics}
      isLoading={isLoading}
      columns={4}
      errorTitle="Error al cargar métricas operacionales"
      errorMessage="No se pudieron cargar las métricas operacionales. Por favor, intenta nuevamente."
    />
  );
};
