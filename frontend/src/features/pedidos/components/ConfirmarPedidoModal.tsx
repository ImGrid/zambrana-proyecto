import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useCamionesDisponibles } from '@/features/camiones/hooks/useCamionesDisponibles';
import { useConductoresActivos } from '@/features/conductores/hooks/useConductoresActivos';
import { useConfirmarPedido } from '@/features/pedido/hooks/useConfirmarPedido';
import type { PedidoListItem } from '@/features/pedido/types/pedido.types';

const confirmarPedidoSchema = z.object({
  camion_id: z.coerce.number().min(1, 'Debe seleccionar un camión'),
  conductor_id: z.coerce.number().min(1, 'Debe seleccionar un conductor'),
  fecha_entrega_estimada: z.string().optional(),
  observaciones: z.string().optional(),
});

type ConfirmarPedidoFormData = z.infer<typeof confirmarPedidoSchema>;

interface ConfirmarPedidoModalProps {
  open: boolean;
  onClose: () => void;
  pedido: PedidoListItem;
}

// Convierte datetime-local YYYY-MM-DDTHH:MM a formato ISO YYYY-MM-DDTHH:MM:SSZ
function convertirDatetimeLocalAISO(datetime: string): string {
  if (!datetime) return '';
  // Agregar segundos :00 y timezone Z (UTC)
  return `${datetime}:00Z`;
}

export function ConfirmarPedidoModal({ open, onClose, pedido }: ConfirmarPedidoModalProps) {
  const { data: camionesData, isLoading: loadingCamiones } = useCamionesDisponibles();
  const { data: conductoresData, isLoading: loadingConductores } = useConductoresActivos();
  const { mutate: confirmarPedido, isPending } = useConfirmarPedido();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ConfirmarPedidoFormData>({
    resolver: zodResolver(confirmarPedidoSchema),
  });

  const onSubmit = (data: ConfirmarPedidoFormData) => {
    confirmarPedido(
      {
        id: pedido.id,
        data: {
          camion_id: data.camion_id,
          conductor_id: data.conductor_id,
          fecha_entrega_estimada: data.fecha_entrega_estimada
            ? convertirDatetimeLocalAISO(data.fecha_entrega_estimada)
            : undefined,
          observaciones: data.observaciones || undefined,
        },
      },
      {
        onSuccess: () => {
          reset();
          onClose();
        },
      }
    );
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const camionesOptions = camionesData?.camiones.map((c) => ({
    value: c.id,
    label: `${c.placa} - ${c.marca || ''} ${c.modelo || ''} (${c.capacidad_m3} m³)`.trim(),
  })) || [];

  const conductoresOptions = conductoresData?.conductores.map((c) => ({
    value: c.id,
    label: `${c.nombre_completo}${c.usuario_email ? ` - ${c.usuario_email}` : ''}`,
  })) || [];

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={`Aprobar Pedido ${pedido.codigo_seguimiento}`}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={handleClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit(onSubmit)} loading={isPending}>
            Confirmar Pedido
          </Button>
        </>
      }
    >
      <form className="space-y-4">
        <div className="bg-cemento-50 rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-cemento-600">Cliente:</span>
            <span className="font-medium text-cemento-900">{pedido.cliente_razon_social}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-cemento-600">Monto total:</span>
            <span className="font-medium text-cemento-900">Bs. {pedido.monto_total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-cemento-600">Total m³:</span>
            <span className="font-medium text-cemento-900">{pedido.total_m3.toFixed(2)} m³</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-cemento-600">Dirección:</span>
            <span className="font-medium text-cemento-900 text-right flex-1 ml-4">
              {pedido.direccion_entrega}
            </span>
          </div>
        </div>

        <Select
          label="Asignar Camión"
          {...register('camion_id')}
          error={errors.camion_id?.message}
          options={camionesOptions}
          required
          disabled={loadingCamiones || isPending}
        >
          <option value="">
            {loadingCamiones ? 'Cargando camiones...' : 'Seleccionar camión'}
          </option>
        </Select>

        <Select
          label="Asignar Conductor"
          {...register('conductor_id')}
          error={errors.conductor_id?.message}
          options={conductoresOptions}
          required
          disabled={loadingConductores || isPending}
        >
          <option value="">
            {loadingConductores ? 'Cargando conductores...' : 'Seleccionar conductor'}
          </option>
        </Select>

        <Input
          label="Fecha estimada de entrega (opcional)"
          type="datetime-local"
          {...register('fecha_entrega_estimada')}
          error={errors.fecha_entrega_estimada?.message}
          disabled={isPending}
        />

        <div>
          <label className="block text-sm font-medium text-cemento-700 mb-1">
            Observaciones (opcional)
          </label>
          <textarea
            {...register('observaciones')}
            rows={3}
            disabled={isPending}
            className="w-full px-3 py-2 border border-piedra-300 rounded-md shadow-sm focus:ring-coral-500 focus:border-coral-500 disabled:bg-cemento-100 disabled:cursor-not-allowed"
            placeholder="Agregar notas adicionales..."
          />
          {errors.observaciones && (
            <p className="mt-1 text-sm text-error-600">{errors.observaciones.message}</p>
          )}
        </div>
      </form>
    </Modal>
  );
}
