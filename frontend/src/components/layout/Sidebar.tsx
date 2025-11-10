import { Navigation } from './Navigation';
import { cn } from '@/lib/utils';

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  return (
    <div className={cn('flex grow flex-col gap-y-5 overflow-y-auto bg-gray-900 px-6', className)}>
      <div className="flex h-16 shrink-0 items-center">
        <img src="/logo.png" alt="Agregados Zambrana" className="h-10 w-auto" />
      </div>
      <Navigation />
    </div>
  );
}
