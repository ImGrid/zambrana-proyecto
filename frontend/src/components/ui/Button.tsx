import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Spinner } from './Spinner';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'error' | 'warning' | 'success' | 'ghost';
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
            'bg-orange-500 text-white hover:bg-orange-600 focus:ring-orange-500':
              variant === 'primary',
            'bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-500':
              variant === 'secondary',
            'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500':
              variant === 'danger' || variant === 'error',
            'bg-yellow-500 text-white hover:bg-yellow-600 focus:ring-yellow-500':
              variant === 'warning',
            'bg-green-500 text-white hover:bg-green-600 focus:ring-green-500':
              variant === 'success',
            'text-gray-700 hover:bg-gray-100 focus:ring-gray-500': variant === 'ghost',
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
