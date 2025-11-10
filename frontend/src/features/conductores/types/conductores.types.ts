// Tipos alineados 100% con backend/src/modules/conductores/conductores.schemas.ts

// Conductor completo (usado en detalle y después de updates)
export interface Conductor {
  id: number;
  usuario_id: number | null;
  nombre_completo: string;
  ci: string;
  telefono: string | null;
  licencia_categoria: string | null;
  fecha_vencimiento_licencia: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
  usuario_email: string | null;
}

// Conductor en lista (versión simplificada)
export interface ConductorListItem {
  id: number;
  nombre_completo: string;
  ci: string;
  telefono: string | null;
  licencia_categoria: string | null;
  activo: boolean;
}

// Respuesta de lista de conductores
export interface ConductoresListResponse {
  conductores: ConductorListItem[];
  total: number;
  limit: number;
  offset: number;
}

// Parámetros de query para listar conductores
export interface ListConductoresParams {
  limit?: number;
  offset?: number;
  soloActivos?: boolean;
}

// Datos para crear conductor
export interface CreateConductorData {
  nombre_completo: string;
  ci: string;
  telefono?: string;
  licencia_categoria?: string;
  fecha_vencimiento_licencia?: string;
}

// Datos para actualizar conductor
export interface UpdateConductorData {
  nombre_completo?: string;
  ci?: string;
  telefono?: string;
  licencia_categoria?: string;
  fecha_vencimiento_licencia?: string;
}

// Respuesta de update/toggle
export interface ConductorUpdateResponse {
  message: string;
  conductor?: Conductor;
}

// Conductor con licencia próxima a vencer
export interface ConductorLicenciaVencer {
  id: number;
  nombre_completo: string;
  ci: string;
  telefono: string | null;
  licencia_categoria: string | null;
  fecha_vencimiento_licencia: string | null;
  activo: boolean;
}

// Respuesta de licencias próximas a vencer
export interface LicenciasVencerResponse {
  conductores: ConductorLicenciaVencer[];
}
