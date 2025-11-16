import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  User,
  MapPin,
  Calendar,
  Package,
  Truck,
  UserCircle,
  FileText,
  CheckCircle,
  XCircle,
  Navigation,
  Clock
} from 'lucide-react';
import { usePedidoById } from '@/features/pedido/hooks/usePedidoById';
import type { PedidoListItem } from '../types/pedidos.types';
import { ESTADO_BADGE_VARIANTS, EstadoPedido } from '../types/pedidos.types';

interface PedidoDetalleModalProps {
  open: boolean;
  onClose: () => void;
  pedido: PedidoListItem;
  onAprobar?: (pedido: PedidoListItem) => void;
  onRechazar?: (pedido: PedidoListItem) => void;
}

export function PedidoDetalleModal({
  open,
  onClose,
  pedido,
  onAprobar,
  onRechazar,
}: PedidoDetalleModalProps) {
  const { data: pedidoCompleto, isLoading } = usePedidoById(pedido.id, { enabled: open });

  const getEstadoBadgeVariant = (estadoNombre: string) => {
    const estado = estadoNombre.toUpperCase();
    if (estado.includes('PENDIENTE')) return ESTADO_BADGE_VARIANTS[EstadoPedido.PENDIENTE];
    if (estado.includes('CONFIRMADO')) return ESTADO_BADGE_VARIANTS[EstadoPedido.CONFIRMADO];
    if (estado.includes('CAMINO')) return ESTADO_BADGE_VARIANTS[EstadoPedido.EN_CAMINO];
    if (estado.includes('DESVIADO')) return ESTADO_BADGE_VARIANTS[EstadoPedido.DESVIADO];
    if (estado.includes('ATASCADO')) return ESTADO_BADGE_VARIANTS[EstadoPedido.ATASCADO];
    if (estado.includes('RECHAZADO')) return ESTADO_BADGE_VARIANTS[EstadoPedido.RECHAZADO_CLIENTE];
    if (estado.includes('ENTREGADO')) return ESTADO_BADGE_VARIANTS[EstadoPedido.ENTREGADO];
    if (estado.includes('CANCELADO')) return ESTADO_BADGE_VARIANTS[EstadoPedido.CANCELADO];
    if (estado.includes('MULTIPLE')) return ESTADO_BADGE_VARIANTS[EstadoPedido.EN_PROCESO_MULTIPLE];
    return 'default';
  };

  const isPendiente = pedido.estado_nombre.toLowerCase().includes('pendiente');
  const mostrarAcciones = isPendiente && (onAprobar || onRechazar);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Detalle del Pedido"
      size="lg"
      footer={
        mostrarAcciones ? (
          <div className="flex gap-3">
            {onRechazar && (
              <Button
                variant="danger"
                onClick={() => {
                  onClose();
                  onRechazar(pedido);
                }}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Rechazar Pedido
              </Button>
            )}
            {onAprobar && (
              <Button
                variant="success"
                onClick={() => {
                  onClose();
                  onAprobar(pedido);
                }}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Aprobar Pedido
              </Button>
            )}
          </div>
        ) : (
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        )
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-coral-600"></div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Header con código y estado */}
          <div className="bg-coral-50 rounded-lg p-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-cemento-600 mb-0.5">Código de Seguimiento</p>
              <p className="text-lg font-bold font-mono text-cemento-900">{pedido.codigo_seguimiento}</p>
            </div>
            <Badge variant={getEstadoBadgeVariant(pedido.estado_nombre)} className="text-sm px-3 py-1">
              {pedido.estado_nombre}
            </Badge>
          </div>

          {/* Grid de 2 columnas */}
          <div className="grid grid-cols-2 gap-3">
            {/* Columna Izquierda */}
            <div className="space-y-3">
              {/* Sección Cliente */}
              <div className="border border-piedra-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-coral-600" />
                  <h3 className="font-semibold text-sm text-cemento-900">Cliente</h3>
                </div>
                <div>
                  <p className="text-xs text-cemento-500">Razón Social</p>
                  <p className="font-medium text-sm text-cemento-900">{pedido.cliente_razon_social}</p>
                </div>
              </div>

              {/* Sección Dirección */}
              <div className="border border-piedra-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-coral-600" />
                  <h3 className="font-semibold text-sm text-cemento-900">Dirección de Entrega</h3>
                </div>
                <div className="space-y-1">
                  <div>
                    <p className="text-xs text-cemento-500">Dirección</p>
                    <p className="text-sm font-medium text-cemento-900">{pedido.direccion_entrega}</p>
                  </div>
                  {pedidoCompleto?.zona_nombre && (
                    <div>
                      <p className="text-xs text-cemento-500">Zona</p>
                      <p className="text-sm font-medium text-cemento-900">{pedidoCompleto.zona_nombre}</p>
                    </div>
                  )}
                  {pedidoCompleto?.referencia_ubicacion && (
                    <div>
                      <p className="text-xs text-cemento-500">Referencia</p>
                      <p className="text-sm font-medium text-cemento-900">{pedidoCompleto.referencia_ubicacion}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Sección Fechas */}
              <div className="border border-piedra-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-coral-600" />
                  <h3 className="font-semibold text-sm text-cemento-900">Fechas</h3>
                </div>
                <div className="space-y-1">
                  <div>
                    <p className="text-xs text-cemento-500">Fecha de Pedido</p>
                    <p className="text-sm font-medium text-cemento-900">
                      {new Date(pedido.fecha_pedido).toLocaleDateString('es-BO', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  {pedidoCompleto?.fecha_entrega_solicitada && (
                    <div>
                      <p className="text-xs text-cemento-500">Entrega Solicitada</p>
                      <p className="text-sm font-medium text-cemento-900">
                        {new Date(pedidoCompleto.fecha_entrega_solicitada).toLocaleDateString('es-BO', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  )}
                  {pedidoCompleto?.fecha_entrega_estimada && (
                    <div>
                      <p className="text-xs text-cemento-500">Entrega Estimada</p>
                      <p className="text-sm font-medium text-cemento-900">
                        {new Date(pedidoCompleto.fecha_entrega_estimada).toLocaleDateString('es-BO', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  )}
                  {pedidoCompleto?.fecha_entrega_real && (
                    <div>
                      <p className="text-xs text-cemento-500">Entrega Real</p>
                      <p className="text-sm font-medium text-success-700">
                        {new Date(pedidoCompleto.fecha_entrega_real).toLocaleDateString('es-BO', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Columna Derecha */}
            <div className="space-y-3">
              {/* Sección Materiales */}
              <div className="border border-piedra-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="h-4 w-4 text-coral-600" />
                  <h3 className="font-semibold text-sm text-cemento-900">Materiales</h3>
                </div>
                {pedidoCompleto?.items && pedidoCompleto.items.length > 0 ? (
                  <div className="space-y-2">
                    {pedidoCompleto.items.map((item) => (
                      <div key={item.id} className="flex justify-between items-center text-xs">
                        <div>
                          <p className="font-medium text-cemento-900">{item.material_nombre}</p>
                          <p className="text-xs text-cemento-600">
                            {item.cantidad_m3.toFixed(2)} m³ @ Bs. {item.precio_unitario.toFixed(2)}/m³
                          </p>
                        </div>
                        <p className="font-semibold text-cemento-900">Bs. {item.subtotal.toFixed(2)}</p>
                      </div>
                    ))}
                    <div className="border-t border-piedra-300 pt-2 mt-2 flex justify-between items-center">
                      <span className="font-semibold text-sm text-cemento-900">Total</span>
                      <div className="text-right">
                        <p className="text-xs text-cemento-600">{pedido.total_m3.toFixed(2)} m³</p>
                        <p className="text-base font-bold text-cemento-900">Bs. {pedido.monto_total.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-2">
                    <p className="text-xs text-cemento-600">{pedido.total_m3.toFixed(2)} m³</p>
                    <p className="text-sm font-bold text-cemento-900">Bs. {pedido.monto_total.toFixed(2)}</p>
                  </div>
                )}
              </div>

              {/* Sección Logística */}
              <div className="border border-piedra-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Truck className="h-4 w-4 text-coral-600" />
                  <h3 className="font-semibold text-sm text-cemento-900">Logística</h3>
                </div>
                <div className="space-y-1">
                  <div>
                    <p className="text-xs text-cemento-500">Camión Asignado</p>
                    <p className={`text-sm font-medium ${pedido.camion_placa ? 'text-cemento-900 font-mono' : 'text-cemento-400 italic'}`}>
                      {pedido.camion_placa || 'Sin asignar'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-cemento-500">Conductor Asignado</p>
                    <p className={`text-sm font-medium ${pedido.conductor_nombre ? 'text-cemento-900' : 'text-cemento-400 italic'}`}>
                      {pedido.conductor_nombre || 'Sin asignar'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Sección Información de Ruta (si existe) */}
              {(pedidoCompleto?.eta_minutos || pedidoCompleto?.distancia_km) && (
                <div className="border border-info-200 bg-info-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Navigation className="h-4 w-4 text-info-600" />
                    <h3 className="font-semibold text-sm text-info-900">Información de Ruta</h3>
                  </div>
                  <div className="space-y-1">
                    {pedidoCompleto?.distancia_km && (
                      <div>
                        <p className="text-xs text-info-600">Distancia</p>
                        <p className="text-sm font-medium text-info-900">
                          {pedidoCompleto.distancia_km.toFixed(2)} km
                        </p>
                      </div>
                    )}
                    {pedidoCompleto?.eta_minutos && (
                      <div>
                        <p className="text-xs text-info-600">Tiempo Estimado</p>
                        <p className="text-sm font-medium text-info-900">
                          {Math.floor(pedidoCompleto.eta_minutos / 60)}h {pedidoCompleto.eta_minutos % 60}min
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Secciones de ancho completo */}
          {pedidoCompleto?.observaciones && (
            <div className="border border-piedra-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-coral-600" />
                <h3 className="font-semibold text-sm text-cemento-900">Observaciones</h3>
              </div>
              <p className="text-cemento-700 text-sm">{pedidoCompleto.observaciones}</p>
            </div>
          )}

          {pedidoCompleto?.motivo_rechazo && (
            <div className="border border-error-200 bg-error-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="h-4 w-4 text-error-600" />
                <h3 className="font-semibold text-sm text-error-900">Motivo de Rechazo</h3>
              </div>
              <p className="text-error-700 text-sm">{pedidoCompleto.motivo_rechazo}</p>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
