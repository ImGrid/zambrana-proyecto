import { Link, Outlet } from 'react-router-dom';
import { Truck } from 'lucide-react';

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <Truck className="h-8 w-8 text-orange-600" />
              <span className="text-xl font-bold text-gray-900">
                Agregados Zambrana
              </span>
            </Link>

            <nav className="flex items-center gap-4">
              <Link
                to="/"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Volver al inicio
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  );
}
