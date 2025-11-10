import { useQuery } from '@tanstack/react-query';
import { getMaterialesCatalogoApi } from '../api/catalogo.api';
import type { ListMaterialesParams } from '../types/catalogo.types';

export const useMateriales = (params: ListMaterialesParams = {}) => {
  return useQuery({
    queryKey: ['materiales-catalogo', params],
    queryFn: () => getMaterialesCatalogoApi(params),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};
