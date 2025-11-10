import { MapIcon } from '@heroicons/react/24/outline';
import { PlaceholderPage } from '@/components/ui/PlaceholderPage';

export const EntregasPage = () => {
  return (
    <PlaceholderPage
      title="Mis Entregas"
      description="Módulo para gestionar entregas asignadas al conductor"
      icon={<MapIcon className="h-12 w-12" />}
    />
  );
};
