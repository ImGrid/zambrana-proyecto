import { Truck, AlertTriangle, Gauge, Clock } from 'lucide-react';
import { MetricCard } from '@/components/ui/MetricCard';
import type { EntregaActiva } from '../types/entregas.types';

interface MetricasEntregasGridProps {
  entregas: EntregaActiva[];
}

// Componente que muestra métricas calculadas de entregas activas
// Datos vienen de entregas activas obtenidas del backend
export function MetricasEntregasGrid({ entregas }: MetricasEntregasGridProps) {
  // Calcular métricas basadas en datos del backend
  const totalActivas = entregas.length;

  const totalDetenidos = entregas.filter((e) => e.esta_detenido).length;

  const velocidadesValidas = entregas
    .map((e) => e.velocidad_promedio_kmh)
    .filter((v) => v > 0);

  const velocidadPromedio =
    velocidadesValidas.length > 0
      ? velocidadesValidas.reduce((acc, v) => acc + v, 0) / velocidadesValidas.length
      : 0;

  // Contar entregas que deberían llegar en los próximos 30 minutos
  // Basado en ruta_calculada.tiempo_total_minutos del backend
  const proximasLlegadas = entregas.filter((e) => {
    if (!e.pedido.ruta_calculada) return false;
    const tiempoRestante = e.pedido.ruta_calculada.tiempo_total_minutos;
    return tiempoRestante <= 30;
  }).length;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="En Camino"
        value={totalActivas}
        icon={<Truck className="h-6 w-6" />}
        subtitle="Entregas activas"
        colorClass="text-info-500"
      />

      <MetricCard
        title="Detenidos"
        value={totalDetenidos}
        icon={<AlertTriangle className="h-6 w-6" />}
        subtitle={totalDetenidos > 0 ? 'Requieren atención' : 'Todos en movimiento'}
        colorClass={totalDetenidos > 0 ? 'text-warning-500' : 'text-success-500'}
      />

      <MetricCard
        title="Velocidad Promedio"
        value={`${velocidadPromedio.toFixed(1)} km/h`}
        icon={<Gauge className="h-6 w-6" />}
        subtitle="Flota activa"
        colorClass="text-tierra-600"
      />

      <MetricCard
        title="Próximas Llegadas"
        value={proximasLlegadas}
        icon={<Clock className="h-6 w-6" />}
        subtitle="En los próximos 30 min"
        colorClass="text-coral-500"
      />
    </div>
  );
}
