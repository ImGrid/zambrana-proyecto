import { pool } from '../../database/postgres/pool.js';
import { PoolClient } from 'pg';

/**
 * Tipos para entregas
 */
export interface Entrega {
  id: number;
  pedido_id: number;
  conductor_id: number;
  camion_id: number;
  hora_salida_planta: Date | null;
  hora_llegada_cliente: Date | null;
  duracion_minutos: number | null;
  ruta_planificada_id: string | null;
  desviaciones_detectadas: number | null;
  porcentaje_adherencia: number | null;
  entregado: boolean | null;
  firma_cliente: string | null;
  foto_comprobante: string | null;
  observaciones_entrega: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface EntregaConDetalle extends Entrega {
  pedido: {
    id: number;
    codigo_seguimiento: string;
    estado: string;
    fecha_entrega: Date;
    direccion_entrega: string;
    latitud_entrega: number;
    longitud_entrega: number;
    ruta_calculada: any | null;
    cliente: {
      id: number;
      razon_social: string;
      telefono: string;
    };
  };
  camion: {
    id: number;
    placa: string;
    modelo: string;
  };
  conductor: {
    id: number;
    nombre_completo: string;
    telefono: string;
  };
}

export interface EventoEntrega {
  id: number;
  entrega_id: number;
  tipo_evento: string;
  descripcion: string | null;
  latitud: number | null;
  longitud: number | null;
  created_at: Date;
}

/**
 * Crea una nueva entrega y registra el evento de salida
 *
 * TRANSACCIONAL: Si algo falla, todo se revierte
 *
 * @param pedido_id - ID del pedido a entregar
 * @param camion_id - ID del camión asignado
 * @param conductor_id - ID del conductor asignado
 * @param ruta_planificada_id - ID de la ruta planificada (opcional)
 * @returns Entrega creada
 */
export async function createEntrega(
  pedido_id: number,
  camion_id: number,
  conductor_id: number,
  ruta_planificada_id?: string
): Promise<Entrega> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Verificar que el pedido existe y esta confirmado
    const pedidoCheck = await client.query(
      `SELECT p.id
       FROM pedidos p
       JOIN estados_pedido e ON p.estado_actual_id = e.id
       WHERE p.id = $1 AND e.nombre = 'CONFIRMADO'
       FOR UPDATE OF p`,
      [pedido_id]
    );

    if (pedidoCheck.rows.length === 0) {
      throw new Error('Pedido no encontrado o no esta confirmado');
    }

    // Verificar que el camion esta disponible
    const camionCheck = await client.query(
      `SELECT id
       FROM camiones
       WHERE id = $1 AND activo = TRUE
       FOR UPDATE`,
      [camion_id]
    );

    if (camionCheck.rows.length === 0) {
      throw new Error('Camion no disponible');
    }

    // Verificar que el conductor esta disponible
    const conductorCheck = await client.query(
      `SELECT id
       FROM conductores
       WHERE id = $1 AND activo = TRUE
       FOR UPDATE`,
      [conductor_id]
    );

    if (conductorCheck.rows.length === 0) {
      throw new Error('Conductor no disponible');
    }

    // Crear la entrega
    const entregaResult = await client.query<Entrega>(
      `INSERT INTO entregas (
        pedido_id,
        conductor_id,
        camion_id,
        hora_salida_planta,
        ruta_planificada_id,
        entregado
      ) VALUES ($1, $2, $3, NOW(), $4, FALSE)
      RETURNING *`,
      [pedido_id, conductor_id, camion_id, ruta_planificada_id || null]
    );

    const entrega = entregaResult.rows[0];

    // Actualizar estado del pedido a EN_CAMINO (estado_actual_id = 3)
    await client.query(
      `UPDATE pedidos
       SET estado_actual_id = 3, updated_at = NOW()
       WHERE id = $1`,
      [pedido_id]
    );

    // Registrar evento de salida
    await client.query(
      `INSERT INTO eventos_entrega (
        entrega_id,
        tipo_evento,
        descripcion,
        created_at
      ) VALUES ($1, 'SALIDA_PLANTA', 'Camion salio de la planta', NOW())`,
      [entrega.id]
    );

    await client.query('COMMIT');

    return entrega;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Obtiene una entrega por ID con todos los detalles relacionados
 *
 * Uso: Mostrar estado completo de una entrega en el dashboard
 *
 * @param id - ID de la entrega
 * @returns Entrega con todos los detalles o null si no existe
 */
export async function findEntregaById(id: number): Promise<EntregaConDetalle | null> {
  const result = await pool.query<EntregaConDetalle>(
    `SELECT
      e.*,
      jsonb_build_object(
        'id', p.id,
        'codigo_seguimiento', p.codigo_seguimiento,
        'estado', ep.nombre,
        'fecha_entrega', COALESCE(p.fecha_entrega_real, p.fecha_entrega_estimada),
        'direccion_entrega', p.direccion_entrega,
        'latitud_entrega', p.latitud_entrega,
        'longitud_entrega', p.longitud_entrega,
        'ruta_calculada', p.ruta_calculada,
        'cliente', jsonb_build_object(
          'id', c.id,
          'razon_social', c.razon_social,
          'telefono', c.telefono
        )
      ) as pedido,
      jsonb_build_object(
        'id', cam.id,
        'placa', cam.placa,
        'modelo', cam.modelo
      ) as camion,
      jsonb_build_object(
        'id', cond.id,
        'nombre_completo', cond.nombre_completo,
        'telefono', cond.telefono
      ) as conductor
    FROM entregas e
    INNER JOIN pedidos p ON e.pedido_id = p.id
    INNER JOIN clientes c ON p.cliente_id = c.id
    INNER JOIN camiones cam ON e.camion_id = cam.id
    INNER JOIN conductores cond ON e.conductor_id = cond.id
    INNER JOIN estados_pedido ep ON p.estado_actual_id = ep.id
    WHERE e.id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
}

/**
 * Obtiene una entrega por pedido_id
 *
 * Uso: Verificar si un pedido ya tiene entrega asignada
 *
 * @param pedido_id - ID del pedido
 * @returns Entrega o null si no existe
 */
export async function findEntregaByPedidoId(pedido_id: number): Promise<Entrega | null> {
  const result = await pool.query<Entrega>(
    `SELECT * FROM entregas WHERE pedido_id = $1`,
    [pedido_id]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
}

/**
 * Obtiene todas las entregas activas (EN_CAMINO)
 *
 * Uso: Dashboard en tiempo real, mostrar todos los camiones en ruta
 *
 * @returns Array de entregas activas con detalles
 */
export async function findEntregasActivas(): Promise<EntregaConDetalle[]> {
  const result = await pool.query<EntregaConDetalle>(
    `SELECT
      e.*,
      jsonb_build_object(
        'id', p.id,
        'codigo_seguimiento', p.codigo_seguimiento,
        'estado', ep.nombre,
        'fecha_entrega', COALESCE(p.fecha_entrega_real, p.fecha_entrega_estimada),
        'direccion_entrega', p.direccion_entrega,
        'latitud_entrega', p.latitud_entrega,
        'longitud_entrega', p.longitud_entrega,
        'ruta_calculada', p.ruta_calculada,
        'cliente', jsonb_build_object(
          'id', c.id,
          'razon_social', c.razon_social,
          'telefono', c.telefono
        )
      ) as pedido,
      jsonb_build_object(
        'id', cam.id,
        'placa', cam.placa,
        'modelo', cam.modelo
      ) as camion,
      jsonb_build_object(
        'id', cond.id,
        'nombre_completo', cond.nombre_completo,
        'telefono', cond.telefono
      ) as conductor
    FROM entregas e
    INNER JOIN pedidos p ON e.pedido_id = p.id
    INNER JOIN clientes c ON p.cliente_id = c.id
    INNER JOIN camiones cam ON e.camion_id = cam.id
    INNER JOIN conductores cond ON e.conductor_id = cond.id
    INNER JOIN estados_pedido ep ON p.estado_actual_id = ep.id
    WHERE e.entregado = FALSE AND e.hora_salida_planta IS NOT NULL
      AND (e.observaciones_entrega IS NULL OR e.observaciones_entrega NOT LIKE 'CANCELADA:%')
    ORDER BY e.hora_salida_planta DESC`
  );

  return result.rows;
}

/**
 * Obtiene entregas por estado con paginacion
 *
 * Uso: Listados filtrados, reportes
 *
 * @param estado - Estado de las entregas a buscar
 * @param limite - Limite de resultados
 * @param offset - Offset para paginacion
 * @returns Array de entregas con detalles
 */
export async function findEntregasByEstado(
  estado: 'EN_CAMINO' | 'COMPLETADA' | 'CANCELADA',
  limite: number = 50,
  offset: number = 0
): Promise<EntregaConDetalle[]> {
  let whereClause = '';

  if (estado === 'EN_CAMINO') {
    whereClause = 'WHERE e.entregado = FALSE AND e.hora_salida_planta IS NOT NULL AND (e.observaciones_entrega IS NULL OR e.observaciones_entrega NOT LIKE \'CANCELADA:%\')';
  } else if (estado === 'COMPLETADA') {
    whereClause = 'WHERE e.entregado = TRUE';
  } else if (estado === 'CANCELADA') {
    whereClause = 'WHERE e.observaciones_entrega LIKE \'CANCELADA:%\'';
  }

  const result = await pool.query<EntregaConDetalle>(
    `SELECT
      e.*,
      jsonb_build_object(
        'id', p.id,
        'codigo_seguimiento', p.codigo_seguimiento,
        'estado', ep.nombre,
        'fecha_entrega', COALESCE(p.fecha_entrega_real, p.fecha_entrega_estimada),
        'direccion_entrega', p.direccion_entrega,
        'latitud_entrega', p.latitud_entrega,
        'longitud_entrega', p.longitud_entrega,
        'cliente', jsonb_build_object(
          'id', c.id,
          'razon_social', c.razon_social,
          'telefono', c.telefono
        )
      ) as pedido,
      jsonb_build_object(
        'id', cam.id,
        'placa', cam.placa,
        'modelo', cam.modelo
      ) as camion,
      jsonb_build_object(
        'id', cond.id,
        'nombre_completo', cond.nombre_completo,
        'telefono', cond.telefono
      ) as conductor
    FROM entregas e
    INNER JOIN pedidos p ON e.pedido_id = p.id
    INNER JOIN clientes c ON p.cliente_id = c.id
    INNER JOIN camiones cam ON e.camion_id = cam.id
    INNER JOIN conductores cond ON e.conductor_id = cond.id
    INNER JOIN estados_pedido ep ON p.estado_actual_id = ep.id
    ${whereClause}
    ORDER BY e.created_at DESC
    LIMIT $1 OFFSET $2`,
    [limite, offset]
  );

  return result.rows;
}

/**
 * Finaliza una entrega registrando firma, foto y observaciones
 *
 * TRANSACCIONAL: Actualiza entrega, pedido, camion y conductor atomicamente
 *
 * @param id - ID de la entrega
 * @param firma_cliente - Firma del cliente en Base64 (opcional)
 * @param foto_comprobante - Foto del comprobante en Base64 (opcional)
 * @param observaciones - Observaciones finales (opcional)
 * @returns Entrega finalizada
 */
export async function finalizarEntrega(
  id: number,
  firma_cliente?: string,
  foto_comprobante?: string,
  observaciones?: string
): Promise<Entrega> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Verificar que la entrega existe y esta en camino
    const entregaCheck = await client.query<Entrega>(
      `SELECT * FROM entregas
       WHERE id = $1 AND entregado = FALSE AND hora_salida_planta IS NOT NULL
       FOR UPDATE`,
      [id]
    );

    if (entregaCheck.rows.length === 0) {
      throw new Error('Entrega no encontrada o ya fue finalizada');
    }

    const entrega = entregaCheck.rows[0];

    // Actualizar la entrega con calculo automatico de duracion_minutos
    const entregaResult = await client.query<Entrega>(
      `UPDATE entregas
       SET
         entregado = TRUE,
         hora_llegada_cliente = NOW(),
         duracion_minutos = EXTRACT(EPOCH FROM (NOW() - hora_salida_planta)) / 60,
         firma_cliente = COALESCE($2, firma_cliente),
         foto_comprobante = COALESCE($3, foto_comprobante),
         observaciones_entrega = COALESCE($4, observaciones_entrega),
         updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, firma_cliente || null, foto_comprobante || null, observaciones || null]
    );

    const entregaFinalizada = entregaResult.rows[0];

    // Actualizar estado del pedido a ENTREGADO (ID = 7)
    await client.query(
      `UPDATE pedidos
       SET estado_actual_id = 7, updated_at = NOW()
       WHERE id = $1`,
      [entrega.pedido_id]
    );

    // Liberar camion (no hay campo estado en camiones)
    await client.query(
      `UPDATE camiones
       SET updated_at = NOW()
       WHERE id = $1`,
      [entrega.camion_id]
    );

    // Liberar conductor (no hay campo estado en conductores)
    await client.query(
      `UPDATE conductores
       SET updated_at = NOW()
       WHERE id = $1`,
      [entrega.conductor_id]
    );

    // Registrar evento de finalizacion
    await client.query(
      `INSERT INTO eventos_entrega (
        entrega_id,
        tipo_evento,
        descripcion,
        created_at
      ) VALUES ($1, 'ENTREGA_COMPLETADA', $2, NOW())`,
      [id, observaciones || 'Entrega finalizada exitosamente']
    );

    await client.query('COMMIT');

    return entregaFinalizada;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Cancela una entrega en progreso
 *
 * TRANSACCIONAL: Libera recursos (camion, conductor) y actualiza estados
 *
 * @param id - ID de la entrega
 * @param motivo - Motivo de la cancelacion
 * @returns Entrega cancelada
 */
export async function cancelarEntrega(
  id: number,
  motivo: string
): Promise<Entrega> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Verificar que la entrega existe y esta en camino
    const entregaCheck = await client.query<Entrega>(
      `SELECT * FROM entregas
       WHERE id = $1 AND entregado = FALSE AND hora_salida_planta IS NOT NULL
       FOR UPDATE`,
      [id]
    );

    if (entregaCheck.rows.length === 0) {
      throw new Error('Entrega no encontrada o no se puede cancelar');
    }

    const entrega = entregaCheck.rows[0];

    // Actualizar la entrega (cancelada se marca poniendo observaciones)
    const entregaResult = await client.query<Entrega>(
      `UPDATE entregas
       SET
         observaciones_entrega = $2,
         updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, 'CANCELADA: ' + motivo]
    );

    // Revertir estado del pedido a CONFIRMADO (estado_id = 2)
    await client.query(
      `UPDATE pedidos
       SET estado_actual_id = 2, updated_at = NOW()
       WHERE id = $1`,
      [entrega.pedido_id]
    );

    // Actualizar timestamp de camion (no hay campo estado)
    await client.query(
      `UPDATE camiones
       SET updated_at = NOW()
       WHERE id = $1`,
      [entrega.camion_id]
    );

    // Actualizar timestamp de conductor (no hay campo estado)
    await client.query(
      `UPDATE conductores
       SET updated_at = NOW()
       WHERE id = $1`,
      [entrega.conductor_id]
    );

    // Registrar evento de cancelacion
    await client.query(
      `INSERT INTO eventos_entrega (
        entrega_id,
        tipo_evento,
        descripcion,
        created_at
      ) VALUES ($1, 'CANCELADA', $2, NOW())`,
      [id, motivo]
    );

    await client.query('COMMIT');

    return entregaResult.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Obtiene el historial de eventos de una entrega
 *
 * Uso: Auditoria, timeline de la entrega
 *
 * @param entrega_id - ID de la entrega
 * @returns Array de eventos ordenados cronologicamente
 */
export async function obtenerEventosEntrega(
  entrega_id: number
): Promise<EventoEntrega[]> {
  const result = await pool.query<EventoEntrega>(
    `SELECT *
     FROM eventos_entrega
     WHERE entrega_id = $1
     ORDER BY created_at ASC`,
    [entrega_id]
  );

  return result.rows;
}

/**
 * Cuenta el total de entregas por estado
 *
 * Uso: Metricas, dashboard de estadisticas
 *
 * @param estado - Estado a contar (opcional, si no se proporciona cuenta todas)
 * @returns Total de entregas
 */
export async function contarEntregasPorEstado(
  estado?: 'EN_CAMINO' | 'COMPLETADA' | 'CANCELADA'
): Promise<number> {
  let query = 'SELECT COUNT(*) as count FROM entregas e';

  if (estado === 'EN_CAMINO') {
    query += ' WHERE e.entregado = FALSE AND e.hora_salida_planta IS NOT NULL AND (e.observaciones_entrega IS NULL OR e.observaciones_entrega NOT LIKE \'CANCELADA:%\')';
  } else if (estado === 'COMPLETADA') {
    query += ' WHERE e.entregado = TRUE';
  } else if (estado === 'CANCELADA') {
    query += ' WHERE e.observaciones_entrega LIKE \'CANCELADA:%\'';
  }

  const result = await pool.query<{ count: string }>(query);

  return parseInt(result.rows[0].count, 10);
}

// Obtiene el ultimo evento de movimiento (DETENIDO o REANUDO) de una entrega
export async function obtenerUltimoEventoMovimiento(
  entrega_id: number
): Promise<EventoEntrega | null> {
  const result = await pool.query<EventoEntrega>(
    `SELECT *
     FROM eventos_entrega
     WHERE entrega_id = $1
       AND tipo_evento IN ('DETENIDO', 'REANUDO')
     ORDER BY created_at DESC
     LIMIT 1`,
    [entrega_id]
  );

  return result.rows[0] || null;
}

/**
 * Registra un evento de movimiento en una entrega
 *
 * Uso: Conductor reporta detencion o reanudacion de marcha
 *
 * @param entrega_id - ID de la entrega
 * @param tipo_evento - Tipo de evento (DETENIDO, REANUDO)
 * @param descripcion - Descripcion o motivo (opcional)
 * @param latitud - Latitud donde ocurrio (opcional)
 * @param longitud - Longitud donde ocurrio (opcional)
 * @returns Evento creado
 */
export async function registrarEventoMovimiento(
  entrega_id: number,
  tipo_evento: string,
  descripcion?: string,
  latitud?: number,
  longitud?: number
): Promise<EventoEntrega> {
  const result = await pool.query<EventoEntrega>(
    `INSERT INTO eventos_entrega (
      entrega_id,
      tipo_evento,
      descripcion,
      latitud,
      longitud,
      created_at
    ) VALUES ($1, $2, $3, $4, $5, NOW())
    RETURNING *`,
    [entrega_id, tipo_evento, descripcion || null, latitud || null, longitud || null]
  );

  const evento = result.rows[0];
  if (!evento) {
    throw new Error('Error al registrar evento de movimiento');
  }

  return evento;
}
