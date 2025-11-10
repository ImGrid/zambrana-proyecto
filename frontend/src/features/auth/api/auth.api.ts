import { api } from '@/lib/axios';
import type { LoginRequest, LoginResponse, LogoutResponse, RefreshResponse, RegisterRequest, RegisterResponse } from '../types/auth.types';
import type { Usuario } from '@/types';

export const loginApi = async (data: LoginRequest): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>('/auth/login', data);
  return response.data;
};

export const registerApi = async (data: RegisterRequest): Promise<RegisterResponse> => {
  const response = await api.post<RegisterResponse>('/auth/register/public', data);
  return response.data;
};

export const logoutApi = async (): Promise<LogoutResponse> => {
  const response = await api.post<LogoutResponse>('/auth/logout');
  return response.data;
};

export const getCurrentUserApi = async (): Promise<Usuario> => {
  const response = await api.get<Usuario>('/auth/me');
  return response.data;
};

export const refreshTokenApi = async (): Promise<RefreshResponse> => {
  const response = await api.post<RefreshResponse>('/auth/refresh');
  return response.data;
};
