import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useCreateConductor, useUpdateConductor } from '../hooks/useConductores';
import { CategoriaLicencia, CATEGORIA_LICENCIA_LABELS } from '../types/conductores.types';
import type { Conductor, CreateConductorData, UpdateConductorData } from '../types/conductores.types';

interface ConductorFormProps {
  isOpen: boolean;
  onClose: () => void;
  conductor?: Conductor | null;
}

export const ConductorForm = ({ isOpen, onClose, conductor }: ConductorFormProps) => {
  const isEditing = !!conductor;
  const createMutation = useCreateConductor();
  const updateMutation = useUpdateConductor();

  const [formData, setFormData] = useState({
    nombre_completo: '',
    ci: '',
    telefono: '',
    licencia_categoria: '',
    fecha_vencimiento_licencia: ''
  });

  useEffect(() => {
    if (conductor) {
      setFormData({
        nombre_completo: conductor.nombre_completo,
        ci: conductor.ci,
        telefono: conductor.telefono || '',
        licencia_categoria: conductor.licencia_categoria || '',
        fecha_vencimiento_licencia: conductor.fecha_vencimiento_licencia
          ? conductor.fecha_vencimiento_licencia.split('T')[0]
          : ''
      });
    } else {
      setFormData({
        nombre_completo: '',
        ci: '',
        telefono: '',
        licencia_categoria: '',
        fecha_vencimiento_licencia: ''
      });
    }
  }, [conductor, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isEditing && conductor) {
      const updateData: UpdateConductorData = {
        nombre_completo: formData.nombre_completo,
        ci: formData.ci,
        telefono: formData.telefono || undefined,
        licencia_categoria: formData.licencia_categoria || undefined,
        fecha_vencimiento_licencia: formData.fecha_vencimiento_licencia
          ? new Date(formData.fecha_vencimiento_licencia).toISOString()
          : undefined
      };

      await updateMutation.mutateAsync({ id: conductor.id, data: updateData });
    } else {
      const createData: CreateConductorData = {
        nombre_completo: formData.nombre_completo,
        ci: formData.ci,
        telefono: formData.telefono || undefined,
        licencia_categoria: formData.licencia_categoria || undefined,
        fecha_vencimiento_licencia: formData.fecha_vencimiento_licencia
          ? new Date(formData.fecha_vencimiento_licencia).toISOString()
          : undefined
      };

      await createMutation.mutateAsync(createData);
    }

    onClose();
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Conductor' : 'Nuevo Conductor'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Nombre Completo"
            required
            value={formData.nombre_completo}
            onChange={(e) => setFormData({ ...formData, nombre_completo: e.target.value })}
            placeholder="Ej: Juan Pérez Gómez"
          />

          <Input
            label="CI"
            required
            value={formData.ci}
            onChange={(e) => setFormData({ ...formData, ci: e.target.value })}
            placeholder="Ej: 12345678"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Teléfono"
            type="tel"
            value={formData.telefono}
            onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
            placeholder="Ej: 77123456"
          />

          <div>
            <label className="block text-sm font-medium text-cemento-700 mb-2">
              Categoría de Licencia
            </label>
            <Select
              value={formData.licencia_categoria}
              onChange={(e) => setFormData({ ...formData, licencia_categoria: e.target.value })}
            >
              <option value="">Seleccionar categoría (opcional)</option>
              <option value={CategoriaLicencia.A}>{CATEGORIA_LICENCIA_LABELS[CategoriaLicencia.A]}</option>
              <option value={CategoriaLicencia.B}>{CATEGORIA_LICENCIA_LABELS[CategoriaLicencia.B]}</option>
              <option value={CategoriaLicencia.C}>{CATEGORIA_LICENCIA_LABELS[CategoriaLicencia.C]}</option>
              <option value={CategoriaLicencia.PROFESIONAL}>{CATEGORIA_LICENCIA_LABELS[CategoriaLicencia.PROFESIONAL]}</option>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Fecha de Vencimiento de Licencia"
            type="date"
            value={formData.fecha_vencimiento_licencia}
            onChange={(e) => setFormData({ ...formData, fecha_vencimiento_licencia: e.target.value })}
          />
        </div>

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
            {isEditing ? 'Actualizar' : 'Crear'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
