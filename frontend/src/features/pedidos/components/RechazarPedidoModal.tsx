import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useCancelarPedido } from '@/features/pedido/hooks/useCancelarPedido';
import type { PedidoListItem } from '@/features/pedido/types/pedido.types';

const rechazarPedidoSchema = z.object({
  motivo: z
    .string()
    .min(10, 'El motivo debe tener al menos 10 caracteres')
    .max(500, 'El motivo es demasiado largo'),
});

type RechazarPedidoFormData = z.infer<typeof rechazarPedidoSchema>;

interface RechazarPedidoModalProps {
  open: boolean;
  onClose: () => void;
  pedido: PedidoListItem;
}

export function RechazarPedidoModal({ open, onClose, pedido }: RechazarPedidoModalProps) {
  const { mutate: cancelarPedido, isPending } = useCancelarPedido();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RechazarPedidoFormData>({
    resolver: zodResolver(rechazarPedidoSchema),
  });

  const onSubmit = (data: RechazarPedidoFormData) => {
    cancelarPedido(
      {
        id: pedido.id,
        data: {
          motivo: data.motivo,
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

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={`Rechazar Pedido ${pedido.codigo_seguimiento}`}
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={handleClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            onClick={handleSubmit(onSubmit)}
            loading={isPending}
          >
            Confirmar Rechazo
          </Button>
        </>
      }
    >
      <form className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Cliente:</span>
            <span className="font-medium text-gray-900">{pedido.cliente_razon_social}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Monto total:</span>
            <span className="font-medium text-gray-900">Bs. {pedido.monto_total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Total m³:</span>
            <span className="font-medium text-gray-900">{pedido.total_m3.toFixed(2)} m³</span>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-sm text-yellow-800">
            Esta acción cambiará el estado del pedido a CANCELADO y no se podrá revertir.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Motivo del rechazo <span className="text-red-500">*</span>
          </label>
          <textarea
            {...register('motivo')}
            rows={4}
            disabled={isPending}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="Explique detalladamente el motivo del rechazo..."
          />
          {errors.motivo && (
            <p className="mt-1 text-sm text-red-600">{errors.motivo.message}</p>
          )}
        </div>
      </form>
    </Modal>
  );
}
