import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { loginApi } from '../api/auth.api';
import { useAuthStore } from '../stores/auth.store';
import { getDefaultRouteForRole } from '@/config/routes.config';
import type { LoginRequest } from '../types/auth.types';

export const useLogin = () => {
  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: loginApi,
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken);
      toast.success(`Bienvenido ${data.user.nombre}`);

      // Redirigir a la ruta por defecto según el rol
      const defaultRoute = getDefaultRouteForRole(data.user.rol);
      navigate(defaultRoute, { replace: true });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error al iniciar sesión';
      toast.error(message);
    },
  });
};
