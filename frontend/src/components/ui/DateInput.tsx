import { cn } from '@/lib/utils';

interface DateInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
}

export const DateInput = ({
  value,
  onChange,
  label,
  placeholder,
  className
}: DateInputProps) => {
  return (
    <div className={cn('', className)}>
      {label && (
        <label className="block text-sm font-medium text-cemento-700 mb-1">
          {label}
        </label>
      )}
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="block w-full rounded-md border-0 py-2 px-3 text-cemento-900 ring-1 ring-inset ring-piedra-300 placeholder:text-cemento-400 focus:ring-2 focus:ring-inset focus:ring-coral-500 sm:text-sm sm:leading-6"
      />
    </div>
  );
};
