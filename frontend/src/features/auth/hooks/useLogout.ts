import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { logoutApi } from '../api/auth.api';
import { useAuthStore } from '../stores/auth.store';

export const useLogout = () => {
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: logoutApi,
    onSuccess: () => {
      clearAuth();
      toast.success('Sesión cerrada correctamente');
      navigate('/login');
    },
    onError: () => {
      // Aunque falle el backend, limpiamos local
      clearAuth();
      navigate('/login');
    },
  });
};
