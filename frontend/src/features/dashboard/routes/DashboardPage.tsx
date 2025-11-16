import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useDashboard, useRefreshDashboard } from '../hooks/useDashboard';
import { MetricsGrid } from '../components/MetricsGrid';
import { OperationalStatsGrid } from '../components/OperationalStatsGrid';
import { PedidosChart } from '../components/PedidosChart';
import { IngresosChart } from '../components/IngresosChart';
import { EstadosChart } from '../components/EstadosChart';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';

export const DashboardPage = () => {
  const { user } = useAuth();
  const [dias, setDias] = useState(30);
  const { data, isLoading, error } = useDashboard({ dias });
  const { mutate: refreshViews, isPending: isRefreshing } = useRefreshDashboard();

  const periodos = [
    { value: 7, label: '7 días' },
    { value: 30, label: '30 días' },
    { value: 90, label: '90 días' }
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-cemento-900">Dashboard</h1>
          <p className="text-sm text-cemento-500 mt-1">
            Bienvenido, {user?.nombre}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {periodos.map((periodo) => (
            <button
              key={periodo.value}
              onClick={() => setDias(periodo.value)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                dias === periodo.value
                  ? 'bg-coral-500 text-white'
                  : 'bg-white text-cemento-700 border border-piedra-300 hover:bg-cemento-50'
              }`}
            >
              {periodo.label}
            </button>
          ))}

          {(user?.rol === 'admin' || user?.rol === 'gerente') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => refreshViews()}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Actualizando...' : 'Actualizar Datos'}
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <ErrorState
          title="Error al cargar el dashboard"
          message="No se pudieron cargar los datos del dashboard. Por favor, intenta nuevamente."
        />
      ) : (
        <div className="space-y-6">
          <MetricsGrid dias={dias} />

          <OperationalStatsGrid dias={dias} />

          {!data || data.metricas.length === 0 ? (
            <EmptyState
              title="Sin datos para graficar"
              message={`No hay datos para mostrar en los gráficos de los últimos ${dias} días.`}
            />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <PedidosChart metricas={data.metricas} />
                <IngresosChart metricas={data.metricas} />
              </div>

              <EstadosChart metricas={data.metricas} />
            </>
          )}
        </div>
      )}
    </div>
  );
};
