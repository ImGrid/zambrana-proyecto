// Tipos alineados 100% con backend/src/modules/camiones/camiones.schemas.ts

// Camión completo (usado en detalle y después de updates)
export interface Camion {
  id: number;
  placa: string;
  tipo_camion_id: number;
  tipo_camion: string;
  marca: string | null;
  modelo: string | null;
  año: number | null;
  capacidad_m3: number;
  color: string | null;
  activo: boolean;
  en_mantenimiento: boolean;
  created_at: string;
  updated_at: string;
}

// Camión en lista (versión simplificada)
export interface CamionListItem {
  id: number;
  placa: string;
  tipo_camion: string;
  marca: string | null;
  modelo: string | null;
  capacidad_m3: number;
  activo: boolean;
  en_mantenimiento: boolean;
}

// Respuesta de lista de camiones
export interface CamionesListResponse {
  camiones: CamionListItem[];
  total: number;
  limit: number;
  offset: number;
}

// Parámetros de query para listar camiones
export interface ListCamionesParams {
  limit?: number;
  offset?: number;
  soloActivos?: boolean;
  soloDisponibles?: boolean;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// Datos para crear camión
export interface CreateCamionData {
  placa: string;
  tipo_camion_id: number;
  marca?: string;
  modelo?: string;
  año?: number;
  capacidad_m3: number;
  color?: string;
}

// Datos para actualizar camión
export interface UpdateCamionData {
  placa?: string;
  tipo_camion_id?: number;
  marca?: string;
  modelo?: string;
  año?: number;
  capacidad_m3?: number;
  color?: string;
}

// Respuesta de update/toggle
export interface CamionUpdateResponse {
  message: string;
  camion?: Camion;
}

// Tipos de camiones disponibles (según base de datos)
export enum TipoCamion {
  VOLQUETA_SIMPLE = 1,
  VOLQUETA_DOBLE = 2,
  MIXER = 3
}

export const TIPO_CAMION_LABELS: Record<number, string> = {
  [TipoCamion.VOLQUETA_SIMPLE]: 'Volqueta Simple',
  [TipoCamion.VOLQUETA_DOBLE]: 'Volqueta Doble',
  [TipoCamion.MIXER]: 'Mixer'
};
