import { LoginForm } from "../components/LoginForm";

export const LoginPage = () => {
  return (
    <div className="flex" style={{ minHeight: "calc(100vh - 64px)" }}>
      {/* Left side - Image/Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-coral-600 items-center justify-center p-12">
        <div className="max-w-md text-white">
          <h1 className="text-4xl font-bold mb-4">Agregados Zambrana</h1>
          <p className="text-lg opacity-90">
            Sistema de gestión y seguimiento GPS para entregas de materiales de
            construcción
          </p>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-arena-50">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="mb-8 text-center">
            <picture>
              <source srcSet="/logo-hero.webp" type="image/webp" />
              <img
                src="/logo_origin.png"
                alt="Agregados Zambrana"
                className="h-24 mx-auto mb-4"
              />
            </picture>
            <h2 className="text-2xl font-bold text-cemento-900">
              Iniciar Sesión
            </h2>
            <p className="text-sm text-cemento-600 mt-2">
              Ingresa tus credenciales para acceder al sistema
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-lg shadow-sm border border-piedra-200 p-8">
            <LoginForm />
          </div>

          {/* Footer info */}
          <p className="text-center text-sm text-cemento-500 mt-6">
            Sistema de Tracking GPS - Agregados Zambrana
          </p>
        </div>
      </div>
    </div>
  );
};
