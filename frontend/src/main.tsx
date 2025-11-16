import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import 'leaflet/dist/leaflet.css';
import { App } from './app/App';
import { useAuthStore } from './features/auth/stores/auth.store';

// Hidratar el estado de autenticación antes de montar la app
useAuthStore.getState().hydrate().finally(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
});
