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

export interface ConductorListItem {
  id: number;
  nombre_completo: string;
  ci: string;
  telefono: string | null;
  licencia_categoria: string | null;
  activo: boolean;
}

export interface ConductoresListResponse {
  conductores: ConductorListItem[];
  total: number;
  limit: number;
  offset: number;
}
