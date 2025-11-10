import { pool } from '../../database/postgres/pool.js';
import { PoolClient } from 'pg';

/**
 * Tipos para entregas
 */
export interface Entrega {
  id: number;
  pedido_id: number;
  camion_id: number;
  conductor_id: number;
  estado: 'EN_CAMINO' | 'COMPLETADA' | 'CANCELADA';
  hora_salida: Date | null;
  hora_llegada_estimada: Date | null;
  hora_llegada_real: Date | null;
  distancia_km: number | null;
  ruta_calculada: any | null;
  firma_cliente: string | null;
  foto_comprobante: string | null;
  observaciones: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface EntregaConDetalle extends Entrega {
  pedido: {
    id: number;
    numero_pedido: string;
    estado: string;
    fecha_entrega: Date;
    cliente: {
      id: number;
      razon_social: string;
      direccion: string;
      latitud: number;
      longitud: number;
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
  timestamp: Date;
}

/**
 * Crea una nueva entrega y registra el evento de salida
 *
 * TRANSACCIONAL: Si algo falla, todo se revierte
 *
 * @param pedido_id - ID del pedido a entregar
 * @param camion_id - ID del camión asignado
 * @param conductor_id - ID del conductor asignado
 * @param ruta_calculada - Objeto JSON con la ruta calculada desde Neo4j
 * @param distancia_km - Distancia total de la ruta
 * @param hora_llegada_estimada - Hora estimada de llegada
 * @returns Entrega creada
 */
export async function createEntrega(
  pedido_id: number,
  camion_id: number,
  conductor_id: number,
  ruta_calculada: any,
  distancia_km: number,
  hora_llegada_estimada: Date
): Promise<Entrega> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Verificar que el pedido existe y esta confirmado
    const pedidoCheck = await client.query(
      `SELECT id, estado
       FROM pedidos
       WHERE id = $1 AND estado = 'CONFIRMADO'
       FOR UPDATE`,
      [pedido_id]
    );

    if (pedidoCheck.rows.length === 0) {
      throw new Error('Pedido no encontrado o no esta confirmado');
    }

    // Verificar que el camion esta disponible
    const camionCheck = await client.query(
      `SELECT id, estado
       FROM camiones
       WHERE id = $1 AND estado = 'DISPONIBLE'
       FOR UPDATE`,
      [camion_id]
    );

    if (camionCheck.rows.length === 0) {
      throw new Error('Camion no disponible');
    }

    // Verificar que el conductor esta disponible
    const conductorCheck = await client.query(
      `SELECT id, estado
       FROM conductores
       WHERE id = $1 AND estado = 'DISPONIBLE'
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
        camion_id,
        conductor_id,
        estado,
        hora_salida,
        hora_llegada_estimada,
        distancia_km,
        ruta_calculada
      ) VALUES ($1, $2, $3, 'EN_CAMINO', NOW(), $4, $5, $6)
      RETURNING *`,
      [pedido_id, camion_id, conductor_id, hora_llegada_estimada, distancia_km, JSON.stringify(ruta_calculada)]
    );

    const entrega = entregaResult.rows[0];

    // Actualizar estado del pedido
    await client.query(
      `UPDATE pedidos
       SET estado = 'EN_CAMINO', updated_at = NOW()
       WHERE id = $1`,
      [pedido_id]
    );

    // Actualizar estado del camion
    await client.query(
      `UPDATE camiones
       SET estado = 'EN_RUTA', updated_at = NOW()
       WHERE id = $1`,
      [camion_id]
    );

    // Actualizar estado del conductor
    await client.query(
      `UPDATE conductores
       SET estado = 'EN_RUTA', updated_at = NOW()
       WHERE id = $1`,
      [conductor_id]
    );

    // Registrar evento de salida
    await client.query(
      `INSERT INTO eventos_entrega (
        entrega_id,
        tipo_evento,
        descripcion,
        timestamp
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
        'numero_pedido', p.numero_pedido,
        'estado', p.estado,
        'fecha_entrega', p.fecha_entrega,
        'cliente', jsonb_build_object(
          'id', c.id,
          'razon_social', c.razon_social,
          'direccion', c.direccion,
          'latitud', c.latitud,
          'longitud', c.longitud,
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
        'numero_pedido', p.numero_pedido,
        'estado', p.estado,
        'fecha_entrega', p.fecha_entrega,
        'cliente', jsonb_build_object(
          'id', c.id,
          'razon_social', c.razon_social,
          'direccion', c.direccion,
          'latitud', c.latitud,
          'longitud', c.longitud,
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
    WHERE e.estado = 'EN_CAMINO'
    ORDER BY e.hora_salida DESC`
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
  const result = await pool.query<EntregaConDetalle>(
    `SELECT
      e.*,
      jsonb_build_object(
        'id', p.id,
        'numero_pedido', p.numero_pedido,
        'estado', p.estado,
        'fecha_entrega', p.fecha_entrega,
        'cliente', jsonb_build_object(
          'id', c.id,
          'razon_social', c.razon_social,
          'direccion', c.direccion,
          'latitud', c.latitud,
          'longitud', c.longitud,
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
    WHERE e.estado = $1
    ORDER BY e.created_at DESC
    LIMIT $2 OFFSET $3`,
    [estado, limite, offset]
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
       WHERE id = $1 AND estado = 'EN_CAMINO'
       FOR UPDATE`,
      [id]
    );

    if (entregaCheck.rows.length === 0) {
      throw new Error('Entrega no encontrada o ya fue finalizada');
    }

    const entrega = entregaCheck.rows[0];

    // Actualizar la entrega
    const entregaResult = await client.query<Entrega>(
      `UPDATE entregas
       SET
         estado = 'COMPLETADA',
         hora_llegada_real = NOW(),
         firma_cliente = COALESCE($2, firma_cliente),
         foto_comprobante = COALESCE($3, foto_comprobante),
         observaciones = COALESCE($4, observaciones),
         updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, firma_cliente || null, foto_comprobante || null, observaciones || null]
    );

    const entregaFinalizada = entregaResult.rows[0];

    // Actualizar estado del pedido
    await client.query(
      `UPDATE pedidos
       SET estado = 'ENTREGADO', updated_at = NOW()
       WHERE id = $1`,
      [entrega.pedido_id]
    );

    // Liberar camion
    await client.query(
      `UPDATE camiones
       SET estado = 'DISPONIBLE', updated_at = NOW()
       WHERE id = $1`,
      [entrega.camion_id]
    );

    // Liberar conductor
    await client.query(
      `UPDATE conductores
       SET estado = 'DISPONIBLE', updated_at = NOW()
       WHERE id = $1`,
      [entrega.conductor_id]
    );

    // Registrar evento de finalizacion
    await client.query(
      `INSERT INTO eventos_entrega (
        entrega_id,
        tipo_evento,
        descripcion,
        timestamp
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
       WHERE id = $1 AND estado = 'EN_CAMINO'
       FOR UPDATE`,
      [id]
    );

    if (entregaCheck.rows.length === 0) {
      throw new Error('Entrega no encontrada o no se puede cancelar');
    }

    const entrega = entregaCheck.rows[0];

    // Actualizar la entrega
    const entregaResult = await client.query<Entrega>(
      `UPDATE entregas
       SET
         estado = 'CANCELADA',
         observaciones = $2,
         updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, motivo]
    );

    // Revertir estado del pedido a CONFIRMADO
    await client.query(
      `UPDATE pedidos
       SET estado = 'CONFIRMADO', updated_at = NOW()
       WHERE id = $1`,
      [entrega.pedido_id]
    );

    // Liberar camion
    await client.query(
      `UPDATE camiones
       SET estado = 'DISPONIBLE', updated_at = NOW()
       WHERE id = $1`,
      [entrega.camion_id]
    );

    // Liberar conductor
    await client.query(
      `UPDATE conductores
       SET estado = 'DISPONIBLE', updated_at = NOW()
       WHERE id = $1`,
      [entrega.conductor_id]
    );

    // Registrar evento de cancelacion
    await client.query(
      `INSERT INTO eventos_entrega (
        entrega_id,
        tipo_evento,
        descripcion,
        timestamp
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
     ORDER BY timestamp ASC`,
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
    query += ' WHERE e.entregado = FALSE AND e.hora_salida_planta IS NOT NULL';
  } else if (estado === 'COMPLETADA') {
    query += ' WHERE e.entregado = TRUE';
  } else if (estado === 'CANCELADA') {
    query += ' INNER JOIN pedidos p ON e.pedido_id = p.id WHERE p.estado_actual_id = 8';
  }

  const result = await pool.query<{ count: string }>(query);

  return parseInt(result.rows[0].count, 10);
}
