import osmnx as ox
import pandas as pd
import json

print("=== Extrayendo intersecciones de OpenStreetMap ===\n")

# Coordenadas del área
planta = (-17.39228, -66.27838)  # Quillacollo
colcapirhua = (-17.390305882051333, -66.23897279221319)  # Colcapirhua

# Usar radio desde la planta (más eficiente que bounding box)
radio_metros = 5000  # 5 km de radio desde la planta (cubre hasta Colcapirhua)

print(f"Descargando red de calles:")
print(f"  Centro: Planta Agregados Zambrana ({planta[0]}, {planta[1]})")
print(f"  Radio: {radio_metros/1000} km\n")

try:
    # Descargar red de calles en un radio desde la planta
    print("Descargando datos de OpenStreetMap... (puede tardar 1-2 minutos)")
    G = ox.graph_from_point(planta, dist=radio_metros, network_type='drive')

    print(f"OK - Red descargada exitosamente\n")

    # Convertir a GeoDataFrames
    nodes, edges = ox.graph_to_gdfs(G)

    print(f"Total de nodos (intersecciones): {len(nodes)}")
    print(f"Total de calles (edges): {len(edges)}\n")

    # Preparar datos para Neo4j
    intersecciones = []

    for idx, node in nodes.iterrows():
        # Generar ID único
        node_id = f"INTER_{idx}"

        # Obtener nombre de la calle si existe
        nombre = f"Intersección {idx}"

        # Coordenadas
        lat = node.geometry.y
        lon = node.geometry.x

        intersecciones.append({
            'id': node_id,
            'osm_id': idx,
            'nombre': nombre,
            'latitud': lat,
            'longitud': lon,
            'tipo': 'interseccion'
        })

    # Agregar la planta como nodo especial
    intersecciones.insert(0, {
        'id': 'PLANTA_QUILLACOLLO',
        'osm_id': 'PLANTA',
        'nombre': 'Planta Agregados Zambrana',
        'latitud': planta[0],
        'longitud': planta[1],
        'tipo': 'planta'
    })

    print(f"Total de intersecciones procesadas: {len(intersecciones)}\n")

    # Guardar en JSON
    with open('intersecciones.json', 'w', encoding='utf-8') as f:
        json.dump(intersecciones, f, indent=2, ensure_ascii=False)

    print("OK - Guardado en: intersecciones.json")

    # Guardar en CSV también
    df = pd.DataFrame(intersecciones)
    df.to_csv('intersecciones.csv', index=False, encoding='utf-8')

    print("OK - Guardado en: intersecciones.csv")

    # Preparar datos de relaciones (calles que conectan intersecciones)
    relaciones = []

    for idx, edge in edges.iterrows():
        origen = idx[0]
        destino = idx[1]

        # Calcular distancia (si existe en los datos)
        distancia_km = edge.get('length', 0) / 1000 if 'length' in edge else 0

        # Obtener nombre de calle, manejando NaN y listas correctamente
        nombre = edge.get('name', 'Sin nombre')

        # Si es lista, tomar el primer elemento
        if isinstance(nombre, list):
            nombre = nombre[0] if nombre else 'Sin nombre'

        # Si es NaN o None, usar valor por defecto
        if nombre is None or (isinstance(nombre, float) and pd.isna(nombre)):
            nombre = 'Sin nombre'

        # Convertir a string para asegurar
        nombre = str(nombre) if nombre != 'Sin nombre' else 'Sin nombre'

        relaciones.append({
            'origen': f"INTER_{origen}",
            'destino': f"INTER_{destino}",
            'distancia_km': round(distancia_km, 3),
            'nombre_calle': nombre
        })

    # Guardar relaciones
    with open('relaciones.json', 'w', encoding='utf-8') as f:
        json.dump(relaciones, f, indent=2, ensure_ascii=False)

    print(f"OK - {len(relaciones)} relaciones guardadas en: relaciones.json\n")

    # Mostrar algunos ejemplos
    print("--- Primeras 5 intersecciones ---")
    for i in intersecciones[:5]:
        print(f"  {i['id']}: ({i['latitud']}, {i['longitud']})")

    print("\n--- Primeras 5 relaciones ---")
    for r in relaciones[:5]:
        print(f"  {r['origen']} -> {r['destino']}: {r['distancia_km']} km ({r['nombre_calle']})")

    print("\n=== OK - Extraccion completada exitosamente ===")
    print(f"\nArchivos generados:")
    print(f"  - intersecciones.json ({len(intersecciones)} nodos)")
    print(f"  - intersecciones.csv ({len(intersecciones)} nodos)")
    print(f"  - relaciones.json ({len(relaciones)} relaciones)")

except Exception as e:
    print(f"\nError: {e}")
    print("\nPosibles soluciones:")
    print("  1. Verifica tu conexión a internet")
    print("  2. Intenta ajustar el bounding box")
    print("  3. Verifica que las coordenadas sean correctas")
