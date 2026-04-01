import fs from 'fs';

const relaciones = JSON.parse(fs.readFileSync('relaciones.json', 'utf-8'));

console.log('=== BUSCANDO RELACIONES UNIDIRECCIONALES ===\n');

// Crear mapa de todas las relaciones
const relacionesMap = new Map();
for (const rel of relaciones) {
  const key = `${rel.origen}->${rel.destino}`;
  relacionesMap.set(key, rel);
}

// Encontrar las que no tienen inversa
const unidireccionales = [];
for (const rel of relaciones) {
  const keyInversa = `${rel.destino}->${rel.origen}`;
  if (!relacionesMap.has(keyInversa)) {
    unidireccionales.push(rel);
  }
}

console.log('Total de relaciones unidireccionales:', unidireccionales.length);

// Analizar patrones
const origenes = new Map();
const destinos = new Map();

for (const rel of unidireccionales) {
  // Contar por origen
  origenes.set(rel.origen, (origenes.get(rel.origen) || 0) + 1);

  // Contar por destino
  destinos.set(rel.destino, (destinos.get(rel.destino) || 0) + 1);
}

console.log('\nTop 10 nodos que más ENVÍAN relaciones unidireccionales:');
const topOrigenes = [...origenes.entries()]
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10);

topOrigenes.forEach(([nodo, count], idx) => {
  console.log(`  ${idx + 1}. ${nodo}: ${count} relaciones salientes sin retorno`);
});

console.log('\nTop 10 nodos que más RECIBEN relaciones unidireccionales:');
const topDestinos = [...destinos.entries()]
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10);

topDestinos.forEach(([nodo, count], idx) => {
  console.log(`  ${idx + 1}. ${nodo}: ${count} relaciones entrantes sin retorno`);
});

// Ejemplos
console.log('\n=== EJEMPLOS DE RELACIONES UNIDIRECCIONALES ===');
unidireccionales.slice(0, 5).forEach((rel, idx) => {
  console.log(`\n${idx + 1}. ${rel.origen} -> ${rel.destino}`);
  console.log(`   Distancia: ${rel.distancia_km} km`);
  console.log(`   Calle: ${rel.nombre_calle}`);

  // Verificar si el destino tiene alguna conexión de vuelta (aunque no directa)
  const conexionesDestino = relaciones.filter(r => r.origen === rel.destino).length;
  console.log(`   (El destino tiene ${conexionesDestino} conexiones salientes totales)`);
});
