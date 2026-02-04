import * as pedidosRepo from './pedidos.repository.js';
import { pool } from '../../database/postgres/pool.js';
import { calcularRutaHastaPedido } from '../entregas/rutas.service.js';

// =====================================================
// TIPOS PARA RESPUESTAS
// =====================================================

interface Pedido {
  id: number;
  codigo_seguimiento: string;
  cliente_id: number;
  cliente_razon_social: string;
  estado_actual_id: number;
  estado_nombre: string;
  direccion_entrega: string;
  latitud_entrega: number | null;
  longitud_entrega: number | null;
  referencia_ubicacion: string | null;
  zona_id: number | null;
  zona_nombre: string | null;
  camion_asignado_id: number | null;
  camion_placa: string | null;
  conductor_asignado_id: number | null;
  conductor_nombre: string | null;
  fecha_pedido: string;
  fecha_entrega_solicitada: string | null;
  fecha_entrega_estimada: string | null;
  fecha_entrega_real: string | null;
  total_m3: number;
  monto_total: number;
  eta_minutos: number | null;
  distancia_km: number | null;
  observaciones: string | null;
  motivo_rechazo: string | null;
  created_at: string;
  updated_at: string;
  items?: Array<{
    id: number;
    material_id: number;
    material_nombre: string;
    cantidad_m3: number;
    precio_unitario: number;
    subtotal: number;
    created_at: string;
  }>;
}

interface PedidoListItem {
  id: number;
  codigo_seguimiento: string;
  cliente_razon_social: string;
  estado_nombre: string;
  direccion_entrega: string;
  fecha_pedido: string;
  fecha_entrega_solicitada: string | null;
  total_m3: number;
  monto_total: number;
  camion_placa: string | null;
  conductor_nombre: string | null;
}

interface CreatePedidoResult {
  success: boolean;
  pedido?: Pedido;
  message?: string;
}

interface ListPedidosResult {
  success: boolean;
  pedidos?: PedidoListItem[];
  total?: number;
  limit?: number;
  offset?: number;
  message?: string;
}

interface GetPedidoResult {
  success: boolean;
  pedido?: Pedido;
  message?: string;
}

interface TrackingResult {
  success: boolean;
  tracking?: {
    codigo_seguimiento: string;
    estado_actual: string;
    direccion_entrega: string;
    fecha_pedido: string;
    fecha_entrega_estimada: string | null;
    eta_minutos: number | null;
    total_m3: number;
    historial: Array<{
      estado: string;
      fecha: string;
    }>;
  };
  message?: string;
}

interface HistorialResult {
  success: boolean;
  historial?: Array<{
    id: number;
    estado_nombre: string;
    usuario_nombre: string | null;
    comentario: string | null;
    created_at: string;
  }>;
  message?: string;
}

//crear pedido
export async function createPedido(data: {
  cliente_id: number;
  direccion_entrega: string;
  latitud_entrega: number;
  longitud_entrega: number;
  referencia_ubicacion?: string;
  fecha_entrega_solicitada?: string;
  observaciones?: string;
  items: Array<{
    material_id: number;
    cantidad_m3: number;
    precio_unitario?: number;
  }>;
}): Promise<CreatePedidoResult> {
  try {
    // Validar que el cliente existe
    const clienteResult = await pool.query('SELECT id FROM clientes WHERE id = $1', [
      data.cliente_id,
    ]);

    if (clienteResult.rows.length === 0) {
      return {
        success: false,
        message: 'Cliente no encontrado',
      };
    }

    // Validar y obtener precios de materiales
    const itemsConPrecios: pedidosRepo.CreateDetallePedidoData[] = [];

    for (const item of data.items) {
      // Obtener material
      const materialResult = await pool.query<{
        id: number;
        precio_m3: number;
        activo: boolean;
        stock_actual: number;
      }>('SELECT id, precio_m3, activo, stock_actual FROM materiales WHERE id = $1', [
        item.material_id,
      ]);

      if (materialResult.rows.length === 0) {
        return {
          success: false,
          message: `Material con ID ${item.material_id} no encontrado`,
        };
      }

      const materialRow = materialResult.rows[0];
      if (!materialRow) {
        return {
          success: false,
          message: `Material con ID ${item.material_id} no encontrado`,
        };
      }

      if (!materialRow.activo) {
        return {
          success: false,
          message: `Material ${item.material_id} no está activo`,
        };
      }

      // Verificar stock disponible
      if (materialRow.stock_actual < item.cantidad_m3) {
        return {
          success: false,
          message: `Stock insuficiente para material ${item.material_id}. Disponible: ${materialRow.stock_actual} m³`,
        };
      }

      // Usar precio proporcionado o el precio actual del material
      const precioUnitario = item.precio_unitario || materialRow.precio_m3;

      itemsConPrecios.push({
        material_id: item.material_id,
        cantidad_m3: item.cantidad_m3,
        precio_unitario: precioUnitario,
      });
    }

    // Crear pedido
    const pedidoData: pedidosRepo.CreatePedidoData = {
      cliente_id: data.cliente_id,
      direccion_entrega: data.direccion_entrega,
      latitud_entrega: data.latitud_entrega,
      longitud_entrega: data.longitud_entrega,
      referencia_ubicacion: data.referencia_ubicacion,
      fecha_entrega_solicitada: data.fecha_entrega_solicitada
        ? new Date(data.fecha_entrega_solicitada)
        : undefined,
      observaciones: data.observaciones,
    };

    const pedidoId = await pedidosRepo.createPedido(pedidoData, itemsConPrecios);

    if (!pedidoId) {
      return {
        success: false,
        message: 'Error al crear el pedido',
      };
    }

    // Obtener pedido creado
    const pedidoCreado = await pedidosRepo.findPedidoById(pedidoId);
    if (!pedidoCreado) {
      return {
        success: false,
        message: 'Pedido creado pero no se pudo recuperar',
      };
    }

    // Obtener items
    const items = await pedidosRepo.findDetallesPedido(pedidoId);

    return {
      success: true,
      pedido: {
        id: pedidoCreado.id,
        codigo_seguimiento: pedidoCreado.codigo_seguimiento,
        cliente_id: pedidoCreado.cliente_id,
        cliente_razon_social: pedidoCreado.cliente_razon_social || '',
        estado_actual_id: pedidoCreado.estado_actual_id,
        estado_nombre: pedidoCreado.estado_nombre || '',
        direccion_entrega: pedidoCreado.direccion_entrega,
        latitud_entrega: pedidoCreado.latitud_entrega,
        longitud_entrega: pedidoCreado.longitud_entrega,
        referencia_ubicacion: pedidoCreado.referencia_ubicacion || null,
        zona_id: pedidoCreado.zona_id || null,
        zona_nombre: pedidoCreado.zona_nombre || null,
        camion_asignado_id: pedidoCreado.camion_asignado_id,
        camion_placa: pedidoCreado.camion_placa || null,
        conductor_asignado_id: pedidoCreado.conductor_asignado_id,
        conductor_nombre: pedidoCreado.conductor_nombre || null,
        fecha_pedido: pedidoCreado.fecha_pedido.toISOString(),
        fecha_entrega_solicitada: pedidoCreado.fecha_entrega_solicitada
          ? pedidoCreado.fecha_entrega_solicitada.toISOString()
          : null,
        fecha_entrega_estimada: pedidoCreado.fecha_entrega_estimada
          ? pedidoCreado.fecha_entrega_estimada.toISOString()
          : null,
        fecha_entrega_real: pedidoCreado.fecha_entrega_real
          ? pedidoCreado.fecha_entrega_real.toISOString()
          : null,
        total_m3: pedidoCreado.total_m3,
        monto_total: pedidoCreado.monto_total,
        eta_minutos: pedidoCreado.eta_minutos,
        distancia_km: pedidoCreado.distancia_km,
        observaciones: pedidoCreado.observaciones,
        motivo_rechazo: pedidoCreado.motivo_rechazo,
        created_at: pedidoCreado.created_at.toISOString(),
        updated_at: pedidoCreado.updated_at.toISOString(),
        items: items.map((item) => ({
          id: item.id,
          material_id: item.material_id,
          material_nombre: item.material_nombre || '',
          cantidad_m3: item.cantidad_m3,
          precio_unitario: item.precio_unitario,
          subtotal: item.subtotal,
          created_at: item.created_at.toISOString(),
        })),
      },
      message: 'Pedido creado exitosamente',
    };
  } catch (error) {
    console.error('Error al crear pedido:', error);
    return {
      success: false,
      message: 'Error interno del servidor',
    };
  }
}

/**
 * Listar pedidos con filtros
 */
export async function listPedidos(
  limit: number = 20,
  offset: number = 0,
  filters: {
    estado_id?: number;
    cliente_id?: number;
    conductor_asignado_id?: number;
    fecha_desde?: string;
    fecha_hasta?: string;
  } = {}
): Promise<ListPedidosResult> {
  try {
    const [pedidos, total] = await Promise.all([
      pedidosRepo.findAllPedidos(limit, offset, filters),
      pedidosRepo.countPedidos(filters),
    ]);

    return {
      success: true,
      pedidos: pedidos.map((p) => ({
        id: p.id,
        codigo_seguimiento: p.codigo_seguimiento,
        cliente_razon_social: p.cliente_razon_social || '',
        cliente_nombre: p.cliente_razon_social || '',
        estado_nombre: p.estado_nombre || '',
        direccion_entrega: p.direccion_entrega,
        fecha_pedido: p.fecha_pedido.toISOString(),
        fecha_entrega_solicitada: p.fecha_entrega_solicitada
          ? p.fecha_entrega_solicitada.toISOString()
          : null,
        total_m3: p.total_m3,
        monto_total: p.monto_total,
        camion_placa: p.camion_placa || null,
        conductor_nombre: p.conductor_nombre || null,
        latitud_entrega: p.latitud_entrega || null,
        longitud_entrega: p.longitud_entrega || null,
        distancia_km: p.distancia_km || null,
        eta_minutos: p.eta_minutos || null,
        ruta_calculada: p.ruta_calculada || null,
      })),
      total,
      limit,
      offset,
    };
  } catch (error) {
    console.error('Error al listar pedidos:', error);
    return {
      success: false,
      message: 'Error interno del servidor',
    };
  }
}

/**
 * Obtener pedido por ID con detalles
 */
export async function getPedidoById(id: number): Promise<GetPedidoResult> {
  try {
    const pedido = await pedidosRepo.findPedidoById(id);

    if (!pedido) {
      return {
        success: false,
        message: 'Pedido no encontrado',
      };
    }

    // Obtener items
    const items = await pedidosRepo.findDetallesPedido(id);

    return {
      success: true,
      pedido: {
        id: pedido.id,
        codigo_seguimiento: pedido.codigo_seguimiento,
        cliente_id: pedido.cliente_id,
        cliente_razon_social: pedido.cliente_razon_social || '',
        estado_actual_id: pedido.estado_actual_id,
        estado_nombre: pedido.estado_nombre || '',
        direccion_entrega: pedido.direccion_entrega,
        latitud_entrega: pedido.latitud_entrega,
        longitud_entrega: pedido.longitud_entrega,
        referencia_ubicacion: pedido.referencia_ubicacion || null,
        zona_id: pedido.zona_id || null,
        zona_nombre: pedido.zona_nombre || null,
        camion_asignado_id: pedido.camion_asignado_id,
        camion_placa: pedido.camion_placa || null,
        conductor_asignado_id: pedido.conductor_asignado_id,
        conductor_nombre: pedido.conductor_nombre || null,
        fecha_pedido: pedido.fecha_pedido.toISOString(),
        fecha_entrega_solicitada: pedido.fecha_entrega_solicitada
          ? pedido.fecha_entrega_solicitada.toISOString()
          : null,
        fecha_entrega_estimada: pedido.fecha_entrega_estimada
          ? pedido.fecha_entrega_estimada.toISOString()
          : null,
        fecha_entrega_real: pedido.fecha_entrega_real
          ? pedido.fecha_entrega_real.toISOString()
          : null,
        total_m3: pedido.total_m3,
        monto_total: pedido.monto_total,
        eta_minutos: pedido.eta_minutos,
        distancia_km: pedido.distancia_km,
        observaciones: pedido.observaciones,
        motivo_rechazo: pedido.motivo_rechazo,
        created_at: pedido.created_at.toISOString(),
        updated_at: pedido.updated_at.toISOString(),
        items: items.map((item) => ({
          id: item.id,
          material_id: item.material_id,
          material_nombre: item.material_nombre || '',
          cantidad_m3: item.cantidad_m3,
          precio_unitario: item.precio_unitario,
          subtotal: item.subtotal,
          created_at: item.created_at.toISOString(),
        })),
      },
    };
  } catch (error) {
    console.error('Error al obtener pedido:', error);
    return {
      success: false,
      message: 'Error interno del servidor',
    };
  }
}

/**
 * Tracking público por código
 */
export async function getTrackingByCodigo(codigo: string): Promise<TrackingResult> {
  try {
    const pedido = await pedidosRepo.findPedidoByCodigo(codigo);

    if (!pedido) {
      return {
        success: false,
        message: 'Código de seguimiento no encontrado',
      };
    }

    // Obtener historial
    const historialRows = await pedidosRepo.findHistorialEstados(pedido.id);

    return {
      success: true,
      tracking: {
        codigo_seguimiento: pedido.codigo_seguimiento,
        estado_actual: pedido.estado_nombre || '',
        direccion_entrega: pedido.direccion_entrega,
        fecha_pedido: pedido.fecha_pedido.toISOString(),
        fecha_entrega_estimada: pedido.fecha_entrega_estimada
          ? pedido.fecha_entrega_estimada.toISOString()
          : null,
        eta_minutos: pedido.eta_minutos,
        total_m3: pedido.total_m3,
        historial: historialRows.map((h) => ({
          estado: h.estado_nombre || '',
          fecha: h.created_at.toISOString(),
        })),
      },
    };
  } catch (error) {
    console.error('Error al obtener tracking:', error);
    return {
      success: false,
      message: 'Error interno del servidor',
    };
  }
}

//Confirmar pedido y asignar recursos
export async function confirmarPedido(
  id: number,
  data: {
    camion_id: number;
    conductor_id: number;
    fecha_entrega_estimada?: string;
    observaciones?: string;
  }
): Promise<CreatePedidoResult> {
  try {
    // Verificar que el pedido existe y está en estado PENDIENTE
    const pedido = await pedidosRepo.findPedidoById(id);

    if (!pedido) {
      return {
        success: false,
        message: 'Pedido no encontrado',
      };
    }

    if (pedido.estado_actual_id !== 1) {
      return {
        success: false,
        message: 'Solo se pueden confirmar pedidos en estado PENDIENTE',
      };
    }

    // Verificar disponibilidad de camión
    const camionDisponible = await pedidosRepo.isCamionDisponible(data.camion_id);
    if (!camionDisponible) {
      return {
        success: false,
        message: 'El camión seleccionado no está disponible',
      };
    }

    // Verificar disponibilidad de conductor
    const conductorDisponible = await pedidosRepo.isConductorDisponible(data.conductor_id);
    if (!conductorDisponible) {
      return {
        success: false,
        message: 'El conductor seleccionado no está disponible',
      };
    }

    // Confirmar pedido
    const fechaEstimada = data.fecha_entrega_estimada
      ? new Date(data.fecha_entrega_estimada)
      : undefined;

    const confirmado = await pedidosRepo.confirmarPedido(
      id,
      data.camion_id,
      data.conductor_id,
      fechaEstimada,
      data.observaciones
    );

    if (!confirmado) {
      return {
        success: false,
        message: 'Error al confirmar el pedido',
      };
    }

    // Calcular ruta óptima usando Neo4j
    try {
      const rutaCompleta = await calcularRutaHastaPedido(id);

      // Guardar ruta calculada en la base de datos
      await pool.query(
        `UPDATE pedidos
         SET ruta_calculada = $1,
             distancia_km = $2,
             eta_minutos = $3
         WHERE id = $4`,
        [
          JSON.stringify(rutaCompleta.ruta_calculada),
          rutaCompleta.distancia_total_km,
          Math.round(rutaCompleta.tiempo_estimado_minutos),
          id
        ]
      );

      console.log(`Ruta calculada y guardada para pedido ${id}: ${rutaCompleta.distancia_total_km} km, ${Math.round(rutaCompleta.tiempo_estimado_minutos)} min`);
    } catch (errorRuta) {
      // Si falla el cálculo de ruta, no fallar la confirmación del pedido
      // Solo registrar el error
      console.error(`Error al calcular ruta para pedido ${id}:`, errorRuta);
      console.warn('El pedido fue confirmado pero no se pudo calcular la ruta con Neo4j');
    }

    // Obtener pedido actualizado
    const pedidoActualizado = await getPedidoById(id);

    return {
      success: true,
      pedido: pedidoActualizado.pedido,
      message: 'Pedido confirmado exitosamente',
    };
  } catch (error) {
    console.error('Error al confirmar pedido:', error);
    return {
      success: false,
      message: 'Error interno del servidor',
    };
  }
}

/**
 * Reasignar camión y conductor
 */
export async function reasignarPedido(
  id: number,
  data: {
    camion_id: number;
    conductor_id: number;
    motivo: string;
  }
): Promise<CreatePedidoResult> {
  try {
    // Verificar que el pedido existe
    const pedido = await pedidosRepo.findPedidoById(id);

    if (!pedido) {
      return {
        success: false,
        message: 'Pedido no encontrado',
      };
    }

    // Solo se puede reasignar si está CONFIRMADO o EN_CAMINO
    if (![2, 3].includes(pedido.estado_actual_id)) {
      return {
        success: false,
        message: 'Solo se pueden reasignar pedidos confirmados o en camino',
      };
    }

    // Verificar disponibilidad
    const camionDisponible = await pedidosRepo.isCamionDisponible(data.camion_id);
    if (!camionDisponible) {
      return {
        success: false,
        message: 'El camión seleccionado no está disponible',
      };
    }

    const conductorDisponible = await pedidosRepo.isConductorDisponible(data.conductor_id);
    if (!conductorDisponible) {
      return {
        success: false,
        message: 'El conductor seleccionado no está disponible',
      };
    }

    // Reasignar
    const reasignado = await pedidosRepo.reasignarRecursos(id, data.camion_id, data.conductor_id);

    if (!reasignado) {
      return {
        success: false,
        message: 'Error al reasignar recursos',
      };
    }

    // Obtener pedido actualizado
    const pedidoActualizado = await getPedidoById(id);

    return {
      success: true,
      pedido: pedidoActualizado.pedido,
      message: 'Recursos reasignados exitosamente',
    };
  } catch (error) {
    console.error('Error al reasignar pedido:', error);
    return {
      success: false,
      message: 'Error interno del servidor',
    };
  }
}

/**
 * Cancelar pedido
 */
export async function cancelarPedido(id: number, motivo: string): Promise<CreatePedidoResult> {
  try {
    const pedido = await pedidosRepo.findPedidoById(id);

    if (!pedido) {
      return {
        success: false,
        message: 'Pedido no encontrado',
      };
    }

    if (pedido.estado_actual_id !== 1) {
      return {
        success: false,
        message: 'Solo se pueden cancelar pedidos en estado PENDIENTE',
      };
    }

    const cancelado = await pedidosRepo.cancelarPedido(id, motivo);

    if (!cancelado) {
      return {
        success: false,
        message: 'Error al cancelar el pedido',
      };
    }

    const pedidoActualizado = await getPedidoById(id);

    return {
      success: true,
      pedido: pedidoActualizado.pedido,
      message: 'Pedido cancelado exitosamente',
    };
  } catch (error) {
    console.error('Error al cancelar pedido:', error);
    return {
      success: false,
      message: 'Error interno del servidor',
    };
  }
}

/**
 * Eliminar pedido (solo admin, solo cancelados)
 */
export async function deletePedido(id: number): Promise<{ success: boolean; message: string }> {
  try {
    const eliminado = await pedidosRepo.deletePedido(id);

    if (!eliminado) {
      return {
        success: false,
        message: 'No se pudo eliminar el pedido (debe estar cancelado)',
      };
    }

    return {
      success: true,
      message: 'Pedido eliminado exitosamente',
    };
  } catch (error) {
    console.error('Error al eliminar pedido:', error);
    return {
      success: false,
      message: 'Error interno del servidor',
    };
  }
}

//obtener historial de estados de un pedido
export async function getHistorialEstados(id: number): Promise<HistorialResult> {
  try {
    const pedido = await pedidosRepo.findPedidoById(id);

    if (!pedido) {
      return {
        success: false,
        message: 'Pedido no encontrado',
      };
    }
    const historial = await pedidosRepo.findHistorialEstados(id);
    return {
      success: true,
      historial: historial.map((h) => ({
        id: h.id,
        estado_nombre: h.estado_nombre || '',
        usuario_nombre: h.usuario_nombre || null,
        comentario: h.comentario || null,
        created_at: h.created_at.toISOString(),
      })),
    };
  } catch (error) {
    console.error('Error al obtener historial:', error);
    return {
      success: false,
      message: 'Error interno del servidor',
    };
  }
}

// Obtener estadísticas de pedidos
export async function getEstadisticas(dias: number = 30) {
  try {
    const estadisticas = await pedidosRepo.getEstadisticasPedidos(dias);
    return {
      success: true,
      data: estadisticas,
    };
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    return {
      success: false,
      message: 'Error interno del servidor',
    };
  }
}
