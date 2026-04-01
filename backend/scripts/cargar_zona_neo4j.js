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

// Uso: node cargar_zona_neo4j.js <nombre_zona>
// Ejemplo: node cargar_zona_neo4j.js zona2
const nombreZona = process.argv[2];
if (!nombreZona) {
  console.log('Uso: node cargar_zona_neo4j.js <nombre_zona>');
  console.log('Ejemplo: node cargar_zona_neo4j.js zona2');
  process.exit(1);
}

async function cargarZona() {
  const session = driver.session();

  try {
    console.log(`=== CARGA INCREMENTAL: ${nombreZona} ===\n`);

    // Contar nodos antes
    const antesResult = await session.run('MATCH (n:Ubicacion) RETURN count(n) as total');
    const antesTotalNodos = antesResult.records[0].get('total').toNumber();
    const antesRelResult = await session.run('MATCH ()-[r:CONECTA_CON]->() RETURN count(r) as total');
    const antesTotalRel = antesRelResult.records[0].get('total').toNumber();
    console.log(`Estado actual: ${antesTotalNodos} nodos, ${antesTotalRel} relaciones\n`);

    // Leer archivos
    console.log('Paso 1: Leyendo archivos JSON...');
    const interseccionesPath = path.join(__dirname, `${nombreZona}_intersecciones.json`);
    const relacionesPath = path.join(__dirname, `${nombreZona}_relaciones.json`);

    const intersecciones = JSON.parse(fs.readFileSync(interseccionesPath, 'utf-8'));
    const relaciones = JSON.parse(fs.readFileSync(relacionesPath, 'utf-8'));
    console.log(`OK - ${intersecciones.length} nodos, ${relaciones.length} relaciones\n`);

    // Crear indice si no existe
    console.log('Paso 2: Verificando indice...');
    await session.run('CREATE INDEX idx_ubicacion_id IF NOT EXISTS FOR (u:Ubicacion) ON (u.id)');
    console.log('OK\n');

    // MERGE nodos (no duplica si ya existen)
    console.log('Paso 3: Cargando nodos (MERGE - sin duplicar)...');
    let nodosNuevos = 0;
    let nodosExistentes = 0;

    for (let i = 0; i < intersecciones.length; i += BATCH_SIZE) {
      const batch = intersecciones.slice(i, i + BATCH_SIZE);

      const result = await session.run(
        `
        UNWIND $nodos AS nodo
        MERGE (u:Ubicacion {id: nodo.id})
        ON CREATE SET
          u.osm_id = nodo.osm_id,
          u.nombre = nodo.nombre,
          u.latitud = nodo.latitud,
          u.longitud = nodo.longitud,
          u.tipo = nodo.tipo
        RETURN
          sum(CASE WHEN u.osm_id = nodo.osm_id THEN 0 ELSE 1 END) as existentes
        `,
        { nodos: batch }
      );

      const procesados = i + batch.length;
      const porcentaje = ((procesados / intersecciones.length) * 100).toFixed(1);
      console.log(`  Progreso: ${procesados}/${intersecciones.length} (${porcentaje}%)`);
    }

    // Contar nodos despues de insercion
    const despuesNodosResult = await session.run('MATCH (n:Ubicacion) RETURN count(n) as total');
    const despuesTotalNodos = despuesNodosResult.records[0].get('total').toNumber();
    nodosNuevos = despuesTotalNodos - antesTotalNodos;
    nodosExistentes = intersecciones.length - nodosNuevos;
    console.log(`OK - ${nodosNuevos} nodos nuevos, ${nodosExistentes} ya existian\n`);

    // MERGE relaciones
    console.log('Paso 4: Cargando relaciones (sin duplicar)...');
    let relacionesCreadas = 0;

    for (let i = 0; i < relaciones.length; i += BATCH_SIZE) {
      const batch = relaciones.slice(i, i + BATCH_SIZE);

      await session.run(
        `
        UNWIND $relaciones AS rel
        MATCH (origen:Ubicacion {id: rel.origen})
        MATCH (destino:Ubicacion {id: rel.destino})
        WHERE NOT EXISTS {
          MATCH (origen)-[r:CONECTA_CON]->(destino)
          WHERE abs(r.distancia_km - rel.distancia_km) < 0.001
        }
        CREATE (origen)-[:CONECTA_CON {
          distancia_km: rel.distancia_km,
          nombre_calle: rel.nombre_calle,
          tiempo_minutos: (rel.distancia_km / $velocidad) * 60
        }]->(destino)
        `,
        { relaciones: batch, velocidad: VELOCIDAD_PROMEDIO_KMH }
      );

      const procesados = i + batch.length;
      const porcentaje = ((procesados / relaciones.length) * 100).toFixed(1);
      console.log(`  Progreso: ${procesados}/${relaciones.length} (${porcentaje}%)`);
    }

    // Contar relaciones despues
    const despuesRelResult = await session.run('MATCH ()-[r:CONECTA_CON]->() RETURN count(r) as total');
    const despuesTotalRel = despuesRelResult.records[0].get('total').toNumber();
    relacionesCreadas = despuesTotalRel - antesTotalRel;
    console.log(`OK - ${relacionesCreadas} relaciones nuevas\n`);

    // Verificar conectividad con la planta
    console.log('Paso 5: Verificando conectividad con la planta...');
    const conectividadResult = await session.run(`
      MATCH (planta:Ubicacion {tipo: 'planta'})
      MATCH (n:Ubicacion {tipo: 'interseccion'})
      WITH planta, n, rand() as r
      ORDER BY r LIMIT 10
      OPTIONAL MATCH path = shortestPath((planta)-[:CONECTA_CON*]-(n))
      RETURN n.id as id, path IS NOT NULL as alcanzable
    `);

    let alcanzables = 0;
    conectividadResult.records.forEach(r => {
      if (r.get('alcanzable')) alcanzables++;
    });
    console.log(`${alcanzables}/10 nodos aleatorios alcanzables desde la planta\n`);

    // Resumen final
    console.log('=== RESUMEN ===\n');
    console.log(`Antes:   ${antesTotalNodos} nodos, ${antesTotalRel} relaciones`);
    console.log(`Despues: ${despuesTotalNodos} nodos, ${despuesTotalRel} relaciones`);
    console.log(`Nuevos:  +${nodosNuevos} nodos, +${relacionesCreadas} relaciones`);

    // Cobertura actual
    const coberturaResult = await session.run(`
      MATCH (n:Ubicacion {tipo: 'interseccion'})
      RETURN min(n.latitud) as latMin, max(n.latitud) as latMax,
             min(n.longitud) as lonMin, max(n.longitud) as lonMax
    `);
    const c = coberturaResult.records[0];
    console.log(`\nCobertura: Lat [${c.get('latMin')}, ${c.get('latMax')}]`);
    console.log(`           Lon [${c.get('lonMin')}, ${c.get('lonMax')}]`);

    console.log(`\n=== CARGA COMPLETADA ===`);

  } catch (error) {
    console.error('\nERROR:', error.message);
    console.error(error.stack);
  } finally {
    await session.close();
    await driver.close();
  }
}

cargarZona().catch(console.error);
