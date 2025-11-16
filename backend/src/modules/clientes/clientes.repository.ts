import { pool } from '../../database/postgres/pool.js';

// Tipos para las filas de la base de datos
export interface ClienteRow {
  id: number;
  usuario_id: number | null;
  tipo_cliente_id: number;
  razon_social: string;
  nit: string | null;
  telefono: string | null;
  created_at: Date;
  updated_at: Date;
  usuario_email?: string | null;
  tipo_cliente_nombre?: string;
}

export interface ClienteListItem {
  id: number;
  razon_social: string;
  nit: string | null;
  telefono: string | null;
  tipo_cliente_nombre: string;
}

// Listar todos los clientes con paginación
export async function findAllClientes(
  limit: number = 20,
  offset: number = 0
): Promise<ClienteListItem[]> {
  const result = await pool.query<ClienteRow>(
    `SELECT
      c.id,
      c.razon_social,
      c.nit,
      c.telefono,
      tc.nombre as tipo_cliente_nombre
    FROM clientes c
    INNER JOIN tipo_cliente tc ON c.tipo_cliente_id = tc.id
    ORDER BY c.razon_social ASC
    LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  // Mapear rows asegurando que tipo_cliente_nombre no sea undefined
  return result.rows.map(row => ({
    id: row.id,
    razon_social: row.razon_social,
    nit: row.nit,
    telefono: row.telefono,
    tipo_cliente_nombre: row.tipo_cliente_nombre || ''
  }));
}

// Contar total de clientes
export async function countClientes(): Promise<number> {
  const result = await pool.query<{ count: string }>(
    `SELECT COUNT(*) as count FROM clientes`
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

// Buscar cliente por ID
export async function findClienteById(id: number): Promise<ClienteRow | null> {
  const result = await pool.query<ClienteRow>(
    `SELECT
      c.id,
      c.usuario_id,
      c.tipo_cliente_id,
      c.razon_social,
      c.nit,
      c.telefono,
      c.created_at,
      c.updated_at,
      u.email as usuario_email,
      tc.nombre as tipo_cliente_nombre
    FROM clientes c
    LEFT JOIN usuarios u ON c.usuario_id = u.id
    INNER JOIN tipo_cliente tc ON c.tipo_cliente_id = tc.id
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

// Buscar cliente por NIT
export async function findClienteByNIT(nit: string): Promise<ClienteRow | null> {
  const result = await pool.query<ClienteRow>(
    `SELECT
      c.id,
      c.usuario_id,
      c.tipo_cliente_id,
      c.razon_social,
      c.nit,
      c.telefono,
      c.created_at,
      c.updated_at,
      u.email as usuario_email,
      tc.nombre as tipo_cliente_nombre
    FROM clientes c
    LEFT JOIN usuarios u ON c.usuario_id = u.id
    INNER JOIN tipo_cliente tc ON c.tipo_cliente_id = tc.id
    WHERE c.nit = $1`,
    [nit]
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

// Buscar cliente por usuario_id
export async function findClienteByUsuarioId(usuarioId: number): Promise<ClienteRow | null> {
  const result = await pool.query<ClienteRow>(
    `SELECT
      c.id,
      c.usuario_id,
      c.tipo_cliente_id,
      c.razon_social,
      c.nit,
      c.telefono,
      c.created_at,
      c.updated_at,
      u.email as usuario_email,
      tc.nombre as tipo_cliente_nombre
    FROM clientes c
    LEFT JOIN usuarios u ON c.usuario_id = u.id
    INNER JOIN tipo_cliente tc ON c.tipo_cliente_id = tc.id
    WHERE c.usuario_id = $1`,
    [usuarioId]
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

// Crear nuevo cliente
export async function createCliente(data: {
  razon_social: string;
  tipo_cliente_id: number;
  nit?: string;
  telefono?: string;
}): Promise<number> {
  const result = await pool.query<{ id: number }>(
    `INSERT INTO clientes (razon_social, tipo_cliente_id, nit, telefono)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [
      data.razon_social,
      data.tipo_cliente_id,
      data.nit || null,
      data.telefono || null
    ]
  );

  const row = result.rows[0];
  if (!row) {
    throw new Error('No se pudo crear el cliente');
  }

  return row.id;
}

// Actualizar información de cliente (admin o gerente)
export async function updateCliente(
  id: number,
  data: {
    razon_social?: string;
    nit?: string;
    telefono?: string;
    tipo_cliente_id?: number;
  }
): Promise<boolean> {
  const fields: string[] = [];
  const values: (string | number)[] = [];
  let paramCounter = 1;

  if (data.razon_social !== undefined) {
    fields.push(`razon_social = $${paramCounter++}`);
    values.push(data.razon_social);
  }
  if (data.nit !== undefined) {
    fields.push(`nit = $${paramCounter++}`);
    values.push(data.nit);
  }
  if (data.telefono !== undefined) {
    fields.push(`telefono = $${paramCounter++}`);
    values.push(data.telefono);
  }
  if (data.tipo_cliente_id !== undefined) {
    fields.push(`tipo_cliente_id = $${paramCounter++}`);
    values.push(data.tipo_cliente_id);
  }

  if (fields.length === 0) {
    return false;
  }

  fields.push(`updated_at = NOW()`);
  values.push(id);

  const result = await pool.query(
    `UPDATE clientes
     SET ${fields.join(', ')}
     WHERE id = $${paramCounter}`,
    values
  );

  return result.rowCount !== null && result.rowCount > 0;
}

// Verificar si NIT ya existe (para evitar duplicados)
export async function nitExists(nit: string, excludeId?: number): Promise<boolean> {
  let query = 'SELECT id FROM clientes WHERE nit = $1';
  const params: (string | number)[] = [nit];

  if (excludeId !== undefined) {
    query += ' AND id != $2';
    params.push(excludeId);
  }

  const result = await pool.query(query, params);
  return result.rows.length > 0;
}

// Obtener estadísticas de clientes
export async function getEstadisticasClientes() {
  // Total de clientes
  const totalResult = await pool.query<{ total: string }>(
    'SELECT COUNT(*) as total FROM clientes'
  );

  // Clientes activos este mes (con pedidos)
  const activosMesResult = await pool.query<{ total: string }>(
    `SELECT COUNT(DISTINCT c.id) as total
     FROM clientes c
     INNER JOIN pedidos p ON c.id = p.cliente_id
     WHERE p.fecha_pedido >= DATE_TRUNC('month', CURRENT_DATE)`
  );

  // Clientes nuevos este mes
  const nuevosMesResult = await pool.query<{ total: string }>(
    `SELECT COUNT(*) as total
     FROM clientes
     WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)`
  );

  // Clientes inactivos (sin pedidos en últimos 90 días)
  const inactivosResult = await pool.query<{ total: string }>(
    `SELECT COUNT(DISTINCT c.id) as total
     FROM clientes c
     LEFT JOIN pedidos p ON c.id = p.cliente_id
       AND p.fecha_pedido >= CURRENT_DATE - INTERVAL '90 days'
     WHERE p.id IS NULL`
  );

  // Cliente top del mes (mayor gasto)
  const topClienteResult = await pool.query<{
    id: number;
    razon_social: string;
    total_gastado: string;
  }>(
    `SELECT
      c.id,
      c.razon_social,
      SUM(p.monto_total) as total_gastado
    FROM clientes c
    INNER JOIN pedidos p ON c.id = p.cliente_id
    WHERE p.fecha_pedido >= DATE_TRUNC('month', CURRENT_DATE)
    GROUP BY c.id, c.razon_social
    ORDER BY total_gastado DESC
    LIMIT 1`
  );

  const topCliente = topClienteResult.rows[0] || null;

  return {
    total_clientes: parseInt(totalResult.rows[0]?.total || '0', 10),
    clientes_activos_mes: parseInt(activosMesResult.rows[0]?.total || '0', 10),
    clientes_nuevos_mes: parseInt(nuevosMesResult.rows[0]?.total || '0', 10),
    clientes_inactivos_90dias: parseInt(inactivosResult.rows[0]?.total || '0', 10),
    cliente_top_mes: topCliente ? {
      id: topCliente.id,
      razon_social: topCliente.razon_social,
      total_gastado: parseFloat(topCliente.total_gastado)
    } : null
  };
}
