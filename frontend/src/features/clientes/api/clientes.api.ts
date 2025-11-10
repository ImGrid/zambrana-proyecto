import { api } from '@/lib/axios';
import type {
  ClientesListResponse,
  ListClientesParams,
  Cliente,
  CreateClienteData,
  UpdateClienteData,
  ClienteUpdateResponse
} from '../types/clientes.types';
import type { EstadisticasClientes } from '../types/estadisticas.types';

// GET /api/clientes - Listar clientes con paginación
export const getClientesApi = async (params?: ListClientesParams): Promise<ClientesListResponse> => {
  const { data } = await api.get<ClientesListResponse>('/clientes', {
    params: {
      limit: params?.limit,
      offset: params?.offset
    }
  });
  return data;
};

// GET /api/clientes/:id - Obtener cliente por ID
export const getClienteByIdApi = async (id: number): Promise<Cliente> => {
  const { data } = await api.get<Cliente>(`/clientes/${id}`);
  return data;
};

// POST /api/clientes - Crear nuevo cliente
export const createClienteApi = async (createData: CreateClienteData): Promise<ClienteUpdateResponse> => {
  const { data } = await api.post<ClienteUpdateResponse>('/clientes', createData);
  return data;
};

// PUT /api/clientes/:id - Actualizar cliente
export const updateClienteApi = async (
  id: number,
  updateData: UpdateClienteData
): Promise<ClienteUpdateResponse> => {
  const { data } = await api.put<ClienteUpdateResponse>(`/clientes/${id}`, updateData);
  return data;
};

// GET /api/clientes/estadisticas - Obtener estadísticas de clientes
export const getEstadisticasClientesApi = async (): Promise<EstadisticasClientes> => {
  const { data } = await api.get<EstadisticasClientes>('/clientes/estadisticas');
  return data;
};
