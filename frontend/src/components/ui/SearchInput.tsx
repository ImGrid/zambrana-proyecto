import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const SearchInput = ({
  value,
  onChange,
  placeholder = 'Buscar...',
  className
}: SearchInputProps) => {
  const handleClear = () => {
    onChange('');
  };

  return (
    <div className={cn('relative', className)}>
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <MagnifyingGlassIcon className="h-5 w-5 text-cemento-400" aria-hidden="true" />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="block w-full rounded-md border-0 py-2 pl-10 pr-10 text-cemento-900 ring-1 ring-inset ring-piedra-300 placeholder:text-cemento-400 focus:ring-2 focus:ring-inset focus:ring-coral-500 sm:text-sm sm:leading-6"
        placeholder={placeholder}
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-cemento-400 hover:text-cemento-600"
        >
          <XMarkIcon className="h-5 w-5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
};
