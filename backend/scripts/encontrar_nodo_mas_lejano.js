import neo4j from 'neo4j-driver';

const driver = neo4j.driver(
  'bolt://localhost:7687',
  neo4j.auth.basic('neo4j', 'neo12345')
);

async function encontrarMasLejano() {
  const session = driver.session();
  try {
    console.log('=== BUSCANDO NODO MAS LEJANO DESDE LA PLANTA ===\n');

    console.log('Calculando rutas desde la planta a todos los nodos...');
    console.log('(Esto puede tardar 1-2 minutos con 5,078 nodos)\n');

    // Encontrar el nodo mas lejano calculando rutas
    const resultado = await session.run(`
      MATCH (planta:Ubicacion {tipo: 'planta'})
      MATCH (destino:Ubicacion)
      WHERE destino.tipo = 'interseccion'
      WITH planta, destino LIMIT 100
      MATCH path = shortestPath((planta)-[:CONECTA_CON*]-(destino))
      WITH destino, path,
           reduce(dist = 0, r in relationships(path) | dist + r.distancia_km) as distancia,
           length(path) as numSegmentos
      ORDER BY distancia DESC
      LIMIT 1
      RETURN
        destino.id as id,
        destino.nombre as nombre,
        destino.latitud as lat,
        destino.longitud as lon,
        distancia,
        numSegmentos
    `);

    if (resultado.records.length === 0) {
      console.log('No se encontraron rutas');
      return;
    }

    const record = resultado.records[0];
    const id = record.get('id');
    const nombre = record.get('nombre');
    const lat = record.get('lat');
    const lon = record.get('lon');
    const distancia = record.get('distancia');
    const numSegmentos = record.get('numSegmentos');

    console.log('=== NODO MAS LEJANO ENCONTRADO ===');
    console.log(`ID: ${id}`);
    console.log(`Nombre: ${nombre}`);
    console.log(`Coordenadas: (${lat}, ${lon})`);
    console.log(`Distancia desde planta: ${distancia.toFixed(3)} km`);
    console.log(`Numero de segmentos en la ruta: ${numSegmentos}\n`);

    console.log('=== QUERY PARA NEO4J BROWSER ===');
    console.log('Copia y pega esta query en Neo4j Browser:\n');
    console.log(`MATCH (planta:Ubicacion {tipo: 'planta'}),`);
    console.log(`      (destino:Ubicacion {id: '${id}'})`);
    console.log(`MATCH path = shortestPath((planta)-[:CONECTA_CON*]-(destino))`);
    console.log(`RETURN path`);
    console.log('\n');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await session.close();
    await driver.close();
  }
}

encontrarMasLejano().catch(console.error);
