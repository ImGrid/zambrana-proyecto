export interface User {
  id: number;
  email: string;
  rol: 'admin' | 'gerente' | 'conductor' | 'cliente';
  nombre: string;
  created_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}

export interface RefreshResponse {
  accessToken: string;
}

export interface LogoutResponse {
  message: string;
}

export interface RegisterRequest {
  nombre: string;
  email: string;
  password: string;
  confirmPassword: string;
  tipo_cliente_id: number;
  telefono?: string;
}

export interface RegisterResponse {
  accessToken: string;
  user: User;
}
