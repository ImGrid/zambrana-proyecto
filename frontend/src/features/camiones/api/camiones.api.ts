import { api } from '@/lib/axios';
import type {
  CamionesListResponse,
  ListCamionesParams,
  Camion,
  CreateCamionData,
  UpdateCamionData,
  CamionUpdateResponse
} from '../types/camiones.types';
import type { EstadisticasCamiones } from '../types/estadisticas.types';

// GET /api/camiones - Listar camiones con filtros
export const getCamionesApi = async (params?: ListCamionesParams): Promise<CamionesListResponse> => {
  const { data } = await api.get<CamionesListResponse>('/camiones', {
    params: {
      limit: params?.limit,
      offset: params?.offset,
      soloActivos: params?.soloActivos,
      soloDisponibles: params?.soloDisponibles
    }
  });
  return data;
};

// GET /api/camiones/:id - Obtener camión por ID
export const getCamionByIdApi = async (id: number): Promise<Camion> => {
  const { data } = await api.get<Camion>(`/camiones/${id}`);
  return data;
};

// POST /api/camiones - Crear nuevo camión
export const createCamionApi = async (createData: CreateCamionData): Promise<CamionUpdateResponse> => {
  const { data } = await api.post<CamionUpdateResponse>('/camiones', createData);
  return data;
};

// PUT /api/camiones/:id - Actualizar camión
export const updateCamionApi = async (
  id: number,
  updateData: UpdateCamionData
): Promise<CamionUpdateResponse> => {
  const { data } = await api.put<CamionUpdateResponse>(`/camiones/${id}`, updateData);
  return data;
};

// PATCH /api/camiones/:id/toggle-activo - Activar/desactivar camión
export const toggleActivoCamionApi = async (id: number): Promise<CamionUpdateResponse> => {
  const { data } = await api.patch<CamionUpdateResponse>(`/camiones/${id}/toggle-activo`);
  return data;
};

// PATCH /api/camiones/:id/toggle-mantenimiento - Cambiar estado de mantenimiento
export const toggleMantenimientoCamionApi = async (id: number): Promise<CamionUpdateResponse> => {
  const { data } = await api.patch<CamionUpdateResponse>(`/camiones/${id}/toggle-mantenimiento`);
  return data;
};

// GET /api/camiones/estadisticas - Obtener estadísticas de camiones
export const getEstadisticasCamionesApi = async (): Promise<EstadisticasCamiones> => {
  const { data } = await api.get<EstadisticasCamiones>('/camiones/estadisticas');
  return data;
};
