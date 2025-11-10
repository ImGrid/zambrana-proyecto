export interface EstadisticasConductores {
  total_conductores: number;
  conductores_activos: number;
  conductores_inactivos: number;
  licencias_por_vencer_30dias: number;
  licencias_vencidas: number;
  conductores_con_entregas_mes: number;
  conductor_top_mes: {
    id: number;
    nombre_completo: string;
    total_entregas: number;
  } | null;
}
