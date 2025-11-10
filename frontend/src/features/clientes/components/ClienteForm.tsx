import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Dialog } from '@headlessui/react';
import { Button } from '@/components/ui/Button';
import { useCreateCliente, useUpdateCliente } from '../hooks/useClientes';
import { TipoCliente, TIPO_CLIENTE_LABELS } from '../types/clientes.types';
import type { Cliente, CreateClienteData, UpdateClienteData } from '../types/clientes.types';

interface ClienteFormProps {
  isOpen: boolean;
  onClose: () => void;
  cliente?: Cliente | null;
}

export const ClienteForm = ({ isOpen, onClose, cliente }: ClienteFormProps) => {
  const isEditing = !!cliente;
  const createMutation = useCreateCliente();
  const updateMutation = useUpdateCliente();

  const [formData, setFormData] = useState({
    razon_social: '',
    tipo_cliente_id: TipoCliente.PARTICULAR.toString(),
    nit: '',
    telefono: '',
    direccion: '',
    latitud: '',
    longitud: '',
    referencia_ubicacion: ''
  });

  useEffect(() => {
    if (cliente) {
      setFormData({
        razon_social: cliente.razon_social,
        tipo_cliente_id: cliente.tipo_cliente_id.toString(),
        nit: cliente.nit || '',
        telefono: cliente.telefono || '',
        direccion: cliente.direccion || '',
        latitud: cliente.latitud?.toString() || '',
        longitud: cliente.longitud?.toString() || '',
        referencia_ubicacion: cliente.referencia_ubicacion || ''
      });
    }
  }, [cliente]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isEditing && cliente) {
      const updateData: UpdateClienteData = {
        razon_social: formData.razon_social || undefined,
        tipo_cliente_id: parseInt(formData.tipo_cliente_id) || undefined,
        nit: formData.nit || undefined,
        telefono: formData.telefono || undefined,
        direccion: formData.direccion || undefined,
        latitud: formData.latitud ? parseFloat(formData.latitud) : undefined,
        longitud: formData.longitud ? parseFloat(formData.longitud) : undefined,
        referencia_ubicacion: formData.referencia_ubicacion || undefined
      };

      await updateMutation.mutateAsync({ id: cliente.id, data: updateData });
    } else {
      const createData: CreateClienteData = {
        razon_social: formData.razon_social,
        tipo_cliente_id: parseInt(formData.tipo_cliente_id),
        nit: formData.nit || undefined,
        telefono: formData.telefono || undefined,
        direccion: formData.direccion || undefined,
        latitud: formData.latitud ? parseFloat(formData.latitud) : undefined,
        longitud: formData.longitud ? parseFloat(formData.longitud) : undefined,
        referencia_ubicacion: formData.referencia_ubicacion || undefined
      };

      await createMutation.mutateAsync(createData);
    }

    handleClose();
  };

  const handleClose = () => {
    setFormData({
      razon_social: '',
      tipo_cliente_id: TipoCliente.PARTICULAR.toString(),
      nit: '',
      telefono: '',
      direccion: '',
      latitud: '',
      longitud: '',
      referencia_ubicacion: ''
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-3xl w-full bg-white rounded-lg shadow-xl">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <Dialog.Title className="text-xl font-semibold text-gray-900">
              {isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}
            </Dialog.Title>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-500 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="razon_social" className="block text-sm font-medium text-gray-700 mb-2">
                  Razón Social / Nombre *
                </label>
                <input
                  type="text"
                  id="razon_social"
                  name="razon_social"
                  value={formData.razon_social}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Empresa S.A. o Juan Pérez"
                />
              </div>

              <div>
                <label htmlFor="tipo_cliente_id" className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Cliente *
                </label>
                <select
                  id="tipo_cliente_id"
                  name="tipo_cliente_id"
                  value={formData.tipo_cliente_id}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={TipoCliente.PARTICULAR}>{TIPO_CLIENTE_LABELS[TipoCliente.PARTICULAR]}</option>
                  <option value={TipoCliente.EMPRESA}>{TIPO_CLIENTE_LABELS[TipoCliente.EMPRESA]}</option>
                </select>
              </div>

              <div>
                <label htmlFor="nit" className="block text-sm font-medium text-gray-700 mb-2">
                  NIT
                </label>
                <input
                  type="text"
                  id="nit"
                  name="nit"
                  value={formData.nit}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="1234567890"
                />
              </div>

              <div>
                <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono
                </label>
                <input
                  type="tel"
                  id="telefono"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="70123456"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="direccion" className="block text-sm font-medium text-gray-700 mb-2">
                  Dirección
                </label>
                <textarea
                  id="direccion"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Av. Principal #123, Zona Norte"
                />
              </div>

              <div>
                <label htmlFor="latitud" className="block text-sm font-medium text-gray-700 mb-2">
                  Latitud GPS
                </label>
                <input
                  type="number"
                  id="latitud"
                  name="latitud"
                  value={formData.latitud}
                  onChange={handleChange}
                  step="0.000001"
                  min="-90"
                  max="90"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="-17.413977"
                />
              </div>

              <div>
                <label htmlFor="longitud" className="block text-sm font-medium text-gray-700 mb-2">
                  Longitud GPS
                </label>
                <input
                  type="number"
                  id="longitud"
                  name="longitud"
                  value={formData.longitud}
                  onChange={handleChange}
                  step="0.000001"
                  min="-180"
                  max="180"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="-66.165320"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="referencia_ubicacion" className="block text-sm font-medium text-gray-700 mb-2">
                  Referencia de Ubicación
                </label>
                <textarea
                  id="referencia_ubicacion"
                  name="referencia_ubicacion"
                  value={formData.referencia_ubicacion}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Al lado de la gasolinera, portón azul"
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
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending
                  ? 'Guardando...'
                  : isEditing
                  ? 'Actualizar Cliente'
                  : 'Crear Cliente'}
              </Button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};
