import { Calendar, MapPin, Package, Truck, User, MapPinned } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { PedidoListItem } from '../types/pedido.types';

interface PedidoCardProps {
  pedido: PedidoListItem;
  onClick?: () => void;
  showTracking?: boolean;
}

export function PedidoCard({ pedido, onClick, showTracking = true }: PedidoCardProps) {
  const navigate = useNavigate();

  const esEnCamino = pedido.estado_nombre.toLowerCase().includes('en_camino');

  const handleVerTracking = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/cliente/tracking/${pedido.id}`);
  };

  const getEstadoBadgeVariant = (estado: string) => {
    const estadoLower = estado.toLowerCase();
    if (estadoLower.includes('pendiente')) return 'warning';
    if (estadoLower.includes('confirmado')) return 'primary';
    if (estadoLower.includes('en_camino')) return 'primary';
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
          <h3 className="font-semibold text-lg text-cemento-900">
            {pedido.codigo_seguimiento}
          </h3>
          <p className="text-sm text-cemento-500 mt-0.5">
            {formatDate(pedido.fecha_pedido)}
          </p>
        </div>
        <Badge variant={getEstadoBadgeVariant(pedido.estado_nombre)}>
          {pedido.estado_nombre}
        </Badge>
      </div>

      {/* Dirección */}
      <div className="mb-3">
        <div className="flex items-start gap-2 text-sm text-cemento-700">
          <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-cemento-400" />
          <span className="line-clamp-2">{pedido.direccion_entrega}</span>
        </div>
      </div>

      {/* Fecha entrega solicitada */}
      {pedido.fecha_entrega_solicitada && (
        <div className="mb-3">
          <div className="flex items-center gap-2 text-sm text-cemento-600">
            <Calendar className="h-4 w-4 text-cemento-400" />
            <span>Entrega solicitada: {formatDate(pedido.fecha_entrega_solicitada)}</span>
          </div>
        </div>
      )}

      {/* Asignación */}
      <div className="mb-4 space-y-1">
        {pedido.camion_placa && (
          <div className="flex items-center gap-2 text-sm text-cemento-600">
            <Truck className="h-4 w-4 text-cemento-400" />
            <span>Camión: {pedido.camion_placa}</span>
          </div>
        )}
        {pedido.conductor_nombre && (
          <div className="flex items-center gap-2 text-sm text-cemento-600">
            <User className="h-4 w-4 text-cemento-400" />
            <span>Conductor: {pedido.conductor_nombre}</span>
          </div>
        )}
      </div>

      {/* Totales */}
      <div className="border-t border-piedra-200 pt-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm text-cemento-600">
            <Package className="h-4 w-4 text-cemento-400" />
            <span>{pedido.total_m3.toFixed(2)} m³</span>
          </div>
          <div className="text-right">
            <p className="text-sm text-cemento-500">Total</p>
            <p className="text-lg font-bold text-coral-600">
              Bs {pedido.monto_total.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Botón de tracking si está en camino */}
        {showTracking && esEnCamino && (
          <Button
            variant="primary"
            size="sm"
            fullWidth
            onClick={handleVerTracking}
            className="mt-2"
          >
            <MapPinned className="h-4 w-4" />
            Ver Tracking en Tiempo Real
          </Button>
        )}
      </div>
    </Card>
  );
}
