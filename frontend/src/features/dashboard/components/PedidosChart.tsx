import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { DashboardMetrica } from '../types/dashboard.types';
import { CHART_COLORS, GRID_STYLE, AXIS_STYLE, TOOLTIP_STYLE } from '@/config/chart-colors';

interface PedidosChartProps {
  metricas: DashboardMetrica[];
}

export const PedidosChart = ({ metricas }: PedidosChartProps) => {
  const data = metricas.map((metrica) => ({
    fecha: new Date(metrica.fecha).toLocaleDateString('es-BO', {
      day: '2-digit',
      month: 'short'
    }),
    'Total Pedidos': metrica.total_pedidos,
    'Entregados': metrica.entregados,
    'En Proceso': metrica.en_proceso,
    'Cancelados': metrica.cancelados
  }));

  return (
    <div className="bg-white rounded-lg border border-piedra-200 p-6">
      <h3 className="text-lg font-semibold text-cemento-900 mb-4">
        Evolución de Pedidos
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid {...GRID_STYLE} />
          <XAxis
            dataKey="fecha"
            tick={AXIS_STYLE.tick}
            tickLine={AXIS_STYLE.tickLine}
          />
          <YAxis
            tick={AXIS_STYLE.tick}
            tickLine={AXIS_STYLE.tickLine}
          />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Legend
            wrapperStyle={{ fontSize: '0.875rem' }}
            iconType="circle"
          />
          <Line
            type="monotone"
            dataKey="Total Pedidos"
            stroke={CHART_COLORS.primary}
            strokeWidth={2}
            dot={{ fill: CHART_COLORS.primary, r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="Entregados"
            stroke={CHART_COLORS.success}
            strokeWidth={2}
            dot={{ fill: CHART_COLORS.success, r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="En Proceso"
            stroke={CHART_COLORS.info}
            strokeWidth={2}
            dot={{ fill: CHART_COLORS.info, r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="Cancelados"
            stroke={CHART_COLORS.error}
            strokeWidth={2}
            dot={{ fill: CHART_COLORS.error, r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
