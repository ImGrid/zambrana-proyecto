import { Truck, User, MapPin, Navigation } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { EntregaActiva } from '../types/entregas.types';

interface EntregaActiveCardProps {
  entrega: EntregaActiva;
  selected?: boolean;
  onClick?: () => void;
}

// Componente para mostrar una entrega en la lista lateral
// Muestra información esencial: camión, cliente, estado, velocidad
export function EntregaActiveCard({ entrega, selected = false, onClick }: EntregaActiveCardProps) {
  const formatHora = (date: Date | null) => {
    if (!date) return '--:--';
    return new Date(date).toLocaleTimeString('es-BO', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatVelocidad = (velocidad: number) => {
    return velocidad.toFixed(1);
  };

  return (
    <Card
      padding="sm"
      className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
        selected ? 'ring-2 ring-coral-500 bg-coral-50' : ''
      }`}
      onClick={onClick}
    >
      {/* Header con badge de estado */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-cemento-900 truncate">
            {entrega.pedido.codigo_seguimiento}
          </p>
          <p className="text-xs text-cemento-500">
            Salida: {formatHora(entrega.hora_salida_planta)}
          </p>
        </div>
        <Badge
          variant={entrega.esta_detenido ? 'warning' : 'success'}
          className="ml-2 flex-shrink-0"
        >
          {entrega.esta_detenido ? 'DETENIDO' : 'EN RUTA'}
        </Badge>
      </div>

      {/* Información del camión */}
      <div className="flex items-center gap-1.5 mb-1.5">
        <Truck className="h-3.5 w-3.5 text-cemento-400 flex-shrink-0" />
        <span className="text-xs text-cemento-700 truncate">
          {entrega.camion.placa} - {entrega.conductor.nombre_completo}
        </span>
      </div>

      {/* Cliente */}
      <div className="flex items-start gap-1.5 mb-1.5">
        <User className="h-3.5 w-3.5 text-cemento-400 flex-shrink-0 mt-0.5" />
        <span className="text-xs text-cemento-700 truncate">
          {entrega.pedido.cliente.razon_social}
        </span>
      </div>

      {/* Destino */}
      <div className="flex items-start gap-1.5 mb-2">
        <MapPin className="h-3.5 w-3.5 text-cemento-400 flex-shrink-0 mt-0.5" />
        <span className="text-xs text-cemento-600 line-clamp-2">
          {entrega.pedido.direccion_entrega}
        </span>
      </div>

      {/* Footer con velocidad */}
      <div className="pt-2 border-t border-piedra-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Navigation className="h-3.5 w-3.5 text-info-500" />
            <span className="text-xs font-medium text-cemento-900">
              {formatVelocidad(entrega.velocidad_promedio_kmh)} km/h
            </span>
          </div>
          {entrega.pedido.ruta_calculada && (
            <span className="text-xs text-cemento-500">
              {entrega.pedido.ruta_calculada.distancia_total_km.toFixed(1)} km
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
