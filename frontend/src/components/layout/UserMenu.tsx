import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { UserCircleIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useLogout } from '@/features/auth/hooks/useLogout';
import { useNavigate } from 'react-router-dom';

export function UserMenu() {
  const { user } = useAuth();
  const { mutate: logout } = useLogout();
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <Menu as="div" className="relative">
      <MenuButton className="flex items-center gap-x-2 text-sm focus:outline-none">
        <span className="sr-only">Abrir menú de usuario</span>
        <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
          <span className="text-sm font-medium text-orange-600">
            {user.nombre.charAt(0).toUpperCase()}
          </span>
        </div>
        <span className="hidden lg:flex lg:items-center">
          <span className="text-sm font-semibold text-gray-900" aria-hidden="true">
            {user.nombre}
          </span>
          <ChevronDownIcon className="ml-1 h-5 w-5 text-gray-400" aria-hidden="true" />
        </span>
      </MenuButton>

      <MenuItems
        transition
        anchor="bottom end"
        className="w-56 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5 transition duration-200 ease-out data-closed:scale-95 data-closed:opacity-0 mt-2"
      >
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-sm font-medium text-gray-900">{user.nombre}</p>
          <p className="text-xs text-gray-500 truncate">{user.email}</p>
          <p className="text-xs text-gray-500 mt-1">
            <span className="inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-800">
              {user.rol}
            </span>
          </p>
        </div>

        <MenuItem>
          {({ focus }) => (
            <button
              onClick={() => navigate('/perfil')}
              className={`${
                focus ? 'bg-gray-100' : ''
              } group flex w-full items-center px-4 py-2 text-sm text-gray-700 transition-colors`}
            >
              <UserCircleIcon className="mr-3 h-5 w-5 text-gray-400" aria-hidden="true" />
              Mi Perfil
            </button>
          )}
        </MenuItem>

        <MenuItem>
          {({ focus }) => (
            <button
              onClick={() => navigate('/configuracion')}
              className={`${
                focus ? 'bg-gray-100' : ''
              } group flex w-full items-center px-4 py-2 text-sm text-gray-700 transition-colors`}
            >
              <Cog6ToothIcon className="mr-3 h-5 w-5 text-gray-400" aria-hidden="true" />
              Configuración
            </button>
          )}
        </MenuItem>

        <div className="border-t border-gray-100 my-1" />

        <MenuItem>
          {({ focus }) => (
            <button
              onClick={() => logout()}
              className={`${
                focus ? 'bg-gray-100' : ''
              } group flex w-full items-center px-4 py-2 text-sm text-red-600 transition-colors`}
            >
              <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5 text-red-500" aria-hidden="true" />
              Cerrar Sesión
            </button>
          )}
        </MenuItem>
      </MenuItems>
    </Menu>
  );
}
