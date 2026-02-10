// TIPOS DE ENTREGAS - COINCIDEN EXACTAMENTE CON BACKEND

// Estructura base de una entrega
// backend/src/modules/entregas/entregas.repository.ts líneas 7-24
export interface Entrega {
  id: number;
  pedido_id: number;
  conductor_id: number;
  camion_id: number;
  hora_salida_planta: Date | null;
  hora_llegada_cliente: Date | null;
  duracion_minutos: number | null;
  ruta_planificada_id: string | null;
  desviaciones_detectadas: number | null;
  porcentaje_adherencia: number | null;
  entregado: boolean | null;
  firma_cliente: string | null;
  foto_comprobante: string | null;
  observaciones_entrega: string | null;
  created_at: Date;
  updated_at: Date;
}

// Entrega con todos los detalles relacionados
// backend/src/modules/entregas/entregas.repository.ts líneas 26-52
export interface EntregaConDetalle extends Entrega {
  pedido: {
    id: number;
    codigo_seguimiento: string;
    estado: string;
    fecha_entrega: Date;
    direccion_entrega: string;
    latitud_entrega: number;
    longitud_entrega: number;
    ruta_calculada: any | null;
    cliente: {
      id: number;
      razon_social: string;
      telefono: string;
    };
  };
  camion: {
    id: number;
    placa: string;
    modelo: string;
  };
  conductor: {
    id: number;
    nombre_completo: string;
    telefono: string;
  };
}

// Estructura de la ruta calculada (almacenada en pedidos.ruta_calculada JSONB)
// Esta estructura viene de Neo4j y se guarda como JSON en PostgreSQL
export interface RutaCalculada {
  nodos: NodoRuta[];
  segmentos: SegmentoRuta[];
  distancia_total_km: number;
  tiempo_total_minutos: number;
  interseccion_destino: {
    id: string;
    nombre: string;
    latitud: number;
    longitud: number;
  };
}

export interface NodoRuta {
  id: string;
  nombre: string;
  tipo: 'planta' | 'cliente' | 'interseccion' | 'zona';
  latitud: number;
  longitud: number;
  orden: number;
}

export interface SegmentoRuta {
  desde: string;
  hasta: string;
  distancia_km: number;
  tiempo_minutos: number;
  orden: number;
}

// Evento de una entrega (timeline de la entrega)
// backend/src/modules/entregas/entregas.repository.ts líneas 54-62
export interface EventoEntrega {
  id: number;
  entrega_id: number;
  tipo_evento: string;
  descripcion: string | null;
  latitud: number | null;
  longitud: number | null;
  created_at: Date;
}

// TIPOS DE RESPUESTA DE ENDPOINTS

// GET /entregas/:id - Estado completo de una entrega
// backend/src/modules/entregas/entregas.service.ts líneas 264-301
export interface EstadoEntrega {
  entrega: EntregaConDetalle;
  posicion_actual: PosicionGPS | null;
  velocidad_promedio_kmh: number;
  esta_detenido: boolean;
  esta_desviado: boolean;
  eta_actualizado: Date | null;
}

// GET /entregas/:id/historial - Historial de tracking completo
// backend/src/modules/entregas/entregas.service.ts líneas 314-344
export interface HistorialTracking {
  entrega: {
    id: number;
    entregado: boolean | null;
    pedido: EntregaConDetalle['pedido'];
    camion: EntregaConDetalle['camion'];
    conductor: EntregaConDetalle['conductor'];
  };
  posiciones: PosicionGPS[];
  paginacion: {
    total: number;
    limite: number;
    offset: number;
    tiene_mas: boolean;
  };
}

// GET /entregas/activas - Entregas activas con posición actual
// backend/src/modules/entregas/entregas.service.ts líneas 353-371
export interface EntregaActiva extends EntregaConDetalle {
  posicion_actual: PosicionGPS | null;
  velocidad_promedio_kmh: number;
  esta_detenido: boolean;
  esta_desviado: boolean;
}

// PATCH /entregas/:id/finalizar - Respuesta al finalizar entrega
// backend/src/modules/entregas/entregas.service.ts líneas 243-253
export interface FinalizarEntregaResponse {
  entrega: Entrega;
  metricas: MetricasEntrega;
}

export interface MetricasEntrega {
  distancia_planificada_km: number | null;
  distancia_recorrida_km: number;
  desviacion_ruta_porcentaje: string | null;
  tiempo_estimado_minutos: number | null;
  tiempo_real_minutos: number | null;
  total_posiciones_gps_registradas: number;
}

// GET /entregas/:id/eventos - Respuesta de eventos
// backend/src/modules/entregas/entregas.service.ts líneas 381-398
export interface EventosEntregaResponse {
  entrega: {
    id: number;
    entregado: boolean | null;
    pedido: EntregaConDetalle['pedido'];
  };
  eventos: EventoEntrega[];
}

// GET /entregas/estadisticas - Estadísticas generales
// backend/src/modules/entregas/entregas.service.ts líneas 438-449
export interface EstadisticasEntregas {
  en_camino: number;
  completadas: number;
  canceladas: number;
  total: number;
}

// TIPOS DE INPUT/REQUEST

// POST /entregas/iniciar
// backend/src/modules/entregas/entregas.schemas.ts línea 11
export interface IniciarEntregaInput {
  pedido_id: number;
}

// POST /entregas/:id/gps
// backend/src/modules/entregas/entregas.schemas.ts línea 51
export interface RecibirGPSInput {
  latitud: number;
  longitud: number;
  velocidad_kmh?: number;
  direccion_grados?: number;
  precision_metros?: number;
  timestamp?: string;
}

// PATCH /entregas/:id/finalizar
// backend/src/modules/entregas/entregas.schemas.ts línea 74
export interface FinalizarEntregaInput {
  firma_cliente?: string;
  foto_comprobante?: string;
  observaciones?: string;
}

// PATCH /entregas/:id/cancelar
export interface CancelarEntregaInput {
  motivo: string;
}

// Importar tipo de GPS
import { PosicionGPS } from './gps.types';
