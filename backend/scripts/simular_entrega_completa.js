import neo4j from 'neo4j-driver';
import pg from 'pg';
import fetch from 'node-fetch';

const { Pool } = pg;

// Configuracion PostgreSQL
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'zambrana_db',
  user: 'postgres',
  password: '12345'
});

// Configuracion Neo4j
const driver = neo4j.driver(
  'bolt://localhost:7687',
  neo4j.auth.basic('neo4j', 'neo12345')
);

const API_URL = 'http://localhost:3000/api';
let ACCESS_TOKEN = '';

// Esperar X segundos
function esperar(segundos) {
  return new Promise(resolve => setTimeout(resolve, segundos * 1000));
}

async function simularEntregaCompleta() {
  const session = driver.session();

  try {
    console.log('=== SIMULACION DE ENTREGA COMPLETA ===\n');

    // ========================================
    // PASO 1: LOGIN
    // ========================================
    console.log('Paso 1: Autenticando...');
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@zambrana.com',
        password: 'Admin123!'
      })
    });

    if (!loginRes.ok) {
      const error = await loginRes.text();
      throw new Error(`Error en login: ${error}`);
    }

    const loginData = await loginRes.json();
    ACCESS_TOKEN = loginData.accessToken; // NOMBRE CORRECTO
    console.log('OK - Token obtenido\n');

    // ========================================
    // PASO 2: BUSCAR NODO MAS LEJANO
    // ========================================
    console.log('Paso 2: Buscando destino lejano en Neo4j...');
    const resultado = await session.run(`
      MATCH (planta:Ubicacion {tipo: 'planta'})
      MATCH (destino:Ubicacion)
      WHERE destino.tipo = 'interseccion'
      WITH planta, destino LIMIT 300
      MATCH path = shortestPath((planta)-[:CONECTA_CON*]-(destino))
      WITH destino, path,
           reduce(dist = 0, r in relationships(path) | dist + r.distancia_km) as distancia
      ORDER BY distancia DESC
      LIMIT 1
      RETURN
        destino.id as id,
        destino.latitud as lat,
        destino.longitud as lon,
        distancia
    `);

    if (resultado.records.length === 0) {
      throw new Error('No se encontro destino lejano');
    }

    const destino = resultado.records[0];
    const destinoLat = destino.get('lat');
    const destinoLon = destino.get('lon');
    const distanciaEstimada = destino.get('distancia');

    console.log(`OK - Destino encontrado:`);
    console.log(`  Coordenadas: (${destinoLat}, ${destinoLon})`);
    console.log(`  Distancia estimada: ${distanciaEstimada.toFixed(3)} km\n`);

    // ========================================
    // PASO 3: CREAR PEDIDO
    // ========================================
    console.log('Paso 3: Creando pedido...');

    // Calcular fecha de entrega (mañana)
    const fechaEntrega = new Date();
    fechaEntrega.setDate(fechaEntrega.getDate() + 1);
    const fechaEntregaStr = fechaEntrega.toISOString();

    const crearPedidoRes = await fetch(`${API_URL}/pedidos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ACCESS_TOKEN}`
      },
      body: JSON.stringify({
        cliente_id: 1,
        fecha_entrega_solicitada: fechaEntregaStr,
        direccion_entrega: 'Destino de simulacion (nodo mas lejano)',
        latitud_entrega: destinoLat,
        longitud_entrega: destinoLon,
        referencia_ubicacion: 'Punto mas lejano desde la planta',
        observaciones: 'Simulacion de entrega al punto mas lejano',
        items: [
          {
            material_id: 2,
            cantidad_m3: 5.0,
            precio_unitario: 100
          }
        ]
      })
    });

    if (!crearPedidoRes.ok) {
      const error = await crearPedidoRes.text();
      throw new Error(`Error creando pedido: ${error}`);
    }

    const pedidoCreado = await crearPedidoRes.json();
    const pedidoId = pedidoCreado.pedido.id;
    const codigoSeguimiento = pedidoCreado.pedido.codigo_seguimiento;

    console.log(`OK - Pedido creado:`);
    console.log(`  ID: ${pedidoId}`);
    console.log(`  Codigo: ${codigoSeguimiento}`);
    console.log(`  Estado: ${pedidoCreado.pedido.estado_nombre}\n`);

    // ========================================
    // PASO 4: BUSCAR RECURSOS DISPONIBLES
    // ========================================
    console.log('Paso 4: Buscando camion y conductor disponibles...');

    // Buscar camion disponible
    const camionDisponibleResult = await pool.query(`
      SELECT c.id, c.placa
      FROM camiones c
      WHERE c.activo = true
        AND c.id NOT IN (
          SELECT camion_asignado_id
          FROM pedidos
          WHERE estado_actual_id IN (2, 3)
            AND camion_asignado_id IS NOT NULL
        )
      LIMIT 1
    `);

    if (camionDisponibleResult.rows.length === 0) {
      throw new Error('No hay camiones disponibles');
    }

    const camionId = camionDisponibleResult.rows[0].id;
    const camionPlaca = camionDisponibleResult.rows[0].placa;

    // Buscar conductor disponible
    const conductorDisponibleResult = await pool.query(`
      SELECT c.id, c.nombre_completo
      FROM conductores c
      WHERE c.activo = true
        AND c.id NOT IN (
          SELECT conductor_asignado_id
          FROM pedidos
          WHERE estado_actual_id IN (2, 3)
            AND conductor_asignado_id IS NOT NULL
        )
      LIMIT 1
    `);

    if (conductorDisponibleResult.rows.length === 0) {
      throw new Error('No hay conductores disponibles');
    }

    const conductorId = conductorDisponibleResult.rows[0].id;
    const conductorNombre = conductorDisponibleResult.rows[0].nombre_completo;

    console.log(`OK - Recursos encontrados:`);
    console.log(`  Camion: ${camionPlaca} (ID: ${camionId})`);
    console.log(`  Conductor: ${conductorNombre} (ID: ${conductorId})\\n`);

    // ========================================
    // PASO 5: CONFIRMAR PEDIDO
    // ========================================
    console.log('Paso 5: Confirmando pedido y calculando ruta...');
    const confirmarRes = await fetch(`${API_URL}/pedidos/${pedidoId}/confirmar`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ACCESS_TOKEN}`
      },
      body: JSON.stringify({
        camion_id: camionId,
        conductor_id: conductorId
      })
    });

    if (!confirmarRes.ok) {
      const error = await confirmarRes.text();
      throw new Error(`Error confirmando pedido: ${error}`);
    }

    const pedidoConfirmado = await confirmarRes.json();
    console.log(`OK - Pedido confirmado:`);
    console.log(`  Estado: ${pedidoConfirmado.pedido.estado_nombre}`);
    console.log(`  Camion: ${pedidoConfirmado.pedido.camion_placa || 'N/A'}`);
    console.log(`  Conductor: ${pedidoConfirmado.pedido.conductor_nombre || 'N/A'}`);
    console.log(`  Distancia: ${pedidoConfirmado.pedido.distancia_km || 'N/A'} km`);
    console.log(`  ETA: ${pedidoConfirmado.pedido.eta_minutos || 'N/A'} min\n`);

    // ========================================
    // PASO 6: INICIAR ENTREGA
    // ========================================
    console.log('Paso 6: Iniciando entrega...');
    const iniciarRes = await fetch(`${API_URL}/entregas/iniciar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ACCESS_TOKEN}`
      },
      body: JSON.stringify({
        pedido_id: pedidoId
      })
    });

    if (!iniciarRes.ok) {
      const error = await iniciarRes.text();
      throw new Error(`Error iniciando entrega: ${error}`);
    }

    const iniciarData = await iniciarRes.json();
    const entregaId = iniciarData.data.id;

    console.log(`OK - Entrega iniciada:`);
    console.log(`  Entrega ID: ${entregaId}`);
    console.log(`  Pedido: ${iniciarData.data.pedido.codigo_seguimiento}`);
    console.log(`  Camion: ${iniciarData.data.camion.placa}`);
    console.log(`  Conductor: ${iniciarData.data.conductor.nombre_completo}\n`);

    // ========================================
    // PASO 7: OBTENER RUTA CALCULADA
    // ========================================
    console.log('Paso 7: Obteniendo ruta calculada...');
    const rutaResult = await pool.query(
      'SELECT ruta_calculada FROM pedidos WHERE id = $1',
      [pedidoId]
    );

    if (!rutaResult.rows[0] || !rutaResult.rows[0].ruta_calculada) {
      throw new Error('No se encontro ruta calculada en el pedido');
    }

    const rutaCalculada = rutaResult.rows[0].ruta_calculada;
    const nodos = rutaCalculada.nodos;

    console.log(`OK - Ruta obtenida:`);
    console.log(`  Nodos en la ruta: ${nodos.length}`);
    console.log(`  Distancia total: ${rutaCalculada.distancia_total_km.toFixed(3)} km`);
    console.log(`  Tiempo estimado: ${rutaCalculada.tiempo_total_minutos.toFixed(1)} min\n`);

    // ========================================
    // PASO 8: SIMULAR RECORRIDO GPS
    // ========================================
    console.log('Paso 8: Simulando recorrido GPS...');
    console.log(`Enviando ${nodos.length} posiciones cada 3 segundos...\n`);

    let posicionesEnviadas = 0;

    for (let i = 0; i < nodos.length; i++) {
      const nodo = nodos[i];
      const porcentaje = ((i + 1) / nodos.length * 100).toFixed(1);

      // Enviar posicion GPS
      const gpsRes = await fetch(`${API_URL}/entregas/${entregaId}/gps`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ACCESS_TOKEN}`
        },
        body: JSON.stringify({
          latitud: nodo.latitud,
          longitud: nodo.longitud,
          velocidad_kmh: 35 + Math.random() * 30, // 35-65 km/h
          precision_metros: 5 + Math.random() * 10 // 5-15 metros
        })
      });

      if (gpsRes.ok) {
        const gpsData = await gpsRes.json();
        posicionesEnviadas++;

        // Mostrar progreso cada 10 nodos o en el ultimo
        if (i % 10 === 0 || i === nodos.length - 1) {
          const etaMinutos = gpsData.data.eta_actualizado
            ? Math.round((new Date(gpsData.data.eta_actualizado) - new Date()) / 60000)
            : 'N/A';

          console.log(`  [${porcentaje}%] Posicion ${i + 1}/${nodos.length} - ETA: ${etaMinutos} min`);
        }
      } else {
        const error = await gpsRes.text();
        console.log(`  ERROR en posicion ${i + 1}: ${error}`);
      }

      // Esperar 3 segundos antes de enviar siguiente posicion
      if (i < nodos.length - 1) {
        await esperar(3);
      }
    }

    console.log(`\nOK - ${posicionesEnviadas} posiciones GPS enviadas\n`);

    // ========================================
    // PASO 9: FINALIZAR ENTREGA
    // ========================================
    console.log('Paso 9: Finalizando entrega...');
    const finalizarRes = await fetch(`${API_URL}/entregas/${entregaId}/finalizar`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ACCESS_TOKEN}`
      },
      body: JSON.stringify({
        observaciones: 'Entrega simulada completada exitosamente'
      })
    });

    if (!finalizarRes.ok) {
      const error = await finalizarRes.text();
      throw new Error(`Error finalizando entrega: ${error}`);
    }

    const finalizarData = await finalizarRes.json();
    console.log('OK - Entrega finalizada\n');

    // ========================================
    // PASO 10: RESUMEN FINAL
    // ========================================
    console.log('=== RESUMEN DE LA SIMULACION ===\n');

    const resumenResult = await pool.query(`
      SELECT
        e.id as entrega_id,
        e.entregado,
        e.hora_salida_planta,
        e.hora_llegada_cliente,
        e.duracion_minutos,
        p.codigo_seguimiento,
        p.direccion_entrega,
        ep.nombre as estado_pedido,
        c.razon_social,
        cam.placa,
        con.nombre_completo as conductor,
        (SELECT COUNT(*) FROM posiciones_gps WHERE entrega_id = e.id) as total_posiciones
      FROM entregas e
      JOIN pedidos p ON e.pedido_id = p.id
      JOIN estados_pedido ep ON p.estado_actual_id = ep.id
      JOIN clientes c ON p.cliente_id = c.id
      JOIN camiones cam ON e.camion_id = cam.id
      JOIN conductores con ON e.conductor_id = con.id
      WHERE e.id = $1
    `, [entregaId]);

    const resumen = resumenResult.rows[0];

    console.log('PEDIDO:');
    console.log(`  Codigo: ${resumen.codigo_seguimiento}`);
    console.log(`  Estado: ${resumen.estado_pedido}`);
    console.log(`  Cliente: ${resumen.razon_social}`);
    console.log(`  Destino: ${resumen.direccion_entrega}`);

    console.log('\nENTREGA:');
    console.log(`  ID: ${resumen.entrega_id}`);
    console.log(`  Entregado: ${resumen.entregado ? 'SI' : 'NO'}`);
    console.log(`  Camion: ${resumen.placa}`);
    console.log(`  Conductor: ${resumen.conductor}`);

    console.log('\nTIEMPOS:');
    console.log(`  Salida planta: ${resumen.hora_salida_planta}`);
    console.log(`  Llegada cliente: ${resumen.hora_llegada_cliente}`);
    console.log(`  Duracion: ${resumen.duracion_minutos} minutos`);

    console.log('\nTRACKING:');
    console.log(`  Posiciones GPS registradas: ${resumen.total_posiciones}`);
    console.log(`  Distancia recorrida: ${distanciaEstimada.toFixed(3)} km (estimada)`);

    if (finalizarData.data.metricas) {
      const m = finalizarData.data.metricas;
      console.log('\nMETRICAS:');
      console.log(`  Distancia planificada: ${m.distancia_planificada_km || 'N/A'} km`);
      console.log(`  Distancia recorrida: ${m.distancia_recorrida_km || 'N/A'} km`);
      console.log(`  Desviacion: ${m.desviacion_ruta_porcentaje || 'N/A'}%`);
      console.log(`  Tiempo estimado: ${m.tiempo_estimado_minutos || 'N/A'} min`);
      console.log(`  Tiempo real: ${m.tiempo_real_minutos || 'N/A'} min`);
    }

    console.log('\n=== SIMULACION COMPLETADA EXITOSAMENTE ===');

  } catch (error) {
    console.error('\nERROR en simulacion:', error.message);
    console.error(error.stack);
  } finally {
    await session.close();
    await driver.close();
    await pool.end();
  }
}

simularEntregaCompleta().catch(console.error);
