import { cn } from '@/lib/utils';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectFilterProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  label?: string;
  className?: string;
}

export const SelectFilter = ({
  value,
  onChange,
  options,
  placeholder = 'Seleccionar...',
  label,
  className
}: SelectFilterProps) => {
  return (
    <div className={cn('', className)}>
      {label && (
        <label className="block text-sm font-medium text-cemento-700 mb-1">
          {label}
        </label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="block w-full rounded-md border-0 py-2 pl-3 pr-10 text-cemento-900 ring-1 ring-inset ring-piedra-300 focus:ring-2 focus:ring-coral-500 sm:text-sm sm:leading-6"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};
