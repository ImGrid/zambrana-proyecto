import { Bars3Icon } from '@heroicons/react/24/outline';
import { UserMenu } from './UserMenu';

interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  return (
    <div className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-x-4 border-b border-piedra-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={onMenuClick}
        className="-m-2.5 p-2.5 text-cemento-700 lg:hidden hover:text-cemento-900 transition-colors"
      >
        <span className="sr-only">Abrir menú</span>
        <Bars3Icon className="h-6 w-6" aria-hidden="true" />
      </button>

      <div className="h-6 w-px bg-piedra-200 lg:hidden" aria-hidden="true" />

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="flex flex-1 items-center">
          {/* Page title o breadcrumbs irían aquí */}
        </div>
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          {/* Notification bell iría aquí (Fase 6) */}
          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-piedra-200" aria-hidden="true" />
          <UserMenu />
        </div>
      </div>
    </div>
  );
}
