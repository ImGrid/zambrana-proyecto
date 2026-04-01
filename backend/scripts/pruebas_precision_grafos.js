import neo4j from 'neo4j-driver';

const driver = neo4j.driver(
  'bolt://127.0.0.1:7687',
  neo4j.auth.basic('neo4j', 'neo12345'),
  { encrypted: 'ENCRYPTION_OFF' }
);

// Planta Agregados Zambrana
const PLANTA = { lat: -17.38375972482226, lon: -66.15733157342568 };

// 5 destinos de prueba distribuidos en diferentes zonas y distancias
const DESTINOS = [
  { nombre: 'Destino 1 - Quillacollo centro', lat: -17.3925, lon: -66.2690 },
  { nombre: 'Destino 2 - Colcapirhua', lat: -17.3940, lon: -66.2450 },
  { nombre: 'Destino 3 - Av. Blanco Galindo', lat: -17.3960, lon: -66.2300 },
  { nombre: 'Destino 4 - Sur Quillacollo', lat: -17.4123, lon: -66.2416 },
  { nombre: 'Destino 5 - Limite cobertura', lat: -17.3848, lon: -66.2368 },
];

// Formula de Haversine (replica de rutas.service.ts)
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function main() {
  const session = driver.session();

  try {
    console.log('=== PRUEBAS DE PRECISION DE ALGORITMOS DE GRAFOS ===\n');

    // Verificar conexion
    await session.run('RETURN 1');
    console.log('Conectado a Neo4j\n');

    // ============================================================
    // PRUEBA 1: Cobertura del grafo
    // ============================================================
    console.log('--- 1. COBERTURA DEL GRAFO ---');
    const statsResult = await session.run(`
      MATCH (n:Ubicacion)
      RETURN n.tipo as tipo, count(n) as cantidad,
             min(n.latitud) as lat_min, max(n.latitud) as lat_max,
             min(n.longitud) as lon_min, max(n.longitud) as lon_max
      ORDER BY tipo
    `);

    statsResult.records.forEach(r => {
      console.log(`Tipo: ${r.get('tipo')}, Cantidad: ${r.get('cantidad')}`);
      console.log(`  Lat: [${r.get('lat_min')}, ${r.get('lat_max')}]`);
      console.log(`  Lon: [${r.get('lon_min')}, ${r.get('lon_max')}]`);
    });

    const relResult = await session.run('MATCH ()-[r:CONECTA_CON]->() RETURN count(r) as total');
    console.log(`Total relaciones CONECTA_CON: ${relResult.records[0].get('total')}`);

    // ============================================================
    // PRUEBA 2: Haversine vs point.distance de Neo4j
    // ============================================================
    console.log('\n--- 2. HAVERSINE vs NEO4J point.distance ---');
    console.log('Distancia aprox | Haversine (km) | Neo4j (km) | Diferencia (m) | Error %');

    for (const dest of DESTINOS) {
      const haversineDist = haversine(PLANTA.lat, PLANTA.lon, dest.lat, dest.lon);

      const neo4jResult = await session.run(`
        RETURN point.distance(
          point({latitude: $lat1, longitude: $lon1}),
          point({latitude: $lat2, longitude: $lon2})
        ) / 1000.0 as distancia_km
      `, { lat1: PLANTA.lat, lon1: PLANTA.lon, lat2: dest.lat, lon2: dest.lon });

      const neo4jDist = neo4jResult.records[0].get('distancia_km');
      const diffMetros = Math.abs(haversineDist - neo4jDist) * 1000;
      const errorPct = (Math.abs(haversineDist - neo4jDist) / neo4jDist * 100);

      console.log(
        `${dest.nombre.padEnd(35)} | ${haversineDist.toFixed(4)} | ${neo4jDist.toFixed(4)} | ${diffMetros.toFixed(1)} m | ${errorPct.toFixed(3)}%`
      );
    }

    // ============================================================
    // PRUEBA 3: Rutas optimas a 5 destinos
    // ============================================================
    console.log('\n--- 3. CALCULO DE RUTAS OPTIMAS (shortestPath) ---');
    console.log('Destino | Dist. directa | Dist. ruta | Proporcion | Nodos | Tiempo est.');

    for (const dest of DESTINOS) {
      // Encontrar interseccion mas cercana al destino
      const cercanaResult = await session.run(`
        MATCH (n:Ubicacion {tipo: 'interseccion'})
        WITH n, point.distance(
          point({latitude: $lat, longitude: $lng}),
          point({latitude: n.latitud, longitude: n.longitud})
        ) as dist
        RETURN n.id as id, n.nombre as nombre, n.latitud as lat, n.longitud as lon, dist as distancia_metros
        ORDER BY dist ASC
        LIMIT 1
      `, { lat: dest.lat, lng: dest.lon });

      if (cercanaResult.records.length === 0) {
        console.log(`${dest.nombre}: No se encontro interseccion cercana`);
        continue;
      }

      const cercana = cercanaResult.records[0];
      const interseccionId = cercana.get('id');
      const distInterseccion = cercana.get('distancia_metros');

      // Calcular ruta desde planta
      const rutaResult = await session.run(`
        MATCH (origen:Ubicacion {id: 'PLANTA_AGREGADOS_ZAMBRANA'}),
              (destino:Ubicacion {id: $destinoId}),
              path = shortestPath((origen)-[:CONECTA_CON*]-(destino))
        WITH path, nodes(path) as nodos, relationships(path) as relaciones
        RETURN
          size(nodos) as num_nodos,
          reduce(dist = 0.0, r in relaciones | dist + r.distancia_km) as distancia_total,
          reduce(t = 0.0, r in relaciones | t + r.tiempo_minutos) as tiempo_total
      `, { destinoId: interseccionId });

      if (rutaResult.records.length === 0) {
        console.log(`${dest.nombre}: No se encontro ruta`);
        continue;
      }

      const ruta = rutaResult.records[0];
      const distDirecta = haversine(PLANTA.lat, PLANTA.lon, dest.lat, dest.lon);
      const distRuta = ruta.get('distancia_total');
      const numNodos = ruta.get('num_nodos');
      const tiempoMin = ruta.get('tiempo_total');
      const proporcion = distRuta / distDirecta;

      console.log(
        `${dest.nombre.padEnd(35)} | ${distDirecta.toFixed(2)} km | ${distRuta.toFixed(2)} km | ${proporcion.toFixed(2)}x | ${numNodos} | ${tiempoMin.toFixed(1)} min`
      );
    }

    // ============================================================
    // PRUEBA 4: Deteccion de desviacion (distancia punto a ruta)
    // ============================================================
    console.log('\n--- 4. DETECCION DE DESVIACION ---');

    // Obtener ruta del pedido 74 (la que esta activa)
    const rutaPedido = await session.run(`
      MATCH (origen:Ubicacion {id: 'PLANTA_AGREGADOS_ZAMBRANA'}),
            (destino:Ubicacion {id: 'INTER_780226793'}),
            path = shortestPath((origen)-[:CONECTA_CON*]-(destino))
      WITH nodes(path) as nodos
      UNWIND nodos as n
      RETURN n.latitud as lat, n.longitud as lon, n.id as id
    `);

    const nodosRuta = rutaPedido.records.map(r => ({
      lat: r.get('lat'),
      lon: r.get('lon'),
      id: r.get('id')
    }));

    console.log(`Ruta tiene ${nodosRuta.length} nodos`);
    console.log('Primer nodo (planta):', nodosRuta[0].lat, nodosRuta[0].lon);
    console.log('Ultimo nodo:', nodosRuta[nodosRuta.length - 1].lat, nodosRuta[nodosRuta.length - 1].lon);

    // Puntos de prueba: algunos sobre la ruta, otros fuera
    const METROS_LAT = 111139;
    const METROS_LON = 111139 * Math.cos(-17.39 * Math.PI / 180);

    function distanciaPuntoASegmento(pLat, pLon, aLat, aLon, bLat, bLon) {
      const px = (pLon - aLon) * METROS_LON;
      const py = (pLat - aLat) * METROS_LAT;
      const bx = (bLon - aLon) * METROS_LON;
      const by = (bLat - aLat) * METROS_LAT;
      const segLenSq = bx * bx + by * by;
      if (segLenSq === 0) return Math.sqrt(px * px + py * py) / 1000;
      const t = Math.max(0, Math.min(1, (px * bx + py * by) / segLenSq));
      const dx = px - t * bx;
      const dy = py - t * by;
      return Math.sqrt(dx * dx + dy * dy) / 1000;
    }

    function distanciaMinARuta(lat, lon, nodos) {
      let min = Infinity;
      for (let i = 0; i < nodos.length - 1; i++) {
        const d = distanciaPuntoASegmento(lat, lon, nodos[i].lat, nodos[i].lon, nodos[i + 1].lat, nodos[i + 1].lon);
        if (d < min) min = d;
      }
      return min;
    }

    const UMBRAL_KM = 0.2; // 200 metros

    const puntosTest = [
      { nombre: 'Sobre la ruta (nodo 3)', lat: nodosRuta[2].lat, lon: nodosRuta[2].lon },
      { nombre: 'Cerca de ruta (50m)', lat: nodosRuta[5].lat + 0.0005, lon: nodosRuta[5].lon },
      { nombre: 'Cerca de ruta (150m)', lat: nodosRuta[5].lat + 0.0013, lon: nodosRuta[5].lon },
      { nombre: 'Fuera de ruta (300m)', lat: nodosRuta[5].lat + 0.0027, lon: nodosRuta[5].lon },
      { nombre: 'Fuera de ruta (500m)', lat: nodosRuta[5].lat + 0.0045, lon: nodosRuta[5].lon },
      { nombre: 'Muy lejos (2 km)', lat: nodosRuta[5].lat + 0.018, lon: nodosRuta[5].lon },
      { nombre: 'Otro barrio (5 km)', lat: -17.41, lon: -66.15 },
    ];

    console.log('\nPunto de prueba                    | Dist. a ruta (m) | Umbral 200m | Resultado');
    for (const p of puntosTest) {
      const distKm = distanciaMinARuta(p.lat, p.lon, nodosRuta);
      const distM = distKm * 1000;
      const desviado = distKm > UMBRAL_KM;
      console.log(
        `${p.nombre.padEnd(35)} | ${distM.toFixed(1).padStart(10)} m | ${UMBRAL_KM * 1000} m     | ${desviado ? 'DESVIADO' : 'EN RUTA'}`
      );
    }

    // ============================================================
    // PRUEBA 5: ETA dinamico (simulacion de recorrido)
    // ============================================================
    console.log('\n--- 5. SIMULACION DE ETA DINAMICO ---');

    const destFinal = { lat: nodosRuta[nodosRuta.length - 1].lat, lon: nodosRuta[nodosRuta.length - 1].lon };
    const velocidadPromKmh = 40;

    // Simular posiciones a lo largo de la ruta (cada 3 nodos)
    console.log('Posicion en ruta     | Dist. restante (km) | ETA (min) | Velocidad');
    for (let i = 0; i < nodosRuta.length; i += Math.max(1, Math.floor(nodosRuta.length / 8))) {
      const nodo = nodosRuta[i];
      const distRestante = haversine(nodo.lat, nodo.lon, destFinal.lat, destFinal.lon);
      const etaMin = (distRestante / velocidadPromKmh) * 60;

      console.log(
        `Nodo ${i.toString().padStart(3)}/${nodosRuta.length} (${nodo.id.substring(0, 20).padEnd(20)}) | ${distRestante.toFixed(3).padStart(10)} km | ${etaMin.toFixed(1).padStart(6)} min | ${velocidadPromKmh} km/h`
      );
    }
    // Ultimo nodo
    const ultimoNodo = nodosRuta[nodosRuta.length - 1];
    const distFinalUltimo = haversine(ultimoNodo.lat, ultimoNodo.lon, destFinal.lat, destFinal.lon);
    console.log(
      `Nodo ${(nodosRuta.length - 1).toString().padStart(3)}/${nodosRuta.length} (${ultimoNodo.id.substring(0, 20).padEnd(20)}) | ${distFinalUltimo.toFixed(3).padStart(10)} km | ${((distFinalUltimo / velocidadPromKmh) * 60).toFixed(1).padStart(6)} min | ${velocidadPromKmh} km/h (LLEGADA)`
    );

    // ============================================================
    // PRUEBA 6: Conectividad del grafo
    // ============================================================
    console.log('\n--- 6. CONECTIVIDAD DEL GRAFO ---');

    // Muestreo de conectividad: probar 20 intersecciones aleatorias
    const muestreoResult = await session.run(`
      MATCH (n:Ubicacion {tipo: 'interseccion'})
      WITH n, rand() as r
      ORDER BY r
      LIMIT 20
      RETURN n.id as id
    `);

    let alcanzables = 0;
    const totalMuestra = muestreoResult.records.length;
    for (const rec of muestreoResult.records) {
      const id = rec.get('id');
      const check = await session.run(
        'MATCH (origen:Ubicacion {id: "PLANTA_AGREGADOS_ZAMBRANA"}), (destino:Ubicacion {id: $destId}), path = shortestPath((origen)-[:CONECTA_CON*]-(destino)) RETURN length(path) as len',
        { destId: id }
      );
      if (check.records.length > 0) alcanzables++;
    }

    const totalIntersecciones = await session.run(`
      MATCH (n:Ubicacion {tipo: 'interseccion'}) RETURN count(n) as total
    `);
    const totalInter = totalIntersecciones.records[0].get('total');

    console.log(`Muestra de intersecciones: ${alcanzables} alcanzables de ${totalMuestra} probadas`);
    console.log(`Total de intersecciones en el grafo: ${totalInter}`);
    console.log(`Conectividad estimada: ${(alcanzables / totalMuestra * 100).toFixed(1)}%`);

    // Grado promedio
    const gradoResult = await session.run(`
      MATCH (n:Ubicacion)-[r:CONECTA_CON]-()
      WITH n, count(r) as grado
      RETURN avg(grado) as grado_promedio, min(grado) as grado_min, max(grado) as grado_max
    `);
    const grado = gradoResult.records[0];
    console.log(`Grado promedio: ${grado.get('grado_promedio').toFixed(2)}`);
    console.log(`Grado min/max: ${grado.get('grado_min')} / ${grado.get('grado_max')}`);

    console.log('\n=== FIN DE PRUEBAS ===');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await session.close();
    await driver.close();
  }
}

main();
