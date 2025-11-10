import { DollarSign, Package, Power } from 'lucide-react';
import { Table } from '@/components/ui/Table';
import type { Column } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { MaterialListItem } from '../types/materiales.types';

interface MaterialesTableProps {
  materiales: MaterialListItem[];
  loading?: boolean;
  onUpdatePrecio?: (id: number) => void;
  onAjustarStock?: (id: number) => void;
  onToggleActivo?: (id: number) => void;
}

export const MaterialesTable = ({ materiales, loading, onUpdatePrecio, onAjustarStock, onToggleActivo }: MaterialesTableProps) => {
  const columns: Column<MaterialListItem>[] = [
    {
      header: 'Código',
      accessor: 'codigo',
    },
    {
      header: 'Nombre',
      accessor: 'nombre',
    },
    {
      header: 'Unidad',
      accessor: 'unidad_medida',
    },
    {
      header: 'Precio/m³',
      accessor: (row) => (
        <span className="text-gray-900 font-medium">
          Bs. {row.precio_m3.toFixed(2)}
        </span>
      ),
    },
    {
      header: 'Stock',
      accessor: (row) => {
        const isLow = row.stock_actual < row.stock_minimo;
        return (
          <div className="flex items-center gap-2">
            <span className={isLow ? 'text-red-600 font-semibold' : 'text-gray-900'}>
              {row.stock_actual.toFixed(2)}
            </span>
            <span className="text-gray-400 text-xs">
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
            variant={row.activo ? 'error' : 'success'}
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
    />
  );
};
