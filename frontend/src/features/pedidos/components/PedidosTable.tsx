import { Table } from '@/components/ui/Table';
import type { Column, SortOrder } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { CheckCircle, XCircle, Eye } from 'lucide-react';
import type { PedidoListItem } from '../types/pedidos.types';
import { ESTADO_BADGE_VARIANTS, EstadoPedido } from '../types/pedidos.types';

interface PedidosTableProps {
  pedidos: PedidoListItem[];
  loading?: boolean;
  onVerDetalle?: (pedido: PedidoListItem) => void;
  onAprobar?: (pedido: PedidoListItem) => void;
  onRechazar?: (pedido: PedidoListItem) => void;
  sortBy?: string;
  sortOrder?: SortOrder;
  onSort?: (sortKey: string) => void;
}

export const PedidosTable = ({ pedidos, loading, onVerDetalle, onAprobar, onRechazar, sortBy, sortOrder, onSort }: PedidosTableProps) => {
  const getEstadoBadgeVariant = (estadoNombre: string) => {
    const estado = estadoNombre.toUpperCase();
    if (estado.includes('PENDIENTE')) return ESTADO_BADGE_VARIANTS[EstadoPedido.PENDIENTE];
    if (estado.includes('CONFIRMADO')) return ESTADO_BADGE_VARIANTS[EstadoPedido.CONFIRMADO];
    if (estado.includes('CAMINO')) return ESTADO_BADGE_VARIANTS[EstadoPedido.EN_CAMINO];
    if (estado.includes('DESVIADO')) return ESTADO_BADGE_VARIANTS[EstadoPedido.DESVIADO];
    if (estado.includes('ATASCADO')) return ESTADO_BADGE_VARIANTS[EstadoPedido.ATASCADO];
    if (estado.includes('RECHAZADO')) return ESTADO_BADGE_VARIANTS[EstadoPedido.RECHAZADO_CLIENTE];
    if (estado.includes('ENTREGADO')) return ESTADO_BADGE_VARIANTS[EstadoPedido.ENTREGADO];
    if (estado.includes('CANCELADO')) return ESTADO_BADGE_VARIANTS[EstadoPedido.CANCELADO];
    if (estado.includes('MULTIPLE')) return ESTADO_BADGE_VARIANTS[EstadoPedido.EN_PROCESO_MULTIPLE];
    return 'default';
  };

  const columns: Column<PedidoListItem>[] = [
    {
      header: 'Codigo',
      sortKey: 'codigo_seguimiento',
      accessor: (row) => (
        <span className="font-mono text-xs text-cemento-700">
          {row.codigo_seguimiento}
        </span>
      ),
    },
    {
      header: 'Cliente',
      sortKey: 'cliente_razon_social',
      accessor: 'cliente_razon_social',
    },
    {
      header: 'Estado',
      sortKey: 'estado_nombre',
      accessor: (row) => (
        <Badge variant={getEstadoBadgeVariant(row.estado_nombre)}>
          {row.estado_nombre}
        </Badge>
      ),
    },
    {
      header: 'Fecha',
      sortKey: 'fecha_pedido',
      accessor: (row) => (
        <span className="text-cemento-900 text-sm whitespace-nowrap">
          {new Date(row.fecha_pedido).toLocaleDateString('es-BO', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          })}
        </span>
      ),
    },
    {
      header: 'Monto',
      sortKey: 'monto_total',
      accessor: (row) => (
        <span className="text-cemento-900 font-bold whitespace-nowrap">
          Bs. {row.monto_total.toFixed(2)}
        </span>
      ),
    },
    {
      header: 'Acciones',
      accessor: (row: PedidoListItem) => {
        const isPendiente = row.estado_nombre.toLowerCase().includes('pendiente');

        return (
          <div className="flex gap-2 justify-end">
            {onVerDetalle && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  onVerDetalle(row);
                }}
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
            {isPendiente && onAprobar && (
              <Button
                variant="success"
                size="sm"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  onAprobar(row);
                }}
              >
                <CheckCircle className="h-4 w-4" />
              </Button>
            )}
            {isPendiente && onRechazar && (
              <Button
                variant="danger"
                size="sm"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  onRechazar(row);
                }}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <Table
      columns={columns}
      data={pedidos}
      loading={loading}
      emptyMessage="No se encontraron pedidos"
      sortBy={sortBy}
      sortOrder={sortOrder}
      onSort={onSort}
    />
  );
};
