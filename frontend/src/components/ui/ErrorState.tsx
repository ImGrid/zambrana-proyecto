import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { Button } from './Button';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Error al cargar los datos',
  message = 'Ocurrió un error al intentar cargar la información. Por favor, intenta nuevamente.',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-4', className)}>
      <div className="rounded-full bg-error-100 p-4 mb-4">
        <ExclamationTriangleIcon className="h-8 w-8 text-error-600" />
      </div>
      <h3 className="text-lg font-semibold text-cemento-900 mb-2">{title}</h3>
      <p className="text-sm text-cemento-500 text-center max-w-md mb-6">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="secondary">
          Reintentar
        </Button>
      )}
    </div>
  );
}
