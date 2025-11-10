import { useState } from 'react';
import { X } from 'lucide-react';
import { Dialog } from '@headlessui/react';
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
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-md w-full bg-white rounded-lg shadow-xl">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <Dialog.Title className="text-xl font-semibold text-gray-900">
              Actualizar Precio
            </Dialog.Title>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-500 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Material: <span className="font-medium text-gray-900">{material?.nombre}</span>
              </p>
              <p className="text-sm text-gray-600">
                Precio actual: <span className="font-medium text-gray-900">Bs {material?.precio_m3.toFixed(2)}</span>
              </p>
            </div>

            <div>
              <label htmlFor="precio_m3" className="block text-sm font-medium text-gray-700 mb-2">
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};
