import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { user, isAuthenticated, isLoading } = useAuthStore();

  // Mostrar loading mientras se hidrata
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

  // No autenticado
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Autenticado pero sin permiso de rol
  if (allowedRoles && user && !allowedRoles.includes(user.rol)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cemento-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm border border-piedra-200 p-8 text-center">
          <h2 className="text-2xl font-bold text-cemento-900 mb-4">Acceso Denegado</h2>
          <p className="text-cemento-600 mb-6">
            No tienes permisos para acceder a esta sección.
          </p>
          <button
            onClick={() => window.history.back()}
            className="bg-coral-500 hover:bg-coral-600 text-white font-medium py-2 px-4 rounded-lg transition"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  // Todo OK, renderizar hijos
  return <Outlet />;
};
