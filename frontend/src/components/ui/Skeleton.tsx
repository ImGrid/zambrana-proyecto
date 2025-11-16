import { cn } from '@/lib/utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  variant = 'rectangular',
  width,
  height,
  className,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        'bg-cemento-200 animate-pulse',
        {
          'rounded': variant === 'rectangular',
          'rounded-full': variant === 'circular',
          'rounded h-4': variant === 'text',
        },
        className
      )}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
      }}
      {...props}
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-piedra-200 shadow-sm overflow-hidden">
      <Skeleton variant="rectangular" className="w-full h-48" />

      <div className="p-4 space-y-3">
        <Skeleton variant="text" className="w-3/4" />
        <Skeleton variant="text" className="w-1/2" />

        <div className="flex items-center justify-between pt-2">
          <Skeleton variant="text" className="w-1/3" />
          <Skeleton variant="rectangular" className="w-20 h-9 rounded" />
        </div>
      </div>
    </div>
  );
}

export function OrderCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-piedra-200 shadow-sm p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-2 flex-1">
          <Skeleton variant="text" className="w-32" />
          <Skeleton variant="text" className="w-48" />
        </div>
        <Skeleton variant="rectangular" className="w-24 h-6 rounded-full" />
      </div>

      <div className="space-y-2">
        <Skeleton variant="text" className="w-full" />
        <Skeleton variant="text" className="w-3/4" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function OrderListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <OrderCardSkeleton key={i} />
      ))}
    </div>
  );
}
