import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useCreateMaterial } from '../hooks/useMateriales';
import type { CreateMaterialData } from '../types/materiales.types';

interface MaterialFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MaterialForm = ({ isOpen, onClose }: MaterialFormProps) => {
  const createMutation = useCreateMaterial();

  const [formData, setFormData] = useState({
    nombre: '',
    codigo: '',
    descripcion: '',
    unidad_medida: 'm3',
    precio_m3: '',
    stock_minimo: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const createData: CreateMaterialData = {
      nombre: formData.nombre,
      codigo: formData.codigo,
      descripcion: formData.descripcion || undefined,
      unidad_medida: formData.unidad_medida,
      precio_m3: parseFloat(formData.precio_m3),
      stock_minimo: parseFloat(formData.stock_minimo)
    };

    await createMutation.mutateAsync(createData);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      nombre: '',
      codigo: '',
      descripcion: '',
      unidad_medida: 'm3',
      precio_m3: '',
      stock_minimo: ''
    });
    onClose();
  };

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      title="Crear Material"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="nombre" className="block text-sm font-medium text-cemento-700 mb-2">
                  Nombre *
                </label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-piedra-300 rounded-lg focus:ring-2 focus:ring-coral-500 focus:border-transparent"
                  placeholder="Arena fina"
                />
              </div>

              <div>
                <label htmlFor="codigo" className="block text-sm font-medium text-cemento-700 mb-2">
                  Código *
                </label>
                <input
                  type="text"
                  id="codigo"
                  name="codigo"
                  value={formData.codigo}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-piedra-300 rounded-lg focus:ring-2 focus:ring-coral-500 focus:border-transparent"
                  placeholder="ARE-001"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="descripcion" className="block text-sm font-medium text-cemento-700 mb-2">
                  Descripción
                </label>
                <textarea
                  id="descripcion"
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-piedra-300 rounded-lg focus:ring-2 focus:ring-coral-500 focus:border-transparent"
                  placeholder="Descripción opcional del material"
                />
              </div>

              <div>
                <label htmlFor="unidad_medida" className="block text-sm font-medium text-cemento-700 mb-2">
                  Unidad de Medida *
                </label>
                <select
                  id="unidad_medida"
                  name="unidad_medida"
                  value={formData.unidad_medida}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-piedra-300 rounded-lg focus:ring-2 focus:ring-coral-500 focus:border-transparent"
                >
                  <option value="m3">m³ (metros cúbicos)</option>
                  <option value="toneladas">Toneladas</option>
                  <option value="kg">Kilogramos</option>
                  <option value="unidades">Unidades</option>
                </select>
              </div>

              <div>
                <label htmlFor="precio_m3" className="block text-sm font-medium text-cemento-700 mb-2">
                  Precio por m³ (Bs) *
                </label>
                <input
                  type="number"
                  id="precio_m3"
                  name="precio_m3"
                  value={formData.precio_m3}
                  onChange={handleChange}
                  required
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2 border border-piedra-300 rounded-lg focus:ring-2 focus:ring-coral-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label htmlFor="stock_minimo" className="block text-sm font-medium text-cemento-700 mb-2">
                  Stock Mínimo *
                </label>
                <input
                  type="number"
                  id="stock_minimo"
                  name="stock_minimo"
                  value={formData.stock_minimo}
                  onChange={handleChange}
                  required
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2 border border-piedra-300 rounded-lg focus:ring-2 focus:ring-coral-500 focus:border-transparent"
                  placeholder="0.00"
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
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? 'Creando...' : 'Crear Material'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
