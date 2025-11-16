import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useCreateCamion, useUpdateCamion } from '../hooks/useCamiones';
import { TipoCamion, TIPO_CAMION_LABELS } from '../types/camiones.types';
import type { Camion, CreateCamionData, UpdateCamionData } from '../types/camiones.types';

interface CamionFormProps {
  isOpen: boolean;
  onClose: () => void;
  camion?: Camion | null;
}

export const CamionForm = ({ isOpen, onClose, camion }: CamionFormProps) => {
  const isEditing = !!camion;
  const createMutation = useCreateCamion();
  const updateMutation = useUpdateCamion();

  const [formData, setFormData] = useState({
    placa: '',
    tipo_camion_id: TipoCamion.VOLQUETA_SIMPLE,
    marca: '',
    modelo: '',
    año: '',
    capacidad_m3: '',
    color: ''
  });

  useEffect(() => {
    if (camion) {
      setFormData({
        placa: camion.placa,
        tipo_camion_id: camion.tipo_camion_id,
        marca: camion.marca || '',
        modelo: camion.modelo || '',
        año: camion.año?.toString() || '',
        capacidad_m3: camion.capacidad_m3.toString(),
        color: camion.color || ''
      });
    } else {
      setFormData({
        placa: '',
        tipo_camion_id: TipoCamion.VOLQUETA_SIMPLE,
        marca: '',
        modelo: '',
        año: '',
        capacidad_m3: '',
        color: ''
      });
    }
  }, [camion, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isEditing && camion) {
      const updateData: UpdateCamionData = {
        placa: formData.placa,
        tipo_camion_id: formData.tipo_camion_id,
        marca: formData.marca || undefined,
        modelo: formData.modelo || undefined,
        año: formData.año ? Number(formData.año) : undefined,
        capacidad_m3: Number(formData.capacidad_m3),
        color: formData.color || undefined
      };

      await updateMutation.mutateAsync({ id: camion.id, data: updateData });
    } else {
      const createData: CreateCamionData = {
        placa: formData.placa,
        tipo_camion_id: formData.tipo_camion_id,
        marca: formData.marca || undefined,
        modelo: formData.modelo || undefined,
        año: formData.año ? Number(formData.año) : undefined,
        capacidad_m3: Number(formData.capacidad_m3),
        color: formData.color || undefined
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
      title={isEditing ? 'Editar Camión' : 'Nuevo Camión'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Placa"
            required
            value={formData.placa}
            onChange={(e) => setFormData({ ...formData, placa: e.target.value })}
            placeholder="Ej: ABC-1234"
          />

          <div>
            <label className="block text-sm font-medium text-cemento-700 mb-1">
              Tipo de Camión <span className="text-error-500">*</span>
            </label>
            <select
              required
              value={formData.tipo_camion_id}
              onChange={(e) => setFormData({ ...formData, tipo_camion_id: Number(e.target.value) })}
              className="block w-full rounded-lg border border-piedra-300 px-3 py-2 text-cemento-900 focus:border-coral-500 focus:ring-2 focus:ring-coral-500/20"
            >
              <option value={TipoCamion.VOLQUETA_SIMPLE}>{TIPO_CAMION_LABELS[TipoCamion.VOLQUETA_SIMPLE]}</option>
              <option value={TipoCamion.VOLQUETA_DOBLE}>{TIPO_CAMION_LABELS[TipoCamion.VOLQUETA_DOBLE]}</option>
              <option value={TipoCamion.MIXER}>{TIPO_CAMION_LABELS[TipoCamion.MIXER]}</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Marca"
            value={formData.marca}
            onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
            placeholder="Ej: Volvo"
          />

          <Input
            label="Modelo"
            value={formData.modelo}
            onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
            placeholder="Ej: FM 440"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Año"
            type="number"
            value={formData.año}
            onChange={(e) => setFormData({ ...formData, año: e.target.value })}
            placeholder="Ej: 2020"
            min="1900"
            max="2100"
          />

          <Input
            label="Capacidad (m³)"
            type="number"
            required
            value={formData.capacidad_m3}
            onChange={(e) => setFormData({ ...formData, capacidad_m3: e.target.value })}
            placeholder="Ej: 15"
            step="0.1"
            min="0"
          />

          <Input
            label="Color"
            value={formData.color}
            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            placeholder="Ej: Rojo"
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
