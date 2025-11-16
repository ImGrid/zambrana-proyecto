import { useState, useEffect } from 'react';
import { UsuariosTable } from '../components/UsuariosTable';
import { UsuarioForm } from '../components/UsuarioForm';
import { useUsuarios, useUsuario, useDeactivateUsuario } from '../hooks/useUsuarios';
import { SearchInput } from '@/components/ui/SearchInput';
import { SelectFilter } from '@/components/ui/SelectFilter';
import { Pagination } from '@/components/ui/Pagination';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import type { Usuario } from '../types/usuarios.types';

export const UsuariosPage = () => {
  const [page, setPage] = useState(1);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroRol, setFiltroRol] = useState('');
  const [buscar, setBuscar] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [toggleId, setToggleId] = useState<number | null>(null);

  const limit = 20;
  const offset = (page - 1) * limit;

  const { data, isLoading } = useUsuarios({
    limit,
    offset,
  });

  const { data: usuarioData } = useUsuario(selectedId);
  const deactivateMutation = useDeactivateUsuario();

  useEffect(() => {
    if (usuarioData && selectedId) {
      setSelectedUsuario(usuarioData);
      setIsFormOpen(true);
      setSelectedId(null);
    }
  }, [usuarioData, selectedId]);

  const usuarios = data?.usuarios || [];

  const usuariosFiltered = usuarios.filter((usuario) => {
    if (filtroEstado === 'activos' && !usuario.activo) return false;
    if (filtroEstado === 'inactivos' && usuario.activo) return false;
    if (filtroRol && usuario.rol !== filtroRol) return false;

    if (!buscar) return true;
    const searchLower = buscar.toLowerCase();
    return (
      usuario.nombre.toLowerCase().includes(searchLower) ||
      usuario.email.toLowerCase().includes(searchLower) ||
      usuario.rol.toLowerCase().includes(searchLower)
    );
  });

  const totalPages = data ? Math.ceil(data.total / limit) : 0;

  const handleOpenEdit = (id: number) => {
    setSelectedId(id);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedUsuario(null);
  };

  const handleToggleActivo = (id: number) => {
    setToggleId(id);
  };

  const confirmToggleActivo = () => {
    if (toggleId) {
      deactivateMutation.mutate(toggleId);
      setToggleId(null);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-cemento-900">Gestión de Usuarios</h1>
        <p className="text-sm text-cemento-500 mt-1">
          Administración de usuarios del sistema
        </p>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <SearchInput
            value={buscar}
            onChange={setBuscar}
            placeholder="Buscar por nombre, email o rol..."
          />
        </div>
        <div className="w-full sm:w-48">
          <SelectFilter
            value={filtroRol}
            onChange={setFiltroRol}
            options={[
              { value: 'admin', label: 'Administrador' },
              { value: 'gerente', label: 'Gerente' },
              { value: 'conductor', label: 'Conductor' },
              { value: 'cliente', label: 'Cliente' },
            ]}
            placeholder="Todos los roles"
          />
        </div>
        <div className="w-full sm:w-48">
          <SelectFilter
            value={filtroEstado}
            onChange={setFiltroEstado}
            options={[
              { value: 'activos', label: 'Solo Activos' },
              { value: 'inactivos', label: 'Solo Inactivos' },
            ]}
            placeholder="Todos los estados"
          />
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

      <UsuariosTable
        usuarios={usuariosFiltered}
        loading={isLoading}
        onEdit={handleOpenEdit}
        onToggleActivo={handleToggleActivo}
      />

      <UsuarioForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        usuario={selectedUsuario}
      />

      <ConfirmDialog
        open={toggleId !== null}
        onClose={() => setToggleId(null)}
        onConfirm={confirmToggleActivo}
        title="Confirmar acción"
        message="¿Estás seguro de que deseas cambiar el estado de este usuario?"
        confirmText="Confirmar"
        loading={deactivateMutation.isPending}
      />
    </div>
  );
};
