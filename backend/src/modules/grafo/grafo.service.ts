import neo4j from 'neo4j-driver';
import { getSession } from '../../database/neo4j/driver.js';
import { pool } from '../../database/postgres/pool.js';

// Tipos internos
interface NodoGrafo {
  id: string;
  label: string;
  tipo: string;
  propiedades?: Record<string, unknown>;
}

interface RelacionGrafo {
  origen: string;
  destino: string;
  tipo: string;
  propiedades?: Record<string, unknown>;
}

interface GrafoResult {
  nodos: NodoGrafo[];
  relaciones: RelacionGrafo[];
}

// Sincronizar un cliente a Neo4j
export async function sincronizarCliente(clienteId: number): Promise<void> {
  const pgResult = await pool.query(
    `SELECT c.id, c.razon_social, c.nit, c.telefono, tc.nombre as tipo_cliente
     FROM clientes c
     JOIN tipo_cliente tc ON c.tipo_cliente_id = tc.id
     WHERE c.id = $1`,
    [clienteId]
  );

  if (pgResult.rows.length === 0) return;

  const cliente = pgResult.rows[0];
  const session = getSession();

  try {
    await session.run(
      `MERGE (c:Cliente {pg_id: $id})
       SET c.razon_social = $razon_social,
           c.nit = $nit,
           c.telefono = $telefono,
           c.tipo_cliente = $tipo_cliente`,
      {
        id: cliente.id,
        razon_social: cliente.razon_social,
        nit: cliente.nit || '',
        telefono: cliente.telefono || '',
        tipo_cliente: cliente.tipo_cliente
      }
    );
  } finally {
    await session.close();
  }
}

// Sincronizar un material a Neo4j
export async function sincronizarMaterial(materialId: number): Promise<void> {
  const pgResult = await pool.query(
    `SELECT id, nombre, codigo, precio_m3, unidad_medida
     FROM materiales WHERE id = $1`,
    [materialId]
  );

  if (pgResult.rows.length === 0) return;

  const material = pgResult.rows[0];
  const session = getSession();

  try {
    await session.run(
      `MERGE (m:Material {pg_id: $id})
       SET m.nombre = $nombre,
           m.codigo = $codigo,
           m.precio_m3 = $precio_m3,
           m.unidad_medida = $unidad_medida`,
      {
        id: material.id,
        nombre: material.nombre,
        codigo: material.codigo,
        precio_m3: parseFloat(material.precio_m3),
        unidad_medida: material.unidad_medida
      }
    );
  } finally {
    await session.close();
  }
}

// Sincronizar un conductor a Neo4j
export async function sincronizarConductor(conductorId: number): Promise<void> {
  const pgResult = await pool.query(
    `SELECT id, nombre_completo, ci, telefono, licencia_categoria
     FROM conductores WHERE id = $1`,
    [conductorId]
  );

  if (pgResult.rows.length === 0) return;

  const conductor = pgResult.rows[0];
  const session = getSession();

  try {
    await session.run(
      `MERGE (d:Conductor {pg_id: $id})
       SET d.nombre_completo = $nombre_completo,
           d.ci = $ci,
           d.telefono = $telefono,
           d.licencia_categoria = $licencia_categoria`,
      {
        id: conductor.id,
        nombre_completo: conductor.nombre_completo,
        ci: conductor.ci,
        telefono: conductor.telefono || '',
        licencia_categoria: conductor.licencia_categoria || ''
      }
    );
  } finally {
    await session.close();
  }
}

// Sincronizar un camion a Neo4j
export async function sincronizarCamion(camionId: number): Promise<void> {
  const pgResult = await pool.query(
    `SELECT c.id, c.placa, c.marca, c.modelo, c.capacidad_m3, tc.nombre as tipo_camion
     FROM camiones c
     JOIN tipo_camion tc ON c.tipo_camion_id = tc.id
     WHERE c.id = $1`,
    [camionId]
  );

  if (pgResult.rows.length === 0) return;

  const camion = pgResult.rows[0];
  const session = getSession();

  try {
    await session.run(
      `MERGE (cam:Camion {pg_id: $id})
       SET cam.placa = $placa,
           cam.marca = $marca,
           cam.modelo = $modelo,
           cam.capacidad_m3 = $capacidad_m3,
           cam.tipo_camion = $tipo_camion`,
      {
        id: camion.id,
        placa: camion.placa,
        marca: camion.marca || '',
        modelo: camion.modelo || '',
        capacidad_m3: parseFloat(camion.capacidad_m3),
        tipo_camion: camion.tipo_camion
      }
    );
  } finally {
    await session.close();
  }
}

// Sincronizar una zona a Neo4j
export async function sincronizarZona(zonaId: number): Promise<void> {
  const pgResult = await pool.query(
    `SELECT id, nombre, codigo FROM zonas_entrega WHERE id = $1`,
    [zonaId]
  );

  if (pgResult.rows.length === 0) return;

  const zona = pgResult.rows[0];
  const session = getSession();

  try {
    await session.run(
      `MERGE (z:Zona {pg_id: $id})
       SET z.nombre = $nombre,
           z.codigo = $codigo`,
      {
        id: zona.id,
        nombre: zona.nombre,
        codigo: zona.codigo
      }
    );
  } finally {
    await session.close();
  }
}

// Crear grafo cuando se crea un pedido
export async function crearGrafoPedido(pedidoId: number): Promise<void> {
  // Obtener pedido con datos del cliente
  const pedidoResult = await pool.query(
    `SELECT p.id, p.codigo_seguimiento, p.cliente_id, p.estado_actual_id,
            ep.nombre as estado, p.direccion_entrega, p.total_m3, p.monto_total,
            p.fecha_pedido, p.zona_id
     FROM pedidos p
     JOIN estados_pedido ep ON p.estado_actual_id = ep.id
     WHERE p.id = $1`,
    [pedidoId]
  );

  if (pedidoResult.rows.length === 0) return;

  const pedido = pedidoResult.rows[0];

  // Obtener detalles del pedido
  const detallesResult = await pool.query(
    `SELECT dp.material_id, dp.cantidad_m3, dp.precio_unitario, dp.subtotal
     FROM detalle_pedidos dp WHERE dp.pedido_id = $1`,
    [pedidoId]
  );

  // Sincronizar cliente primero
  await sincronizarCliente(pedido.cliente_id);

  // Sincronizar materiales
  for (const detalle of detallesResult.rows) {
    await sincronizarMaterial(detalle.material_id);
  }

  // Sincronizar zona si existe
  if (pedido.zona_id) {
    await sincronizarZona(pedido.zona_id);
  }

  const session = getSession();

  try {
    // Crear nodo Pedido
    await session.run(
      `MERGE (p:Pedido {pg_id: $id})
       SET p.codigo_seguimiento = $codigo,
           p.estado = $estado,
           p.direccion_entrega = $direccion,
           p.total_m3 = $total_m3,
           p.monto_total = $monto_total,
           p.fecha_pedido = $fecha_pedido`,
      {
        id: pedido.id,
        codigo: pedido.codigo_seguimiento,
        estado: pedido.estado,
        direccion: pedido.direccion_entrega,
        total_m3: parseFloat(pedido.total_m3),
        monto_total: parseFloat(pedido.monto_total),
        fecha_pedido: pedido.fecha_pedido.toISOString()
      }
    );

    // Relacion Cliente -[:REALIZA]-> Pedido
    await session.run(
      `MATCH (c:Cliente {pg_id: $cliente_id})
       MATCH (p:Pedido {pg_id: $pedido_id})
       MERGE (c)-[:REALIZA]->(p)`,
      { cliente_id: pedido.cliente_id, pedido_id: pedido.id }
    );

    // Relaciones Pedido -[:INCLUYE]-> Material (por cada detalle)
    for (const detalle of detallesResult.rows) {
      await session.run(
        `MATCH (p:Pedido {pg_id: $pedido_id})
         MATCH (m:Material {pg_id: $material_id})
         MERGE (p)-[r:INCLUYE]->(m)
         SET r.cantidad_m3 = $cantidad_m3,
             r.precio_unitario = $precio_unitario,
             r.subtotal = $subtotal`,
        {
          pedido_id: pedido.id,
          material_id: detalle.material_id,
          cantidad_m3: parseFloat(detalle.cantidad_m3),
          precio_unitario: parseFloat(detalle.precio_unitario),
          subtotal: parseFloat(detalle.subtotal)
        }
      );
    }

    // Relacion Pedido -[:EN_ZONA]-> Zona (si tiene zona)
    if (pedido.zona_id) {
      await session.run(
        `MATCH (p:Pedido {pg_id: $pedido_id})
         MATCH (z:Zona {pg_id: $zona_id})
         MERGE (p)-[:EN_ZONA]->(z)`,
        { pedido_id: pedido.id, zona_id: pedido.zona_id }
      );
    }
  } finally {
    await session.close();
  }
}

// Actualizar grafo cuando se confirma un pedido (asigna conductor y camion)
export async function confirmarGrafoPedido(pedidoId: number): Promise<void> {
  const pedidoResult = await pool.query(
    `SELECT p.id, p.conductor_asignado_id, p.camion_asignado_id,
            ep.nombre as estado
     FROM pedidos p
     JOIN estados_pedido ep ON p.estado_actual_id = ep.id
     WHERE p.id = $1`,
    [pedidoId]
  );

  if (pedidoResult.rows.length === 0) return;

  const pedido = pedidoResult.rows[0];

  // Sincronizar conductor y camion
  if (pedido.conductor_asignado_id) {
    await sincronizarConductor(pedido.conductor_asignado_id);
  }
  if (pedido.camion_asignado_id) {
    await sincronizarCamion(pedido.camion_asignado_id);
  }

  const session = getSession();

  try {
    // Actualizar estado del pedido
    await session.run(
      `MATCH (p:Pedido {pg_id: $pedido_id})
       SET p.estado = $estado`,
      { pedido_id: pedido.id, estado: pedido.estado }
    );

    // Relacion Pedido -[:ASIGNADO_A]-> Conductor
    if (pedido.conductor_asignado_id) {
      await session.run(
        `MATCH (p:Pedido {pg_id: $pedido_id})
         MATCH (d:Conductor {pg_id: $conductor_id})
         MERGE (p)-[:ASIGNADO_A]->(d)`,
        { pedido_id: pedido.id, conductor_id: pedido.conductor_asignado_id }
      );
    }

    // Relacion Pedido -[:USA_CAMION]-> Camion
    if (pedido.camion_asignado_id) {
      await session.run(
        `MATCH (p:Pedido {pg_id: $pedido_id})
         MATCH (cam:Camion {pg_id: $camion_id})
         MERGE (p)-[:USA_CAMION]->(cam)`,
        { pedido_id: pedido.id, camion_id: pedido.camion_asignado_id }
      );
    }
  } finally {
    await session.close();
  }
}

// Crear grafo cuando se inicia una entrega
export async function crearGrafoEntrega(entregaId: number): Promise<void> {
  const entregaResult = await pool.query(
    `SELECT e.id, e.pedido_id, e.conductor_id, e.camion_id,
            e.hora_salida_planta
     FROM entregas e WHERE e.id = $1`,
    [entregaId]
  );

  if (entregaResult.rows.length === 0) return;

  const entrega = entregaResult.rows[0];

  // Obtener cliente_id del pedido
  const pedidoResult = await pool.query(
    `SELECT cliente_id, ep.nombre as estado
     FROM pedidos p
     JOIN estados_pedido ep ON p.estado_actual_id = ep.id
     WHERE p.id = $1`,
    [entrega.pedido_id]
  );

  if (pedidoResult.rows.length === 0) return;

  const pedido = pedidoResult.rows[0];

  const session = getSession();

  try {
    // Crear nodo Entrega
    await session.run(
      `MERGE (e:Entrega {pg_id: $id})
       SET e.hora_salida_planta = $hora_salida,
           e.entregado = false`,
      {
        id: entrega.id,
        hora_salida: entrega.hora_salida_planta ? entrega.hora_salida_planta.toISOString() : ''
      }
    );

    // Actualizar estado del pedido
    await session.run(
      `MATCH (p:Pedido {pg_id: $pedido_id})
       SET p.estado = $estado`,
      { pedido_id: entrega.pedido_id, estado: pedido.estado }
    );

    // Relacion Pedido -[:GENERA]-> Entrega
    await session.run(
      `MATCH (p:Pedido {pg_id: $pedido_id})
       MATCH (e:Entrega {pg_id: $entrega_id})
       MERGE (p)-[:GENERA]->(e)`,
      { pedido_id: entrega.pedido_id, entrega_id: entrega.id }
    );

    // Relacion Conductor -[:EJECUTA]-> Entrega
    await session.run(
      `MATCH (d:Conductor {pg_id: $conductor_id})
       MATCH (e:Entrega {pg_id: $entrega_id})
       MERGE (d)-[:EJECUTA]->(e)`,
      { conductor_id: entrega.conductor_id, entrega_id: entrega.id }
    );

    // Relacion Camion -[:TRANSPORTA]-> Entrega
    await session.run(
      `MATCH (cam:Camion {pg_id: $camion_id})
       MATCH (e:Entrega {pg_id: $entrega_id})
       MERGE (cam)-[:TRANSPORTA]->(e)`,
      { camion_id: entrega.camion_id, entrega_id: entrega.id }
    );

    // Relacion Entrega -[:DESTINO]-> Cliente
    await session.run(
      `MATCH (e:Entrega {pg_id: $entrega_id})
       MATCH (c:Cliente {pg_id: $cliente_id})
       MERGE (e)-[:DESTINO]->(c)`,
      { entrega_id: entrega.id, cliente_id: pedido.cliente_id }
    );
  } finally {
    await session.close();
  }
}

// Actualizar grafo cuando se completa una entrega
export async function completarGrafoEntrega(entregaId: number): Promise<void> {
  const entregaResult = await pool.query(
    `SELECT e.id, e.pedido_id, e.entregado, e.hora_llegada_cliente,
            e.duracion_minutos, e.porcentaje_adherencia
     FROM entregas e WHERE e.id = $1`,
    [entregaId]
  );

  if (entregaResult.rows.length === 0) return;

  const entrega = entregaResult.rows[0];

  const pedidoResult = await pool.query(
    `SELECT ep.nombre as estado
     FROM pedidos p
     JOIN estados_pedido ep ON p.estado_actual_id = ep.id
     WHERE p.id = $1`,
    [entrega.pedido_id]
  );

  const estado = pedidoResult.rows[0]?.estado || 'ENTREGADO';

  const session = getSession();

  try {
    // Actualizar nodo Entrega
    await session.run(
      `MATCH (e:Entrega {pg_id: $id})
       SET e.entregado = $entregado,
           e.hora_llegada_cliente = $hora_llegada,
           e.duracion_minutos = $duracion,
           e.porcentaje_adherencia = $adherencia`,
      {
        id: entrega.id,
        entregado: entrega.entregado,
        hora_llegada: entrega.hora_llegada_cliente ? entrega.hora_llegada_cliente.toISOString() : '',
        duracion: entrega.duracion_minutos || 0,
        adherencia: entrega.porcentaje_adherencia ? parseFloat(entrega.porcentaje_adherencia) : 0
      }
    );

    // Actualizar estado del pedido
    await session.run(
      `MATCH (p:Pedido {pg_id: $pedido_id})
       SET p.estado = $estado`,
      { pedido_id: entrega.pedido_id, estado }
    );
  } finally {
    await session.close();
  }
}

// Consultar grafo de un pedido especifico
export async function obtenerGrafoPedido(pedidoId: number): Promise<GrafoResult> {
  const session = getSession();

  try {
    const result = await session.run(
      `MATCH (c:Cliente)-[r1:REALIZA]->(p:Pedido {pg_id: $pedido_id})
       OPTIONAL MATCH (p)-[r2:INCLUYE]->(m:Material)
       OPTIONAL MATCH (p)-[r3:ASIGNADO_A]->(d:Conductor)
       OPTIONAL MATCH (p)-[r4:USA_CAMION]->(cam:Camion)
       OPTIONAL MATCH (p)-[r5:GENERA]->(e:Entrega)
       OPTIONAL MATCH (e)-[r6:DESTINO]->(c2:Cliente)
       OPTIONAL MATCH (d2:Conductor)-[r7:EJECUTA]->(e)
       OPTIONAL MATCH (cam2:Camion)-[r8:TRANSPORTA]->(e)
       OPTIONAL MATCH (p)-[r9:EN_ZONA]->(z:Zona)
       RETURN c, p, m, d, cam, e, c2, d2, cam2, z,
              r1, r2, r3, r4, r5, r6, r7, r8, r9`,
      { pedido_id: pedidoId }
    );

    return procesarResultadosGrafo(result.records);
  } finally {
    await session.close();
  }
}

// Consultar grafo de operaciones generales
export async function obtenerGrafoOperaciones(
  estado?: string,
  limite: number = 50
): Promise<GrafoResult> {
  const session = getSession();

  try {
    const whereClause = estado ? 'WHERE p.estado = $estado' : '';

    const result = await session.run(
      `MATCH (c:Cliente)-[r1:REALIZA]->(p:Pedido)
       ${whereClause}
       OPTIONAL MATCH (p)-[r2:INCLUYE]->(m:Material)
       OPTIONAL MATCH (p)-[r3:ASIGNADO_A]->(d:Conductor)
       OPTIONAL MATCH (p)-[r4:USA_CAMION]->(cam:Camion)
       OPTIONAL MATCH (p)-[r5:GENERA]->(e:Entrega)
       OPTIONAL MATCH (e)-[r6:DESTINO]->(c2:Cliente)
       OPTIONAL MATCH (p)-[r9:EN_ZONA]->(z:Zona)
       WITH c, p, m, d, cam, e, c2, z, r1, r2, r3, r4, r5, r6, r9
       ORDER BY p.pg_id DESC
       LIMIT $limite
       RETURN c, p, m, d, cam, e, c2, z,
              r1, r2, r3, r4, r5, r6, r9`,
      { estado: estado || '', limite: neo4j.int(limite) }
    );

    return procesarResultadosGrafo(result.records);
  } finally {
    await session.close();
  }
}

// Consultar grafo de un cliente
export async function obtenerGrafoCliente(clienteId: number): Promise<GrafoResult> {
  const session = getSession();

  try {
    const result = await session.run(
      `MATCH (c:Cliente {pg_id: $cliente_id})-[r1:REALIZA]->(p:Pedido)
       OPTIONAL MATCH (p)-[r2:INCLUYE]->(m:Material)
       OPTIONAL MATCH (p)-[r3:ASIGNADO_A]->(d:Conductor)
       OPTIONAL MATCH (p)-[r4:USA_CAMION]->(cam:Camion)
       OPTIONAL MATCH (p)-[r5:GENERA]->(e:Entrega)
       OPTIONAL MATCH (e)-[r6:DESTINO]->(c2:Cliente)
       RETURN c, p, m, d, cam, e, c2,
              r1, r2, r3, r4, r5, r6`,
      { cliente_id: clienteId }
    );

    return procesarResultadosGrafo(result.records);
  } finally {
    await session.close();
  }
}

// Estadisticas del grafo de operaciones
interface EstadisticasGrafo {
  total_clientes: number;
  total_pedidos: number;
  total_conductores: number;
  total_camiones: number;
  total_materiales: number;
  total_entregas: number;
  total_relaciones: number;
}

export async function obtenerEstadisticasGrafo(): Promise<EstadisticasGrafo> {
  const session = getSession();

  try {
    const result = await session.run(
      `OPTIONAL MATCH (c:Cliente)
       WITH count(c) as total_clientes
       OPTIONAL MATCH (p:Pedido)
       WITH total_clientes, count(p) as total_pedidos
       OPTIONAL MATCH (d:Conductor)
       WITH total_clientes, total_pedidos, count(d) as total_conductores
       OPTIONAL MATCH (cam:Camion)
       WITH total_clientes, total_pedidos, total_conductores, count(cam) as total_camiones
       OPTIONAL MATCH (m:Material)
       WITH total_clientes, total_pedidos, total_conductores, total_camiones, count(m) as total_materiales
       OPTIONAL MATCH (e:Entrega)
       WITH total_clientes, total_pedidos, total_conductores, total_camiones, total_materiales, count(e) as total_entregas
       OPTIONAL MATCH ()-[r]->() WHERE type(r) IN ['REALIZA','INCLUYE','ASIGNADO_A','USA_CAMION','GENERA','DESTINO','EJECUTA','TRANSPORTA','EN_ZONA']
       RETURN total_clientes, total_pedidos, total_conductores, total_camiones, total_materiales, total_entregas, count(r) as total_relaciones`
    );

    if (result.records.length === 0) {
      return {
        total_clientes: 0,
        total_pedidos: 0,
        total_conductores: 0,
        total_camiones: 0,
        total_materiales: 0,
        total_entregas: 0,
        total_relaciones: 0
      };
    }

    const record = result.records[0]!;
    return {
      total_clientes: toNumber(record.get('total_clientes')),
      total_pedidos: toNumber(record.get('total_pedidos')),
      total_conductores: toNumber(record.get('total_conductores')),
      total_camiones: toNumber(record.get('total_camiones')),
      total_materiales: toNumber(record.get('total_materiales')),
      total_entregas: toNumber(record.get('total_entregas')),
      total_relaciones: toNumber(record.get('total_relaciones'))
    };
  } finally {
    await session.close();
  }
}

// Sincronizar todos los datos existentes de PostgreSQL a Neo4j
interface DetallesSincronizacion {
  clientes: number;
  materiales: number;
  conductores: number;
  camiones: number;
  zonas: number;
  pedidos: number;
  entregas: number;
}

export async function sincronizarTodo(): Promise<{ mensaje: string; detalles: DetallesSincronizacion }> {
  // Clientes
  const clientes = await pool.query('SELECT id FROM clientes');
  for (const row of clientes.rows) {
    await sincronizarCliente(row.id);
  }

  // Materiales
  const materiales = await pool.query('SELECT id FROM materiales');
  for (const row of materiales.rows) {
    await sincronizarMaterial(row.id);
  }

  // Conductores
  const conductores = await pool.query('SELECT id FROM conductores');
  for (const row of conductores.rows) {
    await sincronizarConductor(row.id);
  }

  // Camiones
  const camiones = await pool.query('SELECT id FROM camiones');
  for (const row of camiones.rows) {
    await sincronizarCamion(row.id);
  }

  // Zonas
  const zonas = await pool.query('SELECT id FROM zonas_entrega');
  for (const row of zonas.rows) {
    await sincronizarZona(row.id);
  }

  // Pedidos (con sus relaciones)
  const pedidos = await pool.query('SELECT id FROM pedidos ORDER BY id');
  for (const row of pedidos.rows) {
    await crearGrafoPedido(row.id);
  }

  // Pedidos confirmados (agregar conductor y camion)
  const pedidosConfirmados = await pool.query(
    `SELECT id FROM pedidos
     WHERE conductor_asignado_id IS NOT NULL
       AND camion_asignado_id IS NOT NULL`
  );
  for (const row of pedidosConfirmados.rows) {
    await confirmarGrafoPedido(row.id);
  }

  // Entregas
  const entregas = await pool.query('SELECT id FROM entregas ORDER BY id');
  for (const row of entregas.rows) {
    await crearGrafoEntrega(row.id);
  }

  // Entregas completadas
  const entregasCompletadas = await pool.query(
    'SELECT id FROM entregas WHERE entregado = true'
  );
  for (const row of entregasCompletadas.rows) {
    await completarGrafoEntrega(row.id);
  }

  return {
    mensaje: 'Sincronizacion completada',
    detalles: {
      clientes: clientes.rows.length,
      materiales: materiales.rows.length,
      conductores: conductores.rows.length,
      camiones: camiones.rows.length,
      zonas: zonas.rows.length,
      pedidos: pedidos.rows.length,
      entregas: entregas.rows.length
    }
  };
}

// Convertir valores de Neo4j a number
function toNumber(val: unknown): number {
  if (typeof val === 'number') return val;
  if (val && typeof val === 'object' && 'toNumber' in val) {
    return (val as { toNumber(): number }).toNumber();
  }
  return 0;
}

// Procesar resultados de Neo4j a formato de nodos y relaciones
function procesarResultadosGrafo(records: any[]): GrafoResult {
  const nodosMap = new Map<string, NodoGrafo>();
  const relacionesSet = new Set<string>();
  const relaciones: RelacionGrafo[] = [];

  for (const record of records) {
    const keys = record.keys as string[];

    for (const key of keys) {
      const value = record.get(key);
      if (!value) continue;

      // Es un nodo
      if (value.labels) {
        const nodoId = generarNodoId(value);
        if (!nodosMap.has(nodoId)) {
          nodosMap.set(nodoId, {
            id: nodoId,
            label: generarNodoLabel(value),
            tipo: value.labels[0],
            propiedades: limpiarPropiedades(value.properties)
          });
        }
      }

      // Es una relacion
      if (value.type && value.start && value.end) {
        const relKey = `${value.start.toString()}-${value.type}-${value.end.toString()}`;
        if (!relacionesSet.has(relKey)) {
          relacionesSet.add(relKey);

          // Buscar nodos de origen y destino
          const origenId = encontrarNodoIdPorIdentity(records, value.start);
          const destinoId = encontrarNodoIdPorIdentity(records, value.end);

          if (origenId && destinoId) {
            relaciones.push({
              origen: origenId,
              destino: destinoId,
              tipo: value.type,
              propiedades: limpiarPropiedades(value.properties)
            });
          }
        }
      }
    }
  }

  return {
    nodos: Array.from(nodosMap.values()),
    relaciones
  };
}

// Generar ID unico para un nodo basado en su label y pg_id
function generarNodoId(nodo: any): string {
  const label = nodo.labels[0].toLowerCase();
  const pgId = nodo.properties.pg_id;
  return `${label}_${pgId}`;
}

// Generar label legible para un nodo
function generarNodoLabel(nodo: any): string {
  const props = nodo.properties;
  const label = nodo.labels[0];

  switch (label) {
    case 'Cliente':
      return props.razon_social || `Cliente ${props.pg_id}`;
    case 'Pedido':
      return props.codigo_seguimiento || `Pedido ${props.pg_id}`;
    case 'Material':
      return props.nombre || `Material ${props.pg_id}`;
    case 'Conductor':
      return props.nombre_completo || `Conductor ${props.pg_id}`;
    case 'Camion':
      return props.placa || `Camion ${props.pg_id}`;
    case 'Entrega':
      return `Entrega #${props.pg_id}`;
    case 'Zona':
      return props.nombre || `Zona ${props.pg_id}`;
    default:
      return `${label} ${props.pg_id}`;
  }
}

// Limpiar propiedades de Neo4j (convertir Integer a number)
function limpiarPropiedades(props: Record<string, any>): Record<string, unknown> {
  const clean: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(props)) {
    if (val && typeof val === 'object' && 'toNumber' in val) {
      clean[key] = val.toNumber();
    } else {
      clean[key] = val;
    }
  }
  return clean;
}

// Encontrar el ID de nodo por identity de Neo4j
function encontrarNodoIdPorIdentity(records: any[], identity: any): string | null {
  for (const record of records) {
    const keys = record.keys as string[];
    for (const key of keys) {
      const value = record.get(key);
      if (value && value.labels && value.identity && value.identity.equals(identity)) {
        return generarNodoId(value);
      }
    }
  }
  return null;
}
