import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { MaterialesTable } from '../components/MaterialesTable';
import { MaterialForm } from '../components/MaterialForm';
import { UpdatePrecioForm } from '../components/UpdatePrecioForm';
import { AjustarStockForm } from '../components/AjustarStockForm';
import { MaterialesStatsGrid } from '../components/MaterialesStatsGrid';
import { useMateriales, useMaterial, useToggleActivoMaterial } from '../hooks/useMateriales';
import { SearchInput } from '@/components/ui/SearchInput';
import { SelectFilter } from '@/components/ui/SelectFilter';
import { Pagination } from '@/components/ui/Pagination';
import { Button } from '@/components/ui/Button';
import type { Material } from '../types/materiales.types';

export const MaterialesPage = () => {
  const [page, setPage] = useState(1);
  const [buscar, setBuscar] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [isPrecioFormOpen, setIsPrecioFormOpen] = useState(false);
  const [isStockFormOpen, setIsStockFormOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const limit = 20;
  const offset = (page - 1) * limit;

  const soloActivos = filtroEstado === 'activos' ? true : undefined;

  const { data, isLoading } = useMateriales({
    limit,
    offset,
    soloActivos,
  });

  const { data: materialData } = useMaterial(selectedId);
  const toggleActivoMutation = useToggleActivoMaterial();

  useEffect(() => {
    if (materialData && selectedId) {
      setSelectedMaterial(materialData);
      setSelectedId(null);
    }
  }, [materialData, selectedId]);

  const materialesFiltered = data?.materiales.filter((material) => {
    if (!buscar) return true;
    const searchLower = buscar.toLowerCase();
    return (
      material.nombre.toLowerCase().includes(searchLower) ||
      material.codigo.toLowerCase().includes(searchLower) ||
      material.unidad_medida.toLowerCase().includes(searchLower)
    );
  }) || [];

  const totalPages = data ? Math.ceil(data.total / limit) : 0;

  const handleOpenCreate = () => {
    setIsCreateFormOpen(true);
  };

  const handleCloseCreate = () => {
    setIsCreateFormOpen(false);
  };

  const handleOpenUpdatePrecio = (id: number) => {
    setSelectedId(id);
    setIsPrecioFormOpen(true);
  };

  const handleCloseUpdatePrecio = () => {
    setIsPrecioFormOpen(false);
    setSelectedMaterial(null);
  };

  const handleOpenAjustarStock = (id: number) => {
    setSelectedId(id);
    setIsStockFormOpen(true);
  };

  const handleCloseAjustarStock = () => {
    setIsStockFormOpen(false);
    setSelectedMaterial(null);
  };

  const handleToggleActivo = (id: number) => {
    toggleActivoMutation.mutate(id);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-cemento-900">Gestión de Stock</h1>
          <p className="text-sm text-cemento-500 mt-1">
            Administración de materiales e inventario
          </p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus size={20} className="mr-2" />
          Nuevo Material
        </Button>
      </div>

      <div className="mb-6">
        <MaterialesStatsGrid />
      </div>

      <div className="mb-6 flex gap-4">
        <div className="flex-1">
          <SearchInput
            value={buscar}
            onChange={setBuscar}
            placeholder="Buscar por nombre, código o unidad..."
          />
        </div>
        <SelectFilter
          value={filtroEstado}
          onChange={setFiltroEstado}
          options={[
            { value: 'activos', label: 'Solo Activos' },
          ]}
          placeholder="Todos los estados"
        />
      </div>

      {data && totalPages > 1 && (
        <div className="mb-4">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={data.total}
            itemsPerPage={limit}
          />
        </div>
      )}

      <MaterialesTable
        materiales={materialesFiltered}
        loading={isLoading}
        onUpdatePrecio={handleOpenUpdatePrecio}
        onAjustarStock={handleOpenAjustarStock}
        onToggleActivo={handleToggleActivo}
      />

      <MaterialForm
        isOpen={isCreateFormOpen}
        onClose={handleCloseCreate}
      />

      <UpdatePrecioForm
        isOpen={isPrecioFormOpen}
        onClose={handleCloseUpdatePrecio}
        material={selectedMaterial}
      />

      <AjustarStockForm
        isOpen={isStockFormOpen}
        onClose={handleCloseAjustarStock}
        material={selectedMaterial}
      />
    </div>
  );
};
