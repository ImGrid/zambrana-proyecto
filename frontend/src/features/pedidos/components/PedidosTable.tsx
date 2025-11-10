import { Table } from '@/components/ui/Table';
import type { Column } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { CheckCircle, XCircle, Eye } from 'lucide-react';
import type { PedidoListItem } from '../types/pedidos.types';
import { ESTADO_BADGE_VARIANTS } from '../types/pedidos.types';

interface PedidosTableProps {
  pedidos: PedidoListItem[];
  loading?: boolean;
  onVerDetalle?: (pedido: PedidoListItem) => void;
  onAprobar?: (pedido: PedidoListItem) => void;
  onRechazar?: (pedido: PedidoListItem) => void;
}

export const PedidosTable = ({ pedidos, loading, onVerDetalle, onAprobar, onRechazar }: PedidosTableProps) => {
  const getEstadoBadgeVariant = (estadoNombre: string) => {
    const estado = estadoNombre.toLowerCase();
    if (estado.includes('pendiente')) return ESTADO_BADGE_VARIANTS[1];
    if (estado.includes('confirmado')) return ESTADO_BADGE_VARIANTS[2];
    if (estado.includes('ruta')) return ESTADO_BADGE_VARIANTS[3];
    if (estado.includes('entregado')) return ESTADO_BADGE_VARIANTS[4];
    if (estado.includes('cancelado')) return ESTADO_BADGE_VARIANTS[5];
    if (estado.includes('rechazado')) return ESTADO_BADGE_VARIANTS[6];
    return 'default';
  };

  const columns: Column<PedidoListItem>[] = [
    {
      header: 'Código',
      accessor: (row) => (
        <span className="font-mono text-xs text-gray-700">
          {row.codigo_seguimiento}
        </span>
      ),
    },
    {
      header: 'Cliente',
      accessor: 'cliente_razon_social',
    },
    {
      header: 'Estado',
      accessor: (row) => (
        <Badge variant={getEstadoBadgeVariant(row.estado_nombre)}>
          {row.estado_nombre}
        </Badge>
      ),
    },
    {
      header: 'Fecha',
      accessor: (row) => (
        <span className="text-gray-900 text-sm whitespace-nowrap">
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
      accessor: (row) => (
        <span className="text-gray-900 font-bold whitespace-nowrap">
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
    />
  );
};
