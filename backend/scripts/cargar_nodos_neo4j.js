import neo4j from 'neo4j-driver';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const driver = neo4j.driver(
  'bolt://127.0.0.1:7687',
  neo4j.auth.basic('neo4j', 'neo12345'),
  { encrypted: 'ENCRYPTION_OFF' }
);

const BATCH_SIZE = 500;
const VELOCIDAD_PROMEDIO_KMH = 40;

async function cargarNodosNeo4j() {
  const session = driver.session();

  try {
    console.log('=== CARGA DE DATOS A NEO4J ===\n');

    // PASO 1: Borrar todo
    console.log('Paso 1: Eliminando datos existentes...');
    await session.run('MATCH (n) DETACH DELETE n');
    console.log('OK - Base de datos limpiada\n');

    // PASO 2: Leer archivos JSON
    console.log('Paso 2: Leyendo archivos JSON...');
    const interseccionesPath = path.join(__dirname, 'intersecciones.json');
    const relacionesPath = path.join(__dirname, 'relaciones.json');

    const intersecciones = JSON.parse(fs.readFileSync(interseccionesPath, 'utf-8'));
    const relaciones = JSON.parse(fs.readFileSync(relacionesPath, 'utf-8'));

    console.log(`OK - ${intersecciones.length} nodos leidos`);
    console.log(`OK - ${relaciones.length} relaciones leidas\n`);

    // PASO 3: Crear nodos en batches
    console.log('Paso 3: Creando nodos...');
    let nodosCreados = 0;

    for (let i = 0; i < intersecciones.length; i += BATCH_SIZE) {
      const batch = intersecciones.slice(i, i + BATCH_SIZE);

      await session.run(
        `
        UNWIND $nodos AS nodo
        CREATE (u:Ubicacion {
          id: nodo.id,
          osm_id: nodo.osm_id,
          nombre: nodo.nombre,
          latitud: nodo.latitud,
          longitud: nodo.longitud,
          tipo: nodo.tipo
        })
        `,
        { nodos: batch }
      );

      nodosCreados += batch.length;
      const porcentaje = ((nodosCreados / intersecciones.length) * 100).toFixed(1);
      console.log(`  Progreso: ${nodosCreados}/${intersecciones.length} (${porcentaje}%)`);
    }

    console.log(`OK - ${nodosCreados} nodos creados\n`);

    // PASO 4: Crear indices para mejorar performance de relaciones
    console.log('Paso 4: Creando indices...');
    await session.run('CREATE INDEX idx_ubicacion_id IF NOT EXISTS FOR (u:Ubicacion) ON (u.id)');
    console.log('OK - Indice creado\n');

    // PASO 5: Crear relaciones en batches
    console.log('Paso 5: Creando relaciones...');
    let relacionesCreadas = 0;

    for (let i = 0; i < relaciones.length; i += BATCH_SIZE) {
      const batch = relaciones.slice(i, i + BATCH_SIZE);

      await session.run(
        `
        UNWIND $relaciones AS rel
        MATCH (origen:Ubicacion {id: rel.origen})
        MATCH (destino:Ubicacion {id: rel.destino})
        CREATE (origen)-[:CONECTA_CON {
          distancia_km: rel.distancia_km,
          nombre_calle: rel.nombre_calle,
          tiempo_minutos: (rel.distancia_km / $velocidad) * 60
        }]->(destino)
        `,
        { relaciones: batch, velocidad: VELOCIDAD_PROMEDIO_KMH }
      );

      relacionesCreadas += batch.length;
      const porcentaje = ((relacionesCreadas / relaciones.length) * 100).toFixed(1);
      console.log(`  Progreso: ${relacionesCreadas}/${relaciones.length} (${porcentaje}%)`);
    }

    console.log(`OK - ${relacionesCreadas} relaciones creadas\n`);

    // PASO 6: Verificacion de la planta
    console.log('Paso 6: Verificando nodo de planta...');
    const plantaResult = await session.run(`
      MATCH (planta:Ubicacion {tipo: 'planta'})
      RETURN planta.id as id, planta.nombre as nombre,
             planta.latitud as lat, planta.longitud as lon
    `);

    if (plantaResult.records.length === 0) {
      console.log('ERROR - No se encontro nodo de planta!');
      return;
    }

    const planta = plantaResult.records[0];
    console.log(`OK - Planta encontrada:`);
    console.log(`  ID: ${planta.get('id')}`);
    console.log(`  Nombre: ${planta.get('nombre')}`);
    console.log(`  Coords: (${planta.get('lat')}, ${planta.get('lon')})\n`);

    // PASO 7: Verificar conexiones de la planta
    console.log('Paso 7: Verificando conexiones de la planta...');
    const conexionesResult = await session.run(`
      MATCH (planta:Ubicacion {tipo: 'planta'})-[r:CONECTA_CON]-(n)
      RETURN count(r) as total
    `);

    const totalConexiones = conexionesResult.records[0].get('total').toNumber();
    console.log(`OK - La planta tiene ${totalConexiones} conexiones\n`);

    if (totalConexiones === 0) {
      console.log('ADVERTENCIA - La planta NO tiene conexiones con otros nodos!');
      console.log('Esto significa que no se podran calcular rutas desde la planta.\n');
    }

    // PASO 8: Probar ruta
    console.log('Paso 8: Probando calculo de ruta...');
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

    if (pruebaRutaResult.records.length === 0) {
      console.log('ERROR - No se pudo calcular ruta de prueba!');
      console.log('Verifica que la planta este conectada al grafo.\n');
    } else {
      const prueba = pruebaRutaResult.records[0];
      console.log(`OK - Ruta de prueba calculada:`);
      console.log(`  Destino: ${prueba.get('destino_id')}`);
      console.log(`  Distancia: ${prueba.get('distancia').toFixed(3)} km`);
      console.log(`  Segmentos: ${prueba.get('segmentos').toNumber()}\n`);
    }

    // PASO 9: Resumen final
    console.log('=== RESUMEN DE CARGA ===\n');

    const resumenResult = await session.run(`
      MATCH (n:Ubicacion)
      WITH n.tipo as tipo, count(n) as cantidad
      RETURN tipo, cantidad
      ORDER BY cantidad DESC
    `);

    console.log('Nodos por tipo:');
    resumenResult.records.forEach(record => {
      const tipo = record.get('tipo');
      const cantidad = record.get('cantidad').toNumber();
      console.log(`  ${tipo}: ${cantidad}`);
    });

    const totalRelResult = await session.run('MATCH ()-[r:CONECTA_CON]->() RETURN count(r) as total');
    const totalRel = totalRelResult.records[0].get('total').toNumber();
    console.log(`\nTotal de relaciones: ${totalRel}`);

    console.log('\n=== CARGA COMPLETADA EXITOSAMENTE ===');

  } catch (error) {
    console.error('\nERROR durante la carga:', error.message);
    console.error(error.stack);
  } finally {
    await session.close();
    await driver.close();
  }
}

cargarNodosNeo4j().catch(console.error);
