import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  itemsPerPage?: number;
  className?: string;
}

export const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
  className
}: PaginationProps) => {
  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className={cn('flex items-center justify-between border-t border-piedra-200 bg-white px-4 py-3 sm:px-6', className)}>
      <div className="flex flex-1 justify-between sm:hidden">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!canGoPrevious}
          className={cn(
            'relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md',
            canGoPrevious
              ? 'border border-piedra-300 bg-white text-cemento-700 hover:bg-cemento-50'
              : 'border border-piedra-200 bg-cemento-50 text-cemento-400 cursor-not-allowed'
          )}
        >
          Anterior
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!canGoNext}
          className={cn(
            'relative ml-3 inline-flex items-center px-4 py-2 text-sm font-medium rounded-md',
            canGoNext
              ? 'border border-piedra-300 bg-white text-cemento-700 hover:bg-cemento-50'
              : 'border border-piedra-200 bg-cemento-50 text-cemento-400 cursor-not-allowed'
          )}
        >
          Siguiente
        </button>
      </div>

      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-cemento-700">
            {totalItems && itemsPerPage ? (
              <>
                Mostrando{' '}
                <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span>
                {' '}-{' '}
                <span className="font-medium">
                  {Math.min(currentPage * itemsPerPage, totalItems)}
                </span>
                {' '}de{' '}
                <span className="font-medium">{totalItems}</span>
                {' '}resultados
              </>
            ) : (
              <>
                Página <span className="font-medium">{currentPage}</span> de{' '}
                <span className="font-medium">{totalPages}</span>
              </>
            )}
          </p>
        </div>

        <div>
          <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Paginación">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={!canGoPrevious}
              className={cn(
                'relative inline-flex items-center rounded-l-md px-2 py-2 text-cemento-400 ring-1 ring-inset ring-piedra-300 focus:z-20 focus:outline-offset-0',
                canGoPrevious ? 'hover:bg-cemento-50' : 'cursor-not-allowed opacity-50'
              )}
            >
              <span className="sr-only">Anterior</span>
              <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
            </button>

            {getPageNumbers().map((page, index) => (
              <button
                key={index}
                onClick={() => typeof page === 'number' ? onPageChange(page) : undefined}
                disabled={page === '...'}
                className={cn(
                  'relative inline-flex items-center px-4 py-2 text-sm font-semibold ring-1 ring-inset ring-piedra-300 focus:z-20 focus:outline-offset-0',
                  page === currentPage
                    ? 'z-10 bg-coral-500 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-500'
                    : page === '...'
                    ? 'text-cemento-700 cursor-default'
                    : 'text-cemento-900 hover:bg-cemento-50'
                )}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={!canGoNext}
              className={cn(
                'relative inline-flex items-center rounded-r-md px-2 py-2 text-cemento-400 ring-1 ring-inset ring-piedra-300 focus:z-20 focus:outline-offset-0',
                canGoNext ? 'hover:bg-cemento-50' : 'cursor-not-allowed opacity-50'
              )}
            >
              <span className="sr-only">Siguiente</span>
              <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
};
