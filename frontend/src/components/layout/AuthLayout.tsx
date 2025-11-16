import { Link, Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-cemento-50">
      <header className="bg-white border-b border-piedra-200">
        <div className="container mx-auto px-8 sm:px-12 lg:px-16">
          <div className="flex items-center justify-between h-20">
            <Link to="/" className="flex items-center">
              <picture>
                <source srcSet="/logo-navbar.webp" type="image/webp" />
                <img
                  src="/logo_origin.png"
                  alt="Agregados Zambrana"
                  className="h-16 w-auto"
                />
              </picture>
            </Link>

            <nav className="flex items-center gap-4">
              <Link
                to="/"
                className="text-sm text-cemento-600 hover:text-cemento-900 transition-colors"
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
