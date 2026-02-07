import { Edit, Power } from 'lucide-react';
import { Table } from '@/components/ui/Table';
import type { Column, SortOrder } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { ConductorListItem } from '../types/conductores.types';

interface ConductoresTableProps {
  conductores: ConductorListItem[];
  loading?: boolean;
  onEdit?: (id: number) => void;
  onToggleActivo?: (id: number) => void;
  sortBy?: string;
  sortOrder?: SortOrder;
  onSort?: (sortKey: string) => void;
}

export const ConductoresTable = ({ conductores, loading, onEdit, onToggleActivo, sortBy, sortOrder, onSort }: ConductoresTableProps) => {
  const columns: Column<ConductorListItem>[] = [
    {
      header: 'Nombre Completo',
      sortKey: 'nombre_completo',
      accessor: 'nombre_completo',
    },
    {
      header: 'CI',
      sortKey: 'ci',
      accessor: 'ci',
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
      header: 'Categoría Licencia',
      sortKey: 'licencia_categoria',
      accessor: (row) => (
        <span className="text-cemento-900">
          {row.licencia_categoria || 'N/A'}
        </span>
      ),
    },
    {
      header: 'Estado',
      accessor: (row) => (
        row.activo
          ? <Badge variant="success">Activo</Badge>
          : <Badge variant="danger">Inactivo</Badge>
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
            title="Editar conductor"
          >
            <Edit size={16} />
          </Button>
          <Button
            variant={row.activo ? 'danger' : 'success'}
            size="sm"
            onClick={() => onToggleActivo?.(row.id)}
            title={row.activo ? 'Desactivar' : 'Activar'}
          >
            <Power size={16} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      data={conductores}
      loading={loading}
      emptyMessage="No se encontraron conductores"
      sortBy={sortBy}
      sortOrder={sortOrder}
      onSort={onSort}
    />
  );
};
