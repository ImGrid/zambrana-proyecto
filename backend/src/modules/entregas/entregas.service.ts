import * as entregasRepo from './entregas.repository.js';
import * as gpsRepo from './gps.repository.js';
import * as rutasService from './rutas.service.js';
import { pool } from '../../database/postgres/pool.js';

/**
 * Inicia una nueva entrega para un pedido
 *
 * FLUJO COMPLETO:
 * 1. Validar que el pedido existe y esta confirmado
 * 2. Calcular ruta desde planta hasta cliente usando Neo4j
 * 3. Asignar camion y conductor disponibles
 * 4. Crear entrega con la ruta calculada
 * 5. Actualizar estados de pedido, camion y conductor
 *
 * @param pedido_id - ID del pedido a entregar
 * @returns Entrega creada con todos los detalles
 */
export async function iniciarEntrega(pedido_id: number) {
  // Validar que el pedido existe y obtener el cliente_id
  const pedidoResult = await pool.query(
    `SELECT p.id, p.codigo_seguimiento, p.cliente_id, e.nombre as estado
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

  // Verificar que no exista una entrega previa para este pedido
  const entregaExistente = await entregasRepo.findEntregaByPedidoId(pedido_id);
  if (entregaExistente) {
    throw new Error(`El pedido ${pedido.codigo_seguimiento} ya tiene una entrega asignada`);
  }

  // Calcular ruta desde planta hasta cliente usando Neo4j
  const rutaCompleta = await rutasService.calcularRutaHastaPedido(pedido_id);

  // Buscar camion disponible
  const camionResult = await pool.query(
    `SELECT id, placa, modelo
     FROM camiones
     WHERE activo = TRUE
     ORDER BY id
     LIMIT 1`
  );

  if (camionResult.rows.length === 0) {
    throw new Error('No hay camiones disponibles en este momento');
  }

  const camion = camionResult.rows[0];

  // Buscar conductor disponible
  const conductorResult = await pool.query(
    `SELECT id, nombre_completo
     FROM conductores
     WHERE activo = TRUE
     ORDER BY id
     LIMIT 1`
  );

  if (conductorResult.rows.length === 0) {
    throw new Error('No hay conductores disponibles en este momento');
  }

  const conductor = conductorResult.rows[0];

  // Crear identificador de ruta planificada
  const rutaPlanificadaId = `PLANTA->${rutaCompleta.interseccion_destino.id}`;

  // Crear la entrega
  const entrega = await entregasRepo.createEntrega(
    pedido_id,
    camion.id,
    conductor.id,
    rutaPlanificadaId
  );

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

/**
 * Finaliza una entrega registrando firma y foto
 *
 * FLUJO:
 * 1. Validar que la entrega existe y esta activa
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
  const velocidadPromedio = await gpsRepo.calcularVelocidadPromedio(entrega_id, 10);

  // Detectar si esta detenido
  const estaDetenido = rutasService.estaDetenido(velocidadPromedio);

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

  return {
    entrega,
    posicion_actual: ultimaPosicion,
    velocidad_promedio_kmh: velocidadPromedio,
    esta_detenido: estaDetenido,
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
      const velocidadPromedio = await gpsRepo.calcularVelocidadPromedio(entrega.id, 10);

      return {
        ...entrega,
        posicion_actual: ultimaPosicion,
        velocidad_promedio_kmh: velocidadPromedio,
        esta_detenido: rutasService.estaDetenido(velocidadPromedio)
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
