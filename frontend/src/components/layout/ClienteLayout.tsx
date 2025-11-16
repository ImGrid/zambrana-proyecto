import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Package, ShoppingCart, User, LogOut } from 'lucide-react';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import { ROUTES } from '@/config/routes.config';
import { cn } from '@/lib/utils';

const clienteNavItems = [
  {
    to: ROUTES.CATALOGO.path,
    icon: Package,
    label: 'Catálogo',
  },
  {
    to: ROUTES.MIS_PEDIDOS.path,
    icon: ShoppingCart,
    label: 'Mis Pedidos',
  },
  {
    to: ROUTES.PERFIL_CLIENTE.path,
    icon: User,
    label: 'Mi Perfil',
  },
];

export function ClienteLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, clearAuth } = useAuthStore();

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-cemento-50">
      <header className="bg-white border-b border-piedra-200 sticky top-0 z-50">
        <div className="container mx-auto px-8 sm:px-12 lg:px-16">
          <div className="flex items-center justify-between h-20">
            <Link to={ROUTES.CATALOGO.path} className="flex items-center">
              <picture>
                <source srcSet="/logo-navbar.webp" type="image/webp" />
                <img
                  src="/logo_origin.png"
                  alt="Agregados Zambrana"
                  className="h-16 w-auto"
                />
              </picture>
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              {clienteNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname.startsWith(item.to);

                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors',
                      isActive
                        ? 'bg-coral-50 text-coral-600 font-medium'
                        : 'text-cemento-600 hover:text-cemento-900 hover:bg-cemento-50'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-4">
              {user && (
                <div className="hidden md:flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-medium text-cemento-900">
                      {user.nombre || user.email}
                    </p>
                    <p className="text-xs text-cemento-500">Cliente</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-cemento-500 hover:text-cemento-700 transition-colors"
                    title="Cerrar sesión"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              )}

              <button
                onClick={handleLogout}
                className="md:hidden text-sm text-cemento-600 hover:text-cemento-900"
              >
                Salir
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-piedra-200 z-40">
        <div className="flex items-center justify-around py-2">
          {clienteNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.to);

            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors',
                  isActive
                    ? 'text-coral-600'
                    : 'text-cemento-500'
                )}
              >
                <Icon className="h-6 w-6" />
                <span className="text-xs">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
