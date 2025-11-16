import { useState } from 'react';
import { Filter, ShoppingBag } from 'lucide-react';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { PedidoCard } from '@/features/pedido/components/PedidoCard';
import { usePedidos } from '@/features/pedido/hooks/usePedidos';

const ITEMS_PER_PAGE = 10;

export const MisPedidosPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [estadoFilter, setEstadoFilter] = useState<number | undefined>(undefined);

  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  const { data, isLoading, isError, error, refetch } = usePedidos({
    limit: ITEMS_PER_PAGE,
    offset,
    estado_id: estadoFilter,
  });

  const totalPages = data ? Math.ceil(data.total / ITEMS_PER_PAGE) : 0;

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <ErrorState
          title="Error al cargar pedidos"
          message={error?.message || 'Ocurrió un error inesperado'}
          retry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-cemento-900 mb-2">Mis Pedidos</h1>
        <p className="text-cemento-600">
          Consulta el estado de tus pedidos y realiza seguimiento
        </p>
      </div>

      {/* Filtros */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <Filter className="h-5 w-5 text-cemento-400" />
          <select
            value={estadoFilter || ''}
            onChange={(e) => {
              setEstadoFilter(e.target.value ? Number(e.target.value) : undefined);
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-piedra-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral-500 focus:border-transparent"
          >
            <option value="">Todos los estados</option>
            <option value="1">Pendiente</option>
            <option value="2">Confirmado</option>
            <option value="3">En camino</option>
            <option value="7">Entregado</option>
            <option value="8">Cancelado</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-lg border border-piedra-200 p-6 animate-pulse"
            >
              <div className="h-6 bg-cemento-200 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-cemento-200 rounded w-2/3 mb-2"></div>
              <div className="h-4 bg-cemento-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && data && data.pedidos.length === 0 && (
        <EmptyState
          icon={ShoppingBag}
          title="No hay pedidos"
          message={
            estadoFilter
              ? 'No se encontraron pedidos con ese estado'
              : 'Aún no has realizado ningún pedido'
          }
        />
      )}

      {/* Pedidos List */}
      {!isLoading && data && data.pedidos.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-4 mb-8">
            {data.pedidos.map((pedido) => (
              <PedidoCard key={pedido.id} pedido={pedido} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};
