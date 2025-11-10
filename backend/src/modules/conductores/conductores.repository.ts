import { pool } from '../../database/postgres/pool.js';

// Tipos para las filas de la base de datos
export interface ConductorRow {
  id: number;
  usuario_id: number | null;
  nombre_completo: string;
  ci: string;
  telefono: string | null;
  licencia_categoria: string | null;
  fecha_vencimiento_licencia: Date | null;
  activo: boolean;
  created_at: Date;
  updated_at: Date;
  usuario_email?: string | null;
}

export interface ConductorListItem {
  id: number;
  nombre_completo: string;
  ci: string;
  telefono: string | null;
  licencia_categoria: string | null;
  activo: boolean;
}

// Listar todos los conductores con paginación
export async function findAllConductores(
  limit: number = 20,
  offset: number = 0,
  soloActivos: boolean = false
): Promise<ConductorListItem[]> {
  const whereClause = soloActivos ? 'WHERE c.activo = true' : '';

  const result = await pool.query<ConductorRow>(
    `SELECT
      c.id,
      c.nombre_completo,
      c.ci,
      c.telefono,
      c.licencia_categoria,
      c.activo
    FROM conductores c
    ${whereClause}
    ORDER BY c.nombre_completo ASC
    LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  return result.rows;
}

// Contar total de conductores
export async function countConductores(soloActivos: boolean = false): Promise<number> {
  const whereClause = soloActivos ? 'WHERE activo = true' : '';

  const result = await pool.query<{ count: string }>(
    `SELECT COUNT(*) as count FROM conductores ${whereClause}`
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

// Buscar conductor por ID
export async function findConductorById(id: number): Promise<ConductorRow | null> {
  const result = await pool.query<ConductorRow>(
    `SELECT
      c.id,
      c.usuario_id,
      c.nombre_completo,
      c.ci,
      c.telefono,
      c.licencia_categoria,
      c.fecha_vencimiento_licencia,
      c.activo,
      c.created_at,
      c.updated_at,
      u.email as usuario_email
    FROM conductores c
    LEFT JOIN usuarios u ON c.usuario_id = u.id
    WHERE c.id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  if (!row) {
    return null;
  }

  return row;
}

// Buscar conductor por CI
export async function findConductorByCI(ci: string): Promise<ConductorRow | null> {
  const result = await pool.query<ConductorRow>(
    `SELECT
      c.id,
      c.usuario_id,
      c.nombre_completo,
      c.ci,
      c.telefono,
      c.licencia_categoria,
      c.fecha_vencimiento_licencia,
      c.activo,
      c.created_at,
      c.updated_at,
      u.email as usuario_email
    FROM conductores c
    LEFT JOIN usuarios u ON c.usuario_id = u.id
    WHERE c.ci = $1`,
    [ci]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  if (!row) {
    return null;
  }

  return row;
}

// Crear nuevo conductor
export async function createConductor(data: {
  nombre_completo: string;
  ci: string;
  telefono?: string;
  licencia_categoria?: string;
  fecha_vencimiento_licencia?: string;
}): Promise<number> {
  const result = await pool.query<{ id: number }>(
    `INSERT INTO conductores (nombre_completo, ci, telefono, licencia_categoria, fecha_vencimiento_licencia)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [
      data.nombre_completo,
      data.ci,
      data.telefono || null,
      data.licencia_categoria || null,
      data.fecha_vencimiento_licencia || null
    ]
  );

  const row = result.rows[0];
  if (!row) {
    throw new Error('No se pudo crear el conductor');
  }

  return row.id;
}

// Actualizar información de conductor (admin o gerente)
export async function updateConductor(
  id: number,
  data: {
    nombre_completo?: string;
    ci?: string;
    telefono?: string;
    licencia_categoria?: string;
    fecha_vencimiento_licencia?: Date;
  }
): Promise<boolean> {
  const fields: string[] = [];
  const values: (string | Date | number)[] = [];
  let paramCounter = 1;

  if (data.nombre_completo !== undefined) {
    fields.push(`nombre_completo = $${paramCounter++}`);
    values.push(data.nombre_completo);
  }
  if (data.ci !== undefined) {
    fields.push(`ci = $${paramCounter++}`);
    values.push(data.ci);
  }
  if (data.telefono !== undefined) {
    fields.push(`telefono = $${paramCounter++}`);
    values.push(data.telefono);
  }
  if (data.licencia_categoria !== undefined) {
    fields.push(`licencia_categoria = $${paramCounter++}`);
    values.push(data.licencia_categoria);
  }
  if (data.fecha_vencimiento_licencia !== undefined) {
    fields.push(`fecha_vencimiento_licencia = $${paramCounter++}`);
    values.push(data.fecha_vencimiento_licencia);
  }

  if (fields.length === 0) {
    return false;
  }

  fields.push(`updated_at = NOW()`);
  values.push(id);

  const result = await pool.query(
    `UPDATE conductores
     SET ${fields.join(', ')}
     WHERE id = $${paramCounter}`,
    values
  );

  return result.rowCount !== null && result.rowCount > 0;
}

// Activar/desactivar conductor
export async function toggleActivoConductor(id: number): Promise<boolean> {
  const result = await pool.query(
    `UPDATE conductores
     SET activo = NOT activo, updated_at = NOW()
     WHERE id = $1
     RETURNING activo`,
    [id]
  );

  return result.rowCount !== null && result.rowCount > 0;
}

// Verificar si CI ya existe (para evitar duplicados)
export async function ciExists(ci: string, excludeId?: number): Promise<boolean> {
  let query = 'SELECT id FROM conductores WHERE ci = $1';
  const params: (string | number)[] = [ci];

  if (excludeId !== undefined) {
    query += ' AND id != $2';
    params.push(excludeId);
  }

  const result = await pool.query(query, params);
  return result.rows.length > 0;
}

// Verificar licencias próximas a vencer (para notificaciones)
export async function findLicenciasProximasVencer(diasAntes: number = 30): Promise<ConductorRow[]> {
  const result = await pool.query<ConductorRow>(
    `SELECT
      c.id,
      c.nombre_completo,
      c.ci,
      c.telefono,
      c.licencia_categoria,
      c.fecha_vencimiento_licencia,
      c.activo
    FROM conductores c
    WHERE c.activo = true
      AND c.fecha_vencimiento_licencia IS NOT NULL
      AND c.fecha_vencimiento_licencia BETWEEN CURRENT_DATE AND CURRENT_DATE + ($1 || ' days')::INTERVAL
    ORDER BY c.fecha_vencimiento_licencia ASC`,
    [diasAntes]
  );

  return result.rows;
}

// Obtener estadísticas de conductores
export async function getEstadisticasConductores() {
  // Total, activos e inactivos (optimizado con FILTER)
  const totalesResult = await pool.query<{
    total_conductores: string;
    conductores_activos: string;
    conductores_inactivos: string;
  }>(`
    SELECT
      COUNT(*) as total_conductores,
      COUNT(*) FILTER (WHERE activo = true) as conductores_activos,
      COUNT(*) FILTER (WHERE activo = false) as conductores_inactivos
    FROM conductores
  `);

  // Licencias por vencer (próximos 30 días)
  const licenciasPorVencerResult = await pool.query<{ total: string }>(`
    SELECT COUNT(*) as total
    FROM conductores
    WHERE activo = true
      AND fecha_vencimiento_licencia IS NOT NULL
      AND fecha_vencimiento_licencia BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
  `);

  // Licencias vencidas
  const licenciasVencidasResult = await pool.query<{ total: string }>(`
    SELECT COUNT(*) as total
    FROM conductores
    WHERE activo = true
      AND fecha_vencimiento_licencia IS NOT NULL
      AND fecha_vencimiento_licencia < CURRENT_DATE
  `);

  // Conductores con entregas este mes
  const conductoresConEntregasMesResult = await pool.query<{ total: string }>(`
    SELECT COUNT(DISTINCT conductor_id) as total
    FROM entregas
    WHERE conductor_id IS NOT NULL
      AND hora_salida_planta >= DATE_TRUNC('month', CURRENT_DATE)
  `);

  // Conductor top del mes (más entregas)
  const topConductorResult = await pool.query<{
    id: number;
    nombre_completo: string;
    total_entregas: string;
  }>(`
    SELECT
      c.id,
      c.nombre_completo,
      COUNT(e.id) as total_entregas
    FROM conductores c
    INNER JOIN entregas e ON c.id = e.conductor_id
    WHERE e.hora_salida_planta >= DATE_TRUNC('month', CURRENT_DATE)
    GROUP BY c.id, c.nombre_completo
    ORDER BY total_entregas DESC
    LIMIT 1
  `);

  const topConductor = topConductorResult.rows[0] || null;
  const totales = totalesResult.rows[0];

  return {
    total_conductores: parseInt(totales?.total_conductores || '0', 10),
    conductores_activos: parseInt(totales?.conductores_activos || '0', 10),
    conductores_inactivos: parseInt(totales?.conductores_inactivos || '0', 10),
    licencias_por_vencer_30dias: parseInt(licenciasPorVencerResult.rows[0]?.total || '0', 10),
    licencias_vencidas: parseInt(licenciasVencidasResult.rows[0]?.total || '0', 10),
    conductores_con_entregas_mes: parseInt(conductoresConEntregasMesResult.rows[0]?.total || '0', 10),
    conductor_top_mes: topConductor ? {
      id: topConductor.id,
      nombre_completo: topConductor.nombre_completo,
      total_entregas: parseInt(topConductor.total_entregas, 10)
    } : null
  };
}
