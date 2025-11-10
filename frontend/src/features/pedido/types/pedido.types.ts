// Tipos que coinciden EXACTAMENTE con el backend
// backend/src/modules/pedidos/pedidos.schemas.ts

// Item del pedido (para crear)
export interface ItemPedidoRequest {
  material_id: number;
  cantidad_m3: number;
  precio_unitario?: number; // Opcional, se toma del material actual
}

// Request para crear pedido
export interface CreatePedidoRequest {
  // cliente_id se obtiene automáticamente del JWT (no se envía)
  direccion_entrega: string;
  latitud_entrega: number;
  longitud_entrega: number;
  referencia_ubicacion?: string;
  fecha_entrega_solicitada?: string; // ISO string
  observaciones?: string;
  items: ItemPedidoRequest[];
}

// Detalle de pedido en response
export interface DetallePedidoResponse {
  id: number;
  material_id: number;
  material_nombre: string;
  cantidad_m3: number;
  precio_unitario: number;
  subtotal: number;
  created_at: string;
}

// Pedido completo en response
export interface PedidoResponse {
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
  items?: DetallePedidoResponse[];
}

// Response al crear pedido
export interface CreatePedidoResponse {
  message: string;
  pedido: PedidoResponse;
}

// Pedido simple para listado (sin detalles completos)
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

// Response de lista de pedidos
export interface PedidosListResponse {
  pedidos: PedidoListItem[];
  total: number;
  limit: number;
  offset: number;
}

// Params para listar pedidos
export interface ListPedidosParams {
  limit?: number;
  offset?: number;
  estado_id?: number;
  cliente_id?: number;
  fecha_desde?: string;
  fecha_hasta?: string;
}

// Item del carrito (uso interno del frontend)
export interface CartItem {
  material_id: number;
  material_nombre: string;
  material_codigo: string;
  unidad_medida: string;
  precio_unitario: number;
  cantidad_m3: number;
  subtotal: number;
}

// Request para confirmar pedido (aprobar)
export interface ConfirmarPedidoRequest {
  camion_id: number;
  conductor_id: number;
  fecha_entrega_estimada?: string; // ISO string
  observaciones?: string;
}

// Request para cancelar pedido (rechazar)
export interface CancelarPedidoRequest {
  motivo: string;
}
