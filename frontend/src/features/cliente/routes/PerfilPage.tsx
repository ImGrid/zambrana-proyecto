import { useState, useEffect } from 'react';
import { User, Building2, Phone, Hash, Save } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { usePerfilCliente, useUpdatePerfilCliente } from '@/features/clientes/hooks/useClientes';
import { TipoCliente, TIPO_CLIENTE_LABELS } from '@/features/clientes/types/clientes.types';
import type { UpdatePerfilData } from '@/features/clientes/types/clientes.types';

export function PerfilPage() {
  const { data: perfil, isLoading, isError, error, refetch } = usePerfilCliente();
  const updateMutation = useUpdatePerfilCliente();

  const [formData, setFormData] = useState({
    razon_social: '',
    tipo_cliente_id: TipoCliente.INDEPENDIENTE.toString(),
    nit: '',
    telefono: ''
  });

  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (perfil) {
      const initialData = {
        razon_social: perfil.razon_social,
        tipo_cliente_id: perfil.tipo_cliente_id.toString(),
        nit: perfil.nit || '',
        telefono: perfil.telefono || ''
      };
      setFormData(initialData);
    }
  }, [perfil]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      setHasChanges(true);
      return newData;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const updateData: UpdatePerfilData = {
      razon_social: formData.razon_social || undefined,
      tipo_cliente_id: parseInt(formData.tipo_cliente_id) || undefined,
      nit: formData.nit || undefined,
      telefono: formData.telefono || undefined
    };

    await updateMutation.mutateAsync(updateData);
    setHasChanges(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <ErrorState
          title="Error al cargar perfil"
          message={error?.message || 'No se pudo cargar tu perfil'}
          retry={() => refetch()}
        />
      </div>
    );
  }

  if (!perfil) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <ErrorState
          title="Perfil no encontrado"
          message="No se encontró un perfil asociado a tu cuenta"
        />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-cemento-900 mb-2">
          Mi Perfil
        </h1>
        <p className="text-cemento-600">
          Administra la información de tu perfil de cliente
        </p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-cemento-700 mb-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Correo Electrónico
              </div>
            </label>
            <Input
              type="email"
              value={perfil.usuario_email || ''}
              disabled
              className="bg-cemento-50"
            />
            <p className="text-xs text-cemento-500 mt-1">
              El correo electrónico no se puede modificar
            </p>
          </div>

          <div>
            <label htmlFor="razon_social" className="block text-sm font-medium text-cemento-700 mb-2">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Razón Social / Nombre Completo
                <span className="text-coral-500">*</span>
              </div>
            </label>
            <Input
              id="razon_social"
              name="razon_social"
              type="text"
              value={formData.razon_social}
              onChange={handleChange}
              required
              minLength={3}
              maxLength={255}
              placeholder="Ingresa tu nombre o razón social"
            />
          </div>

          <div>
            <label htmlFor="tipo_cliente_id" className="block text-sm font-medium text-cemento-700 mb-2">
              Tipo de Cliente
            </label>
            <Select
              id="tipo_cliente_id"
              name="tipo_cliente_id"
              value={formData.tipo_cliente_id}
              onChange={handleChange}
            >
              <option value={TipoCliente.INDEPENDIENTE}>{TIPO_CLIENTE_LABELS[TipoCliente.INDEPENDIENTE]}</option>
              <option value={TipoCliente.HORMIGONERA}>{TIPO_CLIENTE_LABELS[TipoCliente.HORMIGONERA]}</option>
              <option value={TipoCliente.CONSTRUCTORA}>{TIPO_CLIENTE_LABELS[TipoCliente.CONSTRUCTORA]}</option>
            </Select>
          </div>

          <div>
            <label htmlFor="nit" className="block text-sm font-medium text-cemento-700 mb-2">
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4" />
                NIT (opcional)
              </div>
            </label>
            <Input
              id="nit"
              name="nit"
              type="text"
              value={formData.nit}
              onChange={handleChange}
              maxLength={50}
              placeholder="Ingresa tu NIT"
            />
          </div>

          <div>
            <label htmlFor="telefono" className="block text-sm font-medium text-cemento-700 mb-2">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Teléfono (opcional)
              </div>
            </label>
            <Input
              id="telefono"
              name="telefono"
              type="tel"
              value={formData.telefono}
              onChange={handleChange}
              maxLength={50}
              placeholder="Ingresa tu teléfono"
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-cemento-200">
            <Button
              type="submit"
              variant="primary"
              disabled={!hasChanges || updateMutation.isPending}
              className="flex-1"
            >
              {updateMutation.isPending ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Cambios
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>

      <div className="mt-6 p-4 bg-cemento-50 border border-cemento-200 rounded-lg">
        <p className="text-sm text-cemento-600">
          <strong>Nota:</strong> La dirección de entrega se solicita al crear cada pedido,
          ya que puedes tener múltiples ubicaciones de obra.
        </p>
      </div>
    </div>
  );
}
