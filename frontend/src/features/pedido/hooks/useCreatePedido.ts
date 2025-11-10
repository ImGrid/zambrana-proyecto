import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { createPedidoApi } from '../api/pedido.api';
import { ROUTES } from '@/config/routes.config';

export const useCreatePedido = () => {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: createPedidoApi,
    onSuccess: (data) => {
      toast.success(`Pedido creado: ${data.pedido.codigo_seguimiento}`);

      // Redirigir a la vista de pedidos
      navigate(ROUTES.MIS_PEDIDOS.path);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error al crear pedido';
      toast.error(message);
    },
  });
};
