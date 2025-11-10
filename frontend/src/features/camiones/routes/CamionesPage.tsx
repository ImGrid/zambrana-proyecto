import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { CamionesTable } from '../components/CamionesTable';
import { CamionForm } from '../components/CamionForm';
import { CamionesStatsGrid } from '../components/CamionesStatsGrid';
import { useCamiones, useCamion, useToggleActivo, useToggleMantenimiento } from '../hooks/useCamiones';
import { SearchInput } from '@/components/ui/SearchInput';
import { SelectFilter } from '@/components/ui/SelectFilter';
import { Pagination } from '@/components/ui/Pagination';
import { Button } from '@/components/ui/Button';
import type { Camion } from '../types/camiones.types';

export const CamionesPage = () => {
  const [page, setPage] = useState(1);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [buscar, setBuscar] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCamion, setSelectedCamion] = useState<Camion | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const limit = 20;
  const offset = (page - 1) * limit;

  const soloActivos = filtroEstado === 'activos' ? true : undefined;
  const soloDisponibles = filtroEstado === 'disponibles' ? true : undefined;

  const { data, isLoading } = useCamiones({
    limit,
    offset,
    soloActivos,
    soloDisponibles,
  });

  const { data: camionData } = useCamion(selectedId);
  const toggleActivoMutation = useToggleActivo();
  const toggleMantenimientoMutation = useToggleMantenimiento();

  useEffect(() => {
    if (camionData && selectedId) {
      setSelectedCamion(camionData);
      setIsFormOpen(true);
      setSelectedId(null);
    }
  }, [camionData, selectedId]);

  const camionesFiltered = data?.camiones.filter((camion) => {
    if (!buscar) return true;
    const searchLower = buscar.toLowerCase();
    return (
      camion.placa.toLowerCase().includes(searchLower) ||
      camion.tipo_camion.toLowerCase().includes(searchLower) ||
      camion.marca?.toLowerCase().includes(searchLower) ||
      camion.modelo?.toLowerCase().includes(searchLower)
    );
  }) || [];

  const totalPages = data ? Math.ceil(data.total / limit) : 0;

  const handleOpenCreate = () => {
    setSelectedCamion(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (id: number) => {
    setSelectedId(id);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedCamion(null);
  };

  const handleToggleActivo = (id: number) => {
    toggleActivoMutation.mutate(id);
  };

  const handleToggleMantenimiento = (id: number) => {
    toggleMantenimientoMutation.mutate(id);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Flota</h1>
          <p className="text-sm text-gray-500 mt-1">
            Administración de camiones y vehículos de la empresa
          </p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus size={20} className="mr-2" />
          Nuevo Camión
        </Button>
      </div>

      <div className="mb-6">
        <CamionesStatsGrid />
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <SearchInput
            value={buscar}
            onChange={setBuscar}
            placeholder="Buscar por placa, tipo, marca o modelo..."
          />
        </div>
        <div className="w-full sm:w-64">
          <SelectFilter
            value={filtroEstado}
            onChange={setFiltroEstado}
            options={[
              { value: 'activos', label: 'Solo Activos' },
              { value: 'disponibles', label: 'Solo Disponibles' },
            ]}
            placeholder="Todos los estados"
          />
        </div>
      </div>

      <CamionesTable
        camiones={camionesFiltered}
        loading={isLoading}
        onEdit={handleOpenEdit}
        onToggleActivo={handleToggleActivo}
        onToggleMantenimiento={handleToggleMantenimiento}
      />

      {data && totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          totalItems={data.total}
          itemsPerPage={limit}
        />
      )}

      <CamionForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        camion={selectedCamion}
      />
    </div>
  );
};
