import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { DashboardMetrica } from '../types/dashboard.types';
import { CHART_COLORS, GRID_STYLE, AXIS_STYLE, TOOLTIP_STYLE } from '@/config/chart-colors';

interface IngresosChartProps {
  metricas: DashboardMetrica[];
}

export const IngresosChart = ({ metricas }: IngresosChartProps) => {
  const data = metricas.map((metrica) => ({
    fecha: new Date(metrica.fecha).toLocaleDateString('es-BO', {
      day: '2-digit',
      month: 'short'
    }),
    ingresos: metrica.ingresos_dia
  }));

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="bg-white rounded-lg border border-piedra-200 p-6">
      <h3 className="text-lg font-semibold text-cemento-900 mb-4">
        Ingresos Diarios
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={CHART_COLORS.info} stopOpacity={0.3} />
              <stop offset="95%" stopColor={CHART_COLORS.info} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid {...GRID_STYLE} />
          <XAxis
            dataKey="fecha"
            tick={AXIS_STYLE.tick}
            tickLine={AXIS_STYLE.tickLine}
          />
          <YAxis
            tick={AXIS_STYLE.tick}
            tickLine={AXIS_STYLE.tickLine}
            tickFormatter={formatCurrency}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(value: number) => [formatCurrency(value), 'Ingresos']}
          />
          <Area
            type="monotone"
            dataKey="ingresos"
            stroke={CHART_COLORS.info}
            strokeWidth={2}
            fill="url(#colorIngresos)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
