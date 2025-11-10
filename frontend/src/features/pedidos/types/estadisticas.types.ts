export interface EstadisticasPedidos {
  total_pedidos: number;
  pedidos_pendientes: number;
  pedidos_confirmados: number;
  pedidos_en_camino: number;
  pedidos_entregados: number;
  pedidos_cancelados: number;
  pedidos_mes: number;
  monto_total_mes: number;
  volumen_total_mes_m3: number;
  cliente_top_mes: {
    id: number;
    razon_social: string;
    total_pedidos: number;
    monto_total: number;
  } | null;
}
