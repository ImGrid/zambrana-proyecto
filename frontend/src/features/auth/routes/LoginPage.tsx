import { LoginForm } from '../components/LoginForm';

export const LoginPage = () => {
  return (
    <div className="flex" style={{ minHeight: 'calc(100vh - 64px)' }}>
      {/* Left side - Image/Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-orange-500 to-orange-600 items-center justify-center p-12">
        <div className="max-w-md text-white">
          <h1 className="text-4xl font-bold mb-4">Agregados Zambrana</h1>
          <p className="text-lg opacity-90">
            Sistema de gestión y seguimiento GPS para entregas de materiales de construcción
          </p>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="mb-8 text-center">
            <img
              src="/logo.png"
              alt="Agregados Zambrana"
              className="h-16 mx-auto mb-4"
            />
            <h2 className="text-2xl font-bold text-gray-900">Iniciar Sesión</h2>
            <p className="text-sm text-gray-600 mt-2">
              Ingresa tus credenciales para acceder al sistema
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <LoginForm />
          </div>

          {/* Footer info */}
          <p className="text-center text-sm text-gray-500 mt-6">
            Sistema de Tracking GPS - Agregados Zambrana
          </p>
        </div>
      </div>
    </div>
  );
};
