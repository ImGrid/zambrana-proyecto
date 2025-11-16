import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Navigation } from './Navigation';

interface MobileSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function MobileSidebar({ open, onClose }: MobileSidebarProps) {
  return (
    <Dialog open={open} onClose={onClose} className="relative z-50 lg:hidden">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-cemento-900/80 transition-opacity duration-300 ease-linear data-closed:opacity-0"
      />

      <div className="fixed inset-0 flex">
        <DialogPanel
          transition
          className="relative mr-16 flex w-full max-w-xs flex-1 transform transition duration-300 ease-in-out data-closed:-translate-x-full"
        >
          <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-cemento-900 px-6 pb-2">
            <div className="flex h-32 shrink-0 items-center justify-between py-4">
              <picture>
                <source srcSet="/logo-sidebar.webp" type="image/webp" />
                <img
                  src="/logo_origin.png"
                  alt="Agregados Zambrana"
                  className="h-28 w-auto"
                />
              </picture>
              <button
                type="button"
                onClick={onClose}
                className="-m-2.5 p-2.5 text-cemento-300 hover:text-white transition-colors"
              >
                <span className="sr-only">Cerrar menú</span>
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            <Navigation onNavigate={onClose} />
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
