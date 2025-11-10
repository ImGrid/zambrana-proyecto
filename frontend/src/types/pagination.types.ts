// Tipos genéricos para paginación y respuestas del API

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

// Tipos para filtros comunes
export interface DateRangeFilter {
  desde?: string;
  hasta?: string;
}

export interface SearchFilter {
  buscar?: string;
}

export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Tipo combinado para queries complejas
export type QueryParams = PaginationParams & SortParams;
