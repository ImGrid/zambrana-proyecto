import neo4j from 'neo4j-driver';

const driver = neo4j.driver(
  'bolt://127.0.0.1:7687',
  neo4j.auth.basic('neo4j', 'neo12345'),
  { encrypted: 'ENCRYPTION_OFF' }
);

const NUM_CONEXIONES = 20;
const VELOCIDAD_PROMEDIO_KMH = 40;

// Calcular distancia en km entre dos coordenadas usando formula de Haversine
function calcularDistancia(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function conectarPlanta() {
  const session = driver.session();

  try {
    console.log('=== CONECTANDO PLANTA AL GRAFO ===\n');

    // PASO 1: Obtener coordenadas de la planta
    console.log('Paso 1: Obteniendo coordenadas de la planta...');
    const plantaResult = await session.run(`
      MATCH (planta:Ubicacion {tipo: 'planta'})
      RETURN planta.id as id, planta.latitud as lat, planta.longitud as lon
    `);

    if (plantaResult.records.length === 0) {
      throw new Error('No se encontro nodo de planta');
    }

    const plantaId = plantaResult.records[0].get('id');
    const plantaLat = plantaResult.records[0].get('lat');
    const plantaLon = plantaResult.records[0].get('lon');

    console.log(`OK - Planta encontrada:`);
    console.log(`  ID: ${plantaId}`);
    console.log(`  Coords: (${plantaLat}, ${plantaLon})\n`);

    // PASO 2: Obtener todas las intersecciones
    console.log('Paso 2: Obteniendo intersecciones...');
    const interseccionesResult = await session.run(`
      MATCH (i:Ubicacion {tipo: 'interseccion'})
      RETURN i.id as id, i.latitud as lat, i.longitud as lon
    `);

    const intersecciones = interseccionesResult.records.map(record => ({
      id: record.get('id'),
      lat: record.get('lat'),
      lon: record.get('lon')
    }));

    console.log(`OK - ${intersecciones.length} intersecciones obtenidas\n`);

    // PASO 3: Calcular distancias y ordenar por cercania
    console.log('Paso 3: Calculando distancias desde la planta...');
    const interseccionesConDistancia = intersecciones.map(inter => ({
      ...inter,
      distancia: calcularDistancia(plantaLat, plantaLon, inter.lat, inter.lon)
    }));

    interseccionesConDistancia.sort((a, b) => a.distancia - b.distancia);

    console.log(`OK - Distancias calculadas\n`);

    // PASO 4: Seleccionar las N mas cercanas
    const masCercanas = interseccionesConDistancia.slice(0, NUM_CONEXIONES);

    console.log(`Paso 4: Las ${NUM_CONEXIONES} intersecciones mas cercanas:`);
    masCercanas.forEach((inter, idx) => {
      console.log(`  ${idx + 1}. ${inter.id} - ${(inter.distancia * 1000).toFixed(0)} metros`);
    });
    console.log();

    // PASO 5: Crear relaciones bidireccionales
    console.log('Paso 5: Creando conexiones bidireccionales...');
    let relacionesCreadas = 0;

    for (const inter of masCercanas) {
      // Calcular tiempo en minutos
      const tiempoMinutos = (inter.distancia / VELOCIDAD_PROMEDIO_KMH) * 60;

      // Crear relacion: PLANTA -> INTERSECCION
      await session.run(`
        MATCH (planta:Ubicacion {id: $plantaId})
        MATCH (inter:Ubicacion {id: $interId})
        CREATE (planta)-[:CONECTA_CON {
          distancia_km: $distancia,
          nombre_calle: 'Acceso a planta',
          tiempo_minutos: $tiempo
        }]->(inter)
      `, {
        plantaId: plantaId,
        interId: inter.id,
        distancia: inter.distancia,
        tiempo: tiempoMinutos
      });

      // Crear relacion: INTERSECCION -> PLANTA
      await session.run(`
        MATCH (planta:Ubicacion {id: $plantaId})
        MATCH (inter:Ubicacion {id: $interId})
        CREATE (inter)-[:CONECTA_CON {
          distancia_km: $distancia,
          nombre_calle: 'Acceso a planta',
          tiempo_minutos: $tiempo
        }]->(planta)
      `, {
        plantaId: plantaId,
        interId: inter.id,
        distancia: inter.distancia,
        tiempo: tiempoMinutos
      });

      relacionesCreadas += 2;
    }

    console.log(`OK - ${relacionesCreadas} relaciones creadas (${NUM_CONEXIONES} bidireccionales)\n`);

    // PASO 6: Verificar conexiones
    console.log('Paso 6: Verificando conexiones de la planta...');
    const verificarResult = await session.run(`
      MATCH (planta:Ubicacion {tipo: 'planta'})-[r:CONECTA_CON]-(n)
      RETURN count(r) as total
    `);

    const totalConexiones = verificarResult.records[0].get('total').toNumber();
    console.log(`OK - La planta ahora tiene ${totalConexiones} conexiones\n`);

    // PASO 7: Probar calculo de ruta
    console.log('Paso 7: Probando calculo de ruta...');
    const pruebaRutaResult = await session.run(`
      MATCH (planta:Ubicacion {tipo: 'planta'})
      MATCH (destino:Ubicacion {tipo: 'interseccion'})
      WITH planta, destino LIMIT 100
      MATCH path = shortestPath((planta)-[:CONECTA_CON*]-(destino))
      WITH destino, path,
           reduce(dist = 0, r in relationships(path) | dist + r.distancia_km) as distancia,
           length(path) as segmentos
      ORDER BY distancia DESC
      LIMIT 1
      RETURN destino.id as destino_id, distancia, segmentos
    `);

    if (pruebaRutaResult.records.length === 0) {
      console.log('ERROR - Aun no se puede calcular ruta!\n');
    } else {
      const prueba = pruebaRutaResult.records[0];
      console.log(`OK - Ruta de prueba calculada exitosamente:`);
      console.log(`  Destino: ${prueba.get('destino_id')}`);
      console.log(`  Distancia: ${prueba.get('distancia').toFixed(3)} km`);
      console.log(`  Segmentos: ${prueba.get('segmentos').toNumber()}\n`);
    }

    // PASO 8: Estadisticas finales
    console.log('=== ESTADISTICAS FINALES ===\n');

    const estadisticasResult = await session.run(`
      MATCH (n:Ubicacion)
      WITH n.tipo as tipo, count(n) as cantidad
      RETURN tipo, cantidad
      ORDER BY cantidad DESC
    `);

    console.log('Nodos por tipo:');
    estadisticasResult.records.forEach(record => {
      const tipo = record.get('tipo');
      const cantidad = record.get('cantidad').toNumber();
      console.log(`  ${tipo}: ${cantidad}`);
    });

    const totalRelResult = await session.run('MATCH ()-[r:CONECTA_CON]->() RETURN count(r) as total');
    const totalRel = totalRelResult.records[0].get('total').toNumber();
    console.log(`\nTotal de relaciones: ${totalRel}`);

    console.log('\n=== PLANTA CONECTADA EXITOSAMENTE ===');

  } catch (error) {
    console.error('\nERROR:', error.message);
    console.error(error.stack);
  } finally {
    await session.close();
    await driver.close();
  }
}

conectarPlanta().catch(console.error);
