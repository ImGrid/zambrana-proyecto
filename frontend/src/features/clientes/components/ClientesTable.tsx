import { Edit } from 'lucide-react';
import { Table } from '@/components/ui/Table';
import type { Column } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { ClienteListItem } from '../types/clientes.types';

interface ClientesTableProps {
  clientes: ClienteListItem[];
  loading?: boolean;
  onEdit?: (id: number) => void;
}

export const ClientesTable = ({ clientes, loading, onEdit }: ClientesTableProps) => {
  const columns: Column<ClienteListItem>[] = [
    {
      header: 'Razón Social',
      accessor: 'razon_social',
    },
    {
      header: 'NIT',
      accessor: (row) => (
        <span className="text-cemento-900">
          {row.nit || 'N/A'}
        </span>
      ),
    },
    {
      header: 'Teléfono',
      accessor: (row) => (
        <span className="text-cemento-900">
          {row.telefono || 'N/A'}
        </span>
      ),
    },
    {
      header: 'Dirección',
      accessor: (row) => (
        <span className="text-cemento-900 truncate max-w-xs block">
          {row.direccion || 'N/A'}
        </span>
      ),
    },
    {
      header: 'Tipo',
      accessor: (row) => (
        <Badge variant={
          row.tipo_cliente_nombre === 'Constructora' ? 'info' :
          row.tipo_cliente_nombre === 'Hormigonera' ? 'warning' : 'neutral'
        }>
          {row.tipo_cliente_nombre}
        </Badge>
      ),
    },
    {
      header: 'Acciones',
      accessor: (row) => (
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onEdit?.(row.id)}
            title="Editar cliente"
          >
            <Edit size={16} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      data={clientes}
      loading={loading}
      emptyMessage="No se encontraron clientes"
    />
  );
};
