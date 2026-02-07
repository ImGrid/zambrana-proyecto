import { useState } from 'react';
import { PedidosTable } from '../components/PedidosTable';
import { PedidosStatsGrid } from '../components/PedidosStatsGrid';
import { PedidoDetalleModal } from '../components/PedidoDetalleModal';
import { ConfirmarPedidoModal } from '../components/ConfirmarPedidoModal';
import { RechazarPedidoModal } from '../components/RechazarPedidoModal';
import { usePedidos } from '../hooks/usePedidos';
import { useClientes } from '@/features/clientes/hooks/useClientes';
import { SearchInput } from '@/components/ui/SearchInput';
import { SelectFilter } from '@/components/ui/SelectFilter';
import { DateInput } from '@/components/ui/DateInput';
import { Pagination } from '@/components/ui/Pagination';
import { EstadoPedido, ESTADO_PEDIDO_LABELS } from '../types/pedidos.types';
import type { PedidoListItem } from '../types/pedidos.types';
import type { SortOrder } from '@/components/ui/Table';

export const PedidosPage = () => {
  const [page, setPage] = useState(1);
  const [buscar, setBuscar] = useState('');
  const [estadoId, setEstadoId] = useState<number | undefined>(undefined);
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [clienteId, setClienteId] = useState<number | undefined>(undefined);
  const [sortBy, setSortBy] = useState<string | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<SortOrder | undefined>(undefined);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<PedidoListItem | null>(null);
  const [mostrarModalDetalle, setMostrarModalDetalle] = useState(false);
  const [mostrarModalConfirmar, setMostrarModalConfirmar] = useState(false);
  const [mostrarModalRechazar, setMostrarModalRechazar] = useState(false);

  const limit = 20;
  const offset = (page - 1) * limit;

  const { data: clientesData } = useClientes({ limit: 100 });

  const { data, isLoading } = usePedidos({
    limit,
    offset,
    estado_id: estadoId,
    cliente_id: clienteId,
    fecha_desde: fechaDesde || undefined,
    fecha_hasta: fechaHasta || undefined,
    sort_by: sortBy,
    sort_order: sortOrder,
  });

  const pedidosFiltered = data?.pedidos.filter((pedido) => {
    if (!buscar) return true;
    const searchLower = buscar.toLowerCase();
    return (
      pedido.codigo_seguimiento.toLowerCase().includes(searchLower) ||
      pedido.cliente_razon_social.toLowerCase().includes(searchLower) ||
      pedido.direccion_entrega.toLowerCase().includes(searchLower) ||
      pedido.estado_nombre.toLowerCase().includes(searchLower) ||
      pedido.camion_placa?.toLowerCase().includes(searchLower) ||
      pedido.conductor_nombre?.toLowerCase().includes(searchLower)
    );
  }) || [];

  const totalPages = data ? Math.ceil(data.total / limit) : 0;

  const handleVerDetalle = (pedido: PedidoListItem) => {
    setPedidoSeleccionado(pedido);
    setMostrarModalDetalle(true);
  };

  const handleAprobar = (pedido: PedidoListItem) => {
    setPedidoSeleccionado(pedido);
    setMostrarModalConfirmar(true);
  };

  const handleRechazar = (pedido: PedidoListItem) => {
    setPedidoSeleccionado(pedido);
    setMostrarModalRechazar(true);
  };

  const handleCerrarModalDetalle = () => {
    setMostrarModalDetalle(false);
    setPedidoSeleccionado(null);
  };

  const handleCerrarModalConfirmar = () => {
    setMostrarModalConfirmar(false);
    setPedidoSeleccionado(null);
  };

  const handleCerrarModalRechazar = () => {
    setMostrarModalRechazar(false);
    setPedidoSeleccionado(null);
  };

  const handleSort = (key: string) => {
    if (sortBy === key) {
      // Mismo campo: toggle asc -> desc -> sin orden
      if (sortOrder === 'asc') {
        setSortOrder('desc');
      } else {
        setSortBy(undefined);
        setSortOrder(undefined);
      }
    } else {
      // Nuevo campo: empezar con asc
      setSortBy(key);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const clienteOptions = [
    { value: 'todos', label: 'Todos los clientes' },
    ...(clientesData?.clientes || []).map((c) => ({
      value: String(c.id),
      label: c.razon_social,
    })),
  ];

  const estadoOptions = [
    { value: 'todos', label: 'Todos los estados' },
    { value: String(EstadoPedido.PENDIENTE), label: ESTADO_PEDIDO_LABELS[EstadoPedido.PENDIENTE] },
    { value: String(EstadoPedido.CONFIRMADO), label: ESTADO_PEDIDO_LABELS[EstadoPedido.CONFIRMADO] },
    { value: String(EstadoPedido.EN_CAMINO), label: ESTADO_PEDIDO_LABELS[EstadoPedido.EN_CAMINO] },
    { value: String(EstadoPedido.DESVIADO), label: ESTADO_PEDIDO_LABELS[EstadoPedido.DESVIADO] },
    { value: String(EstadoPedido.ATASCADO), label: ESTADO_PEDIDO_LABELS[EstadoPedido.ATASCADO] },
    { value: String(EstadoPedido.RECHAZADO_CLIENTE), label: ESTADO_PEDIDO_LABELS[EstadoPedido.RECHAZADO_CLIENTE] },
    { value: String(EstadoPedido.ENTREGADO), label: ESTADO_PEDIDO_LABELS[EstadoPedido.ENTREGADO] },
    { value: String(EstadoPedido.CANCELADO), label: ESTADO_PEDIDO_LABELS[EstadoPedido.CANCELADO] },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-cemento-900">Gestión de Pedidos</h1>
        <p className="text-sm text-cemento-500 mt-1">
          Administración de pedidos de clientes y seguimiento de entregas
        </p>
      </div>

      <div className="mb-6">
        <PedidosStatsGrid dias={30} />
      </div>

      <div className="mb-6 flex flex-col gap-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <SearchInput
              value={buscar}
              onChange={setBuscar}
              placeholder="Buscar por codigo, cliente, direccion, estado, camion o conductor..."
            />
          </div>
          <SelectFilter
            value={estadoId === undefined ? 'todos' : String(estadoId)}
            onChange={(value) => {
              if (value === 'todos') {
                setEstadoId(undefined);
              } else {
                setEstadoId(Number(value));
              }
              setPage(1);
            }}
            options={estadoOptions}
          />
          <SelectFilter
            value={clienteId === undefined ? 'todos' : String(clienteId)}
            onChange={(value) => {
              if (value === 'todos') {
                setClienteId(undefined);
              } else {
                setClienteId(Number(value));
              }
              setPage(1);
            }}
            options={clienteOptions}
          />
        </div>
        <div className="flex gap-4 items-end">
          <DateInput
            value={fechaDesde}
            onChange={(value) => {
              setFechaDesde(value);
              setPage(1);
            }}
            label="Desde"
          />
          <DateInput
            value={fechaHasta}
            onChange={(value) => {
              setFechaHasta(value);
              setPage(1);
            }}
            label="Hasta"
          />
          {(estadoId !== undefined || clienteId !== undefined || fechaDesde || fechaHasta) && (
            <button
              type="button"
              onClick={() => {
                setEstadoId(undefined);
                setClienteId(undefined);
                setFechaDesde('');
                setFechaHasta('');
                setPage(1);
              }}
              className="px-3 py-2 text-sm text-cemento-600 hover:text-cemento-900 hover:bg-piedra-100 rounded-md transition-colors whitespace-nowrap"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {data && totalPages > 1 && (
        <div className="mb-4">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={data.total}
            itemsPerPage={limit}
          />
        </div>
      )}

      <PedidosTable
        pedidos={pedidosFiltered}
        loading={isLoading}
        onVerDetalle={handleVerDetalle}
        onAprobar={handleAprobar}
        onRechazar={handleRechazar}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
      />

      {pedidoSeleccionado && (
        <>
          <PedidoDetalleModal
            open={mostrarModalDetalle}
            onClose={handleCerrarModalDetalle}
            pedido={pedidoSeleccionado}
            onAprobar={handleAprobar}
            onRechazar={handleRechazar}
          />
          <ConfirmarPedidoModal
            open={mostrarModalConfirmar}
            onClose={handleCerrarModalConfirmar}
            pedido={pedidoSeleccionado}
          />
          <RechazarPedidoModal
            open={mostrarModalRechazar}
            onClose={handleCerrarModalRechazar}
            pedido={pedidoSeleccionado}
          />
        </>
      )}
    </div>
  );
};
