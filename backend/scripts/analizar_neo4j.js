import neo4j from 'neo4j-driver';

const driver = neo4j.driver(
  'bolt://127.0.0.1:7687',
  neo4j.auth.basic('neo4j', 'neo12345'),
  { encrypted: 'ENCRYPTION_OFF' }
);

async function analizarNeo4j() {
  const session = driver.session();

  try {
    console.log('=== ANALISIS DE BASE DE DATOS NEO4J ===\n');

    // Verificar conexion
    console.log('Verificando conexion...');
    await session.run('RETURN 1');
    console.log('OK - Conectado a Neo4j\n');

    // 1. Total de nodos
    console.log('--- NODOS ---');
    const totalNodosResult = await session.run('MATCH (n) RETURN count(n) as total');
    const totalNodos = totalNodosResult.records[0].get('total').toNumber();
    console.log(`Total de nodos: ${totalNodos}`);

    // 2. Nodos por tipo
    const nodosPorTipoResult = await session.run(`
      MATCH (n:Ubicacion)
      RETURN n.tipo as tipo, count(n) as cantidad
      ORDER BY cantidad DESC
    `);

    console.log('\nNodos por tipo:');
    nodosPorTipoResult.records.forEach(record => {
      const tipo = record.get('tipo');
      const cantidad = record.get('cantidad').toNumber();
      console.log(`  ${tipo}: ${cantidad}`);
    });

    // 3. Ejemplo de nodos (primeros 5)
    const ejemploNodosResult = await session.run(`
      MATCH (n:Ubicacion)
      RETURN n.id as id, n.nombre as nombre, n.tipo as tipo,
             n.latitud as lat, n.longitud as lon
      LIMIT 5
    `);

    console.log('\nEjemplo de nodos (primeros 5):');
    ejemploNodosResult.records.forEach((record, idx) => {
      const id = record.get('id');
      const nombre = record.get('nombre');
      const tipo = record.get('tipo');
      const lat = record.get('lat');
      const lon = record.get('lon');
      console.log(`  ${idx + 1}. [${tipo}] ${id}`);
      console.log(`     Nombre: ${nombre}`);
      console.log(`     Coords: (${lat}, ${lon})`);
    });

    // 4. Total de relaciones
    console.log('\n--- RELACIONES ---');
    const totalRelacionesResult = await session.run('MATCH ()-[r]->() RETURN count(r) as total');
    const totalRelaciones = totalRelacionesResult.records[0].get('total').toNumber();
    console.log(`Total de relaciones: ${totalRelaciones}`);

    // 5. Relaciones por tipo
    const relacionesPorTipoResult = await session.run(`
      MATCH ()-[r]->()
      RETURN type(r) as tipo, count(r) as cantidad
      ORDER BY cantidad DESC
    `);

    console.log('\nRelaciones por tipo:');
    relacionesPorTipoResult.records.forEach(record => {
      const tipo = record.get('tipo');
      const cantidad = record.get('cantidad').toNumber();
      console.log(`  ${tipo}: ${cantidad}`);
    });

    // 6. Ejemplo de relaciones (primeras 5)
    const ejemploRelacionesResult = await session.run(`
      MATCH (a:Ubicacion)-[r:CONECTA_CON]->(b:Ubicacion)
      RETURN a.id as origen, b.id as destino, r.distancia_km as distancia
      LIMIT 5
    `);

    console.log('\nEjemplo de relaciones (primeras 5):');
    ejemploRelacionesResult.records.forEach((record, idx) => {
      const origen = record.get('origen');
      const destino = record.get('destino');
      const distancia = record.get('distancia');
      console.log(`  ${idx + 1}. ${origen} -> ${destino}`);
      console.log(`     Distancia: ${distancia} km`);
    });

    // 7. Estadisticas de la planta
    console.log('\n--- PLANTA ---');
    const plantaResult = await session.run(`
      MATCH (planta:Ubicacion {tipo: 'planta'})
      RETURN planta.id as id, planta.nombre as nombre,
             planta.latitud as lat, planta.longitud as lon
    `);

    if (plantaResult.records.length > 0) {
      const record = plantaResult.records[0];
      console.log(`ID: ${record.get('id')}`);
      console.log(`Nombre: ${record.get('nombre')}`);
      console.log(`Coordenadas: (${record.get('lat')}, ${record.get('lon')})`);

      // Cuantas conexiones tiene la planta
      const conexionesPlantaResult = await session.run(`
        MATCH (planta:Ubicacion {tipo: 'planta'})-[r:CONECTA_CON]-()
        RETURN count(r) as total
      `);
      const conexionesPlanta = conexionesPlantaResult.records[0].get('total').toNumber();
      console.log(`Conexiones directas: ${conexionesPlanta}`);
    } else {
      console.log('No se encontro nodo de planta');
    }

    // 8. Clientes
    console.log('\n--- CLIENTES ---');
    const clientesResult = await session.run(`
      MATCH (cliente:Ubicacion {tipo: 'cliente'})
      RETURN cliente.id as id, cliente.nombre as nombre
    `);

    console.log(`Total de clientes: ${clientesResult.records.length}`);
    if (clientesResult.records.length > 0) {
      console.log('Clientes encontrados:');
      clientesResult.records.forEach((record, idx) => {
        console.log(`  ${idx + 1}. ${record.get('id')} - ${record.get('nombre')}`);
      });
    }

    // 9. Verificar ruta mas corta desde planta a un nodo aleatorio
    console.log('\n--- PRUEBA DE RUTA ---');
    const pruebaRutaResult = await session.run(`
      MATCH (planta:Ubicacion {tipo: 'planta'})
      MATCH (destino:Ubicacion {tipo: 'interseccion'})
      WITH planta, destino LIMIT 1
      MATCH path = shortestPath((planta)-[:CONECTA_CON*]-(destino))
      WITH destino, path,
           reduce(dist = 0, r in relationships(path) | dist + r.distancia_km) as distancia,
           length(path) as segmentos
      RETURN destino.id as destino_id, distancia, segmentos
    `);

    if (pruebaRutaResult.records.length > 0) {
      const record = pruebaRutaResult.records[0];
      console.log('Calculando ruta de prueba...');
      console.log(`  Destino: ${record.get('destino_id')}`);
      console.log(`  Distancia: ${record.get('distancia').toFixed(3)} km`);
      console.log(`  Segmentos: ${record.get('segmentos').toNumber()}`);
      console.log('OK - Algoritmo de rutas funciona correctamente');
    } else {
      console.log('No se pudo calcular ruta de prueba');
    }

    console.log('\n=== ANALISIS COMPLETADO ===');

  } catch (error) {
    console.error('\nERROR:', error.message);
    console.error(error);
  } finally {
    await session.close();
    await driver.close();
  }
}

analizarNeo4j().catch(console.error);
