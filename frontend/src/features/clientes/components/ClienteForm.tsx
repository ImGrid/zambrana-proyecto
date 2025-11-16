import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
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
    tipo_cliente_id: TipoCliente.INDEPENDIENTE.toString(),
    nit: '',
    telefono: ''
  });

  useEffect(() => {
    if (cliente) {
      setFormData({
        razon_social: cliente.razon_social,
        tipo_cliente_id: cliente.tipo_cliente_id.toString(),
        nit: cliente.nit || '',
        telefono: cliente.telefono || ''
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
        telefono: formData.telefono || undefined
      };

      await updateMutation.mutateAsync({ id: cliente.id, data: updateData });
    } else {
      const createData: CreateClienteData = {
        razon_social: formData.razon_social,
        tipo_cliente_id: parseInt(formData.tipo_cliente_id),
        nit: formData.nit || undefined,
        telefono: formData.telefono || undefined
      };

      await createMutation.mutateAsync(createData);
    }

    handleClose();
  };

  const handleClose = () => {
    setFormData({
      razon_social: '',
      tipo_cliente_id: TipoCliente.INDEPENDIENTE.toString(),
      nit: '',
      telefono: ''
    });
    onClose();
  };

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      title={isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="razon_social" className="block text-sm font-medium text-cemento-700 mb-2">
              Razón Social / Nombre *
            </label>
            <input
              type="text"
              id="razon_social"
              name="razon_social"
              value={formData.razon_social}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-piedra-300 rounded-lg focus:ring-2 focus:ring-coral-500 focus:border-transparent"
              placeholder="Empresa S.A. o Juan Pérez"
            />
          </div>

          <div>
            <label htmlFor="tipo_cliente_id" className="block text-sm font-medium text-cemento-700 mb-2">
              Tipo de Cliente *
            </label>
            <select
              id="tipo_cliente_id"
              name="tipo_cliente_id"
              value={formData.tipo_cliente_id}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-piedra-300 rounded-lg focus:ring-2 focus:ring-coral-500 focus:border-transparent"
            >
              <option value={TipoCliente.INDEPENDIENTE}>{TIPO_CLIENTE_LABELS[TipoCliente.INDEPENDIENTE]}</option>
              <option value={TipoCliente.HORMIGONERA}>{TIPO_CLIENTE_LABELS[TipoCliente.HORMIGONERA]}</option>
              <option value={TipoCliente.CONSTRUCTORA}>{TIPO_CLIENTE_LABELS[TipoCliente.CONSTRUCTORA]}</option>
            </select>
          </div>

              <div>
                <label htmlFor="nit" className="block text-sm font-medium text-cemento-700 mb-2">
                  NIT
                </label>
                <input
                  type="text"
                  id="nit"
                  name="nit"
                  value={formData.nit}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-piedra-300 rounded-lg focus:ring-2 focus:ring-coral-500 focus:border-transparent"
                  placeholder="1234567890"
                />
              </div>

              <div>
                <label htmlFor="telefono" className="block text-sm font-medium text-cemento-700 mb-2">
                  Teléfono
                </label>
                <input
                  type="tel"
                  id="telefono"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-piedra-300 rounded-lg focus:ring-2 focus:ring-coral-500 focus:border-transparent"
                  placeholder="70123456"
                />
              </div>
        </div>

        <div className="p-4 bg-cemento-50 border border-cemento-200 rounded-lg">
          <p className="text-sm text-cemento-600">
            <strong>Nota:</strong> La dirección de entrega se solicita al crear cada pedido, ya que los clientes pueden tener múltiples ubicaciones de obra.
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-4">
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
    </Modal>
  );
};
