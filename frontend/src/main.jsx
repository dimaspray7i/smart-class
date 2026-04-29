import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import RootLayout from './layouts/RootLayout';
import { router as baseRoutes } from './routes';
import './index.css';

// Setup React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// ✅ Wrap base routes dengan RootLayout yang berisi AuthProvider
const router = createBrowserRouter([
  {
    element: <RootLayout />, // ← AuthProvider ada di sini!
    children: baseRoutes,    // ← Semua routes menjadi children
  },
]);

// Render app
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>
);