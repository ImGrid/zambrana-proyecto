import { MapPin, Calendar, FileText, Package, Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useCartStore } from '../stores/cart.store';
import { useCreatePedido } from '../hooks/useCreatePedido';
import type { CreatePedidoRequest } from '../types/pedido.types';

interface DireccionData {
  direccion_entrega: string;
  latitud_entrega: number;
  longitud_entrega: number;
  referencia_ubicacion: string;
  fecha_entrega_solicitada: string;
  observaciones: string;
}

interface StepResumenProps {
  direccionData: DireccionData;
}

export function StepResumen({ direccionData }: StepResumenProps) {
  const items = useCartStore((state) => state.items);
  const getTotalM3 = useCartStore((state) => state.getTotalM3);
  const getTotalMonto = useCartStore((state) => state.getTotalMonto);
  const clearCart = useCartStore((state) => state.clearCart);
  const { mutate: createPedido, isPending } = useCreatePedido();

  const handleSubmit = () => {
    const request: CreatePedidoRequest = {
      direccion_entrega: direccionData.direccion_entrega,
      latitud_entrega: direccionData.latitud_entrega,
      longitud_entrega: direccionData.longitud_entrega,
      referencia_ubicacion: direccionData.referencia_ubicacion || undefined,
      fecha_entrega_solicitada: direccionData.fecha_entrega_solicitada || undefined,
      observaciones: direccionData.observaciones || undefined,
      items: items.map((item) => ({
        material_id: item.material_id,
        cantidad_m3: item.cantidad_m3,
        precio_unitario: item.precio_unitario,
      })),
    };

    createPedido(request, {
      onSuccess: () => {
        clearCart();
      },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Resumen del pedido
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Revisa la información antes de confirmar tu pedido
        </p>
      </div>

      {/* Dirección de entrega */}
      <Card padding="md">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
          <MapPin className="h-5 w-5 mr-2 text-orange-600" />
          Dirección de entrega
        </h3>
        <div className="space-y-2 text-sm">
          <p className="text-gray-700">{direccionData.direccion_entrega}</p>
          {direccionData.referencia_ubicacion && (
            <p className="text-gray-600">
              <span className="font-medium">Referencia:</span> {direccionData.referencia_ubicacion}
            </p>
          )}
          <p className="text-gray-500 text-xs">
            Coordenadas: {direccionData.latitud_entrega.toFixed(4)}, {direccionData.longitud_entrega.toFixed(4)}
          </p>
        </div>
      </Card>

      {/* Fecha y observaciones */}
      {(direccionData.fecha_entrega_solicitada || direccionData.observaciones) && (
        <Card padding="md">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
            <FileText className="h-5 w-5 mr-2 text-orange-600" />
            Información adicional
          </h3>
          <div className="space-y-2 text-sm">
            {direccionData.fecha_entrega_solicitada && (
              <p className="text-gray-700">
                <Calendar className="h-4 w-4 inline mr-1" />
                <span className="font-medium">Fecha solicitada:</span>{' '}
                {new Date(direccionData.fecha_entrega_solicitada).toLocaleDateString('es-BO', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            )}
            {direccionData.observaciones && (
              <div>
                <p className="font-medium text-gray-700 mb-1">Observaciones:</p>
                <p className="text-gray-600">{direccionData.observaciones}</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Materiales */}
      <Card padding="md">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
          <Package className="h-5 w-5 mr-2 text-orange-600" />
          Materiales ({items.length})
        </h3>
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.material_id}
              className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
            >
              <div className="flex-1">
                <p className="font-medium text-gray-900">{item.material_nombre}</p>
                <p className="text-sm text-gray-500">
                  {item.cantidad_m3} {item.unidad_medida} × Bs {item.precio_unitario.toFixed(2)}
                </p>
              </div>
              <p className="font-semibold text-gray-900">
                Bs {item.subtotal.toFixed(2)}
              </p>
            </div>
          ))}
        </div>

        {/* Totales */}
        <div className="border-t border-gray-200 mt-4 pt-4 space-y-2">
          <div className="flex items-center justify-between text-gray-700">
            <span>Total m³:</span>
            <span className="font-medium">{getTotalM3().toFixed(2)} m³</span>
          </div>
          <div className="flex items-center justify-between text-xl font-bold">
            <span className="text-gray-900">Total a pagar:</span>
            <span className="text-orange-600">Bs {getTotalMonto().toFixed(2)}</span>
          </div>
        </div>
      </Card>

      {/* Botón de confirmación */}
      <div className="flex justify-center pt-4">
        <Button
          variant="primary"
          size="lg"
          onClick={handleSubmit}
          disabled={isPending}
          className="min-w-[200px]"
        >
          <Send className="h-5 w-5 mr-2" />
          {isPending ? 'Creando pedido...' : 'Confirmar pedido'}
        </Button>
      </div>
    </div>
  );
}
