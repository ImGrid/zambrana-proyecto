import { Trash2, Package } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { useCartStore } from '../stores/cart.store';

export function StepCart() {
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const getTotalM3 = useCartStore((state) => state.getTotalM3);
  const getTotalMonto = useCartStore((state) => state.getTotalMonto);

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="Carrito vacío"
        message="Agrega materiales desde el catálogo para crear un pedido"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-cemento-900 mb-4">
          Materiales en el carrito
        </h2>
        <p className="text-sm text-cemento-600 mb-4">
          Revisa los materiales y cantidades antes de continuar
        </p>
      </div>

      {/* Lista de items */}
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.material_id}
            className="flex items-center gap-4 p-4 bg-cemento-50 rounded-lg border border-piedra-200"
          >
            <div className="flex-1">
              <h3 className="font-medium text-cemento-900">{item.material_nombre}</h3>
              <p className="text-sm text-cemento-500">Código: {item.material_codigo}</p>
              <p className="text-sm text-cemento-600 mt-1">
                Bs {item.precio_unitario.toFixed(2)} / {item.unidad_medida}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end">
                <label className="text-xs text-cemento-600 mb-1">Cantidad</label>
                <Input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={item.cantidad_m3}
                  onChange={(e) => updateQuantity(item.material_id, Number(e.target.value))}
                  className="w-24 text-center"
                />
              </div>

              <div className="flex flex-col items-end min-w-[100px]">
                <label className="text-xs text-cemento-600 mb-1">Subtotal</label>
                <p className="font-semibold text-lg text-coral-600">
                  Bs {item.subtotal.toFixed(2)}
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => removeItem(item.material_id)}
                className="text-error-600 hover:text-error-700 hover:bg-error-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Totales */}
      <div className="border-t border-piedra-200 pt-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-cemento-700">
            <span>Total m³:</span>
            <span className="font-medium">{getTotalM3().toFixed(2)} m³</span>
          </div>
          <div className="flex items-center justify-between text-lg font-bold text-cemento-900">
            <span>Total a pagar:</span>
            <span className="text-coral-600">Bs {getTotalMonto().toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
