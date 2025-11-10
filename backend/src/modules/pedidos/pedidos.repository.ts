import { pool } from '../../database/postgres/pool.js';
import { PoolClient } from 'pg';

// =====================================================
// TIPOS PARA FILAS DE LA BASE DE DATOS
// =====================================================

export interface PedidoRow {
  id: number;
  codigo_seguimiento: string;
  cliente_id: number;
  estado_actual_id: number;
  direccion_entrega: string;
  latitud_entrega: number | null;
  longitud_entrega: number | null;
  referencia_ubicacion: string | null;
  zona_id: number | null;
  camion_asignado_id: number | null;
  conductor_asignado_id: number | null;
  fecha_pedido: Date;
  fecha_entrega_solicitada: Date | null;
  fecha_entrega_estimada: Date | null;
  fecha_entrega_real: Date | null;
  total_m3: number;
  monto_total: number;
  eta_minutos: number | null;
  distancia_km: number | null;
  observaciones: string | null;
  motivo_rechazo: string | null;
  created_at: Date;
  updated_at: Date;
  cliente_razon_social?: string | null;
  estado_nombre?: string | null;
  zona_nombre?: string | null;
  camion_placa?: string | null;
  conductor_nombre?: string | null;
}

export interface DetallePedidoRow {
  id: number;
  pedido_id: number;
  material_id: number;
  cantidad_m3: number;
  precio_unitario: number;
  subtotal: number;
  created_at: Date;
  material_nombre?: string | null;
}

export interface HistorialEstadoRow {
  id: number;
  pedido_id: number;
  estado_id: number;
  usuario_id: number | null;
  comentario: string | null;
  created_at: Date;
  estado_nombre?: string | null;
  usuario_nombre?: string | null;
}

export interface CreatePedidoData {
  cliente_id: number;
  direccion_entrega: string;
  latitud_entrega: number;
  longitud_entrega: number;
  referencia_ubicacion?: string;
  fecha_entrega_solicitada?: Date;
  observaciones?: string;
}

export interface CreateDetallePedidoData {
  material_id: number;
  cantidad_m3: number;
  precio_unitario: number;
}

// =====================================================
// FUNCIONES DE GENERACIÓN DE CÓDIGOS
// =====================================================

// genera un codigo de seguimiento único
async function generarCodigoSeguimiento(): Promise<string> {
  const year = new Date().getFullYear();

  // Obtener último número de secuencia del año
  const result = await pool.query<{ max: string | null }>(
    `SELECT MAX(CAST(SUBSTRING(codigo_seguimiento FROM '[0-9]+$') AS INT)) as max
     FROM pedidos
     WHERE codigo_seguimiento LIKE $1`,
    [`ZAM-${year}-%`]
  );

  const maxNum = result.rows[0]?.max ? parseInt(result.rows[0].max, 10) : 0;
  const nextNum = maxNum + 1;
  const paddedNum = nextNum.toString().padStart(5, '0');

  return `ZAM-${year}-${paddedNum}`;
}

// =====================================================
// FUNCIONES DE CREACIÓN
// =====================================================

/**
 * Crear pedido con transacción atómica
 * Incluye: pedido, detalles, historial inicial y descuento de stock
 */
export async function createPedido(
  data: CreatePedidoData,
  items: CreateDetallePedidoData[]
): Promise<number | null> {
  const client: PoolClient = await pool.connect();

  try {
    await client.query('BEGIN');

    // Generar código de seguimiento
    const codigoSeguimiento = await generarCodigoSeguimiento();

    // Calcular totales
    const totalM3 = items.reduce((sum, item) => sum + item.cantidad_m3, 0);
    const montoTotal = items.reduce(
      (sum, item) => sum + item.cantidad_m3 * item.precio_unitario,
      0
    );

    // Insertar pedido principal
    const pedidoResult = await client.query<{ id: number }>(
      `INSERT INTO pedidos (
        codigo_seguimiento,
        cliente_id,
        estado_actual_id,
        direccion_entrega,
        latitud_entrega,
        longitud_entrega,
        referencia_ubicacion,
        fecha_entrega_solicitada,
        total_m3,
        monto_total,
        observaciones
      ) VALUES ($1, $2, 1, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id`,
      [
        codigoSeguimiento,
        data.cliente_id,
        data.direccion_entrega,
        data.latitud_entrega,
        data.longitud_entrega,
        data.referencia_ubicacion || null,
        data.fecha_entrega_solicitada || null,
        totalM3,
        montoTotal,
        data.observaciones || null,
      ]
    );

    const pedidoId = pedidoResult.rows[0]?.id;
    if (!pedidoId) {
      await client.query('ROLLBACK');
      return null;
    }

    // Insertar detalles del pedido
    for (const item of items) {
      const subtotal = item.cantidad_m3 * item.precio_unitario;

      await client.query(
        `INSERT INTO detalle_pedidos (
          pedido_id,
          material_id,
          cantidad_m3,
          precio_unitario,
          subtotal
        ) VALUES ($1, $2, $3, $4, $5)`,
        [pedidoId, item.material_id, item.cantidad_m3, item.precio_unitario, subtotal]
      );
    }

    // Registrar historial de estado inicial
    await client.query(
      `INSERT INTO historial_estado_pedido (
        pedido_id,
        estado_id,
        comentario
      ) VALUES ($1, 1, 'Pedido creado')`,
      [pedidoId]
    );

    await client.query('COMMIT');
    return pedidoId;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al crear pedido:', error);
    throw error;
  } finally {
    client.release();
  }
}

// =====================================================
// FUNCIONES DE CONSULTA
// =====================================================

/**
 * Listar pedidos con filtros
 */
export async function findAllPedidos(
  limit: number = 20,
  offset: number = 0,
  filters: {
    estado_id?: number;
    cliente_id?: number;
    fecha_desde?: string;
    fecha_hasta?: string;
  } = {}
): Promise<PedidoRow[]> {
  let query = `
    SELECT
      p.id,
      p.codigo_seguimiento,
      p.direccion_entrega,
      p.fecha_pedido,
      p.fecha_entrega_solicitada,
      p.total_m3,
      p.monto_total,
      c.razon_social as cliente_razon_social,
      e.nombre as estado_nombre,
      cam.placa as camion_placa,
      con.nombre_completo as conductor_nombre
    FROM pedidos p
    INNER JOIN clientes c ON p.cliente_id = c.id
    INNER JOIN estados_pedido e ON p.estado_actual_id = e.id
    LEFT JOIN camiones cam ON p.camion_asignado_id = cam.id
    LEFT JOIN conductores con ON p.conductor_asignado_id = con.id
    WHERE 1=1
  `;

  const params: (number | string)[] = [];
  let paramIndex = 1;

  if (filters.estado_id) {
    query += ` AND p.estado_actual_id = $${paramIndex}`;
    params.push(filters.estado_id);
    paramIndex++;
  }

  if (filters.cliente_id) {
    query += ` AND p.cliente_id = $${paramIndex}`;
    params.push(filters.cliente_id);
    paramIndex++;
  }

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

  query += ` ORDER BY p.fecha_pedido DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(limit, offset);

  const result = await pool.query<PedidoRow>(query, params);
  return result.rows;
}

/**
 * Contar pedidos con filtros
 */
export async function countPedidos(
  filters: {
    estado_id?: number;
    cliente_id?: number;
    fecha_desde?: string;
    fecha_hasta?: string;
  } = {}
): Promise<number> {
  let query = 'SELECT COUNT(*) as count FROM pedidos WHERE 1=1';
  const params: (number | string)[] = [];
  let paramIndex = 1;

  if (filters.estado_id) {
    query += ` AND estado_actual_id = $${paramIndex}`;
    params.push(filters.estado_id);
    paramIndex++;
  }

  if (filters.cliente_id) {
    query += ` AND cliente_id = $${paramIndex}`;
    params.push(filters.cliente_id);
    paramIndex++;
  }

  if (filters.fecha_desde) {
    query += ` AND fecha_pedido >= $${paramIndex}`;
    params.push(filters.fecha_desde);
    paramIndex++;
  }

  if (filters.fecha_hasta) {
    query += ` AND fecha_pedido <= $${paramIndex}`;
    params.push(filters.fecha_hasta);
    paramIndex++;
  }

  const result = await pool.query<{ count: string }>(query, params);
  return parseInt(result.rows[0]?.count || '0', 10);
}

/**
 * Buscar pedido por ID con joins
 */
export async function findPedidoById(id: number): Promise<PedidoRow | null> {
  const result = await pool.query<PedidoRow>(
    `SELECT
      p.*,
      c.razon_social as cliente_razon_social,
      e.nombre as estado_nombre,
      z.nombre as zona_nombre,
      cam.placa as camion_placa,
      con.nombre_completo as conductor_nombre
    FROM pedidos p
    INNER JOIN clientes c ON p.cliente_id = c.id
    INNER JOIN estados_pedido e ON p.estado_actual_id = e.id
    LEFT JOIN zonas_entrega z ON p.zona_id = z.id
    LEFT JOIN camiones cam ON p.camion_asignado_id = cam.id
    LEFT JOIN conductores con ON p.conductor_asignado_id = con.id
    WHERE p.id = $1`,
    [id]
  );

  return result.rows[0] || null;
}

/**
 * Buscar pedido por código de seguimiento
 */
export async function findPedidoByCodigo(codigo: string): Promise<PedidoRow | null> {
  const result = await pool.query<PedidoRow>(
    `SELECT
      p.*,
      c.razon_social as cliente_razon_social,
      e.nombre as estado_nombre
    FROM pedidos p
    INNER JOIN clientes c ON p.cliente_id = c.id
    INNER JOIN estados_pedido e ON p.estado_actual_id = e.id
    WHERE p.codigo_seguimiento = $1`,
    [codigo]
  );

  return result.rows[0] || null;
}

/**
 * Obtener detalles de un pedido
 */
export async function findDetallesPedido(pedidoId: number): Promise<DetallePedidoRow[]> {
  const result = await pool.query<DetallePedidoRow>(
    `SELECT
      dp.*,
      m.nombre as material_nombre
    FROM detalle_pedidos dp
    INNER JOIN materiales m ON dp.material_id = m.id
    WHERE dp.pedido_id = $1
    ORDER BY dp.id ASC`,
    [pedidoId]
  );

  return result.rows;
}

/**
 * Obtener historial de estados de un pedido
 */
export async function findHistorialEstados(pedidoId: number): Promise<HistorialEstadoRow[]> {
  const result = await pool.query<HistorialEstadoRow>(
    `SELECT
      h.*,
      e.nombre as estado_nombre,
      u.nombre_completo as usuario_nombre
    FROM historial_estado_pedido h
    INNER JOIN estados_pedido e ON h.estado_id = e.id
    LEFT JOIN usuarios u ON h.usuario_id = u.id
    WHERE h.pedido_id = $1
    ORDER BY h.created_at DESC`,
    [pedidoId]
  );

  return result.rows;
}

// =====================================================
// FUNCIONES DE ACTUALIZACIÓN
// =====================================================

/**
 * Confirmar pedido y asignar recursos con transacción atómica
 * Decrementa stock automáticamente
 */
export async function confirmarPedido(
  pedidoId: number,
  camionId: number,
  conductorId: number,
  fechaEntregaEstimada?: Date,
  observaciones?: string
): Promise<boolean> {
  const client: PoolClient = await pool.connect();

  try {
    await client.query('BEGIN');

    // Bloquear pedido para evitar concurrencia
    const lockResult = await client.query<PedidoRow>(
      'SELECT * FROM pedidos WHERE id = $1 FOR UPDATE',
      [pedidoId]
    );

    if (lockResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return false;
    }

    const pedido = lockResult.rows[0];
    if (!pedido) {
      await client.query('ROLLBACK');
      return false;
    }

    // Verificar que esté en estado PENDIENTE
    if (pedido.estado_actual_id !== 1) {
      await client.query('ROLLBACK');
      return false;
    }

    // Obtener detalles del pedido
    const detallesResult = await client.query<DetallePedidoRow>(
      'SELECT * FROM detalle_pedidos WHERE pedido_id = $1',
      [pedidoId]
    );

    // Decrementar stock atómicamente para cada material
    for (const detalle of detallesResult.rows) {
      const updateStockResult = await client.query(
        `UPDATE materiales
         SET stock_actual = stock_actual - $1,
             updated_at = NOW()
         WHERE id = $2 AND stock_actual >= $1
         RETURNING stock_actual`,
        [detalle.cantidad_m3, detalle.material_id]
      );

      if (updateStockResult.rowCount === 0) {
        await client.query('ROLLBACK');
        throw new Error(`Stock insuficiente para material ${detalle.material_id}`);
      }

      // Registrar movimiento de stock
      const stockNuevo = Number(updateStockResult.rows[0]?.stock_actual || 0);
      const stockAnterior = stockNuevo + Number(detalle.cantidad_m3);

      await client.query(
        `INSERT INTO movimientos_stock (
          material_id,
          tipo_movimiento_id,
          cantidad,
          stock_anterior,
          stock_nuevo,
          motivo,
          usuario_id,
          pedido_id
        ) VALUES ($1, 2, $2, $3, $4, $5, NULL, $6)`,
        [
          detalle.material_id,
          -Math.abs(detalle.cantidad_m3),
          stockAnterior,
          stockNuevo,
          `Descuento por confirmación de pedido ${pedido.codigo_seguimiento}`,
          pedidoId,
        ]
      );
    }

    // Actualizar pedido con asignaciones
    const nuevasObservaciones = observaciones
      ? `COALESCE(observaciones || ' | ', '') || $4::TEXT`
      : 'observaciones';

    await client.query(
      `UPDATE pedidos
       SET estado_actual_id = 2,
           camion_asignado_id = $1,
           conductor_asignado_id = $2,
           fecha_entrega_estimada = $3,
           observaciones = ${nuevasObservaciones},
           updated_at = NOW()
       WHERE id = ${observaciones ? '$5' : '$4'}`,
      observaciones
        ? [camionId, conductorId, fechaEntregaEstimada || null, observaciones, pedidoId]
        : [camionId, conductorId, fechaEntregaEstimada || null, pedidoId]
    );

    // Registrar cambio de estado en historial
    await client.query(
      `INSERT INTO historial_estado_pedido (
        pedido_id,
        estado_id,
        comentario
      ) VALUES ($1, 2, $2)`,
      [pedidoId, `Pedido confirmado. Asignado camión ${camionId} y conductor ${conductorId}`]
    );

    await client.query('COMMIT');
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al confirmar pedido:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Reasignar camión y conductor
 */
export async function reasignarRecursos(
  pedidoId: number,
  camionId: number,
  conductorId: number
): Promise<boolean> {
  const client: PoolClient = await pool.connect();

  try {
    await client.query('BEGIN');

    const result = await client.query(
      `UPDATE pedidos
       SET camion_asignado_id = $1,
           conductor_asignado_id = $2,
           updated_at = NOW()
       WHERE id = $3`,
      [camionId, conductorId, pedidoId]
    );

    if (result.rowCount === 0) {
      await client.query('ROLLBACK');
      return false;
    }

    // Registrar en historial
    await client.query(
      `INSERT INTO historial_estado_pedido (
        pedido_id,
        estado_id,
        comentario
      ) VALUES ($1, (SELECT estado_actual_id FROM pedidos WHERE id = $1), $2)`,
      [pedidoId, `Recursos reasignados: camión ${camionId}, conductor ${conductorId}`]
    );

    await client.query('COMMIT');
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al reasignar recursos:', error);
    return false;
  } finally {
    client.release();
  }
}

/**
 * Cancelar pedido (solo si está PENDIENTE, no devuelve stock)
 */
export async function cancelarPedido(pedidoId: number, motivo: string): Promise<boolean> {
  const client: PoolClient = await pool.connect();

  try {
    await client.query('BEGIN');

    // Verificar estado actual
    const pedidoResult = await client.query<PedidoRow>(
      'SELECT * FROM pedidos WHERE id = $1 FOR UPDATE',
      [pedidoId]
    );

    if (pedidoResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return false;
    }

    const pedido = pedidoResult.rows[0];
    if (!pedido) {
      await client.query('ROLLBACK');
      return false;
    }

    // Solo PENDIENTE se puede cancelar
    if (pedido.estado_actual_id !== 1) {
      await client.query('ROLLBACK');
      return false;
    }

    // Actualizar a CANCELADO
    await client.query(
      `UPDATE pedidos
       SET estado_actual_id = 8,
           motivo_rechazo = $1,
           updated_at = NOW()
       WHERE id = $2`,
      [motivo, pedidoId]
    );

    // Registrar en historial
    await client.query(
      `INSERT INTO historial_estado_pedido (
        pedido_id,
        estado_id,
        comentario
      ) VALUES ($1, 8, $2)`,
      [pedidoId, `Pedido cancelado: ${motivo}`]
    );

    await client.query('COMMIT');
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al cancelar pedido:', error);
    return false;
  } finally {
    client.release();
  }
}

/**
 * Eliminar pedido físicamente (solo CANCELADO)
 */
export async function deletePedido(id: number): Promise<boolean> {
  const result = await pool.query('DELETE FROM pedidos WHERE id = $1 AND estado_actual_id = 8', [
    id,
  ]);

  return (result.rowCount ?? 0) > 0;
}

// =====================================================
// FUNCIONES DE DISPONIBILIDAD
// =====================================================

/**
 * Verificar si un camión está disponible
 */
export async function isCamionDisponible(camionId: number): Promise<boolean> {
  const result = await pool.query<{ count: string }>(
    `SELECT COUNT(*) as count
     FROM pedidos
     WHERE camion_asignado_id = $1
       AND estado_actual_id IN (2, 3, 4, 5)`,
    [camionId]
  );

  const count = parseInt(result.rows[0]?.count || '0', 10);
  return count === 0;
}

/**
 * Verificar si un conductor está disponible
 */
export async function isConductorDisponible(conductorId: number): Promise<boolean> {
  const result = await pool.query<{ count: string }>(
    `SELECT COUNT(*) as count
     FROM pedidos
     WHERE conductor_asignado_id = $1
       AND estado_actual_id IN (2, 3, 4, 5)`,
    [conductorId]
  );

  const count = parseInt(result.rows[0]?.count || '0', 10);
  return count === 0;
}

// Obtener estadísticas de pedidos
export async function getEstadisticasPedidos(dias: number = 30) {
  // Total y conteo por estado
  const totalesResult = await pool.query<{
    total_pedidos: string;
    pedidos_pendientes: string;
    pedidos_confirmados: string;
    pedidos_en_camino: string;
    pedidos_entregados: string;
    pedidos_cancelados: string;
  }>(`
    SELECT
      COUNT(*) as total_pedidos,
      COUNT(CASE WHEN estado_actual_id = 1 THEN 1 END) as pedidos_pendientes,
      COUNT(CASE WHEN estado_actual_id = 2 THEN 1 END) as pedidos_confirmados,
      COUNT(CASE WHEN estado_actual_id = 3 THEN 1 END) as pedidos_en_camino,
      COUNT(CASE WHEN estado_actual_id = 7 THEN 1 END) as pedidos_entregados,
      COUNT(CASE WHEN estado_actual_id = 8 THEN 1 END) as pedidos_cancelados
    FROM pedidos
  `);

  // Pedidos en el período
  const pedidosPeriodoResult = await pool.query<{ total: string }>(`
    SELECT COUNT(*) as total
    FROM pedidos
    WHERE fecha_pedido >= CURRENT_DATE - INTERVAL '${dias} days'
  `);

  // Monto total del período (solo pedidos confirmados/entregados/en camino)
  const montoPeriodoResult = await pool.query<{ total: string }>(`
    SELECT COALESCE(SUM(monto_total), 0) as total
    FROM pedidos
    WHERE fecha_pedido >= CURRENT_DATE - INTERVAL '${dias} days'
      AND estado_actual_id IN (2, 3, 7)
  `);

  // Volumen total del período (solo pedidos confirmados/entregados/en camino)
  const volumenPeriodoResult = await pool.query<{ total: string }>(`
    SELECT COALESCE(SUM(total_m3), 0) as total
    FROM pedidos
    WHERE fecha_pedido >= CURRENT_DATE - INTERVAL '${dias} days'
      AND estado_actual_id IN (2, 3, 7)
  `);

  // Cliente top del período
  const topClienteResult = await pool.query<{
    id: number;
    razon_social: string;
    total_pedidos: string;
    monto_total: string;
  }>(`
    SELECT
      c.id,
      c.razon_social,
      COUNT(p.id) as total_pedidos,
      SUM(p.monto_total) as monto_total
    FROM clientes c
    INNER JOIN pedidos p ON c.id = p.cliente_id
    WHERE p.fecha_pedido >= CURRENT_DATE - INTERVAL '${dias} days'
    GROUP BY c.id, c.razon_social
    ORDER BY monto_total DESC
    LIMIT 1
  `);

  const topCliente = topClienteResult.rows[0] || null;
  const totales = totalesResult.rows[0];

  return {
    total_pedidos: parseInt(totales?.total_pedidos || '0', 10),
    pedidos_pendientes: parseInt(totales?.pedidos_pendientes || '0', 10),
    pedidos_confirmados: parseInt(totales?.pedidos_confirmados || '0', 10),
    pedidos_en_camino: parseInt(totales?.pedidos_en_camino || '0', 10),
    pedidos_entregados: parseInt(totales?.pedidos_entregados || '0', 10),
    pedidos_cancelados: parseInt(totales?.pedidos_cancelados || '0', 10),
    pedidos_mes: parseInt(pedidosPeriodoResult.rows[0]?.total || '0', 10),
    monto_total_mes: parseFloat(montoPeriodoResult.rows[0]?.total || '0'),
    volumen_total_mes_m3: parseFloat(volumenPeriodoResult.rows[0]?.total || '0'),
    cliente_top_mes: topCliente
      ? {
          id: topCliente.id,
          razon_social: topCliente.razon_social,
          total_pedidos: parseInt(topCliente.total_pedidos, 10),
          monto_total: parseFloat(topCliente.monto_total),
        }
      : null,
  };
}
