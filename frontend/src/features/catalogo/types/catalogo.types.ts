// Tipos que coinciden EXACTAMENTE con el backend
// backend/src/modules/materiales/materiales.schemas.ts

// Material en lista (respuesta simplificada)
export interface MaterialCatalogo {
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
  materiales: MaterialCatalogo[];
  total: number;
  limit: number;
  offset: number;
}

// Query params para listar materiales
export interface ListMaterialesParams {
  limit?: number;
  offset?: number;
  soloActivos?: boolean;
}
