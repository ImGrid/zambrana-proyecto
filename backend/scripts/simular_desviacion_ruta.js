import neo4j from 'neo4j-driver';
import pg from 'pg';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno desde backend/.env
dotenv.config({ path: join(__dirname, '..', '.env') });

const { Pool } = pg;

// Configuracion PostgreSQL (usa .env o valores por defecto)
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'zambrana_db',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || '12345'
});

// Configuracion Neo4j (usa .env o valores por defecto)
const driver = neo4j.driver(
  process.env.NEO4J_URI || 'bolt://localhost:7687',
  neo4j.auth.basic(
    process.env.NEO4J_USER || 'neo4j',
    process.env.NEO4J_PASSWORD || 'neo12345'
  ),
  { encrypted: 'ENCRYPTION_OFF' }
);

const API_URL = 'http://localhost:3000/api';
let ACCESS_TOKEN = '';

// Esperar X segundos
function esperar(segundos) {
  return new Promise(resolve => setTimeout(resolve, segundos * 1000));
}

async function simularDesviacionRuta() {
  const session = driver.session();

  try {
    console.log('=== SIMULACION DE DESVIACION DE RUTA ===\n');
    console.log('Este script simula un camion que sigue la ruta correcta');
    console.log('y a mitad de camino se DESVIA hacia el sur.');
    console.log('Abre el Monitor GPS en el frontend para verlo en tiempo real.\n');

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
    ACCESS_TOKEN = loginData.accessToken;
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
        cliente_id: 13,
        fecha_entrega_solicitada: fechaEntregaStr,
        direccion_entrega: 'Simulacion de desviacion de ruta',
        latitud_entrega: destinoLat,
        longitud_entrega: destinoLon,
        referencia_ubicacion: 'Punto lejano - prueba desviacion',
        observaciones: 'Simulacion: camion se desvia a mitad de camino',
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
    console.log(`  Codigo: ${codigoSeguimiento}\n`);

    // ========================================
    // PASO 4: BUSCAR RECURSOS DISPONIBLES
    // ========================================
    console.log('Paso 4: Buscando recursos disponibles...');

    const conductorId = 7;
    const conductorNombre = 'Diego Morales Rios';

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

    console.log(`OK - Recursos:`);
    console.log(`  Camion: ${camionPlaca} (ID: ${camionId})`);
    console.log(`  Conductor: ${conductorNombre} (ID: ${conductorId})\n`);

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
    console.log(`OK - Pedido confirmado`);
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

    const rutaCalculada = rutaResult.rows[0].ruta_calculada;
    const nodos = rutaCalculada.nodos;

    console.log(`OK - Ruta obtenida:`);
    console.log(`  Nodos en la ruta: ${nodos.length}`);
    console.log(`  Distancia total: ${rutaCalculada.distancia_total_km.toFixed(3)} km\n`);

    // ========================================
    // PASO 8: PRIMEROS 3 NODOS EN RUTA (para que se vea que arranca bien)
    // ========================================
    const nodosEnRuta = 3;

    console.log('Paso 8: Enviando 3 posiciones EN RUTA (inicio normal)...\n');

    for (let i = 0; i < nodosEnRuta && i < nodos.length; i++) {
      const nodo = nodos[i];

      const gpsRes = await fetch(`${API_URL}/entregas/${entregaId}/gps`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ACCESS_TOKEN}`
        },
        body: JSON.stringify({
          latitud: nodo.latitud,
          longitud: nodo.longitud,
          velocidad_kmh: 35 + Math.random() * 30,
          precision_metros: 5 + Math.random() * 10
        })
      });

      if (gpsRes.ok) {
        const gpsData = await gpsRes.json();
        const warnings = gpsData.data.warnings || [];
        console.log(`  [EN RUTA] Nodo ${i + 1} - ${nodo.nombre} - ${warnings.length > 0 ? 'WARNING' : 'OK'}`);
      }

      await esperar(3);
    }

    console.log('\nCamion salio de la planta correctamente.\n');

    // ========================================
    // PASO 9: DESVIACION TOTAL - TODO EL RESTO ~800m-1km AL SUR
    // ========================================
    console.log('Paso 9: CAMION SE DESVIA - alejandose ~1km al sur de la ruta...');
    console.log('Esto deberia verse claramente en el mapa como marcador ROJO\n');

    const numDesviados = nodos.length - nodosEnRuta;
    const puntosDesviados = [];

    for (let i = 0; i < numDesviados; i++) {
      const nodoOriginal = nodos[nodosEnRuta + i];
      // 0.008-0.010 grados al sur = ~890m a 1110m de desviacion
      puntosDesviados.push({
        latitud: nodoOriginal.latitud - 0.008 - (Math.random() * 0.002),
        longitud: nodoOriginal.longitud,
        nombre: `~1km al sur de ${nodoOriginal.nombre}`
      });
    }

    console.log(`Enviando ${puntosDesviados.length} posiciones DESVIADAS cada 3 segundos...\n`);

    for (let i = 0; i < puntosDesviados.length; i++) {
      const punto = puntosDesviados[i];
      const posGlobal = nodosEnRuta + i + 1;
      const porcentaje = (posGlobal / nodos.length * 100).toFixed(1);

      const gpsRes = await fetch(`${API_URL}/entregas/${entregaId}/gps`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ACCESS_TOKEN}`
        },
        body: JSON.stringify({
          latitud: punto.latitud,
          longitud: punto.longitud,
          velocidad_kmh: 25 + Math.random() * 20,
          precision_metros: 5 + Math.random() * 10
        })
      });

      if (gpsRes.ok) {
        const gpsData = await gpsRes.json();
        const warnings = gpsData.data.warnings || [];
        const estado = warnings.length > 0 ? 'DESVIADO' : 'sin warning (?)';
        console.log(`  [${porcentaje}%] Pos ${posGlobal}/${nodos.length} - ${punto.nombre} - ${estado}`);
      }

      if (i < puntosDesviados.length - 1) {
        await esperar(3);
      }
    }

    console.log('\nRecorrido desviado completado\n');

    // ========================================
    // PASO 10: VERIFICAR ESTADO FINAL
    // ========================================
    console.log('Paso 10: Verificando estado de la entrega...');
    const estadoRes = await fetch(`${API_URL}/entregas/${entregaId}`, {
      headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
    });

    const estadoData = await estadoRes.json();
    const estado = estadoData.data;

    console.log(`  esta_desviado: ${estado.esta_desviado}`);
    console.log(`  esta_detenido: ${estado.esta_detenido}`);
    console.log(`  velocidad_promedio: ${estado.velocidad_promedio_kmh} km/h`);

    if (estado.esta_desviado) {
      console.log('\n  CORRECTO - El sistema detecto la desviacion');
    } else {
      console.log('\n  ERROR - El sistema NO detecto la desviacion');
    }

    // ========================================
    // PASO 11: FINALIZAR ENTREGA (libera conductor y camion)
    // ========================================
    console.log('\nPaso 11: Finalizando entrega...');

    const finalizarRes = await fetch(`${API_URL}/entregas/${entregaId}/finalizar`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ACCESS_TOKEN}`
      },
      body: JSON.stringify({
        observaciones: 'Simulacion de desviacion completada'
      })
    });

    if (finalizarRes.ok) {
      const finalizarData = await finalizarRes.json();
      console.log('OK - Entrega finalizada');
      if (finalizarData.data.metricas) {
        const m = finalizarData.data.metricas;
        console.log(`  Distancia planificada: ${m.distancia_planificada_km || 'N/A'} km`);
        console.log(`  Distancia recorrida: ${m.distancia_recorrida_km || 'N/A'} km`);
        console.log(`  Desviacion: ${m.desviacion_ruta_porcentaje || 'N/A'}%`);
      }
      console.log('');
    } else {
      console.log('Error finalizando entrega\n');
    }

    // ========================================
    // RESUMEN
    // ========================================
    console.log('=== RESUMEN DE LA SIMULACION ===\n');
    console.log(`Pedido: ${codigoSeguimiento}`);
    console.log(`Entrega ID: ${entregaId}`);
    console.log(`Nodos totales: ${nodos.length}`);
    console.log(`Posiciones en ruta: ${nodosEnRuta} (sin warnings)`);
    console.log(`Posiciones desviadas: ${numDesviados} (~1km al sur)`);
    console.log(`esta_desviado final: ${estado.esta_desviado}`);
    console.log('\n=== SIMULACION COMPLETADA ===');

  } catch (error) {
    console.error('\nERROR en simulacion:', error.message);
    console.error(error.stack);
  } finally {
    await session.close();
    await driver.close();
    await pool.end();
  }
}

simularDesviacionRuta().catch(console.error);
