import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useAjustarStock } from '../hooks/useMateriales';
import type { Material } from '../types/materiales.types';

interface AjustarStockFormProps {
  isOpen: boolean;
  onClose: () => void;
  material: Material | null;
}

export const AjustarStockForm = ({ isOpen, onClose, material }: AjustarStockFormProps) => {
  const ajustarStockMutation = useAjustarStock();
  const [cantidad, setCantidad] = useState('');
  const [motivo, setMotivo] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!material) return;

    await ajustarStockMutation.mutateAsync({
      id: material.id,
      data: {
        cantidad: parseFloat(cantidad),
        motivo
      }
    });

    handleClose();
  };

  const handleClose = () => {
    setCantidad('');
    setMotivo('');
    onClose();
  };

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      title="Ajustar Stock"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="mb-4">
              <p className="text-sm text-cemento-600 mb-2">
                Material: <span className="font-medium text-cemento-900">{material?.nombre}</span>
              </p>
              <p className="text-sm text-cemento-600">
                Stock actual: <span className="font-medium text-cemento-900">{material?.stock_actual.toFixed(2)} {material?.unidad_medida}</span>
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="cantidad" className="block text-sm font-medium text-cemento-700 mb-2">
                  Cantidad (+ para aumentar, - para disminuir) *
                </label>
                <input
                  type="number"
                  id="cantidad"
                  name="cantidad"
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                  required
                  step="0.01"
                  className="w-full px-4 py-2 border border-piedra-300 rounded-lg focus:ring-2 focus:ring-coral-500 focus:border-transparent"
                  placeholder="0.00"
                />
                <p className="text-xs text-cemento-500 mt-1">
                  Ejemplo: +10 para agregar, -5 para restar
                </p>
              </div>

              <div>
                <label htmlFor="motivo" className="block text-sm font-medium text-cemento-700 mb-2">
                  Motivo *
                </label>
                <textarea
                  id="motivo"
                  name="motivo"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  required
                  rows={3}
                  className="w-full px-4 py-2 border border-piedra-300 rounded-lg focus:ring-2 focus:ring-coral-500 focus:border-transparent"
                  placeholder="Describa el motivo del ajuste..."
                />
              </div>
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
            disabled={ajustarStockMutation.isPending}
          >
            {ajustarStockMutation.isPending ? 'Ajustando...' : 'Ajustar Stock'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
