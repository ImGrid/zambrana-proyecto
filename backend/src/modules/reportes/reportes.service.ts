import * as reportesRepo from './reportes.repository.js';

// Tipos para respuestas del servicio

interface DashboardResult {
  success: boolean;
  data?: {
    metricas: Array<{
      fecha: string;
      total_pedidos: number;
      entregados: number;
      cancelados: number;
      en_proceso: number;
      ingresos_dia: number;
      tiempo_promedio_entrega: number | null;
      conductores_activos: number;
      camiones_activos: number;
    }>;
    resumen: {
      total_pedidos: number;
      total_ingresos: number;
      promedio_diario: number;
      tasa_entrega: number;
    };
  };
  message?: string;
}

interface ClienteMensualResult {
  success: boolean;
  data?: {
    cliente: {
      id: number;
      razon_social: string;
    };
    reportes: Array<{
      mes: string;
      total_pedidos: number;
      total_gastado: number;
      total_m3_comprados: number;
      tiempo_promedio_entrega: number | null;
      pedidos_cancelados: number;
      pedidos_entregados: number;
    }>;
    totales: {
      total_pedidos: number;
      total_gastado: number;
      total_m3: number;
    };
  };
  message?: string;
}

interface ConductorRendimientoResult {
  success: boolean;
  data?: {
    conductor: {
      id: number;
      nombre_completo: string;
    };
    total_entregas: number;
    tiempo_promedio_entrega: number | null;
    entregas_exitosas: number;
    entregas_fallidas: number;
    adherencia_promedio_ruta: number | null;
    total_desviaciones: number;
    tasa_exito: number;
  };
  message?: string;
}

interface StockResult {
  success: boolean;
  data?: {
    materiales: Array<{
      material_id: number;
      nombre: string;
      codigo: string;
      stock_actual: number;
      stock_minimo: number;
      precio_m3: number;
      total_movimientos_30dias: number;
      entradas_30dias: number;
      salidas_30dias: number;
      estado_stock: string;
    }>;
    resumen: {
      total_materiales: number;
      criticos: number;
      bajos: number;
      normales: number;
    };
  };
  message?: string;
}

interface VentasResult {
  success: boolean;
  data?: {
    ventas: Array<{
      pedido_id: number;
      codigo_seguimiento: string;
      fecha_pedido: string;
      cliente_razon_social: string;
      material_nombre: string;
      cantidad_m3: number;
      precio_unitario: number;
      subtotal: number;
      estado_nombre: string;
    }>;
    total: number;
    limit: number;
    offset: number;
    totales: {
      total_ventas: number;
      total_m3: number;
      monto_total: number;
    };
  };
  message?: string;
}

/**
 * Obtener dashboard con métricas y resumen
 */
export async function getDashboard(dias: number = 30): Promise<DashboardResult> {
  try {
    const metricas = await reportesRepo.getDashboardMetricas(dias);

    // Calcular resumen agregado
    let totalPedidos = 0;
    let totalIngresos = 0;
    let totalEntregados = 0;

    for (const metrica of metricas) {
      totalPedidos += Number(metrica.total_pedidos);
      totalIngresos += Number(metrica.ingresos_dia);
      totalEntregados += Number(metrica.entregados);
    }

    const promedioDiario = metricas.length > 0 ? totalIngresos / metricas.length : 0;
    const tasaEntrega = totalPedidos > 0 ? (totalEntregados / totalPedidos) * 100 : 0;

    return {
      success: true,
      data: {
        metricas: metricas.map(m => ({
          fecha: (m.fecha?.toISOString().split('T')[0]) ?? '',
          total_pedidos: Number(m.total_pedidos),
          entregados: Number(m.entregados),
          cancelados: Number(m.cancelados),
          en_proceso: Number(m.en_proceso),
          ingresos_dia: Number(m.ingresos_dia),
          tiempo_promedio_entrega: m.tiempo_promedio_entrega ? Number(m.tiempo_promedio_entrega) : null,
          conductores_activos: Number(m.conductores_activos),
          camiones_activos: Number(m.camiones_activos)
        })),
        resumen: {
          total_pedidos: totalPedidos,
          total_ingresos: totalIngresos,
          promedio_diario: Math.round(promedioDiario * 100) / 100,
          tasa_entrega: Math.round(tasaEntrega * 100) / 100
        }
      }
    };
  } catch (error) {
    console.error('Error al obtener dashboard:', error);
    return {
      success: false,
      message: 'Error al obtener métricas del dashboard'
    };
  }
}

/**
 * Obtener reporte mensual de cliente
 */
export async function getClienteMensual(
  clienteId: number,
  meses: number = 6
): Promise<ClienteMensualResult> {
  try {
    // Verificar que el cliente existe
    const cliente = await reportesRepo.findClienteById(clienteId);

    if (!cliente) {
      return {
        success: false,
        message: 'Cliente no encontrado'
      };
    }

    const reportes = await reportesRepo.getClienteMensual(clienteId, meses);

    // Calcular totales
    let totalPedidos = 0;
    let totalGastado = 0;
    let totalM3 = 0;

    for (const reporte of reportes) {
      totalPedidos += Number(reporte.total_pedidos);
      totalGastado += Number(reporte.total_gastado);
      totalM3 += Number(reporte.total_m3_comprados);
    }

    return {
      success: true,
      data: {
        cliente: {
          id: cliente.id,
          razon_social: cliente.razon_social
        },
        reportes: reportes.map(r => ({
          mes: (r.mes?.toISOString().split('T')[0]?.substring(0, 7)) ?? '',
          total_pedidos: Number(r.total_pedidos),
          total_gastado: Number(r.total_gastado),
          total_m3_comprados: Number(r.total_m3_comprados),
          tiempo_promedio_entrega: r.tiempo_promedio_entrega ? Number(r.tiempo_promedio_entrega) : null,
          pedidos_cancelados: Number(r.pedidos_cancelados),
          pedidos_entregados: Number(r.pedidos_entregados)
        })),
        totales: {
          total_pedidos: totalPedidos,
          total_gastado: Math.round(totalGastado * 100) / 100,
          total_m3: Math.round(totalM3 * 100) / 100
        }
      }
    };
  } catch (error) {
    console.error('Error al obtener reporte mensual de cliente:', error);
    return {
      success: false,
      message: 'Error al obtener reporte del cliente'
    };
  }
}

/**
 * Obtener rendimiento de conductor
 */
export async function getConductorRendimiento(
  conductorId: number
): Promise<ConductorRendimientoResult> {
  try {
    // Verificar que el conductor existe
    const conductor = await reportesRepo.findConductorById(conductorId);

    if (!conductor) {
      return {
        success: false,
        message: 'Conductor no encontrado'
      };
    }

    const rendimiento = await reportesRepo.getConductorRendimiento(conductorId);

    if (!rendimiento) {
      return {
        success: true,
        data: {
          conductor: {
            id: conductor.id,
            nombre_completo: conductor.nombre_completo
          },
          total_entregas: 0,
          tiempo_promedio_entrega: null,
          entregas_exitosas: 0,
          entregas_fallidas: 0,
          adherencia_promedio_ruta: null,
          total_desviaciones: 0,
          tasa_exito: 0
        }
      };
    }

    const totalEntregas = Number(rendimiento.total_entregas);
    const exitosas = Number(rendimiento.entregas_exitosas);
    const tasaExito = totalEntregas > 0 ? (exitosas / totalEntregas) * 100 : 0;

    return {
      success: true,
      data: {
        conductor: {
          id: conductor.id,
          nombre_completo: conductor.nombre_completo
        },
        total_entregas: totalEntregas,
        tiempo_promedio_entrega: rendimiento.tiempo_promedio_entrega
          ? Number(rendimiento.tiempo_promedio_entrega)
          : null,
        entregas_exitosas: exitosas,
        entregas_fallidas: Number(rendimiento.entregas_fallidas),
        adherencia_promedio_ruta: rendimiento.adherencia_promedio_ruta
          ? Number(rendimiento.adherencia_promedio_ruta)
          : null,
        total_desviaciones: Number(rendimiento.total_desviaciones),
        tasa_exito: Math.round(tasaExito * 100) / 100
      }
    };
  } catch (error) {
    console.error('Error al obtener rendimiento de conductor:', error);
    return {
      success: false,
      message: 'Error al obtener rendimiento del conductor'
    };
  }
}

/**
 * Obtener resumen de stock
 */
export async function getResumenStock(estadoFiltro?: string): Promise<StockResult> {
  try {
    const materiales = await reportesRepo.getResumenStock(estadoFiltro);

    // Calcular resumen
    let criticos = 0;
    let bajos = 0;
    let normales = 0;

    for (const material of materiales) {
      if (material.estado_stock === 'CRÍTICO') criticos++;
      else if (material.estado_stock === 'BAJO') bajos++;
      else normales++;
    }

    return {
      success: true,
      data: {
        materiales: materiales.map(m => ({
          material_id: m.material_id,
          nombre: m.nombre,
          codigo: m.codigo,
          stock_actual: Number(m.stock_actual),
          stock_minimo: Number(m.stock_minimo),
          precio_m3: Number(m.precio_m3),
          total_movimientos_30dias: Number(m.total_movimientos_30dias),
          entradas_30dias: Number(m.entradas_30dias),
          salidas_30dias: Number(m.salidas_30dias),
          estado_stock: m.estado_stock
        })),
        resumen: {
          total_materiales: materiales.length,
          criticos,
          bajos,
          normales
        }
      }
    };
  } catch (error) {
    console.error('Error al obtener resumen de stock:', error);
    return {
      success: false,
      message: 'Error al obtener resumen de stock'
    };
  }
}

/**
 * Obtener reporte de ventas detallado
 */
export async function getVentas(
  limit: number = 50,
  offset: number = 0,
  filters: {
    fecha_desde?: string;
    fecha_hasta?: string;
    cliente_id?: number;
    material_id?: number;
  } = {}
): Promise<VentasResult> {
  try {
    const [ventas, total, totales] = await Promise.all([
      reportesRepo.getVentasDetalladas(limit, offset, filters),
      reportesRepo.countVentas(filters),
      reportesRepo.getTotalesVentas(filters)
    ]);

    return {
      success: true,
      data: {
        ventas: ventas.map(v => ({
          pedido_id: v.pedido_id,
          codigo_seguimiento: v.codigo_seguimiento,
          fecha_pedido: v.fecha_pedido.toISOString(),
          cliente_razon_social: v.cliente_razon_social,
          material_nombre: v.material_nombre,
          cantidad_m3: Number(v.cantidad_m3),
          precio_unitario: Number(v.precio_unitario),
          subtotal: Number(v.subtotal),
          estado_nombre: v.estado_nombre
        })),
        total,
        limit,
        offset,
        totales: {
          total_ventas: totales.total_ventas,
          total_m3: Math.round(totales.total_m3 * 100) / 100,
          monto_total: Math.round(totales.monto_total * 100) / 100
        }
      }
    };
  } catch (error) {
    console.error('Error al obtener reporte de ventas:', error);
    return {
      success: false,
      message: 'Error al obtener reporte de ventas'
    };
  }
}

/**
 * Refrescar vistas materializadas
 */
export async function refreshViews(): Promise<{
  success: boolean;
  data?: {
    refreshed: string[];
    errors: Array<{ view: string; error: string }>;
    duration_ms: number;
  };
  message?: string;
}> {
  try {
    const result = await reportesRepo.refreshMaterializedViews();

    if (!result.success) {
      return {
        success: false,
        message: `Algunas vistas no se pudieron refrescar: ${result.errors.map(e => e.view).join(', ')}`,
        data: result
      };
    }

    return {
      success: true,
      data: result,
      message: `${result.refreshed.length} vistas materializadas refrescadas exitosamente en ${result.duration_ms}ms`
    };
  } catch (error) {
    console.error('Error al refrescar vistas materializadas:', error);
    return {
      success: false,
      message: 'Error al refrescar vistas materializadas'
    };
  }
}
