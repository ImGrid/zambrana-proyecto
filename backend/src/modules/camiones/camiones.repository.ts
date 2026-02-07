import { pool } from '../../database/postgres/pool.js';

// Tipos para las filas de la base de datos
export interface CamionRow {
  id: number;
  placa: string;
  tipo_camion_id: number;
  marca: string | null;
  modelo: string | null;
  año: number | null;
  capacidad_m3: number;
  color: string | null;
  activo: boolean;
  en_mantenimiento: boolean;
  created_at: Date;
  updated_at: Date;
  tipo_camion?: string;
}

export interface CamionListItem {
  id: number;
  placa: string;
  tipo_camion: string;
  marca: string | null;
  modelo: string | null;
  capacidad_m3: number;
  activo: boolean;
  en_mantenimiento: boolean;
}

// Whitelist de campos ordenables
const SORT_FIELDS: Record<string, string> = {
  placa: 'c.placa',
  tipo_camion: 'tc.nombre',
  capacidad_m3: 'c.capacidad_m3',
};

// Listar todos los camiones con paginación
export async function findAllCamiones(
  limit: number = 20,
  offset: number = 0,
  soloActivos: boolean = false,
  soloDisponibles: boolean = false,
  sort_by?: string,
  sort_order?: 'asc' | 'desc'
): Promise<CamionListItem[]> {
  const whereConditions: string[] = [];

  if (soloActivos) {
    whereConditions.push('c.activo = true');
  }

  if (soloDisponibles) {
    whereConditions.push('c.activo = true AND c.en_mantenimiento = false');
  }

  const whereClause = whereConditions.length > 0
    ? `WHERE ${whereConditions.join(' AND ')}`
    : '';

  const sortColumn = (sort_by && SORT_FIELDS[sort_by]) || 'c.placa';
  const sortDirection = sort_order === 'desc' ? 'DESC' : 'ASC';

  const result = await pool.query<CamionRow>(
    `SELECT
      c.id,
      c.placa,
      tc.nombre as tipo_camion,
      c.marca,
      c.modelo,
      c.capacidad_m3,
      c.activo,
      c.en_mantenimiento
    FROM camiones c
    INNER JOIN tipo_camion tc ON c.tipo_camion_id = tc.id
    ${whereClause}
    ORDER BY ${sortColumn} ${sortDirection}
    LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  return result.rows.map(row => ({
    id: row.id,
    placa: row.placa,
    tipo_camion: row.tipo_camion || '',
    marca: row.marca,
    modelo: row.modelo,
    capacidad_m3: Number(row.capacidad_m3),
    activo: row.activo,
    en_mantenimiento: row.en_mantenimiento
  }));
}

// Contar total de camiones
export async function countCamiones(
  soloActivos: boolean = false,
  soloDisponibles: boolean = false
): Promise<number> {
  const whereConditions: string[] = [];

  if (soloActivos) {
    whereConditions.push('activo = true');
  }

  if (soloDisponibles) {
    whereConditions.push('activo = true AND en_mantenimiento = false');
  }

  const whereClause = whereConditions.length > 0
    ? `WHERE ${whereConditions.join(' AND ')}`
    : '';

  const result = await pool.query<{ count: string }>(
    `SELECT COUNT(*) as count FROM camiones ${whereClause}`
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

// Buscar camión por ID
export async function findCamionById(id: number): Promise<CamionRow | null> {
  const result = await pool.query<CamionRow>(
    `SELECT
      c.id,
      c.placa,
      c.tipo_camion_id,
      tc.nombre as tipo_camion,
      c.marca,
      c.modelo,
      c."año",
      c.capacidad_m3,
      c.color,
      c.activo,
      c.en_mantenimiento,
      c.created_at,
      c.updated_at
    FROM camiones c
    INNER JOIN tipo_camion tc ON c.tipo_camion_id = tc.id
    WHERE c.id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  // Asegurar que el row existe antes de acceder a sus propiedades
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    placa: row.placa,
    tipo_camion_id: row.tipo_camion_id,
    tipo_camion: row.tipo_camion,
    marca: row.marca,
    modelo: row.modelo,
    año: row.año,
    capacidad_m3: Number(row.capacidad_m3),
    color: row.color,
    activo: row.activo,
    en_mantenimiento: row.en_mantenimiento,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

// Buscar camión por placa
export async function findCamionByPlaca(placa: string): Promise<CamionRow | null> {
  const result = await pool.query<CamionRow>(
    `SELECT
      c.id,
      c.placa,
      c.tipo_camion_id,
      tc.nombre as tipo_camion,
      c.marca,
      c.modelo,
      c."año",
      c.capacidad_m3,
      c.color,
      c.activo,
      c.en_mantenimiento,
      c.created_at,
      c.updated_at
    FROM camiones c
    INNER JOIN tipo_camion tc ON c.tipo_camion_id = tc.id
    WHERE c.placa = $1`,
    [placa]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  // Asegurar que el row existe antes de acceder a sus propiedades
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    placa: row.placa,
    tipo_camion_id: row.tipo_camion_id,
    tipo_camion: row.tipo_camion,
    marca: row.marca,
    modelo: row.modelo,
    año: row.año,
    capacidad_m3: Number(row.capacidad_m3),
    color: row.color,
    activo: row.activo,
    en_mantenimiento: row.en_mantenimiento,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

// Crear nuevo camión
export async function createCamion(data: {
  placa: string;
  tipo_camion_id: number;
  marca?: string;
  modelo?: string;
  año?: number;
  capacidad_m3: number;
  color?: string;
}): Promise<number> {
  const result = await pool.query<{ id: number }>(
    `INSERT INTO camiones (placa, tipo_camion_id, marca, modelo, "año", capacidad_m3, color)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id`,
    [
      data.placa,
      data.tipo_camion_id,
      data.marca || null,
      data.modelo || null,
      data.año || null,
      data.capacidad_m3,
      data.color || null
    ]
  );

  const row = result.rows[0];
  if (!row) {
    throw new Error('No se pudo crear el camión');
  }

  return row.id;
}

// Actualizar información de camión (admin o gerente)
export async function updateCamion(
  id: number,
  data: {
    placa?: string;
    tipo_camion_id?: number;
    marca?: string;
    modelo?: string;
    año?: number;
    capacidad_m3?: number;
    color?: string;
  }
): Promise<boolean> {
  const fields: string[] = [];
  const values: (string | number)[] = [];
  let paramCounter = 1;

  if (data.placa !== undefined) {
    fields.push(`placa = $${paramCounter++}`);
    values.push(data.placa);
  }
  if (data.tipo_camion_id !== undefined) {
    fields.push(`tipo_camion_id = $${paramCounter++}`);
    values.push(data.tipo_camion_id);
  }
  if (data.marca !== undefined) {
    fields.push(`marca = $${paramCounter++}`);
    values.push(data.marca);
  }
  if (data.modelo !== undefined) {
    fields.push(`modelo = $${paramCounter++}`);
    values.push(data.modelo);
  }
  if (data.año !== undefined) {
    fields.push(`"año" = $${paramCounter++}`);
    values.push(data.año);
  }
  if (data.capacidad_m3 !== undefined) {
    fields.push(`capacidad_m3 = $${paramCounter++}`);
    values.push(data.capacidad_m3);
  }
  if (data.color !== undefined) {
    fields.push(`color = $${paramCounter++}`);
    values.push(data.color);
  }

  if (fields.length === 0) {
    return false;
  }

  fields.push(`updated_at = NOW()`);
  values.push(id);

  const result = await pool.query(
    `UPDATE camiones
     SET ${fields.join(', ')}
     WHERE id = $${paramCounter}`,
    values
  );

  return result.rowCount !== null && result.rowCount > 0;
}

// Activar/desactivar camión
export async function toggleActivoCamion(id: number): Promise<boolean> {
  const result = await pool.query(
    `UPDATE camiones
     SET activo = NOT activo, updated_at = NOW()
     WHERE id = $1
     RETURNING activo`,
    [id]
  );

  return result.rowCount !== null && result.rowCount > 0;
}

// Cambiar estado de mantenimiento
export async function toggleMantenimientoCamion(id: number): Promise<boolean> {
  const result = await pool.query(
    `UPDATE camiones
     SET en_mantenimiento = NOT en_mantenimiento, updated_at = NOW()
     WHERE id = $1
     RETURNING en_mantenimiento`,
    [id]
  );

  return result.rowCount !== null && result.rowCount > 0;
}

// Verificar si placa ya existe (para evitar duplicados)
export async function placaExists(placa: string, excludeId?: number): Promise<boolean> {
  let query = 'SELECT id FROM camiones WHERE placa = $1';
  const params: (string | number)[] = [placa];

  if (excludeId !== undefined) {
    query += ' AND id != $2';
    params.push(excludeId);
  }

  const result = await pool.query(query, params);
  return result.rows.length > 0;
}

// Obtener estadísticas de camiones (optimizado con FILTER)
export async function getEstadisticasCamiones() {
  // Query principal con FILTER (más rápido que CASE WHEN)
  const totalesResult = await pool.query<{
    total_camiones: string;
    camiones_activos: string;
    camiones_inactivos: string;
    camiones_en_mantenimiento: string;
    camiones_disponibles: string;
    capacidad_total_m3: string;
  }>(`
    SELECT
      COUNT(*) as total_camiones,
      COUNT(*) FILTER (WHERE activo = true) as camiones_activos,
      COUNT(*) FILTER (WHERE activo = false) as camiones_inactivos,
      COUNT(*) FILTER (WHERE en_mantenimiento = true) as camiones_en_mantenimiento,
      COUNT(*) FILTER (WHERE activo = true AND en_mantenimiento = false) as camiones_disponibles,
      COALESCE(SUM(capacidad_m3) FILTER (WHERE activo = true), 0) as capacidad_total_m3
    FROM camiones
  `);

  // Camiones con entregas este mes
  const camionesConEntregasMesResult = await pool.query<{ total: string }>(`
    SELECT COUNT(DISTINCT camion_id) as total
    FROM entregas
    WHERE camion_id IS NOT NULL
      AND hora_salida_planta >= DATE_TRUNC('month', CURRENT_DATE)
  `);

  // Camión top del mes (más entregas)
  const topCamionResult = await pool.query<{
    id: number;
    placa: string;
    total_entregas: string;
  }>(`
    SELECT
      c.id,
      c.placa,
      COUNT(e.id) as total_entregas
    FROM camiones c
    INNER JOIN entregas e ON c.id = e.camion_id
    WHERE e.hora_salida_planta >= DATE_TRUNC('month', CURRENT_DATE)
    GROUP BY c.id, c.placa
    ORDER BY total_entregas DESC
    LIMIT 1
  `);

  const topCamion = topCamionResult.rows[0] || null;
  const totales = totalesResult.rows[0];

  return {
    total_camiones: parseInt(totales?.total_camiones || '0', 10),
    camiones_activos: parseInt(totales?.camiones_activos || '0', 10),
    camiones_inactivos: parseInt(totales?.camiones_inactivos || '0', 10),
    camiones_en_mantenimiento: parseInt(totales?.camiones_en_mantenimiento || '0', 10),
    camiones_disponibles: parseInt(totales?.camiones_disponibles || '0', 10),
    capacidad_total_m3: parseFloat(totales?.capacidad_total_m3 || '0'),
    camiones_con_entregas_mes: parseInt(camionesConEntregasMesResult.rows[0]?.total || '0', 10),
    camion_top_mes: topCamion ? {
      id: topCamion.id,
      placa: topCamion.placa,
      total_entregas: parseInt(topCamion.total_entregas, 10)
    } : null
  };
}
