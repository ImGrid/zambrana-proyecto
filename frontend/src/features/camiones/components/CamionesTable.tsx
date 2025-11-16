import { Edit, Power, Wrench } from 'lucide-react';
import { Table } from '@/components/ui/Table';
import type { Column } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { CamionListItem } from '../types/camiones.types';

interface CamionesTableProps {
  camiones: CamionListItem[];
  loading?: boolean;
  onEdit?: (id: number) => void;
  onToggleActivo?: (id: number) => void;
  onToggleMantenimiento?: (id: number) => void;
}

export const CamionesTable = ({ camiones, loading, onEdit, onToggleActivo, onToggleMantenimiento }: CamionesTableProps) => {
  const columns: Column<CamionListItem>[] = [
    {
      header: 'Placa',
      accessor: 'placa',
    },
    {
      header: 'Tipo',
      accessor: 'tipo_camion',
    },
    {
      header: 'Marca / Modelo',
      accessor: (row) => (
        <span className="text-cemento-900">
          {row.marca || 'N/A'} {row.modelo && `- ${row.modelo}`}
        </span>
      ),
    },
    {
      header: 'Capacidad',
      accessor: (row) => (
        <span className="text-cemento-900">
          {row.capacidad_m3} m³
        </span>
      ),
    },
    {
      header: 'Estado',
      accessor: (row) => {
        if (!row.activo) {
          return <Badge variant="danger">Inactivo</Badge>;
        }
        if (row.en_mantenimiento) {
          return <Badge variant="warning">Mantenimiento</Badge>;
        }
        return <Badge variant="success">Activo</Badge>;
      },
    },
    {
      header: 'Acciones',
      accessor: (row) => (
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onEdit?.(row.id)}
            title="Editar camión"
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
          <Button
            variant={row.en_mantenimiento ? 'secondary' : 'warning'}
            size="sm"
            onClick={() => onToggleMantenimiento?.(row.id)}
            title={row.en_mantenimiento ? 'Quitar de mantenimiento' : 'Poner en mantenimiento'}
          >
            <Wrench size={16} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      data={camiones}
      loading={loading}
      emptyMessage="No se encontraron camiones"
    />
  );
};
