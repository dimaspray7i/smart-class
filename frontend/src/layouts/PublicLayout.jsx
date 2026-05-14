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
      <div className="hidden lg:block">
        <Navbar />
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
          
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-600 to-primary-400 flex items-center justify-center text-white font-bold text-lg">
              R
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
              RPL Smart
            </span>
          </Link>
        </div>
        
        <div className="flex items-center gap-2">
          <ThemeToggle />
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