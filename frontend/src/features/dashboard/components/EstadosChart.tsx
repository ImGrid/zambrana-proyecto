import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { DashboardMetrica } from '../types/dashboard.types';
import { CHART_COLORS, GRID_STYLE, AXIS_STYLE, TOOLTIP_STYLE } from '@/config/chart-colors';

interface EstadosChartProps {
  metricas: DashboardMetrica[];
}

export const EstadosChart = ({ metricas }: EstadosChartProps) => {
  // Calcular totales por estado sumando todas las métricas
  const totales = metricas.reduce(
    (acc, metrica) => ({
      entregados: acc.entregados + metrica.entregados,
      en_proceso: acc.en_proceso + metrica.en_proceso,
      cancelados: acc.cancelados + metrica.cancelados
    }),
    { entregados: 0, en_proceso: 0, cancelados: 0 }
  );

  const data = [
    { estado: 'Entregados', cantidad: totales.entregados, fill: CHART_COLORS.success },
    { estado: 'En Proceso', cantidad: totales.en_proceso, fill: CHART_COLORS.info },
    { estado: 'Cancelados', cantidad: totales.cancelados, fill: CHART_COLORS.error }
  ];

  return (
    <div className="bg-white rounded-lg border border-piedra-200 p-6">
      <h3 className="text-lg font-semibold text-cemento-900 mb-4">
        Distribución por Estado
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid {...GRID_STYLE} />
          <XAxis
            dataKey="estado"
            tick={AXIS_STYLE.tick}
            tickLine={AXIS_STYLE.tickLine}
          />
          <YAxis
            tick={AXIS_STYLE.tick}
            tickLine={AXIS_STYLE.tickLine}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
          />
          <Legend
            wrapperStyle={{ fontSize: '0.875rem' }}
            iconType="circle"
          />
          <Bar
            dataKey="cantidad"
            fill={CHART_COLORS.primary}
            radius={[8, 8, 0, 0]}
            name="Pedidos"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
