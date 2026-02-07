import { pool } from '../../database/postgres/pool.js';

// Tipos para las filas de la base de datos
export interface MaterialRow {
  id: number;
  nombre: string;
  codigo: string;
  descripcion: string | null;
  unidad_medida: string;
  precio_m3: number;
  stock_actual: number;
  stock_minimo: number;
  activo: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface MaterialListItem {
  id: number;
  nombre: string;
  codigo: string;
  unidad_medida: string;
  precio_m3: number;
  stock_actual: number;
  stock_minimo: number;
  activo: boolean;
}

// Whitelist de campos ordenables
const SORT_FIELDS: Record<string, string> = {
  nombre: 'nombre',
  codigo: 'codigo',
  precio_m3: 'precio_m3',
  stock_actual: 'stock_actual',
};

// Listar todos los materiales con paginación
export async function findAllMateriales(
  limit: number = 20,
  offset: number = 0,
  soloActivos: boolean = false,
  sort_by?: string,
  sort_order?: 'asc' | 'desc'
): Promise<MaterialListItem[]> {
  const whereClause = soloActivos ? 'WHERE activo = true' : '';
  const sortColumn = (sort_by && SORT_FIELDS[sort_by]) || 'nombre';
  const sortDirection = sort_order === 'desc' ? 'DESC' : 'ASC';

  const result = await pool.query<MaterialRow>(
    `SELECT
      id,
      nombre,
      codigo,
      unidad_medida,
      precio_m3,
      stock_actual,
      stock_minimo,
      activo
    FROM materiales
    ${whereClause}
    ORDER BY ${sortColumn} ${sortDirection}
    LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  return result.rows.map(row => ({
    id: row.id,
    nombre: row.nombre,
    codigo: row.codigo,
    unidad_medida: row.unidad_medida,
    precio_m3: Number(row.precio_m3),
    stock_actual: Number(row.stock_actual),
    stock_minimo: Number(row.stock_minimo),
    activo: row.activo
  }));
}

// Contar total de materiales
export async function countMateriales(soloActivos: boolean = false): Promise<number> {
  const whereClause = soloActivos ? 'WHERE activo = true' : '';

  const result = await pool.query<{ count: string }>(
    `SELECT COUNT(*) as count FROM materiales ${whereClause}`
  );

  // Verificar que existan resultados antes de acceder a rows[0]
  if (result.rows.length === 0) {
    return 0;
  }

  const row = result.rows[0];
  if (!row) {
    return 0;
  }

  return parseInt(row.count, 10);
}

// Buscar material por ID
export async function findMaterialById(id: number): Promise<MaterialRow | null> {
  const result = await pool.query<MaterialRow>(
    `SELECT
      id,
      nombre,
      codigo,
      descripcion,
      unidad_medida,
      precio_m3,
      stock_actual,
      stock_minimo,
      activo,
      created_at,
      updated_at
    FROM materiales
    WHERE id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  if (!row) {
    return null;
  }

  return {
    ...row,
    precio_m3: Number(row.precio_m3),
    stock_actual: Number(row.stock_actual),
    stock_minimo: Number(row.stock_minimo)
  };
}

// Buscar material por código
export async function findMaterialByCodigo(codigo: string): Promise<MaterialRow | null> {
  const result = await pool.query<MaterialRow>(
    `SELECT
      id,
      nombre,
      codigo,
      descripcion,
      unidad_medida,
      precio_m3,
      stock_actual,
      stock_minimo,
      activo,
      created_at,
      updated_at
    FROM materiales
    WHERE codigo = $1`,
    [codigo]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  if (!row) {
    return null;
  }

  return {
    ...row,
    precio_m3: Number(row.precio_m3),
    stock_actual: Number(row.stock_actual),
    stock_minimo: Number(row.stock_minimo)
  };
}

// Crear nuevo material
export async function createMaterial(data: {
  nombre: string;
  codigo: string;
  descripcion?: string;
  unidad_medida: string;
  precio_m3: number;
  stock_minimo: number;
}): Promise<number> {
  const result = await pool.query<{ id: number }>(
    `INSERT INTO materiales (nombre, codigo, descripcion, unidad_medida, precio_m3, stock_minimo)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [
      data.nombre,
      data.codigo,
      data.descripcion || null,
      data.unidad_medida,
      data.precio_m3,
      data.stock_minimo
    ]
  );

  const row = result.rows[0];
  if (!row) {
    throw new Error('No se pudo crear el material');
  }

  return row.id;
}

// Verificar si código ya existe (para evitar duplicados)
export async function codigoExists(codigo: string, excludeId?: number): Promise<boolean> {
  let query = 'SELECT id FROM materiales WHERE codigo = $1';
  const params: (string | number)[] = [codigo];

  if (excludeId !== undefined) {
    query += ' AND id != $2';
    params.push(excludeId);
  }

  const result = await pool.query(query, params);
  return result.rows.length > 0;
}

// Actualizar precio de material (crea historial automático)
export async function updatePrecioMaterial(
  id: number,
  nuevoPrecio: number,
  usuarioId: number
): Promise<boolean> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Verificar que el material existe
    const materialActual = await client.query<{ precio_m3: number }>(
      'SELECT precio_m3 FROM materiales WHERE id = $1',
      [id]
    );

    if (materialActual.rows.length === 0) {
      await client.query('ROLLBACK');
      return false;
    }

    // Cerrar el registro de historial actual (establecer fecha_vigencia_hasta)
    await client.query(
      `UPDATE historial_precios
       SET fecha_vigencia_hasta = CURRENT_DATE
       WHERE material_id = $1 AND fecha_vigencia_hasta IS NULL`,
      [id]
    );

    // Actualizar precio en materiales
    await client.query(
      `UPDATE materiales
       SET precio_m3 = $1, updated_at = NOW()
       WHERE id = $2`,
      [nuevoPrecio, id]
    );

    // Insertar nuevo registro en historial
    await client.query(
      `INSERT INTO historial_precios (material_id, precio_m3, fecha_vigencia_desde, fecha_vigencia_hasta, usuario_cambio_id, motivo)
       VALUES ($1, $2, CURRENT_DATE, NULL, $3, 'Actualización de precio')`,
      [id, nuevoPrecio, usuarioId]
    );

    await client.query('COMMIT');
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Ajustar stock manualmente
export async function ajustarStock(
  id: number,
  cantidad: number,
  usuarioId: number,
  motivo: string
): Promise<boolean> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Obtener stock actual
    const materialActual = await client.query<{ stock_actual: number }>(
      'SELECT stock_actual FROM materiales WHERE id = $1',
      [id]
    );

    if (materialActual.rows.length === 0) {
      await client.query('ROLLBACK');
      return false;
    }

    const row = materialActual.rows[0];
    if (!row) {
      await client.query('ROLLBACK');
      return false;
    }

    const stockAnterior = Number(row.stock_actual);
    const stockNuevo = stockAnterior + cantidad;

    // Validar que el stock no sea negativo
    if (stockNuevo < 0) {
      await client.query('ROLLBACK');
      return false;
    }

    // Actualizar stock
    await client.query(
      `UPDATE materiales
       SET stock_actual = $1, updated_at = NOW()
       WHERE id = $2`,
      [stockNuevo, id]
    );

    // Registrar movimiento
    const tipoMovimiento = cantidad > 0 ? 1 : 2; // 1=ENTRADA, 2=SALIDA
    await client.query(
      `INSERT INTO movimientos_stock (material_id, tipo_movimiento_id, cantidad, stock_anterior, stock_nuevo, usuario_id, motivo)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, tipoMovimiento, Math.abs(cantidad), stockAnterior, stockNuevo, usuarioId, motivo]
    );

    await client.query('COMMIT');
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Activar/desactivar material
export async function toggleActivoMaterial(id: number): Promise<boolean> {
  const result = await pool.query(
    `UPDATE materiales
     SET activo = NOT activo, updated_at = NOW()
     WHERE id = $1
     RETURNING activo`,
    [id]
  );

  return result.rowCount !== null && result.rowCount > 0;
}

// Interfaz para el historial de precios
interface HistorialPrecioRow {
  id: number;
  precio_m3: number;
  fecha_vigencia_desde: Date;
  fecha_vigencia_hasta: Date | null;
  motivo: string | null;
  usuario_nombre: string | null;
}

// Obtener historial de precios de un material
export async function getHistorialPrecios(materialId: number, limit: number = 10): Promise<HistorialPrecioRow[]> {
  const result = await pool.query<HistorialPrecioRow>(
    `SELECT
      hp.id,
      hp.precio_m3,
      hp.fecha_vigencia_desde,
      hp.fecha_vigencia_hasta,
      hp.motivo,
      u.nombre as usuario_nombre
    FROM historial_precios hp
    LEFT JOIN usuarios u ON hp.usuario_cambio_id = u.id
    WHERE hp.material_id = $1
    ORDER BY hp.fecha_vigencia_desde DESC
    LIMIT $2`,
    [materialId, limit]
  );

  return result.rows.map(row => ({
    id: row.id,
    precio_m3: Number(row.precio_m3),
    fecha_vigencia_desde: row.fecha_vigencia_desde,
    fecha_vigencia_hasta: row.fecha_vigencia_hasta,
    motivo: row.motivo,
    usuario_nombre: row.usuario_nombre
  }));
}

// Obtener estadísticas de materiales
export async function getEstadisticasMateriales() {
  // Consulta principal de estadísticas (optimizado con FILTER)
  const statsResult = await pool.query<{
    total_materiales: string;
    stock_critico: string;
    stock_bajo: string;
    stock_normal: string;
    valor_total_inventario: string;
  }>(
    `SELECT
      COUNT(*) as total_materiales,
      COUNT(*) FILTER (WHERE stock_actual <= stock_minimo) as stock_critico,
      COUNT(*) FILTER (WHERE stock_actual <= stock_minimo * 1.5 AND stock_actual > stock_minimo) as stock_bajo,
      COUNT(*) FILTER (WHERE stock_actual > stock_minimo * 1.5) as stock_normal,
      COALESCE(SUM(stock_actual * precio_m3), 0) as valor_total_inventario
    FROM materiales
    WHERE activo = true`
  );

  // Contar movimientos de los últimos 30 días
  const movimientosResult = await pool.query<{ total: string }>(
    `SELECT COUNT(*) as total
     FROM movimientos_stock
     WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'`
  );

  // Material más vendido (basado en salidas de stock)
  const masVendidoResult = await pool.query<{
    id: number;
    nombre: string;
    total_vendido_m3: string;
  }>(
    `SELECT
      m.id,
      m.nombre,
      SUM(ms.cantidad) as total_vendido_m3
    FROM materiales m
    INNER JOIN movimientos_stock ms ON m.id = ms.material_id
    WHERE ms.tipo_movimiento_id = 2
      AND ms.created_at >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY m.id, m.nombre
    ORDER BY total_vendido_m3 DESC
    LIMIT 1`
  );

  const stats = statsResult.rows[0];
  const movimientos = movimientosResult.rows[0];
  const masVendido = masVendidoResult.rows[0] || null;

  return {
    total_materiales: parseInt(stats?.total_materiales || '0', 10),
    stock_critico: parseInt(stats?.stock_critico || '0', 10),
    stock_bajo: parseInt(stats?.stock_bajo || '0', 10),
    stock_normal: parseInt(stats?.stock_normal || '0', 10),
    valor_total_inventario: parseFloat(stats?.valor_total_inventario || '0'),
    movimientos_ultimos_30dias: parseInt(movimientos?.total || '0', 10),
    material_mas_vendido: masVendido ? {
      id: masVendido.id,
      nombre: masVendido.nombre,
      total_vendido_m3: parseFloat(masVendido.total_vendido_m3)
    } : null
  };
}
