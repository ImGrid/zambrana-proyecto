import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useUpdateUsuario } from '../hooks/useUsuarios';
import type { Usuario, UpdateUsuarioData } from '../types/usuarios.types';

interface UsuarioFormProps {
  isOpen: boolean;
  onClose: () => void;
  usuario: Usuario | null;
}

export const UsuarioForm = ({ isOpen, onClose, usuario }: UsuarioFormProps) => {
  const updateMutation = useUpdateUsuario();

  const [formData, setFormData] = useState<UpdateUsuarioData>({
    nombre: '',
    rol: undefined,
    activo: undefined
  });

  useEffect(() => {
    if (usuario) {
      setFormData({
        nombre: usuario.nombre,
        rol: usuario.rol as 'admin' | 'gerente' | 'conductor' | 'cliente',
        activo: usuario.activo
      });
    }
  }, [usuario, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!usuario) return;

    const updateData: UpdateUsuarioData = {};

    if (formData.nombre && formData.nombre !== usuario.nombre) {
      updateData.nombre = formData.nombre;
    }

    if (formData.rol && formData.rol !== usuario.rol) {
      updateData.rol = formData.rol;
    }

    if (formData.activo !== undefined && formData.activo !== usuario.activo) {
      updateData.activo = formData.activo;
    }

    if (Object.keys(updateData).length === 0) {
      onClose();
      return;
    }

    await updateMutation.mutateAsync({ id: usuario.id, data: updateData });
    onClose();
  };

  const isLoading = updateMutation.isPending;

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Editar Usuario"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-cemento-50 p-3 rounded-lg mb-4">
          <p className="text-sm text-cemento-600">
            <span className="font-medium">Email:</span> {usuario?.email}
          </p>
          <p className="text-sm text-cemento-500 mt-1">
            El email no se puede modificar
          </p>
        </div>

        <Input
          label="Nombre"
          required
          value={formData.nombre}
          onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
          placeholder="Ej: Juan Pérez"
        />

        <Select
          label="Rol"
          required
          value={formData.rol || ''}
          onChange={(e) => setFormData({ ...formData, rol: e.target.value as any })}
        >
          <option value="">Seleccionar rol</option>
          <option value="admin">Administrador</option>
          <option value="gerente">Gerente</option>
          <option value="conductor">Conductor</option>
          <option value="cliente">Cliente</option>
        </Select>

        <Select
          label="Estado"
          required
          value={formData.activo === true ? 'true' : 'false'}
          onChange={(e) => setFormData({ ...formData, activo: e.target.value === 'true' })}
        >
          <option value="true">Activo</option>
          <option value="false">Inactivo</option>
        </Select>

        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            loading={isLoading}
          >
            Actualizar
          </Button>
        </div>
      </form>
    </Modal>
  );
};
