import { useQuery } from '@tanstack/react-query';
import { getCamionesApi } from '../api/camiones.api';

export const useCamionesDisponibles = () => {
  return useQuery({
    queryKey: ['camiones', 'disponibles'],
    queryFn: () => getCamionesApi({ soloDisponibles: true, limit: 100 }),
    staleTime: 1000 * 60 * 2,
  });
};
