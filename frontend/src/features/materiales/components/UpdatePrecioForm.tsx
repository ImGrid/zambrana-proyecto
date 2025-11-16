import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useUpdatePrecio } from '../hooks/useMateriales';
import type { Material } from '../types/materiales.types';

interface UpdatePrecioFormProps {
  isOpen: boolean;
  onClose: () => void;
  material: Material | null;
}

export const UpdatePrecioForm = ({ isOpen, onClose, material }: UpdatePrecioFormProps) => {
  const updatePrecioMutation = useUpdatePrecio();
  const [precioM3, setPrecioM3] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!material) return;

    await updatePrecioMutation.mutateAsync({
      id: material.id,
      data: { precio_m3: parseFloat(precioM3) }
    });

    handleClose();
  };

  const handleClose = () => {
    setPrecioM3('');
    onClose();
  };

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      title="Actualizar Precio"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="mb-4">
              <p className="text-sm text-cemento-600 mb-2">
                Material: <span className="font-medium text-cemento-900">{material?.nombre}</span>
              </p>
              <p className="text-sm text-cemento-600">
                Precio actual: <span className="font-medium text-cemento-900">Bs {material?.precio_m3.toFixed(2)}</span>
              </p>
            </div>

            <div>
              <label htmlFor="precio_m3" className="block text-sm font-medium text-cemento-700 mb-2">
                Nuevo Precio por m³ (Bs) *
              </label>
              <input
                type="number"
                id="precio_m3"
                name="precio_m3"
                value={precioM3}
                onChange={(e) => setPrecioM3(e.target.value)}
                required
                step="0.01"
                min="0"
                className="w-full px-4 py-2 border border-piedra-300 rounded-lg focus:ring-2 focus:ring-coral-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={updatePrecioMutation.isPending}
          >
            {updatePrecioMutation.isPending ? 'Actualizando...' : 'Actualizar Precio'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
