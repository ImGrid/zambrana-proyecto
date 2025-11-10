// Tipos basados en schemas del backend (reportes.schemas.ts)

// Coincide con metricaDashboardSchema
export interface DashboardMetrica {
  fecha: string;
  total_pedidos: number;
  entregados: number;
  cancelados: number;
  en_proceso: number;
  ingresos_dia: number;
  tiempo_promedio_entrega: number | null;
  conductores_activos: number;
  camiones_activos: number;
}

// Coincide con dashboardResponseSchema
export interface DashboardResponse {
  metricas: DashboardMetrica[];
  resumen: {
    total_pedidos: number;
    total_ingresos: number;
    promedio_diario: number;
    tasa_entrega: number;
  };
}

// Parámetros de consulta
export interface DashboardQueryParams {
  dias?: number;
}
