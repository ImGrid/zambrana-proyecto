import { api } from '@/lib/axios';
import type {
  ConductoresListResponse,
  ListConductoresParams,
  Conductor,
  CreateConductorData,
  UpdateConductorData,
  ConductorUpdateResponse,
  LicenciasVencerResponse
} from '../types/conductores.types';
import type { EstadisticasConductores } from '../types/estadisticas.types';

// GET /api/conductores - Listar conductores con filtros
export const getConductoresApi = async (params?: ListConductoresParams): Promise<ConductoresListResponse> => {
  const { data } = await api.get<ConductoresListResponse>('/conductores', {
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

// GET /api/conductores/:id - Obtener conductor por ID
export const getConductorByIdApi = async (id: number): Promise<Conductor> => {
  const { data } = await api.get<Conductor>(`/conductores/${id}`);
  return data;
};

// POST /api/conductores - Crear nuevo conductor
export const createConductorApi = async (createData: CreateConductorData): Promise<ConductorUpdateResponse> => {
  const { data } = await api.post<ConductorUpdateResponse>('/conductores', createData);
  return data;
};

// PUT /api/conductores/:id - Actualizar conductor
export const updateConductorApi = async (
  id: number,
  updateData: UpdateConductorData
): Promise<ConductorUpdateResponse> => {
  const { data } = await api.put<ConductorUpdateResponse>(`/conductores/${id}`, updateData);
  return data;
};

// PATCH /api/conductores/:id/toggle-activo - Activar/desactivar conductor
export const toggleActivoConductorApi = async (id: number): Promise<ConductorUpdateResponse> => {
  const { data } = await api.patch<ConductorUpdateResponse>(`/conductores/${id}/toggle-activo`);
  return data;
};

// GET /api/conductores/licencias/proximas-vencer - Obtener licencias próximas a vencer
export const getLicenciasProximasVencerApi = async (dias: number = 30): Promise<LicenciasVencerResponse> => {
  const { data } = await api.get<LicenciasVencerResponse>('/conductores/licencias/proximas-vencer', {
    params: { dias }
  });
  return data;
};

// GET /api/conductores/estadisticas - Obtener estadísticas de conductores
export const getEstadisticasConductoresApi = async (): Promise<EstadisticasConductores> => {
  const { data } = await api.get<EstadisticasConductores>('/conductores/estadisticas');
  return data;
};
