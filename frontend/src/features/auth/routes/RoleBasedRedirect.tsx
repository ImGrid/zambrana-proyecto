import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getDefaultRouteForRole } from '@/config/routes.config';

// Componente que redirige al usuario a su página por defecto según su rol
export const RoleBasedRedirect = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coral-500 mx-auto"></div>
          <p className="mt-4 text-cemento-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const defaultRoute = getDefaultRouteForRole(user.rol);
  return <Navigate to={defaultRoute} replace />;
};
