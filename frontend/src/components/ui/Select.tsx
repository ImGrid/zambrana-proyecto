import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options?: SelectOption[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, options, className, children, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-cemento-700 mb-1">
            {label}
            {props.required && <span className="text-error-500 ml-1">*</span>}
          </label>
        )}
        <select
          ref={ref}
          className={cn(
            'block w-full rounded-lg border border-piedra-300 px-3 py-2 text-cemento-900 transition',
            'focus:border-coral-500 focus:ring-2 focus:ring-coral-500/20 focus:outline-none',
            'disabled:bg-cemento-50 disabled:text-cemento-500 disabled:cursor-not-allowed',
            {
              'border-error-500 focus:border-error-500 focus:ring-error-500/20': error,
            },
            className
          )}
          {...props}
        >
          {options ? (
            options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))
          ) : (
            children
          )}
        </select>
        {error && <p className="mt-1 text-sm text-error-600">{error}</p>}
        {helperText && !error && <p className="mt-1 text-sm text-cemento-500">{helperText}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
