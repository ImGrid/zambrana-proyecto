import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'success' | 'info' | 'warning' | 'danger' | 'neutral';
  size?: 'sm' | 'md';
}

export function Badge({ variant = 'neutral', size = 'md', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        // Variant styles
        {
          'bg-coral-100 text-coral-800': variant === 'primary',
          'bg-success-100 text-success-800': variant === 'success',
          'bg-info-100 text-info-800': variant === 'info',
          'bg-arena-100 text-arena-800': variant === 'warning',
          'bg-error-100 text-error-800': variant === 'danger',
          'bg-cemento-100 text-cemento-800': variant === 'neutral',
        },
        // Size styles
        {
          'px-2 py-0.5 text-xs': size === 'sm',
          'px-2.5 py-1 text-sm': size === 'md',
        },
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
