import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// ═══════════════════════════════════════════════════════════
// 🔐 CONTEXT PROVIDERS - IMPORT ONCE
// ═══════════════════════════════════════════════════════════
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'

// ═══════════════════════════════════════════════════════════
// 🗂️ ROUTES & STYLES
// ═══════════════════════════════════════════════════════════
import { router } from './routes'
import './index.css'

// ═══════════════════════════════════════════════════════════
// 🎨 RETRO CONSOLE GREETING (Dev Only)
// ═══════════════════════════════════════════════════════════
if (process.env.NODE_ENV === 'development') {
  console.log(`
╔════════════════════════════════════════════╗
║  🚀 RPL SMART ECOSYSTEM v2.0 RETRO        ║
║  ─────────────────────────────────────    ║
║  ✨ Retro Futuristic UI Loaded            ║
║  🎮 Press ? for keyboard shortcuts        ║
║  🌙 Ctrl+T to toggle theme                ║
║  🔐 Ctrl+L for quick logout               ║
║                                          ║
║  Built with ❤️  & ☕  | Made in Indonesia  ║
╚════════════════════════════════════════════╝
  `)
}

// ═══════════════════════════════════════════════════════════
// 🔍 REACT QUERY CONFIG
// ═══════════════════════════════════════════════════════════
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
      onError: (error) => {
        // Retro-style error logging
        console.error('🔍 Query error:', {
          message: error?.message || 'Unknown error',
          timestamp: new Date().toISOString(),
          url: window.location.href,
        })
      },
    },
    mutations: {
      retry: 1,
      onError: (error) => {
        console.error('✏️ Mutation error:', {
          message: error?.message || 'Unknown error',
          timestamp: new Date().toISOString(),
        })
      },
    },
  },
})

// ═══════════════════════════════════════════════════════════
// 🎯 RENDER APP
// ═══════════════════════════════════════════════════════════
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)