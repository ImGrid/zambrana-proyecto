export interface EstadisticasClientes {
  total_clientes: number;
  clientes_activos_mes: number;
  clientes_nuevos_mes: number;
  clientes_inactivos_90dias: number;
  cliente_top_mes: {
    id: number;
    razon_social: string;
    total_gastado: number;
  } | null;
}
