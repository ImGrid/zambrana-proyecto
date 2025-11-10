import { useAuthStore } from '../stores/auth.store';

export const useAuth = () => {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  return {
    user,
    isAuthenticated,
    isLoading,
    logout: clearAuth,
  };
};
