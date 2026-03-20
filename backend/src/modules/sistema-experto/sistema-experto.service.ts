import { pool } from '../../database/postgres/pool.js';

// Tipos internos para queries
interface PedidoBase {
  id: number;
  codigo_seguimiento: string;
  total_m3: string;
  zona_id: number | null;
  zona_nombre: string | null;
  direccion_entrega: string;
  fecha_entrega_solicitada: string | null;
  estado_actual_id: number;
}

interface CamionDisponible {
  id: number;
  placa: string;
  modelo: string | null;
  capacidad_m3: string;
  tipo_camion: string;
}

interface ConductorDisponible {
  id: number;
  nombre_completo: string;
}

interface PedidoZona {
  id: number;
}

interface PedidoPendienteFecha {
  id: number;
  fecha_entrega_solicitada: string;
}

interface ReglaRow {
  codigo: string;
  nombre: string;
  descripcion: string | null;
  activa: boolean;
  parametros: unknown;
  prioridad: number;
}

interface ZonaInfo {
  factor_hora_pico: string;
  nombre: string;
}

// Genera sugerencia completa para un pedido pendiente
export async function generarSugerencia(pedidoId: number) {
  // Obtener datos del pedido
  const pedidoResult = await pool.query<PedidoBase>(
    `SELECT p.id, p.codigo_seguimiento, p.total_m3, p.zona_id,
            z.nombre as zona_nombre, p.direccion_entrega,
            p.fecha_entrega_solicitada, p.estado_actual_id
     FROM pedidos p
     LEFT JOIN zonas_entrega z ON p.zona_id = z.id
     WHERE p.id = $1`,
    [pedidoId]
  );

  const pedido = pedidoResult.rows[0];
  if (!pedido) {
    throw new Error('Pedido no encontrado');
  }

  if (pedido.estado_actual_id !== 1) {
    throw new Error('Solo se pueden generar sugerencias para pedidos en estado PENDIENTE');
  }

  const totalM3 = parseFloat(pedido.total_m3);
  const warnings: string[] = [];
  const reglasAplicadas: string[] = [];

  // R1: Camiones disponibles por capacidad
  const camionesResult = await pool.query<CamionDisponible>(
    `SELECT c.id, c.placa, c.modelo, c.capacidad_m3, tc.nombre as tipo_camion
     FROM camiones c
     INNER JOIN tipo_camion tc ON c.tipo_camion_id = tc.id
     WHERE c.activo = TRUE
       AND c.en_mantenimiento = FALSE
       AND c.id NOT IN (
         SELECT camion_asignado_id FROM pedidos
         WHERE estado_actual_id IN (2, 3, 4, 5)
         AND camion_asignado_id IS NOT NULL
       )
     ORDER BY c.capacidad_m3 ASC`,
    []
  );

  const camionesDisponibles = camionesResult.rows.map(c => ({
    id: c.id,
    placa: c.placa,
    modelo: c.modelo,
    capacidad_m3: parseFloat(c.capacidad_m3),
    tipo_camion: c.tipo_camion,
  }));

  // Filtrar candidatos con capacidad suficiente
  const candidatos = camionesDisponibles.filter(c => c.capacidad_m3 >= totalM3);
  const recomendado = candidatos[0] || null;

  let motivoCamion = 'Sin camiones disponibles';
  if (recomendado) {
    if (recomendado.capacidad_m3 === totalM3) {
      motivoCamion = 'Capacidad exacta';
    } else {
      motivoCamion = 'Menor capacidad suficiente disponible';
    }
  } else if (camionesDisponibles.length > 0) {
    motivoCamion = 'Ningun camion disponible cubre el volumen requerido';
  }

  reglasAplicadas.push('R1_ASIGNACION_CAPACIDAD');

  // R6: Multiples viajes
  let requiereMultiplesViajes = false;
  let numeroViajes: number | null = null;
  let volumenPorViaje: number | null = null;

  if (candidatos.length === 0 && camionesDisponibles.length > 0) {
    // Ningun camion cubre el volumen, usar el de mayor capacidad
    const maxCapacidad = camionesDisponibles[camionesDisponibles.length - 1]!;
    requiereMultiplesViajes = true;
    numeroViajes = Math.ceil(totalM3 / maxCapacidad.capacidad_m3);
    volumenPorViaje = parseFloat((totalM3 / numeroViajes).toFixed(2));
    motivoCamion = `Requiere ${numeroViajes} viajes con ${maxCapacidad.placa}`;
    warnings.push(
      `Volumen solicitado (${totalM3} m3) excede la capacidad de camiones disponibles. Se requieren ${numeroViajes} viajes.`
    );
    reglasAplicadas.push('R6_MULTIPLES_VIAJES');
  } else if (totalM3 > 25) {
    // Excede capacidad maxima posible
    const maxCapDisponible = camionesDisponibles.length > 0
      ? camionesDisponibles[camionesDisponibles.length - 1]!.capacidad_m3
      : 25;
    requiereMultiplesViajes = true;
    numeroViajes = Math.ceil(totalM3 / maxCapDisponible);
    volumenPorViaje = parseFloat((totalM3 / numeroViajes).toFixed(2));
    motivoCamion = `Requiere ${numeroViajes} viajes (volumen excede capacidad maxima)`;
    warnings.push(
      `Volumen solicitado (${totalM3} m3) excede la capacidad maxima (25 m3). Se requieren ${numeroViajes} viajes.`
    );
    reglasAplicadas.push('R6_MULTIPLES_VIAJES');
  }

  // Conductores disponibles
  const conductoresResult = await pool.query<ConductorDisponible>(
    `SELECT co.id, co.nombre_completo
     FROM conductores co
     WHERE co.activo = TRUE
       AND co.id NOT IN (
         SELECT conductor_asignado_id FROM pedidos
         WHERE estado_actual_id IN (2, 3, 4, 5)
         AND conductor_asignado_id IS NOT NULL
       )
     ORDER BY co.nombre_completo ASC`,
    []
  );

  const conductoresDisponibles = conductoresResult.rows;
  const conductorRecomendado = conductoresDisponibles[0] || null;

  // R3: Agrupacion por zona
  let pedidosMismaZona = 0;
  let sugerirAgrupacion = false;
  let pedidosIdsZona: number[] = [];

  if (pedido.zona_id) {
    const zonaResult = await pool.query<PedidoZona>(
      `SELECT id FROM pedidos
       WHERE estado_actual_id = 1
         AND zona_id = $1
         AND id != $2`,
      [pedido.zona_id, pedidoId]
    );

    pedidosMismaZona = zonaResult.rows.length;
    sugerirAgrupacion = pedidosMismaZona >= 1;
    pedidosIdsZona = zonaResult.rows.map(r => r.id);

    if (sugerirAgrupacion) {
      warnings.push(
        `Hay ${pedidosMismaZona} pedido(s) pendiente(s) en la misma zona (${pedido.zona_nombre}). Considere agrupar entregas.`
      );
    }
    reglasAplicadas.push('R3_AGRUPACION_ZONA');
  }

  // R5: Prioridad por fecha solicitada
  let tieneFechaSolicitada = false;
  let urgencia: 'alta' | 'media' | 'baja' | null = null;
  let pedidosMasUrgentes = 0;
  let fechaSolicitadaStr: string | null = null;

  const pendientesConFechaResult = await pool.query<PedidoPendienteFecha>(
    `SELECT id, fecha_entrega_solicitada::text as fecha_entrega_solicitada
     FROM pedidos
     WHERE estado_actual_id = 1
       AND fecha_entrega_solicitada IS NOT NULL
       AND id != $1
     ORDER BY fecha_entrega_solicitada ASC`,
    [pedidoId]
  );

  if (pedido.fecha_entrega_solicitada) {
    tieneFechaSolicitada = true;
    fechaSolicitadaStr = new Date(pedido.fecha_entrega_solicitada).toISOString();

    // Calcular urgencia basada en diferencia de dias
    const fechaSolicitada = new Date(pedido.fecha_entrega_solicitada);
    const ahora = new Date();
    const diffMs = fechaSolicitada.getTime() - ahora.getTime();
    const diffHoras = diffMs / (1000 * 60 * 60);

    if (diffHoras <= 24) {
      urgencia = 'alta';
    } else if (diffHoras <= 72) {
      urgencia = 'media';
    } else {
      urgencia = 'baja';
    }

    // Contar pedidos mas urgentes (con fecha anterior a la del pedido actual)
    pedidosMasUrgentes = pendientesConFechaResult.rows.filter(p => {
      return new Date(p.fecha_entrega_solicitada) < fechaSolicitada;
    }).length;

    if (pedidosMasUrgentes > 0) {
      warnings.push(
        `Hay ${pedidosMasUrgentes} pedido(s) pendiente(s) con fecha de entrega mas urgente.`
      );
    }

    if (urgencia === 'alta') {
      warnings.push('Este pedido tiene urgencia ALTA (entrega solicitada en menos de 24 horas).');
    }
  }

  reglasAplicadas.push('R5_ENTREGA_PROGRAMADA');

  // R2: Warning hora pico (informativo)
  const horaActual = new Date();
  const hora = horaActual.getHours();
  const esHoraPico = (hora >= 7 && hora < 9) || (hora >= 18 && hora < 20);

  if (esHoraPico && pedido.zona_id) {
    const zonaInfoResult = await pool.query<ZonaInfo>(
      'SELECT factor_hora_pico, nombre FROM zonas_entrega WHERE id = $1',
      [pedido.zona_id]
    );

    const zona = zonaInfoResult.rows[0];
    if (zona) {
      const factor = parseFloat(zona.factor_hora_pico);
      warnings.push(
        `Hora pico activa. Zona ${zona.nombre} tiene factor x${factor} en tiempos de entrega.`
      );
    }
  }

  reglasAplicadas.push('R2_HORA_PICO');

  // Warnings adicionales
  if (camionesDisponibles.length === 0) {
    warnings.push('No hay camiones disponibles en este momento.');
  }

  if (conductoresDisponibles.length === 0) {
    warnings.push('No hay conductores disponibles en este momento.');
  }

  return {
    pedido: {
      id: pedido.id,
      codigo_seguimiento: pedido.codigo_seguimiento,
      total_m3: totalM3,
      zona_id: pedido.zona_id,
      zona_nombre: pedido.zona_nombre,
      direccion_entrega: pedido.direccion_entrega,
      fecha_entrega_solicitada: fechaSolicitadaStr,
    },
    sugerencia_camion: {
      recomendado: requiereMultiplesViajes && candidatos.length === 0
        ? (camionesDisponibles[camionesDisponibles.length - 1] || null)
        : recomendado,
      candidatos,
      motivo: motivoCamion,
    },
    sugerencia_conductor: {
      recomendado: conductorRecomendado,
      disponibles: conductoresDisponibles,
    },
    multiples_viajes: {
      requiere: requiereMultiplesViajes,
      numero_viajes: numeroViajes,
      volumen_por_viaje: volumenPorViaje,
    },
    agrupacion_zona: {
      pedidos_misma_zona: pedidosMismaZona,
      sugerir_agrupacion: sugerirAgrupacion,
      pedidos_ids: pedidosIdsZona,
    },
    prioridad: {
      tiene_fecha_solicitada: tieneFechaSolicitada,
      fecha_solicitada: fechaSolicitadaStr,
      urgencia,
      pedidos_mas_urgentes: pedidosMasUrgentes,
    },
    warnings,
    reglas_aplicadas: reglasAplicadas,
  };
}

// Obtener todas las reglas de configuracion
export async function obtenerReglas() {
  const result = await pool.query<ReglaRow>(
    `SELECT codigo, nombre, descripcion, activa, parametros, prioridad
     FROM configuracion_reglas
     ORDER BY prioridad ASC`
  );

  return result.rows;
}
