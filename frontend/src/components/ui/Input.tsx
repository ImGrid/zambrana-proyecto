import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ComponentType<{ className?: string }>;
  rightIcon?: React.ComponentType<{ className?: string }>;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { label, error, helperText, leftIcon: LeftIcon, rightIcon: RightIcon, className, ...props },
    ref
  ) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-cemento-700 mb-1">
            {label}
            {props.required && <span className="text-error-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {LeftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <LeftIcon className="h-5 w-5 text-cemento-400" />
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              'block w-full rounded-lg border border-piedra-300 px-3 py-2 text-cemento-900 placeholder-cemento-400 transition',
              'focus:border-coral-500 focus:ring-2 focus:ring-coral-500/20 focus:outline-none',
              'disabled:bg-cemento-50 disabled:text-cemento-500 disabled:cursor-not-allowed',
              {
                'pl-10': LeftIcon,
                'pr-10': RightIcon,
                'border-error-500 focus:border-error-500 focus:ring-error-500/20': error,
              },
              className
            )}
            {...props}
          />
          {RightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <RightIcon className="h-5 w-5 text-cemento-400" />
            </div>
          )}
        </div>
        {error && <p className="mt-1 text-sm text-error-600">{error}</p>}
        {helperText && !error && <p className="mt-1 text-sm text-cemento-500">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
