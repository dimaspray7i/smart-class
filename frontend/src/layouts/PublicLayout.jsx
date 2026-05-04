import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';

export default function PublicLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-dark-bg">
      {/* Mobile Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Desktop Navbar */}
      <Navbar />

      {/* Mobile Header - ONLY visible on mobile/tablet */}
      <header className="lg:hidden h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card sticky top-0 z-30">
        <div className="flex items-center gap-3">
          {/* Hamburger Menu Button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-card transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          </button>
          <span className="font-semibold text-gray-900 dark:text-white">
            RPL Smart
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pt-20 lg:pt-20">
        <Outlet />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}