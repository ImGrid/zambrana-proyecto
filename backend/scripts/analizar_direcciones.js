import fs from 'fs';

const relaciones = JSON.parse(fs.readFileSync('relaciones.json', 'utf-8'));

console.log('=== ANÁLISIS DE DIRECCIONES DE RELACIONES ===\n');
console.log('Total de relaciones:', relaciones.length);

// Buscar ejemplos de relaciones bidireccionales
const pares = new Map();
let ejemploEncontrado = false;

for (const rel of relaciones) {
  const key1 = `${rel.origen}->${rel.destino}`;
  const key2 = `${rel.destino}->${rel.origen}`;

  if (!pares.has(key1)) {
    pares.set(key1, rel);
  }

  // Verificar si existe la inversa
  if (pares.has(key2) && !ejemploEncontrado) {
    console.log('\nEJEMPLO DE RELACIÓN BIDIRECCIONAL:');
    console.log('Dirección 1:', rel.origen, '->', rel.destino);
    console.log('  Distancia:', rel.distancia_km, 'km');
    console.log('  Calle:', rel.nombre_calle);
    console.log('Dirección 2:', rel.destino, '->', rel.origen);
    const inversa = pares.get(key2);
    console.log('  Distancia:', inversa.distancia_km, 'km');
    console.log('  Calle:', inversa.nombre_calle);
    ejemploEncontrado = true;
  }
}

// Contar cuántas son bidireccionales
let bidireccionales = 0;
const visitados = new Set();

for (const rel of relaciones) {
  const key1 = `${rel.origen}->${rel.destino}`;
  const key2 = `${rel.destino}->${rel.origen}`;

  if (visitados.has(key1) || visitados.has(key2)) {
    continue;
  }

  const tieneInversa = relaciones.some(r =>
    r.origen === rel.destino && r.destino === rel.origen
  );

  if (tieneInversa) {
    bidireccionales++;
    visitados.add(key1);
    visitados.add(key2);
  }
}

console.log('\n=== ESTADÍSTICAS ===');
console.log('Pares bidireccionales:', bidireccionales);
console.log('Relaciones unidireccionales:', relaciones.length - (bidireccionales * 2));
console.log('Relaciones totales:', relaciones.length);
console.log('Porcentaje bidireccional:', ((bidireccionales * 2 / relaciones.length) * 100).toFixed(1) + '%');

// Verificar si TODAS son bidireccionales
if (bidireccionales * 2 === relaciones.length) {
  console.log('\n✓ TODAS las relaciones son bidireccionales (cada calle tiene A->B y B->A)');
} else {
  console.log('\n⚠ HAY relaciones unidireccionales mezcladas');
}
