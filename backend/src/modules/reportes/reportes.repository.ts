import { pool } from '../../database/postgres/pool.js';

// Tipos para las filas de las vistas materializadas

export interface DashboardRow {
  fecha: Date;
  total_pedidos: number;
  entregados: number;
  cancelados: number;
  en_proceso: number;
  ingresos_dia: number;
  tiempo_promedio_entrega: number | null;
  conductores_activos: number;
  camiones_activos: number;
}

export interface ClienteMensualRow {
  cliente_id: number;
  razon_social: string;
  mes: Date;
  total_pedidos: number;
  total_gastado: number;
  total_m3_comprados: number;
  tiempo_promedio_entrega: number | null;
  pedidos_cancelados: number;
  pedidos_entregados: number;
}

export interface ConductorRendimientoRow {
  conductor_id: number;
  nombre_completo: string;
  total_entregas: number;
  tiempo_promedio_entrega: number | null;
  entregas_exitosas: number;
  entregas_fallidas: number;
  adherencia_promedio_ruta: number | null;
  total_desviaciones: number;
}

export interface MaterialStockRow {
  material_id: number;
  nombre: string;
  codigo: string;
  stock_actual: number;
  stock_minimo: number;
  precio_m3: number;
  total_movimientos_30dias: number;
  entradas_30dias: number;
  salidas_30dias: number;
  estado_stock: string;
}

export interface VentaRow {
  pedido_id: number;
  codigo_seguimiento: string;
  fecha_pedido: Date;
  cliente_razon_social: string;
  material_nombre: string;
  cantidad_m3: number;
  precio_unitario: number;
  subtotal: number;
  estado_nombre: string;
}

// Consultas a vistas materializadas

/**
 * Obtener métricas del dashboard desde vista materializada
 */
export async function getDashboardMetricas(dias: number = 30): Promise<DashboardRow[]> {
  const result = await pool.query<DashboardRow>(
    `SELECT * FROM mv_dashboard_gerente
     WHERE fecha >= CURRENT_DATE - $1 * INTERVAL '1 day'
     ORDER BY fecha DESC`,
    [dias]
  );

  return result.rows;
}

/**
 * Obtener reporte mensual de un cliente desde vista materializada
 */
export async function getClienteMensual(
  clienteId: number,
  meses: number = 6
): Promise<ClienteMensualRow[]> {
  const result = await pool.query<ClienteMensualRow>(
    `SELECT * FROM mv_reporte_clientes_mensual
     WHERE cliente_id = $1
       AND mes >= DATE_TRUNC('month', CURRENT_DATE) - $2 * INTERVAL '1 month'
     ORDER BY mes DESC`,
    [clienteId, meses]
  );

  return result.rows;
}

/**
 * Verificar que el cliente existe
 */
export async function findClienteById(clienteId: number): Promise<{ id: number; razon_social: string } | null> {
  const result = await pool.query<{ id: number; razon_social: string }>(
    'SELECT id, razon_social FROM clientes WHERE id = $1',
    [clienteId]
  );

  return result.rows[0] || null;
}

/**
 * Obtener rendimiento de conductor desde vista materializada
 */
export async function getConductorRendimiento(conductorId: number): Promise<ConductorRendimientoRow | null> {
  const result = await pool.query<ConductorRendimientoRow>(
    `SELECT * FROM mv_rendimiento_conductores
     WHERE conductor_id = $1`,
    [conductorId]
  );

  return result.rows[0] || null;
}

/**
 * Verificar que el conductor existe
 */
export async function findConductorById(conductorId: number): Promise<{ id: number; nombre_completo: string } | null> {
  const result = await pool.query<{ id: number; nombre_completo: string }>(
    'SELECT id, nombre_completo FROM conductores WHERE id = $1',
    [conductorId]
  );

  return result.rows[0] || null;
}

/**
 * Obtener resumen de stock desde vista materializada
 */
export async function getResumenStock(estadoFiltro?: string): Promise<MaterialStockRow[]> {
  let query = 'SELECT * FROM mv_resumen_stock';
  const params: string[] = [];

  if (estadoFiltro && estadoFiltro !== 'TODOS') {
    query += ' WHERE estado_stock = $1';
    params.push(estadoFiltro);
  }

  query += ' ORDER BY estado_stock DESC, stock_actual ASC';

  const result = await pool.query<MaterialStockRow>(query, params);
  return result.rows;
}

/**
 * Obtener ventas detalladas con filtros
 */
export async function getVentasDetalladas(
  limit: number = 50,
  offset: number = 0,
  filters: {
    fecha_desde?: string;
    fecha_hasta?: string;
    cliente_id?: number;
    material_id?: number;
  } = {}
): Promise<VentaRow[]> {
  let query = `
    SELECT
      p.id AS pedido_id,
      p.codigo_seguimiento,
      p.fecha_pedido,
      c.razon_social AS cliente_razon_social,
      m.nombre AS material_nombre,
      dp.cantidad_m3,
      dp.precio_unitario,
      dp.subtotal,
      e.nombre AS estado_nombre
    FROM pedidos p
    INNER JOIN clientes c ON p.cliente_id = c.id
    INNER JOIN detalle_pedidos dp ON p.id = dp.pedido_id
    INNER JOIN materiales m ON dp.material_id = m.id
    INNER JOIN estados_pedido e ON p.estado_actual_id = e.id
    WHERE 1=1
  `;

  const params: (string | number)[] = [];
  let paramIndex = 1;

  if (filters.fecha_desde) {
    query += ` AND p.fecha_pedido >= $${paramIndex}`;
    params.push(filters.fecha_desde);
    paramIndex++;
  }

  if (filters.fecha_hasta) {
    query += ` AND p.fecha_pedido <= $${paramIndex}`;
    params.push(filters.fecha_hasta);
    paramIndex++;
  }

  if (filters.cliente_id) {
    query += ` AND p.cliente_id = $${paramIndex}`;
    params.push(filters.cliente_id);
    paramIndex++;
  }

  if (filters.material_id) {
    query += ` AND dp.material_id = $${paramIndex}`;
    params.push(filters.material_id);
    paramIndex++;
  }

  query += ` ORDER BY p.fecha_pedido DESC, p.id DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(limit, offset);

  const result = await pool.query<VentaRow>(query, params);
  return result.rows;
}

/**
 * Contar total de ventas con filtros
 */
export async function countVentas(
  filters: {
    fecha_desde?: string;
    fecha_hasta?: string;
    cliente_id?: number;
    material_id?: number;
  } = {}
): Promise<number> {
  let query = `
    SELECT COUNT(*) AS count
    FROM pedidos p
    INNER JOIN detalle_pedidos dp ON p.id = dp.pedido_id
    WHERE 1=1
  `;

  const params: (string | number)[] = [];
  let paramIndex = 1;

  if (filters.fecha_desde) {
    query += ` AND p.fecha_pedido >= $${paramIndex}`;
    params.push(filters.fecha_desde);
    paramIndex++;
  }

  if (filters.fecha_hasta) {
    query += ` AND p.fecha_pedido <= $${paramIndex}`;
    params.push(filters.fecha_hasta);
    paramIndex++;
  }

  if (filters.cliente_id) {
    query += ` AND p.cliente_id = $${paramIndex}`;
    params.push(filters.cliente_id);
    paramIndex++;
  }

  if (filters.material_id) {
    query += ` AND dp.material_id = $${paramIndex}`;
    params.push(filters.material_id);
    paramIndex++;
  }

  const result = await pool.query<{ count: string }>(query, params);
  return parseInt(result.rows[0]?.count || '0', 10);
}

/**
 * Calcular totales de ventas con filtros
 */
export async function getTotalesVentas(
  filters: {
    fecha_desde?: string;
    fecha_hasta?: string;
    cliente_id?: number;
    material_id?: number;
  } = {}
): Promise<{ total_ventas: number; total_m3: number; monto_total: number }> {
  let query = `
    SELECT
      COUNT(DISTINCT p.id) AS total_ventas,
      SUM(dp.cantidad_m3) AS total_m3,
      SUM(dp.subtotal) AS monto_total
    FROM pedidos p
    INNER JOIN detalle_pedidos dp ON p.id = dp.pedido_id
    WHERE 1=1
  `;

  const params: (string | number)[] = [];
  let paramIndex = 1;

  if (filters.fecha_desde) {
    query += ` AND p.fecha_pedido >= $${paramIndex}`;
    params.push(filters.fecha_desde);
    paramIndex++;
  }

  if (filters.fecha_hasta) {
    query += ` AND p.fecha_pedido <= $${paramIndex}`;
    params.push(filters.fecha_hasta);
    paramIndex++;
  }

  if (filters.cliente_id) {
    query += ` AND p.cliente_id = $${paramIndex}`;
    params.push(filters.cliente_id);
    paramIndex++;
  }

  if (filters.material_id) {
    query += ` AND dp.material_id = $${paramIndex}`;
    params.push(filters.material_id);
    paramIndex++;
  }

  const result = await pool.query<{
    total_ventas: string;
    total_m3: string | null;
    monto_total: string | null;
  }>(query, params);

  const row = result.rows[0];

  return {
    total_ventas: parseInt(row?.total_ventas || '0', 10),
    total_m3: parseFloat(row?.total_m3 || '0'),
    monto_total: parseFloat(row?.monto_total || '0')
  };
}

// Nombres validos de vistas materializadas
const MATERIALIZED_VIEWS = [
  'mv_dashboard_gerente',
  'mv_reporte_clientes_mensual',
  'mv_rendimiento_conductores',
  'mv_resumen_stock'
] as const;

type MaterializedViewName = typeof MATERIALIZED_VIEWS[number];

// Refrescar una vista materializada individual (CONCURRENTLY)
export async function refreshSingleView(viewName: MaterializedViewName): Promise<void> {
  await pool.query(`REFRESH MATERIALIZED VIEW CONCURRENTLY ${viewName}`);
}

/**
 * Refrescar todas las vistas materializadas (CONCURRENTLY)
 */
export async function refreshMaterializedViews(): Promise<{
  success: boolean;
  refreshed: string[];
  errors: Array<{ view: string; error: string }>;
  duration_ms: number;
}> {
  const startTime = Date.now();
  const refreshed: string[] = [];
  const errors: Array<{ view: string; error: string }> = [];

  for (const view of MATERIALIZED_VIEWS) {
    try {
      await refreshSingleView(view);
      refreshed.push(view);
    } catch (error: any) {
      errors.push({
        view,
        error: error.message || 'Error desconocido'
      });
    }
  }

  const duration_ms = Date.now() - startTime;

  return {
    success: errors.length === 0,
    refreshed,
    errors,
    duration_ms
  };
}
