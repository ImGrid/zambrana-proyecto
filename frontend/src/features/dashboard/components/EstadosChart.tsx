import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { DashboardMetrica } from '../types/dashboard.types';

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
    { estado: 'Entregados', cantidad: totales.entregados, fill: '#10b981' },
    { estado: 'En Proceso', cantidad: totales.en_proceso, fill: '#3b82f6' },
    { estado: 'Cancelados', cantidad: totales.cancelados, fill: '#ef4444' }
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Distribución por Estado
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="estado"
            tick={{ fill: '#6b7280', fontSize: 12 }}
            tickLine={{ stroke: '#e5e7eb' }}
          />
          <YAxis
            tick={{ fill: '#6b7280', fontSize: 12 }}
            tickLine={{ stroke: '#e5e7eb' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              fontSize: '0.875rem'
            }}
            cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
          />
          <Legend
            wrapperStyle={{ fontSize: '0.875rem' }}
            iconType="circle"
          />
          <Bar
            dataKey="cantidad"
            fill="#FF6B35"
            radius={[8, 8, 0, 0]}
            name="Pedidos"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
