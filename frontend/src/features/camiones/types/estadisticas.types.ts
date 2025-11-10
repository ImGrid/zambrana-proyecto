export interface EstadisticasCamiones {
  total_camiones: number;
  camiones_activos: number;
  camiones_inactivos: number;
  camiones_en_mantenimiento: number;
  camiones_disponibles: number;
  capacidad_total_m3: number;
  camiones_con_entregas_mes: number;
  camion_top_mes: {
    id: number;
    placa: string;
    total_entregas: number;
  } | null;
}
