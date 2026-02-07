import { api } from '@/lib/axios';
import type {
  MaterialesListResponse,
  ListMaterialesParams,
  Material,
  CreateMaterialData,
  UpdatePrecioData,
  AjustarStockData,
  MaterialUpdateResponse,
  HistorialPreciosResponse
} from '../types/materiales.types';
import type { EstadisticasMateriales } from '../types/estadisticas.types';

// GET /api/materiales - Listar materiales con paginación
export const getMaterialesApi = async (params?: ListMaterialesParams): Promise<MaterialesListResponse> => {
  const { data } = await api.get<MaterialesListResponse>('/materiales', {
    params: {
      limit: params?.limit,
      offset: params?.offset,
      soloActivos: params?.soloActivos,
      sort_by: params?.sort_by,
      sort_order: params?.sort_order
    }
  });
  return data;
};

// GET /api/materiales/:id - Obtener material por ID
export const getMaterialByIdApi = async (id: number): Promise<Material> => {
  const { data } = await api.get<Material>(`/materiales/${id}`);
  return data;
};

// POST /api/materiales - Crear nuevo material
export const createMaterialApi = async (createData: CreateMaterialData): Promise<MaterialUpdateResponse> => {
  const { data } = await api.post<MaterialUpdateResponse>('/materiales', createData);
  return data;
};

// PUT /api/materiales/:id/precio - Actualizar precio del material
export const updatePrecioApi = async (
  id: number,
  updateData: UpdatePrecioData
): Promise<MaterialUpdateResponse> => {
  const { data } = await api.put<MaterialUpdateResponse>(`/materiales/${id}/precio`, updateData);
  return data;
};

// POST /api/materiales/:id/ajustar-stock - Ajustar stock del material
export const ajustarStockApi = async (
  id: number,
  ajusteData: AjustarStockData
): Promise<MaterialUpdateResponse> => {
  const { data } = await api.post<MaterialUpdateResponse>(`/materiales/${id}/ajustar-stock`, ajusteData);
  return data;
};

// PATCH /api/materiales/:id/toggle-activo - Activar/desactivar material
export const toggleActivoMaterialApi = async (id: number): Promise<MaterialUpdateResponse> => {
  const { data } = await api.patch<MaterialUpdateResponse>(`/materiales/${id}/toggle-activo`);
  return data;
};

// GET /api/materiales/:id/historial-precios - Obtener historial de precios
export const getHistorialPreciosApi = async (id: number): Promise<HistorialPreciosResponse> => {
  const { data } = await api.get<HistorialPreciosResponse>(`/materiales/${id}/historial-precios`);
  return data;
};

// GET /api/materiales/estadisticas - Obtener estadísticas de materiales
export const getEstadisticasMaterialesApi = async (): Promise<EstadisticasMateriales> => {
  const { data } = await api.get<EstadisticasMateriales>('/materiales/estadisticas');
  return data;
};
