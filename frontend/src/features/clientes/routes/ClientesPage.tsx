import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { ClientesTable } from '../components/ClientesTable';
import { ClienteForm } from '../components/ClienteForm';
import { ClientesStatsGrid } from '../components/ClientesStatsGrid';
import { useClientes, useCliente } from '../hooks/useClientes';
import { SearchInput } from '@/components/ui/SearchInput';
import { Pagination } from '@/components/ui/Pagination';
import { Button } from '@/components/ui/Button';
import type { Cliente } from '../types/clientes.types';

export const ClientesPage = () => {
  const [page, setPage] = useState(1);
  const [buscar, setBuscar] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const limit = 20;
  const offset = (page - 1) * limit;

  const { data, isLoading } = useClientes({
    limit,
    offset,
  });

  const { data: clienteData } = useCliente(selectedId);

  useEffect(() => {
    if (clienteData && selectedId) {
      setSelectedCliente(clienteData);
      setIsFormOpen(true);
      setSelectedId(null);
    }
  }, [clienteData, selectedId]);

  const clientesFiltered = data?.clientes.filter((cliente) => {
    if (!buscar) return true;
    const searchLower = buscar.toLowerCase();
    return (
      cliente.razon_social.toLowerCase().includes(searchLower) ||
      cliente.nit?.toLowerCase().includes(searchLower) ||
      cliente.telefono?.toLowerCase().includes(searchLower) ||
      cliente.direccion?.toLowerCase().includes(searchLower) ||
      cliente.tipo_cliente_nombre.toLowerCase().includes(searchLower)
    );
  }) || [];

  const totalPages = data ? Math.ceil(data.total / limit) : 0;

  const handleOpenCreate = () => {
    setSelectedCliente(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (id: number) => {
    setSelectedId(id);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedCliente(null);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Clientes</h1>
          <p className="text-sm text-gray-500 mt-1">
            Administración de clientes y sus datos de contacto
          </p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus size={20} className="mr-2" />
          Nuevo Cliente
        </Button>
      </div>

      <div className="mb-6">
        <ClientesStatsGrid />
      </div>

      <div className="mb-6">
        <SearchInput
          value={buscar}
          onChange={setBuscar}
          placeholder="Buscar por razón social, NIT, teléfono o dirección..."
        />
      </div>

      <ClientesTable
        clientes={clientesFiltered}
        loading={isLoading}
        onEdit={handleOpenEdit}
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

      <ClienteForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        cliente={selectedCliente}
      />
    </div>
  );
};
