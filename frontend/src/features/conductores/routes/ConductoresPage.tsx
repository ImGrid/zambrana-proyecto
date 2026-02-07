import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { ConductoresTable } from '../components/ConductoresTable';
import { ConductorForm } from '../components/ConductorForm';
import { ConductoresStatsGrid } from '../components/ConductoresStatsGrid';
import { useConductores, useConductor, useToggleActivo } from '../hooks/useConductores';
import { SearchInput } from '@/components/ui/SearchInput';
import { SelectFilter } from '@/components/ui/SelectFilter';
import { Pagination } from '@/components/ui/Pagination';
import { Button } from '@/components/ui/Button';
import type { Conductor } from '../types/conductores.types';
import type { SortOrder } from '@/components/ui/Table';

export const ConductoresPage = () => {
  const [page, setPage] = useState(1);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [buscar, setBuscar] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedConductor, setSelectedConductor] = useState<Conductor | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<string | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<SortOrder | undefined>(undefined);

  const limit = 20;
  const offset = (page - 1) * limit;

  const soloActivos = filtroEstado === 'activos' ? true : undefined;

  const { data, isLoading } = useConductores({
    limit,
    offset,
    soloActivos,
    sort_by: sortBy,
    sort_order: sortOrder,
  });

  const { data: conductorData } = useConductor(selectedId);
  const toggleActivoMutation = useToggleActivo();

  useEffect(() => {
    if (conductorData && selectedId) {
      setSelectedConductor(conductorData);
      setIsFormOpen(true);
      setSelectedId(null);
    }
  }, [conductorData, selectedId]);

  const conductoresFiltered = data?.conductores.filter((conductor) => {
    if (!buscar) return true;
    const searchLower = buscar.toLowerCase();
    return (
      conductor.nombre_completo.toLowerCase().includes(searchLower) ||
      conductor.ci.toLowerCase().includes(searchLower) ||
      conductor.telefono?.toLowerCase().includes(searchLower) ||
      conductor.licencia_categoria?.toLowerCase().includes(searchLower)
    );
  }) || [];

  const totalPages = data ? Math.ceil(data.total / limit) : 0;

  const handleOpenCreate = () => {
    setSelectedConductor(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (id: number) => {
    setSelectedId(id);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedConductor(null);
  };

  const handleToggleActivo = (id: number) => {
    toggleActivoMutation.mutate(id);
  };

  const handleSort = (key: string) => {
    if (sortBy === key) {
      if (sortOrder === 'asc') {
        setSortOrder('desc');
      } else {
        setSortBy(undefined);
        setSortOrder(undefined);
      }
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
    setPage(1);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-cemento-900">Gestión de Conductores</h1>
          <p className="text-sm text-cemento-500 mt-1">
            Administración de conductores y sus licencias
          </p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus size={20} className="mr-2" />
          Nuevo Conductor
        </Button>
      </div>

      <div className="mb-6">
        <ConductoresStatsGrid />
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <SearchInput
            value={buscar}
            onChange={setBuscar}
            placeholder="Buscar por nombre, CI, teléfono o categoría..."
          />
        </div>
        <div className="w-full sm:w-64">
          <SelectFilter
            value={filtroEstado}
            onChange={setFiltroEstado}
            options={[
              { value: 'activos', label: 'Solo Activos' },
            ]}
            placeholder="Todos los estados"
          />
        </div>
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

      <ConductoresTable
        conductores={conductoresFiltered}
        loading={isLoading}
        onEdit={handleOpenEdit}
        onToggleActivo={handleToggleActivo}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
      />

      <ConductorForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        conductor={selectedConductor}
      />
    </div>
  );
};
