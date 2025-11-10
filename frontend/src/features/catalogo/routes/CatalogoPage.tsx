import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ShoppingCart } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProductGridSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Pagination } from '@/components/ui/Pagination';
import { ProductCard } from '../components/ProductCard';
import { useMateriales } from '../hooks/useMateriales';
import { useCartStore } from '@/features/pedido/stores/cart.store';

const ITEMS_PER_PAGE = 12;

export function CatalogoPage() {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const itemCount = useCartStore((state) => state.getItemCount());

  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  const { data, isLoading, isError, error, refetch } = useMateriales({
    limit: ITEMS_PER_PAGE,
    offset,
  });

  // Filtrar materiales por búsqueda (client-side)
  const filteredMateriales = data?.materiales.filter((material) =>
    material.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const totalPages = data ? Math.ceil(data.total / ITEMS_PER_PAGE) : 0;

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <ErrorState
          title="Error al cargar materiales"
          message={error?.message || 'Ocurrió un error inesperado'}
          retry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Catálogo de Materiales
        </h1>
        <p className="text-gray-600">
          Explora nuestro catálogo de materiales de construcción disponibles
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar por nombre o código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Loading State */}
      {isLoading && <ProductGridSkeleton count={ITEMS_PER_PAGE} />}

      {/* Empty State */}
      {!isLoading && filteredMateriales.length === 0 && (
        <EmptyState
          title={searchTerm ? 'No se encontraron materiales' : 'No hay materiales disponibles'}
          message={
            searchTerm
              ? 'Intenta con otros términos de búsqueda'
              : 'No hay materiales activos en el catálogo'
          }
        />
      )}

      {/* Product Grid */}
      {!isLoading && filteredMateriales.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {filteredMateriales.map((material) => (
              <ProductCard key={material.id} material={material} />
            ))}
          </div>

          {/* Pagination */}
          {!searchTerm && totalPages > 1 && (
            <div className="flex justify-center">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </>
      )}

      {/* Floating Cart Button */}
      {itemCount > 0 && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate('/cliente/crear-pedido')}
            className="rounded-full shadow-lg hover:shadow-xl transition-shadow relative"
          >
            <ShoppingCart className="h-6 w-6 mr-2" />
            Ver Carrito
            <Badge
              variant="success"
              className="absolute -top-2 -right-2 bg-green-500 text-white min-w-[24px] h-6 flex items-center justify-center"
            >
              {itemCount}
            </Badge>
          </Button>
        </div>
      )}
    </div>
  );
}
