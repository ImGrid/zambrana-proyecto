import { useQuery } from '@tanstack/react-query';
import { getConductoresApi } from '../api/conductores.api';

export const useConductoresActivos = () => {
  return useQuery({
    queryKey: ['conductores', 'activos'],
    queryFn: () => getConductoresApi({ soloActivos: true, limit: 100 }),
    staleTime: 1000 * 60 * 2,
  });
};
