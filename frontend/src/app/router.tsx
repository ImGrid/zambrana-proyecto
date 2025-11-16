import { createBrowserRouter } from 'react-router-dom';
import { LoginPage } from '@/features/auth/routes/LoginPage';
import { RegisterPage } from '@/features/auth/routes/RegisterPage';
import { ProtectedRoute } from '@/features/auth/routes/ProtectedRoute';
import { MainLayout } from '@/components/layout/MainLayout';
import { ClienteLayout } from '@/components/layout/ClienteLayout';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { LandingPage } from '@/features/public/routes/LandingPage';
import { CatalogoPage } from '@/features/catalogo/routes/CatalogoPage';
import { CrearPedidoPage } from '@/features/pedido/routes/CrearPedidoPage';
import { DashboardPage } from '@/features/dashboard/routes/DashboardPage';
import { PedidosPage } from '@/features/pedidos/routes/PedidosPage';
import { MaterialesPage } from '@/features/materiales/routes/MaterialesPage';
import { ClientesPage } from '@/features/clientes/routes/ClientesPage';
import { CamionesPage } from '@/features/camiones/routes/CamionesPage';
import { ConductoresPage } from '@/features/conductores/routes/ConductoresPage';
import { UsuariosPage } from '@/features/usuarios/routes/UsuariosPage';
import { EntregasPage } from '@/features/entregas/routes/EntregasPage';
import { MonitorGPSPage } from '@/features/entregas/routes/MonitorGPSPage';
import { MisPedidosPage } from '@/features/cliente/routes/MisPedidosPage';
import { PerfilPage } from '@/features/cliente/routes/PerfilPage';
import { TrackingEntregaPage } from '@/features/cliente/routes/TrackingEntregaPage';
import { ROUTES } from '@/config/routes.config';

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      {
        path: '/',
        element: <LandingPage />,
      },
    ],
  },
  {
    element: <AuthLayout />,
    children: [
      {
        path: '/login',
        element: <LoginPage />,
      },
      {
        path: '/register',
        element: <RegisterPage />,
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <MainLayout />,
        children: [
          {
            path: ROUTES.DASHBOARD.path,
            element: <ProtectedRoute allowedRoles={ROUTES.DASHBOARD.allowedRoles} />,
            children: [
              {
                index: true,
                element: <DashboardPage />,
              },
            ],
          },
          {
            path: ROUTES.PEDIDOS.path,
            element: <ProtectedRoute allowedRoles={ROUTES.PEDIDOS.allowedRoles} />,
            children: [
              {
                index: true,
                element: <PedidosPage />,
              },
            ],
          },
          {
            path: ROUTES.MATERIALES.path,
            element: <ProtectedRoute allowedRoles={ROUTES.MATERIALES.allowedRoles} />,
            children: [
              {
                index: true,
                element: <MaterialesPage />,
              },
            ],
          },
          {
            path: ROUTES.CLIENTES.path,
            element: <ProtectedRoute allowedRoles={ROUTES.CLIENTES.allowedRoles} />,
            children: [
              {
                index: true,
                element: <ClientesPage />,
              },
            ],
          },
          {
            path: ROUTES.CAMIONES.path,
            element: <ProtectedRoute allowedRoles={ROUTES.CAMIONES.allowedRoles} />,
            children: [
              {
                index: true,
                element: <CamionesPage />,
              },
            ],
          },
          {
            path: ROUTES.CONDUCTORES.path,
            element: <ProtectedRoute allowedRoles={ROUTES.CONDUCTORES.allowedRoles} />,
            children: [
              {
                index: true,
                element: <ConductoresPage />,
              },
            ],
          },
          {
            path: ROUTES.MONITOR_GPS.path,
            element: <ProtectedRoute allowedRoles={ROUTES.MONITOR_GPS.allowedRoles} />,
            children: [
              {
                index: true,
                element: <MonitorGPSPage />,
              },
            ],
          },
          {
            path: ROUTES.USUARIOS.path,
            element: <ProtectedRoute allowedRoles={ROUTES.USUARIOS.allowedRoles} />,
            children: [
              {
                index: true,
                element: <UsuariosPage />,
              },
            ],
          },
          {
            path: ROUTES.ENTREGAS.path,
            element: <ProtectedRoute allowedRoles={ROUTES.ENTREGAS.allowedRoles} />,
            children: [
              {
                index: true,
                element: <EntregasPage />,
              },
            ],
          },
        ],
      },
      {
        element: <ClienteLayout />,
        children: [
          {
            path: ROUTES.CATALOGO.path,
            element: <ProtectedRoute allowedRoles={ROUTES.CATALOGO.allowedRoles} />,
            children: [
              {
                index: true,
                element: <CatalogoPage />,
              },
            ],
          },
          {
            path: ROUTES.MIS_PEDIDOS.path,
            element: <ProtectedRoute allowedRoles={ROUTES.MIS_PEDIDOS.allowedRoles} />,
            children: [
              {
                index: true,
                element: <MisPedidosPage />,
              },
            ],
          },
          {
            path: '/cliente/crear-pedido',
            element: <ProtectedRoute allowedRoles={['cliente']} />,
            children: [
              {
                index: true,
                element: <CrearPedidoPage />,
              },
            ],
          },
          {
            path: ROUTES.PERFIL_CLIENTE.path,
            element: <ProtectedRoute allowedRoles={ROUTES.PERFIL_CLIENTE.allowedRoles} />,
            children: [
              {
                index: true,
                element: <PerfilPage />,
              },
            ],
          },
          {
            path: '/cliente/tracking/:pedidoId',
            element: <ProtectedRoute allowedRoles={['cliente']} />,
            children: [
              {
                index: true,
                element: <TrackingEntregaPage />,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: (
      <div className="min-h-screen flex items-center justify-center bg-cemento-50">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-cemento-900 mb-4">404</h1>
          <p className="text-cemento-600 mb-6">Página no encontrada</p>
          <a href="/" className="text-coral-500 hover:text-coral-600 font-medium">
            Volver al inicio
          </a>
        </div>
      </div>
    ),
  },
]);
