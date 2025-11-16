import { ReactNode } from 'react';

interface PlaceholderPageProps {
  title: string;
  description: string;
  icon?: ReactNode;
}

export const PlaceholderPage = ({ title, description, icon }: PlaceholderPageProps) => {
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className="max-w-md w-full text-center">
        {icon && (
          <div className="mx-auto h-12 w-12 text-cemento-400 mb-4">
            {icon}
          </div>
        )}
        <h2 className="text-2xl font-bold text-cemento-900 mb-2">{title}</h2>
        <p className="text-cemento-600 mb-6">{description}</p>
        <div className="inline-flex items-center px-4 py-2 bg-coral-50 text-coral-700 rounded-lg text-sm font-medium">
          Próximamente
        </div>
      </div>
    </div>
  );
};
