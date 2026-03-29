import * as entregasRepo from './entregas.repository.js';
import * as gpsRepo from './gps.repository.js';
import * as rutasService from './rutas.service.js';
import { pool } from '../../database/postgres/pool.js';
import { crearGrafoEntrega, completarGrafoEntrega } from '../grafo/grafo.service.js';

// Periodo de gracia en minutos despues de un evento REANUDO
const PERIODO_GRACIA_MINUTOS = 1;

// Umbral de desviacion en km (200 metros)
const UMBRAL_DESVIACION_KM = 0.2;

/**
 * Inicia una nueva entrega para un pedido
 *
 * FLUJO COMPLETO:
 * 1. Validar que el pedido existe y esta confirmado
 * 2. Si es conductor, validar que es el asignado al pedido
 * 3. Usar camion y conductor asignados en el pedido
 * 4. Calcular ruta desde planta hasta cliente usando Neo4j
 * 5. Crear entrega con la ruta calculada
 * 6. Actualizar estados de pedido, camion y conductor
 *
 * @param pedido_id - ID del pedido a entregar
 * @param usuario_id - ID del usuario que inicia (opcional)
 * @param rol - Rol del usuario (opcional)
 * @returns Entrega creada con todos los detalles
 */
export async function iniciarEntrega(
  pedido_id: number,
  usuario_id?: number,
  rol?: string
) {
  // Validar que el pedido existe y obtener datos completos
  const pedidoResult = await pool.query(
    `SELECT p.id, p.codigo_seguimiento, p.cliente_id,
            p.camion_asignado_id, p.conductor_asignado_id,
            e.nombre as estado
     FROM pedidos p
     JOIN estados_pedido e ON p.estado_actual_id = e.id
     WHERE p.id = $1`,
    [pedido_id]
  );

  if (pedidoResult.rows.length === 0) {
    throw new Error(`Pedido con ID ${pedido_id} no encontrado`);
  }

  const pedido = pedidoResult.rows[0];

  if (pedido.estado !== 'CONFIRMADO') {
    throw new Error(`Pedido ${pedido.codigo_seguimiento} no esta confirmado (estado actual: ${pedido.estado})`);
  }

  // Verificar que el pedido tiene camion y conductor asignados
  if (!pedido.camion_asignado_id || !pedido.conductor_asignado_id) {
    throw new Error(`Pedido ${pedido.codigo_seguimiento} no tiene camion o conductor asignado`);
  }

  // Si es conductor, validar que es el asignado al pedido
  if (rol === 'conductor' && usuario_id) {
    const conductorResult = await pool.query<{ id: number }>(
      'SELECT id FROM conductores WHERE usuario_id = $1',
      [usuario_id]
    );

    const conductorRow = conductorResult.rows[0];
    if (!conductorRow) {
      throw new Error('No se encontro informacion de conductor para este usuario');
    }

    if (conductorRow.id !== pedido.conductor_asignado_id) {
      throw new Error('No tienes permiso para iniciar esta entrega. No eres el conductor asignado.');
    }
  }

  // Verificar que no exista una entrega previa para este pedido
  const entregaExistente = await entregasRepo.findEntregaByPedidoId(pedido_id);
  if (entregaExistente) {
    throw new Error(`El pedido ${pedido.codigo_seguimiento} ya tiene una entrega asignada`);
  }

  // Calcular ruta desde planta hasta cliente usando Neo4j
  const rutaCompleta = await rutasService.calcularRutaHastaPedido(pedido_id);

  // Crear identificador de ruta planificada
  const rutaPlanificadaId = `PLANTA->${rutaCompleta.interseccion_destino.id}`;

  // Crear la entrega con camion y conductor asignados en el pedido
  const entrega = await entregasRepo.createEntrega(
    pedido_id,
    pedido.camion_asignado_id,
    pedido.conductor_asignado_id,
    rutaPlanificadaId
  );

  // Sincronizar grafo de operaciones en Neo4j
  try {
    await crearGrafoEntrega(entrega.id);
  } catch (errorGrafo) {
    console.error('Error al sincronizar grafo de entrega:', errorGrafo);
  }

  // Retornar entrega con detalles completos
  const entregaDetallada = await entregasRepo.findEntregaById(entrega.id);

  return entregaDetallada;
}

/**
 * Registra una posicion GPS del camion durante la entrega
 *
 * FLUJO:
 * 1. Validar que la entrega existe y esta activa
 * 2. Insertar posicion GPS en tabla particionada
 * 3. Validar si la posicion esta cerca de la ruta (opcional)
 * 4. Calcular nuevo ETA basado en posicion actual (opcional)
 *
 * @param entrega_id - ID de la entrega
 * @param latitud - Latitud GPS
 * @param longitud - Longitud GPS
 * @param velocidad_kmh - Velocidad en km/h (opcional)
 * @param direccion_grados - Direccion en grados (opcional)
 * @param precision_metros - Precision del GPS (opcional)
 * @param timestamp - Timestamp del GPS (opcional)
 * @returns Resultado con warnings si hay desviaciones
 */
export async function recibirPosicionGPS(
  entrega_id: number,
  latitud: number,
  longitud: number,
  velocidad_kmh?: number,
  direccion_grados?: number,
  precision_metros?: number,
  timestamp?: Date
) {
  // Validar que la entrega existe y esta activa
  const entrega = await entregasRepo.findEntregaById(entrega_id);

  if (!entrega) {
    throw new Error(`Entrega con ID ${entrega_id} no encontrada`);
  }

  if (entrega.entregado === true || !entrega.hora_salida_planta) {
    throw new Error(`La entrega no esta activa (entregado: ${entrega.entregado})`);
  }

  // Deduplicacion: no insertar si es la misma posicion (< 5m) y paso poco tiempo (< 120s)
  const ultimaPosicion = await gpsRepo.obtenerUltimaPosicion(entrega_id);
  if (ultimaPosicion) {
    const distanciaKm = rutasService.calcularDistanciaHaversine(
      ultimaPosicion.latitud, ultimaPosicion.longitud, latitud, longitud
    );
    const tiempoMs = Date.now() - new Date(ultimaPosicion.timestamp).getTime();
    const tiempoSeg = tiempoMs / 1000;

    // Menos de 5 metros Y menos de 120 segundos = duplicado, no insertar
    if (distanciaKm < 0.005 && tiempoSeg < 120) {
      return {
        success: true,
        warnings: [],
        eta_actualizado: null,
        posicion_registrada: { latitud, longitud, timestamp: timestamp || new Date() }
      };
    }
  }

  // Insertar posicion GPS
  await gpsRepo.insertarPosicionGPS(
    entrega_id,
    entrega.conductor_id,
    entrega.camion_id,
    latitud,
    longitud,
    velocidad_kmh,
    direccion_grados,
    precision_metros,
    timestamp
  );

  // Validaciones adicionales
  const warnings: string[] = [];

  // Calcular nuevo ETA basado en posicion actual
  let nuevoETA = null;
  if (entrega.pedido?.latitud_entrega && entrega.pedido?.longitud_entrega) {
    const tiempoRestante = rutasService.calcularTiempoEstimadoLlegada(
      latitud,
      longitud,
      entrega.pedido.latitud_entrega,
      entrega.pedido.longitud_entrega,
      velocidad_kmh || 40
    );

    nuevoETA = new Date();
    nuevoETA.setMinutes(nuevoETA.getMinutes() + Math.ceil(tiempoRestante));
  }

  // Detectar desviacion de ruta en tiempo real
  if (determinarSiDesviado(entrega, latitud, longitud)) {
    warnings.push('El camion se ha desviado de la ruta planificada');
  }

  return {
    success: true,
    warnings,
    eta_actualizado: nuevoETA,
    posicion_registrada: {
      latitud,
      longitud,
      timestamp: timestamp || new Date()
    }
  };
}

// Valida que el conductor este cerca del destino antes de finalizar
// Lee la regla R7_GEOFENCE_ENTREGA de configuracion_reglas
// Si permitir_override_con_observacion esta activo, permite finalizar lejos con observacion
async function validarProximidadEntrega(
  entrega_id: number,
  entrega: any,
  observaciones?: string
): Promise<void> {
  // Leer regla de geofence de la BD
  const reglaResult = await pool.query(
    `SELECT parametros, activa FROM configuracion_reglas WHERE codigo = 'R7_GEOFENCE_ENTREGA'`
  );

  const regla = reglaResult.rows[0];
  if (!regla || !regla.activa) return;

  const params = regla.parametros;
  const radioMetros = params.radio_metros || 300;
  const velocidadMaxKmh = params.velocidad_maxima_kmh || 10;
  const permitirOverride = params.permitir_override_con_observacion || false;

  // Obtener coordenadas del destino
  const latDestino = entrega.pedido?.latitud_entrega;
  const lonDestino = entrega.pedido?.longitud_entrega;
  if (!latDestino || !lonDestino) return;

  // Obtener ultima posicion GPS del conductor
  const ultimaPosicion = await gpsRepo.obtenerUltimaPosicion(entrega_id);
  if (!ultimaPosicion) {
    throw new Error('No se puede finalizar: no hay posiciones GPS registradas para esta entrega');
  }

  // Calcular distancia al destino
  const distanciaKm = rutasService.calcularDistanciaHaversine(
    ultimaPosicion.latitud, ultimaPosicion.longitud,
    latDestino, lonDestino
  );
  const distanciaMetros = distanciaKm * 1000;

  // Verificar velocidad (no deberia finalizar a alta velocidad)
  const velocidadActual = ultimaPosicion.velocidad_kmh || 0;

  if (distanciaMetros > radioMetros) {
    // Esta lejos del destino
    if (permitirOverride && observaciones && observaciones.trim().length > 0) {
      // Permitido con observacion justificando
      return;
    }
    throw new Error(
      `No se puede finalizar: el conductor esta a ${Math.round(distanciaMetros)}m del destino (maximo permitido: ${radioMetros}m). ` +
      (permitirOverride
        ? 'Para finalizar desde esta distancia, incluye una observacion explicando el motivo.'
        : '')
    );
  }

  if (velocidadActual > velocidadMaxKmh) {
    throw new Error(
      `No se puede finalizar: el vehiculo esta en movimiento a ${velocidadActual.toFixed(1)} km/h. ` +
      `Detente antes de finalizar la entrega (maximo: ${velocidadMaxKmh} km/h).`
    );
  }
}

/**
 * Finaliza una entrega registrando firma y foto
 *
 * FLUJO:
 * 1. Validar que la entrega existe y esta activa
 * 1b. Validar proximidad al destino (geofence R7)
 * 2. Calcular metricas finales (distancia recorrida, tiempo real, etc)
 * 3. Finalizar entrega en BD (actualiza entrega, pedido, camion, conductor)
 * 4. Registrar evento de finalizacion
 *
 * @param entrega_id - ID de la entrega
 * @param firma_cliente - Firma del cliente en Base64 (opcional)
 * @param foto_comprobante - Foto en Base64 (opcional)
 * @param observaciones - Observaciones finales (opcional)
 * @returns Entrega finalizada con metricas
 */
export async function finalizarEntrega(
  entrega_id: number,
  firma_cliente?: string,
  foto_comprobante?: string,
  observaciones?: string
) {
  // Validar que la entrega existe
  const entrega = await entregasRepo.findEntregaById(entrega_id);

  if (!entrega) {
    throw new Error(`Entrega con ID ${entrega_id} no encontrada`);
  }

  if (entrega.entregado === true || !entrega.hora_salida_planta) {
    throw new Error(`La entrega no esta activa (entregado: ${entrega.entregado})`);
  }

  // Validacion de geofence: conductor debe estar cerca del destino
  await validarProximidadEntrega(entrega_id, entrega, observaciones);

  // Calcular metricas finales
  const distanciaRecorrida = await gpsRepo.calcularDistanciaRecorrida(entrega_id);
  const totalPosicionesGPS = await gpsRepo.contarPosicionesEntrega(entrega_id);

  // Recalcular ruta planificada para obtener metricas
  let distanciaPlanificada = null;
  let tiempoEstimado = null;
  let desviacionRuta = null;

  try {
    const rutaPlanificada = await rutasService.calcularRutaHastaPedido(entrega.pedido.id);
    distanciaPlanificada = rutaPlanificada.distancia_total_km;
    tiempoEstimado = rutaPlanificada.tiempo_estimado_minutos;

    // Calcular desviacion de ruta
    if (distanciaPlanificada && distanciaRecorrida > 0) {
      desviacionRuta = rutasService.calcularDesviacionRuta(distanciaRecorrida, distanciaPlanificada);
    }
  } catch (error) {
    // Si falla el calculo de ruta, continuar sin metricas de ruta
  }

  // Finalizar entrega en BD
  const entregaFinalizada = await entregasRepo.finalizarEntrega(
    entrega_id,
    firma_cliente,
    foto_comprobante,
    observaciones
  );

  // Persistir metricas de desviacion en la tabla entregas
  if (desviacionRuta !== null || distanciaPlanificada !== null) {
    const porcentajeAdherencia = desviacionRuta !== null
      ? Math.max(0, (1 - desviacionRuta) * 100)
      : null;
    const desviacionesDetectadas = (desviacionRuta !== null && desviacionRuta > 0.15) ? 1 : 0;

    await pool.query(
      `UPDATE entregas
       SET desviaciones_detectadas = $1,
           porcentaje_adherencia = $2
       WHERE id = $3`,
      [desviacionesDetectadas, porcentajeAdherencia, entrega_id]
    );
  }

  // Sincronizar grafo de operaciones en Neo4j
  try {
    await completarGrafoEntrega(entrega_id);
  } catch (errorGrafo) {
    console.error('Error al sincronizar grafo de entrega completada:', errorGrafo);
  }

  // Calcular tiempo real de entrega
  const tiempoRealMinutos = entrega.hora_salida_planta && entregaFinalizada.hora_llegada_cliente
    ? Math.round((entregaFinalizada.hora_llegada_cliente.getTime() - entrega.hora_salida_planta.getTime()) / (1000 * 60))
    : null;

  return {
    entrega: entregaFinalizada,
    metricas: {
      distancia_planificada_km: distanciaPlanificada,
      distancia_recorrida_km: distanciaRecorrida,
      desviacion_ruta_porcentaje: desviacionRuta ? (desviacionRuta * 100).toFixed(1) : null,
      tiempo_estimado_minutos: tiempoEstimado,
      tiempo_real_minutos: tiempoRealMinutos,
      total_posiciones_gps_registradas: totalPosicionesGPS
    }
  };
}

// Minimo de posiciones GPS en la ventana de 2 min para declarar DETENIDO
// Evita falsos positivos con pocas lecturas (ej: acaba de iniciar la entrega)
const MIN_POSICIONES_PARA_DETENIDO = 6;

// Determina si el vehiculo esta detenido usando logica hibrida
// 1. Si hay evento REANUDO reciente (dentro del periodo de gracia), confiar en el conductor
// 2. Si hay evento DETENIDO (sin REANUDO posterior), esta detenido
// 3. Buffer temporal: requiere minimo de lecturas bajas antes de declarar detenido
// 4. Fuera del periodo de gracia, usar velocidad promedio de 2 minutos
async function determinarSiDetenido(
  entrega_id: number,
  velocidadPromedio: number
): Promise<boolean> {
  // Obtener el ultimo evento de movimiento
  const ultimoEvento = await entregasRepo.obtenerUltimoEventoMovimiento(entrega_id);

  // Si hay un evento REANUDO reciente, verificar periodo de gracia
  if (ultimoEvento && ultimoEvento.tipo_evento === 'REANUDO') {
    const ahora = new Date();
    const tiempoEvento = new Date(ultimoEvento.created_at);
    const minutosDesdeEvento = (ahora.getTime() - tiempoEvento.getTime()) / 1000 / 60;

    // Dentro del periodo de gracia - confiar en el conductor
    if (minutosDesdeEvento < PERIODO_GRACIA_MINUTOS) {
      return false;
    }
  }

  // Si hay un evento DETENIDO reciente (sin REANUDO posterior), esta detenido
  if (ultimoEvento && ultimoEvento.tipo_evento === 'DETENIDO') {
    return true;
  }

  // Buffer temporal: si no hay suficientes posiciones en los ultimos 2 minutos,
  // no podemos determinar con confianza que esta detenido
  const posicionesRecientes = await gpsRepo.contarPosicionesRecientes(entrega_id, 2);
  if (posicionesRecientes < MIN_POSICIONES_PARA_DETENIDO) {
    return false;
  }

  // Fuera del periodo de gracia y con suficientes datos - usar velocidad promedio
  return rutasService.estaDetenido(velocidadPromedio);
}

// Determina si el vehiculo esta desviado de la ruta planificada
// Calcula distancia minima del punto GPS a todos los segmentos de la ruta
function determinarSiDesviado(
  entrega: any,
  latitud: number,
  longitud: number
): boolean {
  const nodos = entrega.pedido?.ruta_calculada?.nodos;
  if (!nodos || nodos.length < 2) return false;

  const distancia = rutasService.calcularDistanciaDesdeRuta(latitud, longitud, nodos);
  return distancia > UMBRAL_DESVIACION_KM;
}

/**
 * Obtiene el estado actual de una entrega con ultima posicion GPS
 *
 * Uso: Dashboard en tiempo real, consultar estado de entrega
 *
 * @param entrega_id - ID de la entrega
 * @returns Estado completo de la entrega
 */
export async function obtenerEstadoEntrega(entrega_id: number) {
  const entrega = await entregasRepo.findEntregaById(entrega_id);

  if (!entrega) {
    throw new Error(`Entrega con ID ${entrega_id} no encontrada`);
  }

  // Obtener ultima posicion GPS
  const ultimaPosicion = await gpsRepo.obtenerUltimaPosicion(entrega_id);

  // Calcular velocidad promedio de los ultimos 10 minutos
  const velocidadPromedio = await gpsRepo.calcularVelocidadPromedio(entrega_id, 2);

  // Detectar si esta detenido (logica hibrida con periodo de gracia)
  const estaDetenido = await determinarSiDetenido(entrega_id, velocidadPromedio);

  // Calcular ETA actualizado si esta en camino
  let etaActualizado = null;
  if (entrega.entregado === false && entrega.hora_salida_planta && ultimaPosicion && entrega.pedido?.latitud_entrega && entrega.pedido?.longitud_entrega) {
    const tiempoRestante = rutasService.calcularTiempoEstimadoLlegada(
      ultimaPosicion.latitud,
      ultimaPosicion.longitud,
      entrega.pedido.latitud_entrega,
      entrega.pedido.longitud_entrega,
      velocidadPromedio > 0 ? velocidadPromedio : 40
    );

    etaActualizado = new Date();
    etaActualizado.setMinutes(etaActualizado.getMinutes() + Math.ceil(tiempoRestante));
  }

  // Detectar desviacion de ruta
  let estaDesviado = false;
  if (ultimaPosicion && entrega.pedido?.ruta_calculada?.nodos) {
    estaDesviado = determinarSiDesviado(entrega, ultimaPosicion.latitud, ultimaPosicion.longitud);
  }

  return {
    entrega,
    posicion_actual: ultimaPosicion,
    velocidad_promedio_kmh: velocidadPromedio,
    esta_detenido: estaDetenido,
    esta_desviado: estaDesviado,
    eta_actualizado: etaActualizado
  };
}

/**
 * Obtiene el historial de tracking de una entrega
 *
 * Uso: Ver ruta completa que siguio el camion
 *
 * @param entrega_id - ID de la entrega
 * @param limite - Limite de posiciones a retornar
 * @param offset - Offset para paginacion
 * @returns Historial de posiciones GPS
 */
export async function obtenerHistorialTracking(
  entrega_id: number,
  limite: number = 100,
  offset: number = 0
) {
  const entrega = await entregasRepo.findEntregaById(entrega_id);

  if (!entrega) {
    throw new Error(`Entrega con ID ${entrega_id} no encontrada`);
  }

  const posiciones = await gpsRepo.obtenerPosicionesEntrega(entrega_id, limite, offset);
  const totalPosiciones = await gpsRepo.contarPosicionesEntrega(entrega_id);

  return {
    entrega: {
      id: entrega.id,
      entregado: entrega.entregado,
      pedido: entrega.pedido,
      camion: entrega.camion,
      conductor: entrega.conductor
    },
    posiciones,
    paginacion: {
      total: totalPosiciones,
      limite,
      offset,
      tiene_mas: offset + limite < totalPosiciones
    }
  };
}

/**
 * Obtiene todas las entregas activas con sus posiciones actuales
 *
 * Uso: Dashboard principal, ver todos los camiones en ruta
 *
 * @returns Array de entregas activas con posiciones
 */
export async function obtenerEntregasActivas() {
  const entregas = await entregasRepo.findEntregasActivas();

  const entregasConPosicion = await Promise.all(
    entregas.map(async (entrega) => {
      const ultimaPosicion = await gpsRepo.obtenerUltimaPosicion(entrega.id);
      const velocidadPromedio = await gpsRepo.calcularVelocidadPromedio(entrega.id, 2);

      // Usar logica hibrida con periodo de gracia
      const estaDetenido = await determinarSiDetenido(entrega.id, velocidadPromedio);

      // Detectar desviacion de ruta
      let estaDesviado = false;
      if (ultimaPosicion && entrega.pedido?.ruta_calculada?.nodos) {
        estaDesviado = determinarSiDesviado(entrega, ultimaPosicion.latitud, ultimaPosicion.longitud);
      }

      return {
        ...entrega,
        posicion_actual: ultimaPosicion,
        velocidad_promedio_kmh: velocidadPromedio,
        esta_detenido: estaDetenido,
        esta_desviado: estaDesviado
      };
    })
  );

  return entregasConPosicion;
}

/**
 * Obtiene el historial de eventos de una entrega
 *
 * Uso: Auditoria, timeline de eventos
 *
 * @param entrega_id - ID de la entrega
 * @returns Array de eventos ordenados cronologicamente
 */
export async function obtenerEventosEntrega(entrega_id: number) {
  const entrega = await entregasRepo.findEntregaById(entrega_id);

  if (!entrega) {
    throw new Error(`Entrega con ID ${entrega_id} no encontrada`);
  }

  const eventos = await entregasRepo.obtenerEventosEntrega(entrega_id);

  return {
    entrega: {
      id: entrega.id,
      entregado: entrega.entregado,
      pedido: entrega.pedido
    },
    eventos
  };
}

/**
 * Cancela una entrega en progreso
 *
 * FLUJO:
 * 1. Validar que la entrega existe y esta activa
 * 2. Cancelar entrega en BD (libera camion y conductor)
 * 3. Registrar evento de cancelacion
 *
 * @param entrega_id - ID de la entrega
 * @param motivo - Motivo de la cancelacion
 * @returns Entrega cancelada
 */
export async function cancelarEntrega(entrega_id: number, motivo: string) {
  const entrega = await entregasRepo.findEntregaById(entrega_id);

  if (!entrega) {
    throw new Error(`Entrega con ID ${entrega_id} no encontrada`);
  }

  if (entrega.entregado === true || !entrega.hora_salida_planta) {
    throw new Error(`La entrega no esta activa (entregado: ${entrega.entregado})`);
  }

  const entregaCancelada = await entregasRepo.cancelarEntrega(entrega_id, motivo);

  return {
    entrega: entregaCancelada,
    mensaje: 'Entrega cancelada exitosamente. El camion y conductor estan disponibles nuevamente.'
  };
}

/**
 * Obtiene estadisticas generales de entregas
 *
 * Uso: Dashboard de metricas, reportes
 *
 * @returns Estadisticas de entregas
 */
export async function obtenerEstadisticasEntregas() {
  const totalEnCamino = await entregasRepo.contarEntregasPorEstado('EN_CAMINO');
  const totalCompletadas = await entregasRepo.contarEntregasPorEstado('COMPLETADA');
  const totalCanceladas = await entregasRepo.contarEntregasPorEstado('CANCELADA');

  return {
    en_camino: totalEnCamino,
    completadas: totalCompletadas,
    canceladas: totalCanceladas,
    total: totalEnCamino + totalCompletadas + totalCanceladas
  };
}

/**
 * Registra un evento de movimiento reportado por el conductor
 *
 * FLUJO:
 * 1. Validar que la entrega existe y esta activa
 * 2. Validar que el tipo de evento es correcto
 * 3. Registrar evento en BD
 *
 * @param entrega_id - ID de la entrega
 * @param tipo - Tipo de evento (DETENIDO, REANUDO)
 * @param motivo - Motivo de la detencion (opcional)
 * @param descripcion - Descripcion adicional (opcional)
 * @param latitud - Latitud donde ocurrio (opcional)
 * @param longitud - Longitud donde ocurrio (opcional)
 * @returns Evento registrado
 */
export async function registrarEventoMovimiento(
  entrega_id: number,
  tipo: 'DETENIDO' | 'REANUDO',
  motivo?: string,
  descripcion?: string,
  latitud?: number,
  longitud?: number
) {
  // Validar que la entrega existe y esta activa
  const entrega = await entregasRepo.findEntregaById(entrega_id);

  if (!entrega) {
    throw new Error(`Entrega con ID ${entrega_id} no encontrada`);
  }

  if (entrega.entregado === true || !entrega.hora_salida_planta) {
    throw new Error(`La entrega no esta activa (entregado: ${entrega.entregado})`);
  }

  // Construir descripcion completa
  let descripcionCompleta = '';
  if (tipo === 'DETENIDO' && motivo) {
    descripcionCompleta = `Motivo: ${motivo}`;
    if (descripcion) {
      descripcionCompleta += ` - ${descripcion}`;
    }
  } else if (descripcion) {
    descripcionCompleta = descripcion;
  }

  // Registrar evento
  const evento = await entregasRepo.registrarEventoMovimiento(
    entrega_id,
    tipo,
    descripcionCompleta || undefined,
    latitud,
    longitud
  );

  return {
    evento,
    mensaje: tipo === 'DETENIDO'
      ? 'Detencion reportada correctamente'
      : 'Reanudacion de marcha reportada correctamente'
  };
}
