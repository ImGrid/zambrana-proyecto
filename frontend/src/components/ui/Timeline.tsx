import { cn } from '@/lib/utils';
import { Check, Clock, Truck, Package, CheckCircle2, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export interface TimelineItem {
  label: string;
  description?: string;
  timestamp?: Date | string;
  status: 'completed' | 'current' | 'upcoming' | 'cancelled';
  icon?: React.ReactNode;
}

export interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

const defaultIcons: Record<string, React.ReactNode> = {
  PENDIENTE: <Clock className="h-5 w-5" />,
  CONFIRMADO: <Check className="h-5 w-5" />,
  EN_PREPARACION: <Package className="h-5 w-5" />,
  EN_CAMINO: <Truck className="h-5 w-5" />,
  ENTREGADO: <CheckCircle2 className="h-5 w-5" />,
  CANCELADO: <XCircle className="h-5 w-5" />,
};

export function Timeline({ items, className }: TimelineProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const icon = item.icon || defaultIcons[item.label] || <Clock className="h-5 w-5" />;

        return (
          <div key={index} className="relative flex items-start">
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors',
                {
                  'border-green-600 bg-green-600 text-white': item.status === 'completed',
                  'border-blue-600 bg-blue-600 text-white': item.status === 'current',
                  'border-gray-300 bg-white text-gray-400': item.status === 'upcoming',
                  'border-red-600 bg-red-600 text-white': item.status === 'cancelled',
                }
              )}
            >
              {icon}
            </div>

            {!isLast && (
              <div
                className={cn(
                  'absolute left-5 top-10 w-0.5 h-full transition-colors',
                  {
                    'bg-green-600': item.status === 'completed',
                    'bg-gray-300': item.status === 'upcoming' || item.status === 'current',
                    'bg-red-600': item.status === 'cancelled',
                  }
                )}
              />
            )}

            <div className="ml-4 flex-1">
              <div
                className={cn(
                  'font-medium text-sm',
                  {
                    'text-green-600': item.status === 'completed',
                    'text-blue-600': item.status === 'current',
                    'text-gray-500': item.status === 'upcoming',
                    'text-red-600': item.status === 'cancelled',
                  }
                )}
              >
                {item.label}
              </div>

              {item.description && (
                <div className="text-sm text-gray-600 mt-1">
                  {item.description}
                </div>
              )}

              {item.timestamp && (
                <div className="text-xs text-gray-500 mt-1">
                  {typeof item.timestamp === 'string'
                    ? format(new Date(item.timestamp), "dd 'de' MMMM, yyyy 'a las' HH:mm", {
                        locale: es,
                      })
                    : format(item.timestamp, "dd 'de' MMMM, yyyy 'a las' HH:mm", {
                        locale: es,
                      })}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
