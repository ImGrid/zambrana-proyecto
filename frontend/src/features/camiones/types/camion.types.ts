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

export interface CamionesListResponse {
  camiones: CamionListItem[];
  total: number;
  limit: number;
  offset: number;
}
