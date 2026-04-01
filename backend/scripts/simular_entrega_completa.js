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

// Calcular distancia en metros entre dos coordenadas usando Haversine
function distanciaMetros(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Genera puntos interpolados entre nodos cada ~PASO_METROS metros
// Agrega ruido GPS realista de +-1.5 metros
function interpolarRuta(nodos, pasoMetros) {
  const puntos = [];

  for (let i = 0; i < nodos.length - 1; i++) {
    const a = nodos[i];
    const b = nodos[i + 1];
    const dist = distanciaMetros(a.latitud, a.longitud, b.latitud, b.longitud);
    const numPasos = Math.max(1, Math.round(dist / pasoMetros));

    for (let j = 0; j < numPasos; j++) {
      const t = j / numPasos;
      const lat = a.latitud + (b.latitud - a.latitud) * t;
      const lon = a.longitud + (b.longitud - a.longitud) * t;

      // Ruido GPS realista: +-1.5 metros (~0.0000135 grados)
      const ruidoLat = (Math.random() - 0.5) * 0.000027;
      const ruidoLon = (Math.random() - 0.5) * 0.000027;

      puntos.push({
        latitud: lat + ruidoLat,
        longitud: lon + ruidoLon
      });
    }
  }

  // Agregar el ultimo nodo (destino)
  const ultimo = nodos[nodos.length - 1];
  puntos.push({ latitud: ultimo.latitud, longitud: ultimo.longitud });

  return puntos;
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
    // PASO 2: DESTINO DE ENTREGA
    // ========================================
    const destinoLat = -17.387163072805688;
    const destinoLon = -66.15335998079675;

    console.log('Paso 2: Destino de entrega definido');
    console.log(`  Coordenadas: (${destinoLat}, ${destinoLon})\n`);

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
        cliente_id: 13,
        fecha_entrega_solicitada: fechaEntregaStr,
        direccion_entrega: 'Simulacion de entrega - Agregados Zambrana',
        latitud_entrega: destinoLat,
        longitud_entrega: destinoLon,
        referencia_ubicacion: 'Destino de simulacion',
        observaciones: 'Simulacion de entrega completa',
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
    console.log('Paso 4: Asignando conductor 7 y buscando camion disponible...');

    // Conductor 7 hardcodeado
    const conductorId = 7;
    const conductorNombre = 'Diego Morales Ríos';

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

    console.log(`OK - Recursos asignados:`);
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
    // PASO 8: SIMULAR RECORRIDO GPS CON INTERPOLACION
    // ========================================
    const PASO_METROS = 7;
    const INTERVALO_SEGUNDOS = 1.3;
    const VELOCIDAD_BASE_KMH = 20; // ~20 km/h = velocidad de camion en zona urbana

    const puntosGPS = interpolarRuta(nodos, PASO_METROS);
    const duracionEstimada = (puntosGPS.length * INTERVALO_SEGUNDOS / 60).toFixed(1);

    console.log(`Paso 8: Simulando recorrido GPS con interpolacion...`);
    console.log(`  Nodos originales: ${nodos.length}`);
    console.log(`  Puntos interpolados: ${puntosGPS.length} (cada ~${PASO_METROS}m)`);
    console.log(`  Intervalo: ${INTERVALO_SEGUNDOS}s entre puntos`);
    console.log(`  Duracion estimada: ~${duracionEstimada} minutos\n`);

    let posicionesEnviadas = 0;

    for (let i = 0; i < puntosGPS.length; i++) {
      const punto = puntosGPS[i];
      const porcentaje = ((i + 1) / puntosGPS.length * 100).toFixed(1);

      // Velocidad con desaceleracion gradual al acercarse al destino
      const progreso = i / puntosGPS.length;
      let velocidad;
      if (progreso < 0.7) {
        velocidad = VELOCIDAD_BASE_KMH + (Math.random() - 0.3) * 4;
      } else {
        // Ultimas 30%: desacelerar de 20 a 2 km/h
        const factorDesacel = (progreso - 0.7) / 0.3;
        velocidad = VELOCIDAD_BASE_KMH * (1 - factorDesacel * 0.9) + Math.random() * 2;
      }

      const gpsRes = await fetch(`${API_URL}/entregas/${entregaId}/gps`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ACCESS_TOKEN}`
        },
        body: JSON.stringify({
          latitud: punto.latitud,
          longitud: punto.longitud,
          velocidad_kmh: Math.max(0, velocidad),
          precision_metros: 3 + Math.random() * 7
        })
      });

      if (gpsRes.ok) {
        const gpsData = await gpsRes.json();
        posicionesEnviadas++;

        if (i % 20 === 0 || i === puntosGPS.length - 1) {
          const etaMinutos = gpsData.data.eta_actualizado
            ? Math.round((new Date(gpsData.data.eta_actualizado) - new Date()) / 60000)
            : 'N/A';

          console.log(`  [${porcentaje}%] Posicion ${posicionesEnviadas}/${puntosGPS.length} - ETA: ${etaMinutos} min`);
        }
      } else {
        const error = await gpsRes.text();
        console.log(`  ERROR en posicion ${i + 1}: ${error}`);
      }

      if (i < puntosGPS.length - 1) {
        await esperar(INTERVALO_SEGUNDOS);
      }
    }

    console.log(`\nOK - ${posicionesEnviadas} posiciones GPS enviadas\n`);

    // ========================================
    // PASO 9: DETENERSE Y FINALIZAR ENTREGA
    // ========================================
    console.log('Paso 9: Deteniendose en destino y finalizando...');

    // Enviar posiciones detenido en destino
    const ultimoPunto = puntosGPS[puntosGPS.length - 1];
    for (let d = 0; d < 10; d++) {
      await fetch(`${API_URL}/entregas/${entregaId}/gps`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ACCESS_TOKEN}`
        },
        body: JSON.stringify({
          latitud: ultimoPunto.latitud + (Math.random() - 0.5) * 0.00005,
          longitud: ultimoPunto.longitud + (Math.random() - 0.5) * 0.00005,
          velocidad_kmh: 0,
          precision_metros: 3
        })
      });
      await esperar(1);
    }
    console.log('  Camion detenido en destino (10 posiciones a 0 km/h)');

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
    console.log(`  Distancia: ver metricas abajo`);

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
