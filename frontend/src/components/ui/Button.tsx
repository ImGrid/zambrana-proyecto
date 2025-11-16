import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Spinner } from './Spinner';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'success' | 'danger' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading,
      icon: Icon,
      fullWidth,
      children,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          // Base styles
          'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
          // Variant styles
          {
            'bg-coral-500 text-white hover:bg-coral-600 focus:ring-coral-500':
              variant === 'primary',
            'bg-cemento-100 text-cemento-700 hover:bg-cemento-200 focus:ring-cemento-500':
              variant === 'secondary',
            'border-2 border-piedra-300 bg-white text-cemento-700 hover:bg-cemento-50 focus:ring-cemento-500':
              variant === 'outline',
            'text-cemento-700 hover:bg-cemento-100 focus:ring-cemento-500':
              variant === 'ghost',
            'bg-success-500 text-white hover:bg-success-600 focus:ring-success-500':
              variant === 'success',
            'bg-error-500 text-white hover:bg-error-600 focus:ring-error-500':
              variant === 'danger',
            'bg-arena-500 text-white hover:bg-arena-600 focus:ring-arena-500':
              variant === 'warning',
          },
          // Size styles
          {
            'px-3 py-1.5 text-sm h-8': size === 'sm',
            'px-4 py-2 text-base h-10': size === 'md',
            'px-6 py-3 text-lg h-12': size === 'lg',
          },
          // Full width
          {
            'w-full': fullWidth,
          },
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Spinner size="sm" className="border-t-current" />}
        {Icon && !loading && <Icon className="h-5 w-5" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
