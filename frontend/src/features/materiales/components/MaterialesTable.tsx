import { DollarSign, Package, Power } from 'lucide-react';
import { Table } from '@/components/ui/Table';
import type { Column, SortOrder } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { MaterialListItem } from '../types/materiales.types';

interface MaterialesTableProps {
  materiales: MaterialListItem[];
  loading?: boolean;
  onUpdatePrecio?: (id: number) => void;
  onAjustarStock?: (id: number) => void;
  onToggleActivo?: (id: number) => void;
  sortBy?: string;
  sortOrder?: SortOrder;
  onSort?: (sortKey: string) => void;
}

export const MaterialesTable = ({ materiales, loading, onUpdatePrecio, onAjustarStock, onToggleActivo, sortBy, sortOrder, onSort }: MaterialesTableProps) => {
  const columns: Column<MaterialListItem>[] = [
    {
      header: 'Código',
      sortKey: 'codigo',
      accessor: 'codigo',
    },
    {
      header: 'Nombre',
      sortKey: 'nombre',
      accessor: 'nombre',
    },
    {
      header: 'Unidad',
      accessor: 'unidad_medida',
    },
    {
      header: 'Precio/m³',
      sortKey: 'precio_m3',
      accessor: (row) => (
        <span className="text-cemento-900 font-medium">
          Bs. {row.precio_m3.toFixed(2)}
        </span>
      ),
    },
    {
      header: 'Stock',
      sortKey: 'stock_actual',
      accessor: (row) => {
        const isLow = row.stock_actual < row.stock_minimo;
        return (
          <div className="flex items-center gap-2">
            <span className={isLow ? 'text-error-600 font-semibold' : 'text-cemento-900'}>
              {row.stock_actual.toFixed(2)}
            </span>
            <span className="text-cemento-400 text-xs">
              / {row.stock_minimo.toFixed(2)}
            </span>
            {isLow && (
              <Badge variant="danger" className="text-xs">
                Bajo
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      header: 'Estado',
      accessor: (row) => (
        <Badge variant={row.activo ? 'success' : 'danger'}>
          {row.activo ? 'Activo' : 'Inactivo'}
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
            onClick={() => onUpdatePrecio?.(row.id)}
            title="Actualizar precio"
          >
            <DollarSign size={16} />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onAjustarStock?.(row.id)}
            title="Ajustar stock"
          >
            <Package size={16} />
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
      data={materiales}
      loading={loading}
      emptyMessage="No se encontraron materiales"
      sortBy={sortBy}
      sortOrder={sortOrder}
      onSort={onSort}
    />
  );
};
