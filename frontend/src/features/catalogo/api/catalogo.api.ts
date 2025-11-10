import { api } from '@/lib/axios';
import type { MaterialesListResponse, ListMaterialesParams } from '../types/catalogo.types';

export const getMaterialesCatalogoApi = async (
  params: ListMaterialesParams = {}
): Promise<MaterialesListResponse> => {
  // Por defecto traer solo activos para el catálogo
  const queryParams = {
    soloActivos: true,
    limit: params.limit || 20,
    offset: params.offset || 0,
  };

  const response = await api.get<MaterialesListResponse>('/materiales', {
    params: queryParams,
  });

  return response.data;
};
