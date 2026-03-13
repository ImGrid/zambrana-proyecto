import { NavLink } from 'react-router-dom';
import {
  HomeIcon,
  ShoppingCartIcon,
  CubeIcon,
  UsersIcon,
  TruckIcon,
  UserIcon,
  UserGroupIcon,
  MapIcon,
  MapPinIcon,
  ShareIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { useAuth } from '@/features/auth/hooks/useAuth';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
}

const navItems: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, roles: ['admin', 'gerente'] },
  { name: 'Pedidos', href: '/pedidos', icon: ShoppingCartIcon, roles: ['admin', 'gerente'] },
  { name: 'Stock', href: '/materiales', icon: CubeIcon, roles: ['admin', 'gerente'] },
  { name: 'Clientes', href: '/clientes', icon: UsersIcon, roles: ['admin', 'gerente'] },
  { name: 'Camiones', href: '/camiones', icon: TruckIcon, roles: ['admin', 'gerente'] },
  { name: 'Conductores', href: '/conductores', icon: UserIcon, roles: ['admin', 'gerente'] },
  { name: 'Monitor GPS', href: '/monitor-gps', icon: MapPinIcon, roles: ['admin', 'gerente'] },
  { name: 'Operaciones', href: '/operaciones', icon: ShareIcon, roles: ['admin', 'gerente'] },
  { name: 'Usuarios', href: '/usuarios', icon: UserGroupIcon, roles: ['admin'] },
  { name: 'Mis Entregas', href: '/entregas', icon: MapIcon, roles: ['conductor'] },
];

interface NavigationProps {
  onNavigate?: () => void;
}

export function Navigation({ onNavigate }: NavigationProps) {
  const { user } = useAuth();

  const filteredItems = navItems.filter((item) => user?.rol && item.roles.includes(user.rol));

  return (
    <nav className="flex flex-1 flex-col">
      <ul role="list" className="flex flex-1 flex-col gap-y-1">
        {filteredItems.map((item) => (
          <li key={item.name}>
            <NavLink
              to={item.href}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'group flex gap-x-3 rounded-lg p-3 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-coral-600 text-white'
                    : 'text-cemento-300 hover:bg-cemento-800 hover:text-white'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className={cn(
                      'h-5 w-5 shrink-0 transition-colors',
                      isActive ? 'text-white' : 'text-cemento-400 group-hover:text-white'
                    )}
                    aria-hidden="true"
                  />
                  {item.name}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
