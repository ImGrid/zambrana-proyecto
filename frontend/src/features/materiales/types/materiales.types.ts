// Tipos alineados 100% con backend/src/modules/materiales/materiales.schemas.ts

// Material completo (usado en detalle y después de updates)
export interface Material {
  id: number;
  nombre: string;
  codigo: string;
  descripcion: string | null;
  unidad_medida: string;
  precio_m3: number;
  stock_actual: number;
  stock_minimo: number;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

// Material en lista (versión simplificada)
export interface MaterialListItem {
  id: number;
  nombre: string;
  codigo: string;
  unidad_medida: string;
  precio_m3: number;
  stock_actual: number;
  stock_minimo: number;
  activo: boolean;
}

// Respuesta de lista de materiales
export interface MaterialesListResponse {
  materiales: MaterialListItem[];
  total: number;
  limit: number;
  offset: number;
}

// Parámetros de query para listar materiales
export interface ListMaterialesParams {
  limit?: number;
  offset?: number;
  soloActivos?: boolean;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// Datos para crear material
export interface CreateMaterialData {
  nombre: string;
  codigo: string;
  descripcion?: string;
  unidad_medida: string;
  precio_m3: number;
  stock_minimo: number;
}

// Datos para actualizar precio
export interface UpdatePrecioData {
  precio_m3: number;
}

// Datos para ajustar stock
export interface AjustarStockData {
  cantidad: number;
  motivo: string;
}

// Respuesta de update/toggle
export interface MaterialUpdateResponse {
  message: string;
  material?: Material;
}

// Entrada del historial de precios
export interface HistorialPrecioItem {
  id: number;
  precio_m3: number;
  fecha_vigencia_desde: string;
  fecha_vigencia_hasta: string | null;
  motivo: string | null;
  usuario_nombre: string | null;
}

// Respuesta de historial de precios
export interface HistorialPreciosResponse {
  historial: HistorialPrecioItem[];
}
