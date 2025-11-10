import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { confirmarPedidoApi } from '../api/pedido.api';
import type { ConfirmarPedidoRequest } from '../types/pedido.types';

export const useConfirmarPedido = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ConfirmarPedidoRequest }) =>
      confirmarPedidoApi(id, data),
    onSuccess: (response) => {
      toast.success(response.message || 'Pedido confirmado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error al confirmar pedido';
      toast.error(message);
    },
  });
};
