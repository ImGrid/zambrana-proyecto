// Configuración centralizada de rutas y sus permisos

export type UserRole = 'admin' | 'gerente' | 'conductor' | 'cliente';

export interface RouteConfig {
  path: string;
  allowedRoles: UserRole[];
  name: string;
  description?: string;
}

// Definición de todas las rutas de la aplicación con sus roles permitidos
export const ROUTES: Record<string, RouteConfig> = {
  // Dashboard - Vista general del sistema
  DASHBOARD: {
    path: '/dashboard',
    allowedRoles: ['admin', 'gerente'],
    name: 'Dashboard',
    description: 'Panel principal con métricas y gráficos'
  },

  // Pedidos - Gestión de pedidos
  PEDIDOS: {
    path: '/pedidos',
    allowedRoles: ['admin', 'gerente'],
    name: 'Pedidos',
    description: 'Gestión de pedidos de clientes'
  },

  // Materiales - Gestión de inventario
  MATERIALES: {
    path: '/materiales',
    allowedRoles: ['admin', 'gerente'],
    name: 'Stock',
    description: 'Gestión de inventario de materiales'
  },

  // Clientes - Gestión de clientes
  CLIENTES: {
    path: '/clientes',
    allowedRoles: ['admin', 'gerente'],
    name: 'Clientes',
    description: 'Gestión de clientes'
  },

  // Camiones - Gestión de flota
  CAMIONES: {
    path: '/camiones',
    allowedRoles: ['admin', 'gerente'],
    name: 'Flota',
    description: 'Gestión de camiones y vehículos'
  },

  // Conductores - Gestión de conductores (solo admin)
  CONDUCTORES: {
    path: '/conductores',
    allowedRoles: ['admin'],
    name: 'Conductores',
    description: 'Gestión de conductores'
  },

  // Entregas - Vista de entregas para conductores
  ENTREGAS: {
    path: '/entregas',
    allowedRoles: ['conductor'],
    name: 'Mis Entregas',
    description: 'Entregas asignadas al conductor'
  },

  // Mis Pedidos - Vista de pedidos para clientes
  MIS_PEDIDOS: {
    path: '/cliente/pedidos',
    allowedRoles: ['cliente'],
    name: 'Mis Pedidos',
    description: 'Pedidos del cliente'
  },

  // Catálogo - Vista de catálogo para clientes
  CATALOGO: {
    path: '/cliente/catalogo',
    allowedRoles: ['cliente'],
    name: 'Catálogo',
    description: 'Catálogo de materiales'
  }
};

// Helper para obtener la ruta por defecto según el rol del usuario
export function getDefaultRouteForRole(role: UserRole): string {
  switch (role) {
    case 'admin':
    case 'gerente':
      return ROUTES.DASHBOARD.path;
    case 'conductor':
      return ROUTES.ENTREGAS.path;
    case 'cliente':
      return ROUTES.CATALOGO.path;
    default:
      return '/login';
  }
}

// Helper para verificar si un usuario tiene acceso a una ruta
export function hasAccessToRoute(userRole: UserRole, routePath: string): boolean {
  const route = Object.values(ROUTES).find(r => r.path === routePath);
  if (!route) return false;
  return route.allowedRoles.includes(userRole);
}

// Helper para obtener todas las rutas permitidas para un rol
export function getAllowedRoutesForRole(role: UserRole): RouteConfig[] {
  return Object.values(ROUTES).filter(route => route.allowedRoles.includes(role));
}
