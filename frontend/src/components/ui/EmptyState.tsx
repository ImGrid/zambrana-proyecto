import { InboxIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  message?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon = InboxIcon,
  title,
  description,
  message,
  action,
  className
}: EmptyStateProps) {
  const displayMessage = description || message;

  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-4', className)}>
      <div className="rounded-full bg-gray-100 p-4 mb-4">
        <Icon className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      {displayMessage && <p className="text-sm text-gray-500 text-center max-w-md mb-6">{displayMessage}</p>}
      {action && <div>{action}</div>}
    </div>
  );
}
