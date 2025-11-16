import { Navigation } from "./Navigation";
import { cn } from "@/lib/utils";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  return (
    <div
      className={cn(
        "flex grow flex-col gap-y-5 overflow-y-auto bg-cemento-900 px-6",
        className
      )}
    >
      <div className="flex h-32 shrink-0 items-center justify-center py-4">
        <picture>
          <source srcSet="/logo-sidebar.webp" type="image/webp" />
          <img
            src="/logo_origin.png"
            alt="Agregados Zambrana"
            className="h-28 w-auto brightness-0 invert"
          />
        </picture>
      </div>
      <Navigation />
    </div>
  );
}
