import { Edit, Power } from 'lucide-react';
import { Table } from '@/components/ui/Table';
import type { Column } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { UsuarioListItem } from '../types/usuarios.types';

interface UsuariosTableProps {
  usuarios: UsuarioListItem[];
  loading?: boolean;
  onEdit?: (id: number) => void;
  onToggleActivo?: (id: number) => void;
}

export const UsuariosTable = ({ usuarios, loading, onEdit, onToggleActivo }: UsuariosTableProps) => {
  const getRolColor = (rol: string) => {
    switch (rol) {
      case 'admin':
        return 'danger';
      case 'gerente':
        return 'warning';
      case 'conductor':
        return 'info';
      case 'cliente':
        return 'success';
      default:
        return 'neutral';
    }
  };

  const getRolLabel = (rol: string) => {
    switch (rol) {
      case 'admin':
        return 'Admin';
      case 'gerente':
        return 'Gerente';
      case 'conductor':
        return 'Conductor';
      case 'cliente':
        return 'Cliente';
      default:
        return rol;
    }
  };

  const columns: Column<UsuarioListItem>[] = [
    {
      header: 'Nombre',
      accessor: 'nombre',
    },
    {
      header: 'Email',
      accessor: 'email',
    },
    {
      header: 'Rol',
      accessor: (row) => (
        <Badge variant={getRolColor(row.rol)}>
          {getRolLabel(row.rol)}
        </Badge>
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
      header: 'Fecha Creación',
      accessor: (row) => (
        <span className="text-cemento-900">
          {new Date(row.created_at).toLocaleDateString('es-BO', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })}
        </span>
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
            title="Editar usuario"
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
      data={usuarios}
      loading={loading}
      emptyMessage="No se encontraron usuarios"
    />
  );
};
