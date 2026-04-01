-- Migracion: Hallazgo 2 - Indices UNIQUE para REFRESH CONCURRENTLY
-- Fecha: 2026-02-06
-- REFRESH MATERIALIZED VIEW CONCURRENTLY requiere al menos un indice UNIQUE

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_dashboard_uniq
  ON mv_dashboard_gerente (fecha);

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_stock_uniq
  ON mv_resumen_stock (material_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_conductores_uniq
  ON mv_rendimiento_conductores (conductor_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_clientes_uniq
  ON mv_reporte_clientes_mensual (cliente_id, mes);
