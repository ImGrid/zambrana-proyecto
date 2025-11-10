import { Link, Outlet } from 'react-router-dom';
import { Truck } from 'lucide-react';

export function PublicLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <Truck className="h-8 w-8 text-orange-600" />
              <span className="text-xl font-bold text-gray-900">
                Agregados Zambrana
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              <Link
                to="/"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Inicio
              </Link>
              <Link
                to="/login"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Iniciar Sesión
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                Registrarse
              </Link>
            </nav>

            <div className="md:hidden">
              <Link
                to="/login"
                className="text-sm text-gray-600 hover:text-gray-900 mr-3"
              >
                Entrar
              </Link>
              <Link
                to="/register"
                className="text-sm px-3 py-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                Registro
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Truck className="h-6 w-6 text-orange-600" />
                <span className="font-bold text-gray-900">Agregados Zambrana</span>
              </div>
              <p className="text-sm text-gray-600">
                Distribución de materiales de construcción en Cochabamba, Bolivia.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Contacto</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>Cochabamba, Bolivia</p>
                <p>Teléfono: +591 4 123 4567</p>
                <p>Email: contacto@agregadoszambrana.com</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Horarios</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>Lunes a Viernes: 8:00 - 18:00</p>
                <p>Sábados: 8:00 - 13:00</p>
                <p>Domingos: Cerrado</p>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200 text-center text-sm text-gray-600">
            <p>&copy; 2025 Agregados Zambrana. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
