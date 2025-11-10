// Tipos globales compartidos en toda la aplicación

export interface Usuario {
  id: number;
  email: string;
  nombre: string;
  rol: 'admin' | 'gerente' | 'conductor' | 'cliente';
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiError {
  message: string;
  statusCode?: number;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
