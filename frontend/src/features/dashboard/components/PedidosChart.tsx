import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { DashboardMetrica } from '../types/dashboard.types';

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
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Evolución de Pedidos
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="fecha"
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
          />
          <Legend
            wrapperStyle={{ fontSize: '0.875rem' }}
            iconType="circle"
          />
          <Line
            type="monotone"
            dataKey="Total Pedidos"
            stroke="#FF6B35"
            strokeWidth={2}
            dot={{ fill: '#FF6B35', r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="Entregados"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ fill: '#10b981', r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="En Proceso"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ fill: '#3b82f6', r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="Cancelados"
            stroke="#ef4444"
            strokeWidth={2}
            dot={{ fill: '#ef4444', r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
