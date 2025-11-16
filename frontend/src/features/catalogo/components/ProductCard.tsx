import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Package, ShoppingCart } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCartStore } from '@/features/pedido/stores/cart.store';
import type { MaterialCatalogo } from '../types/catalogo.types';

interface ProductCardProps {
  material: MaterialCatalogo;
}

export function ProductCard({ material }: ProductCardProps) {
  const { nombre, codigo, unidad_medida, precio_m3, stock_actual } = material;
  const [cantidad, setCantidad] = useState(1);
  const addItem = useCartStore((state) => state.addItem);

  const stockBajo = stock_actual <= material.stock_minimo;
  const sinStock = stock_actual === 0;

  const handleAddToCart = () => {
    if (cantidad <= 0) {
      toast.error('La cantidad debe ser mayor a 0');
      return;
    }

    if (cantidad > stock_actual) {
      toast.error('No hay suficiente stock disponible');
      return;
    }

    addItem({
      material_id: material.id,
      material_nombre: material.nombre,
      material_codigo: material.codigo,
      unidad_medida: material.unidad_medida,
      precio_unitario: material.precio_m3,
      cantidad_m3: cantidad,
      subtotal: cantidad * material.precio_m3,
    });

    toast.success(`${cantidad} ${unidad_medida} agregados al carrito`);
    setCantidad(1);
  };

  return (
    <Card variant="product" padding="none" className="h-full flex flex-col">
      {/* Imagen placeholder */}
      <div className="bg-gradient-to-br from-coral-100 to-coral-50 h-48 flex items-center justify-center relative">
        <Package className="h-20 w-20 text-coral-300" />

        {/* Badge de stock */}
        {sinStock ? (
          <div className="absolute top-3 right-3">
            <Badge variant="danger" size="sm">Sin stock</Badge>
          </div>
        ) : stockBajo ? (
          <div className="absolute top-3 right-3">
            <Badge variant="warning" size="sm">Stock bajo</Badge>
          </div>
        ) : null}
      </div>

      {/* Contenido */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h3 className="font-semibold text-cemento-900 text-lg leading-tight">
              {nombre}
            </h3>
            <p className="text-sm text-cemento-500 mt-0.5">Código: {codigo}</p>
          </div>
        </div>

        {/* Info */}
        <div className="space-y-3 mt-auto">
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-coral-600">
              Bs {precio_m3.toFixed(2)}
            </span>
            <span className="text-sm text-cemento-600">/{unidad_medida}</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-cemento-600">Disponible:</span>
            <span className={`font-medium ${sinStock ? 'text-error-600' : stockBajo ? 'text-arena-600' : 'text-success-600'}`}>
              {stock_actual} {unidad_medida}
            </span>
          </div>

          {/* Cantidad y Agregar al carrito */}
          <div className="pt-2 border-t border-piedra-100">
            <div className="flex gap-2">
              <Input
                type="number"
                min="1"
                max={stock_actual}
                value={cantidad}
                onChange={(e) => setCantidad(Number(e.target.value))}
                disabled={sinStock}
                className="w-20 text-center"
              />
              <Button
                onClick={handleAddToCart}
                disabled={sinStock}
                variant="primary"
                size="sm"
                className="flex-1"
              >
                <ShoppingCart className="h-4 w-4 mr-1" />
                Agregar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
