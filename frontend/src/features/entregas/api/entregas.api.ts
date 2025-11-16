import { api } from '@/lib/axios';
import type {
  IniciarEntregaInput,
  RecibirGPSInput,
  FinalizarEntregaInput,
  CancelarEntregaInput,
  EntregaConDetalle,
  EstadoEntrega,
  HistorialTracking,
  EntregaActiva,
  EventosEntregaResponse,
  EstadisticasEntregas,
  FinalizarEntregaResponse,
} from '../types/entregas.types';

// Interfaz de respuesta estándar del backend
interface ApiResponse<T> {
  success: boolean;
  data: T;
  mensaje?: string;
  total?: number;
}

// POST /api/entregas/iniciar - Inicia una nueva entrega
// backend/src/modules/entregas/entregas.routes.ts líneas 14-57
export const iniciarEntregaApi = async (
  input: IniciarEntregaInput
): Promise<EntregaConDetalle> => {
  const { data } = await api.post<ApiResponse<EntregaConDetalle>>(
    '/entregas/iniciar',
    input
  );
  return data.data;
};

// POST /api/entregas/:id/gps - Registra posición GPS del camión
// backend/src/modules/entregas/entregas.routes.ts líneas 59-107
export const registrarGPSApi = async (
  entregaId: number,
  gpsData: RecibirGPSInput
): Promise<{
  success: boolean;
  warnings: string[];
  eta_actualizado: Date | null;
  posicion_registrada: {
    latitud: number;
    longitud: number;
    timestamp: Date;
  };
}> => {
  const { data } = await api.post<ApiResponse<any>>(
    `/entregas/${entregaId}/gps`,
    gpsData
  );
  return data.data;
};

// PATCH /api/entregas/:id/finalizar - Finaliza una entrega
// backend/src/modules/entregas/entregas.routes.ts líneas 109-156
export const finalizarEntregaApi = async (
  entregaId: number,
  input: FinalizarEntregaInput
): Promise<FinalizarEntregaResponse> => {
  const { data } = await api.patch<ApiResponse<FinalizarEntregaResponse>>(
    `/entregas/${entregaId}/finalizar`,
    input
  );
  return data.data;
};

// GET /api/entregas/:id - Obtiene estado actual de una entrega
// backend/src/modules/entregas/entregas.routes.ts líneas 158-196
export const getEstadoEntregaApi = async (
  entregaId: number
): Promise<EstadoEntrega> => {
  const { data } = await api.get<ApiResponse<EstadoEntrega>>(
    `/entregas/${entregaId}`
  );
  return data.data;
};

// GET /api/entregas/activas - Obtiene todas las entregas activas
// backend/src/modules/entregas/entregas.routes.ts líneas 198-235
export const getEntregasActivasApi = async (): Promise<EntregaActiva[]> => {
  const { data } = await api.get<ApiResponse<EntregaActiva[]>>(
    '/entregas/activas'
  );
  return data.data;
};

// GET /api/entregas/:id/historial - Obtiene historial completo de tracking
// backend/src/modules/entregas/entregas.routes.ts líneas 237-277
export const getHistorialTrackingApi = async (
  entregaId: number,
  limite: number = 100,
  offset: number = 0
): Promise<HistorialTracking> => {
  const { data } = await api.get<ApiResponse<HistorialTracking>>(
    `/entregas/${entregaId}/historial`,
    {
      params: { limite, offset },
    }
  );
  return data.data;
};

// GET /api/entregas/:id/eventos - Obtiene historial de eventos
// backend/src/modules/entregas/entregas.routes.ts líneas 279-317
export const getEventosEntregaApi = async (
  entregaId: number
): Promise<EventosEntregaResponse> => {
  const { data } = await api.get<ApiResponse<EventosEntregaResponse>>(
    `/entregas/${entregaId}/eventos`
  );
  return data.data;
};

// PATCH /api/entregas/:id/cancelar - Cancela una entrega en progreso
// backend/src/modules/entregas/entregas.routes.ts líneas 319-365
export const cancelarEntregaApi = async (
  entregaId: number,
  input: CancelarEntregaInput
): Promise<{
  entrega: any;
  mensaje: string;
}> => {
  const { data } = await api.patch<ApiResponse<any>>(
    `/entregas/${entregaId}/cancelar`,
    input
  );
  return data.data;
};

// GET /api/entregas/estadisticas - Obtiene estadísticas generales
// backend/src/modules/entregas/entregas.routes.ts líneas 367-406
export const getEstadisticasEntregasApi = async (): Promise<EstadisticasEntregas> => {
  const { data } = await api.get<ApiResponse<EstadisticasEntregas>>(
    '/entregas/estadisticas'
  );
  return data.data;
};
