import { RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { queryClient } from '@/lib/react-query';
import { router } from './router';
import { CHART_COLORS } from '@/config/chart-colors';

export const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            iconTheme: {
              primary: CHART_COLORS.primary,
              secondary: '#fff',
            },
          },
        }}
      />
    </QueryClientProvider>
  );
};
