import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { registerApi } from '../api/auth.api';
import { useAuthStore } from '../stores/auth.store';
import { getDefaultRouteForRole } from '@/config/routes.config';

export const useRegister = () => {
  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: registerApi,
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken);
      toast.success('Cuenta creada exitosamente');

      // Redirigir a la ruta por defecto según el rol
      const defaultRoute = getDefaultRouteForRole(data.user.rol);
      navigate(defaultRoute, { replace: true });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error al registrar usuario';
      toast.error(message);
    },
  });
};
