import { Link, Outlet } from "react-router-dom";
import { motion, useScroll, useMotionValueEvent } from "motion/react";
import { useState } from "react";

export function PublicLayout() {
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 150);
  });

  return (
    <div className="min-h-screen">
      <header
        className={`fixed top-0 z-50 w-full transition-all duration-300 ${
          isScrolled
            ? "bg-white border-b border-piedra-200"
            : "bg-cemento-900/20 border-b border-white/5"
        }`}
      >
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

            <nav className="hidden md:flex items-center gap-6">
              <Link
                to="/"
                className={`transition-colors ${
                  isScrolled
                    ? "text-cemento-600 hover:text-cemento-900"
                    : "text-white hover:text-arena-100"
                }`}
              >
                Inicio
              </Link>
              <Link
                to="/login"
                className={`transition-colors ${
                  isScrolled
                    ? "text-cemento-600 hover:text-cemento-900"
                    : "text-white hover:text-arena-100"
                }`}
              >
                Iniciar Sesión
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 bg-coral-600 text-white rounded-lg hover:bg-coral-700 transition-colors"
              >
                Registrarse
              </Link>
            </nav>

            <div className="md:hidden">
              <Link
                to="/login"
                className={`text-sm mr-3 transition-colors ${
                  isScrolled
                    ? "text-cemento-600 hover:text-cemento-900"
                    : "text-white hover:text-arena-100"
                }`}
              >
                Entrar
              </Link>
              <Link
                to="/register"
                className="text-sm px-3 py-1.5 bg-coral-600 text-white rounded-lg hover:bg-coral-700 transition-colors"
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

      <footer className="relative z-10 bg-cemento-900 mt-auto">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {/* Columna 1: Logo + Descripción */}
            <div>
              <div className="mb-4">
                <picture>
                  <source srcSet="/logo-navbar.webp" type="image/webp" />
                  <img
                    src="/logo_origin.png"
                    alt="Agregados Zambrana"
                    className="h-12 w-auto brightness-0 invert"
                  />
                </picture>
              </div>
              <p className="text-sm text-arena-100 leading-relaxed">
                Distribución de materiales de construcción en Cochabamba,
                Bolivia.
              </p>
            </div>

            {/* Columna 2: Enlaces Rápidos */}
            <div>
              <h3 className="font-semibold text-white mb-4">Enlaces Rápidos</h3>
              <nav className="space-y-3">
                <Link
                  to="/"
                  className="block text-sm text-arena-100 hover:text-coral-500 transition-colors"
                >
                  Inicio
                </Link>
                <a
                  href="/#servicios"
                  className="block text-sm text-arena-100 hover:text-coral-500 transition-colors"
                >
                  Servicios
                </a>
                <Link
                  to="/register"
                  className="block text-sm text-arena-100 hover:text-coral-500 transition-colors"
                >
                  Registrarse
                </Link>
                <Link
                  to="/login"
                  className="block text-sm text-arena-100 hover:text-coral-500 transition-colors"
                >
                  Iniciar Sesión
                </Link>
              </nav>
            </div>

            {/* Columna 3: Ubicación */}
            <div>
              <h3 className="font-semibold text-white mb-4">Ubicación</h3>
              <p className="text-sm text-arena-100">Cochabamba, Bolivia</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
