export interface EstadisticasMateriales {
  total_materiales: number;
  stock_critico: number;
  stock_bajo: number;
  stock_normal: number;
  valor_total_inventario: number;
  movimientos_ultimos_30dias: number;
  material_mas_vendido: {
    id: number;
    nombre: string;
    total_vendido_m3: number;
  } | null;
}
