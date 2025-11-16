import { z } from 'zod';

// =====================================================
// SCHEMAS DE INPUT (Request)
// =====================================================

// Schema para items del pedido
export const itemPedidoSchema = z.object({
  material_id: z.number().int().positive('Material ID debe ser positivo'),
  cantidad_m3: z.number().positive('Cantidad debe ser positiva'),
  precio_unitario: z.number().positive('Precio debe ser positivo').optional() // Opcional, se toma del material actual
});

// Schema para crear pedido (POST /pedidos)
export const createPedidoSchema = z.object({
  cliente_id: z.number().int().positive().optional(), // Opcional si el usuario es cliente
  direccion_entrega: z.string().min(10, 'Dirección debe tener al menos 10 caracteres'),
  latitud_entrega: z.number().min(-90).max(90, 'Latitud inválida'),
  longitud_entrega: z.number().min(-180).max(180, 'Longitud inválida'),
  referencia_ubicacion: z.string().optional(),
  fecha_entrega_solicitada: z.string().datetime().optional(), // ISO string
  observaciones: z.string().optional(),
  items: z.array(itemPedidoSchema).min(1, 'Debe incluir al menos un material')
});

// Schema para listar pedidos (GET /pedidos)
export const listPedidosSchema = z.object({
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 20),
  offset: z.string().optional().transform(val => val ? parseInt(val, 10) : 0),
  estado_id: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
  cliente_id: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
  fecha_desde: z.string().optional(),
  fecha_hasta: z.string().optional()
});

// Schema para obtener pedido por ID
export const getPedidoByIdSchema = z.object({
  id: z.string().transform(val => parseInt(val, 10))
});

// Schema para tracking público por código
export const getTrackingByCodigoSchema = z.object({
  codigo: z.string().min(1, 'Código de seguimiento requerido')
});

// Schema para confirmar pedido (PATCH /pedidos/:id/confirmar)
export const confirmarPedidoSchema = z.object({
  camion_id: z.number().int().positive('Camión ID requerido'),
  conductor_id: z.number().int().positive('Conductor ID requerido'),
  fecha_entrega_estimada: z.string().datetime().optional(),
  observaciones: z.string().optional()
});

// Schema para reasignar recursos (PUT /pedidos/:id/asignar)
export const reasignarPedidoSchema = z.object({
  camion_id: z.number().int().positive('Camión ID requerido'),
  conductor_id: z.number().int().positive('Conductor ID requerido'),
  motivo: z.string().min(10, 'Motivo debe tener al menos 10 caracteres')
});

// Schema para cancelar pedido (PATCH /pedidos/:id/cancelar)
export const cancelarPedidoSchema = z.object({
  motivo: z.string().min(10, 'Motivo de cancelación requerido')
});

// =====================================================
// SCHEMAS DE OUTPUT (Response)
// =====================================================

// Schema para item de detalle en response
export const detallePedidoResponseSchema = z.object({
  id: z.number(),
  material_id: z.number(),
  material_nombre: z.string(),
  cantidad_m3: z.coerce.number(),
  precio_unitario: z.coerce.number(),
  subtotal: z.coerce.number(),
  created_at: z.string()
});

// Schema para pedido completo en response
export const pedidoResponseSchema = z.object({
  id: z.number(),
  codigo_seguimiento: z.string(),
  cliente_id: z.number(),
  cliente_razon_social: z.string(),
  estado_actual_id: z.number(),
  estado_nombre: z.string(),
  direccion_entrega: z.string(),
  latitud_entrega: z.coerce.number().nullable(),
  longitud_entrega: z.coerce.number().nullable(),
  referencia_ubicacion: z.string().nullable(),
  zona_id: z.number().nullable(),
  zona_nombre: z.string().nullable(),
  camion_asignado_id: z.number().nullable(),
  camion_placa: z.string().nullable(),
  conductor_asignado_id: z.number().nullable(),
  conductor_nombre: z.string().nullable(),
  fecha_pedido: z.string(),
  fecha_entrega_solicitada: z.string().nullable(),
  fecha_entrega_estimada: z.string().nullable(),
  fecha_entrega_real: z.string().nullable(),
  total_m3: z.coerce.number(),
  monto_total: z.coerce.number(),
  eta_minutos: z.coerce.number().nullable(),
  distancia_km: z.coerce.number().nullable(),
  observaciones: z.string().nullable(),
  motivo_rechazo: z.string().nullable(),
  ruta_calculada: z.any().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
  items: z.array(detallePedidoResponseSchema).optional()
});

// Schema para pedido simple (lista sin detalles)
export const pedidoListItemSchema = z.object({
  id: z.number(),
  codigo_seguimiento: z.string(),
  cliente_razon_social: z.string(),
  estado_nombre: z.string(),
  direccion_entrega: z.string(),
  fecha_pedido: z.string(),
  fecha_entrega_solicitada: z.string().nullable(),
  total_m3: z.coerce.number(),
  monto_total: z.coerce.number(),
  camion_placa: z.string().nullable(),
  conductor_nombre: z.string().nullable()
});

// Schema para lista de pedidos
export const pedidosListResponseSchema = z.object({
  pedidos: z.array(pedidoListItemSchema),
  total: z.number(),
  limit: z.number(),
  offset: z.number()
});

// Schema para historial de estados
export const historialEstadoSchema = z.object({
  id: z.number(),
  estado_nombre: z.string(),
  usuario_nombre: z.string().nullable(),
  comentario: z.string().nullable(),
  created_at: z.string()
});

// Schema para tracking público
export const trackingResponseSchema = z.object({
  codigo_seguimiento: z.string(),
  estado_actual: z.string(),
  direccion_entrega: z.string(),
  fecha_pedido: z.string(),
  fecha_entrega_estimada: z.string().nullable(),
  eta_minutos: z.coerce.number().nullable(),
  total_m3: z.coerce.number(),
  historial: z.array(z.object({
    estado: z.string(),
    fecha: z.string()
  }))
});

// Schema para respuesta genérica de éxito
export const pedidoSuccessResponseSchema = z.object({
  message: z.string(),
  pedido: pedidoResponseSchema
});

// Schema para respuesta de error
export const errorResponseSchema = z.object({
  error: z.string(),
  message: z.string()
});

// Schema para query de estadísticas (GET /pedidos/estadisticas)
export const getEstadisticasQuerySchema = z.object({
  dias: z.string().optional().transform(val => val ? parseInt(val, 10) : 30)
});

// Schema para estadísticas de pedidos
export const estadisticasPedidosResponseSchema = z.object({
  total_pedidos: z.number(),
  pedidos_pendientes: z.number(),
  pedidos_confirmados: z.number(),
  pedidos_en_camino: z.number(),
  pedidos_entregados: z.number(),
  pedidos_cancelados: z.number(),
  pedidos_mes: z.number(),
  monto_total_mes: z.number(),
  volumen_total_mes_m3: z.number(),
  cliente_top_mes: z.object({
    id: z.number(),
    razon_social: z.string(),
    total_pedidos: z.number(),
    monto_total: z.number()
  }).nullable()
});
