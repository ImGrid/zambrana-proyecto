// Tipos alineados 100% con backend/src/modules/pedidos/pedidos.schemas.ts

// =====================================================
// INPUTS - Para enviar al backend
// =====================================================

// Item del pedido (material + cantidad)
export interface ItemPedidoInput {
  material_id: number;
  cantidad_m3: number;
  precio_unitario?: number; // Opcional, se toma del material actual
}

// Datos para crear un pedido
export interface CreatePedidoData {
  cliente_id?: number; // Opcional si el usuario es cliente
  direccion_entrega: string;
  latitud_entrega: number;
  longitud_entrega: number;
  referencia_ubicacion?: string;
  fecha_entrega_solicitada?: string; // ISO string
  observaciones?: string;
  items: ItemPedidoInput[];
}

// Datos para confirmar pedido
export interface ConfirmarPedidoData {
  camion_id: number;
  conductor_id: number;
  fecha_entrega_estimada?: string;
  observaciones?: string;
}

// Datos para reasignar recursos
export interface ReasignarPedidoData {
  camion_id: number;
  conductor_id: number;
  motivo: string;
}

// Datos para cancelar pedido
export interface CancelarPedidoData {
  motivo: string;
}

// =====================================================
// OUTPUTS - Respuestas del backend
// =====================================================

// Item de detalle en la respuesta
export interface DetallePedidoItem {
  id: number;
  material_id: number;
  material_nombre: string;
  cantidad_m3: number;
  precio_unitario: number;
  subtotal: number;
  created_at: string;
}

// Pedido completo (usado en detalle y después de operaciones)
export interface Pedido {
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
  items?: DetallePedidoItem[];
}

// Pedido simplificado para lista
export interface PedidoListItem {
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

// Respuesta de lista de pedidos
export interface PedidosListResponse {
  pedidos: PedidoListItem[];
  total: number;
  limit: number;
  offset: number;
}

// Parámetros de query para listar pedidos
export interface ListPedidosParams {
  limit?: number;
  offset?: number;
  estado_id?: number;
  cliente_id?: number;
  fecha_desde?: string;
  fecha_hasta?: string;
}

// Respuesta de operaciones (create, confirmar, reasignar, cancelar)
export interface PedidoSuccessResponse {
  message: string;
  pedido: Pedido;
}

// Entrada del historial de estados
export interface HistorialEstadoItem {
  id: number;
  estado_nombre: string;
  usuario_nombre: string | null;
  comentario: string | null;
  created_at: string;
}

// Respuesta de historial de estados
export interface HistorialEstadosResponse {
  historial: HistorialEstadoItem[];
}

// Tracking público (sin autenticación)
export interface TrackingPublico {
  codigo_seguimiento: string;
  estado_actual: string;
  direccion_entrega: string;
  fecha_pedido: string;
  fecha_entrega_estimada: string | null;
  eta_minutos: number | null;
  total_m3: number;
  historial: {
    estado: string;
    fecha: string;
  }[];
}

// =====================================================
// ENUMS Y CONSTANTES
// =====================================================

// Estados de pedidos (alineados 100% con tabla estados_pedido)
export enum EstadoPedido {
  PENDIENTE = 1,
  CONFIRMADO = 2,
  EN_CAMINO = 3,
  DESVIADO = 4,
  ATASCADO = 5,
  RECHAZADO_CLIENTE = 6,
  ENTREGADO = 7,
  CANCELADO = 8,
  EN_PROCESO_MULTIPLE = 9
}

// Labels para mostrar en UI
export const ESTADO_PEDIDO_LABELS: Record<number, string> = {
  [EstadoPedido.PENDIENTE]: 'Pendiente',
  [EstadoPedido.CONFIRMADO]: 'Confirmado',
  [EstadoPedido.EN_CAMINO]: 'En Camino',
  [EstadoPedido.DESVIADO]: 'Desviado',
  [EstadoPedido.ATASCADO]: 'Atascado',
  [EstadoPedido.RECHAZADO_CLIENTE]: 'Rechazado',
  [EstadoPedido.ENTREGADO]: 'Entregado',
  [EstadoPedido.CANCELADO]: 'Cancelado',
  [EstadoPedido.EN_PROCESO_MULTIPLE]: 'En Proceso Multiple'
};

// Variantes de badge según estado
export type EstadoBadgeVariant = 'default' | 'info' | 'success' | 'warning' | 'danger';

export const ESTADO_BADGE_VARIANTS: Record<number, EstadoBadgeVariant> = {
  [EstadoPedido.PENDIENTE]: 'warning',
  [EstadoPedido.CONFIRMADO]: 'info',
  [EstadoPedido.EN_CAMINO]: 'info',
  [EstadoPedido.DESVIADO]: 'warning',
  [EstadoPedido.ATASCADO]: 'danger',
  [EstadoPedido.RECHAZADO_CLIENTE]: 'danger',
  [EstadoPedido.ENTREGADO]: 'success',
  [EstadoPedido.CANCELADO]: 'danger',
  [EstadoPedido.EN_PROCESO_MULTIPLE]: 'info'
};
