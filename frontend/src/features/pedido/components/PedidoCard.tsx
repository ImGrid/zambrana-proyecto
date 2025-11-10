import { Calendar, MapPin, Package, Truck, User } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { PedidoListItem } from '../types/pedido.types';

interface PedidoCardProps {
  pedido: PedidoListItem;
  onClick?: () => void;
}

export function PedidoCard({ pedido, onClick }: PedidoCardProps) {
  const getEstadoBadgeVariant = (estado: string) => {
    const estadoLower = estado.toLowerCase();
    if (estadoLower.includes('pendiente')) return 'warning';
    if (estadoLower.includes('confirmado')) return 'primary';
    if (estadoLower.includes('en camino')) return 'primary';
    if (estadoLower.includes('entregado')) return 'success';
    if (estadoLower.includes('cancelado')) return 'danger';
    return 'default';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-BO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Card
      variant="elevated"
      padding="md"
      className={`transition-all duration-200 ${onClick ? 'cursor-pointer hover:shadow-lg' : ''}`}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-lg text-gray-900">
            {pedido.codigo_seguimiento}
          </h3>
          <p className="text-sm text-gray-500 mt-0.5">
            {formatDate(pedido.fecha_pedido)}
          </p>
        </div>
        <Badge variant={getEstadoBadgeVariant(pedido.estado_nombre)}>
          {pedido.estado_nombre}
        </Badge>
      </div>

      {/* Dirección */}
      <div className="mb-3">
        <div className="flex items-start gap-2 text-sm text-gray-700">
          <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-gray-400" />
          <span className="line-clamp-2">{pedido.direccion_entrega}</span>
        </div>
      </div>

      {/* Fecha entrega solicitada */}
      {pedido.fecha_entrega_solicitada && (
        <div className="mb-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span>Entrega solicitada: {formatDate(pedido.fecha_entrega_solicitada)}</span>
          </div>
        </div>
      )}

      {/* Asignación */}
      <div className="mb-4 space-y-1">
        {pedido.camion_placa && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Truck className="h-4 w-4 text-gray-400" />
            <span>Camión: {pedido.camion_placa}</span>
          </div>
        )}
        {pedido.conductor_nombre && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User className="h-4 w-4 text-gray-400" />
            <span>Conductor: {pedido.conductor_nombre}</span>
          </div>
        )}
      </div>

      {/* Totales */}
      <div className="border-t border-gray-200 pt-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Package className="h-4 w-4 text-gray-400" />
          <span>{pedido.total_m3.toFixed(2)} m³</span>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-lg font-bold text-orange-600">
            Bs {pedido.monto_total.toFixed(2)}
          </p>
        </div>
      </div>
    </Card>
  );
}
