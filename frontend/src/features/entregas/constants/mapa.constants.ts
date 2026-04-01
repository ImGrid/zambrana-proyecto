// CONSTANTES DEL MAPA - Configuración de Leaflet

// Coordenadas de Planta Agregados Zambrana
// Estas coordenadas coinciden con las del backend Neo4j
export const PLANTA_COORDENADAS = {
  latitud: -17.38375972482226,
  longitud: -66.15733157342568,
} as const;

// Configuración del mapa de Leaflet
export const MAPA_CONFIG = {
  // Centro inicial del mapa (planta)
  centro: [PLANTA_COORDENADAS.latitud, PLANTA_COORDENADAS.longitud] as [number, number],

  // Nivel de zoom inicial
  zoomInicial: 13,

  // Niveles de zoom permitidos
  zoomMin: 10,
  zoomMax: 18,

  // URL de tiles de OpenStreetMap
  tileLayerUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',

  // Atribución requerida por OpenStreetMap
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
} as const;

// Intervalo de polling para actualizaciones GPS (en milisegundos)
// El backend recibe GPS cada 10 segundos, nosotros consultamos cada 10 segundos
export const POLLING_INTERVAL_MS = 10000;

// Colores para los marcadores y rutas
export const MAPA_COLORES = {
  // Planta
  planta: '#10b981',

  // Camión en movimiento
  camionMovimiento: '#3b82f6',

  // Camión detenido
  camionDetenido: '#f59e0b',

  // Camión desviado de la ruta
  camionDesviado: '#ef4444',

  // Cliente/destino
  cliente: '#ef4444',

  // Ruta planificada (azul brillante para alta visibilidad)
  rutaPlanificada: '#0066FF',

  // Ruta recorrida
  rutaRecorrida: '#06b6d4',
} as const;

// Configuración de iconos
export const ICON_CONFIG = {
  // Tamaño del icono [ancho, alto]
  iconSize: [32, 32] as [number, number],

  // Punto de anclaje del icono (centro inferior)
  iconAnchor: [16, 32] as [number, number],

  // Punto de anclaje del popup (encima del icono)
  popupAnchor: [0, -32] as [number, number],
} as const;

// Configuración de la polyline (línea de ruta)
export const POLYLINE_CONFIG = {
  // Grosor de la línea
  peso: 6,

  // Opacidad
  opacidad: 0.9,

  // Estilo de las esquinas
  lineJoin: 'round' as const,

  // Estilo de los extremos
  lineCap: 'round' as const,
} as const;

// Umbral de velocidad para considerar que un camión está detenido (km/h)
export const VELOCIDAD_DETENIDO_THRESHOLD = 5;
