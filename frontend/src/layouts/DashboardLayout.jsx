import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg">
      {/* Mobile Sidebar - ONLY on mobile/tablet */}
      <div className="lg:hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Mobile Header - ONLY visible on mobile/tablet */}
      <header className="lg:hidden h-20 flex items-center justify-between px-4 border-b border-gray-200 dark:border-dark-border bg-white/80 dark:bg-dark-card/80 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-3">
          {/* Hamburger Menu Button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2.5 rounded-xl bg-gray-100 dark:bg-dark-card hover:bg-gray-200 dark:hover:bg-dark-border transition-all"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          </button>
          
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-600 to-primary-400 flex items-center justify-center text-white font-bold text-lg">
              R
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
              RPL Smart
            </span>
          </div>
        </div>
      </header>

      {/* Desktop Navbar - ONLY visible on desktop */}
      <div className="hidden lg:block fixed top-0 left-0 right-0 z-50">
        <Navbar />
      </div>

      {/* Page Content */}
      <main className="p-4 md:p-6 lg:p-8 lg:pt-24">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}