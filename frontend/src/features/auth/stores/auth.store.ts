import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types/auth.types';
import { api } from '@/lib/axios';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: User, accessToken: string) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: true,

      setAuth: (user, accessToken) => {
        set({
          user,
          accessToken,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      clearAuth: () => {
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      hydrate: async () => {
        const token = get().accessToken;

        if (!token) {
          set({ isLoading: false });
          return;
        }

        try {
          // Intentar obtener usuario actual con el token guardado
          const response = await api.get<User>('/auth/me');
          set({
            user: response.data,
            accessToken: token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          // Si falla, intentar refresh
          if (error.response?.status === 401) {
            try {
              const refreshResponse = await api.post<{ accessToken: string }>('/auth/refresh');
              const newToken = refreshResponse.data.accessToken;

              // Intentar nuevamente con el nuevo token
              set({ accessToken: newToken });
              const userResponse = await api.get<User>('/auth/me');

              set({
                user: userResponse.data,
                accessToken: newToken,
                isAuthenticated: true,
                isLoading: false,
              });
            } catch {
              // Refresh también falló, limpiar todo
              get().clearAuth();
            }
          } else {
            get().clearAuth();
          }
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        accessToken: state.accessToken,
      }),
    }
  )
);
