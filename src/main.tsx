import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, createHashRouter, RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@fontsource-variable/manrope';
import '@fontsource-variable/newsreader';
import '@fontsource-variable/plus-jakarta-sans';
import '@fontsource-variable/montserrat';
import './index.css';
import { AuthProvider } from './lib/auth';
import App from './App';

async function start() {
  // Solo en la demostración: base de datos simulada en memoria (no se incluye en el sitio real).
  if (import.meta.env.VITE_DEMO) await import('./demo/demo');

  const qc = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false } } });
  const routes = [{ path: '*', element: <AuthProvider><App /></AuthProvider> }];
  const router = import.meta.env.VITE_DEMO ? createHashRouter(routes) : createBrowserRouter(routes);

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={qc}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>,
  );
}
start();
