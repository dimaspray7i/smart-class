import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg">
      <Navbar />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="lg:ml-64">
        {/* Mobile header */}
        <div className="lg:hidden h-16 flex items-center px-4 border-b border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card sticky top-16 z-30">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg">
            <Menu className="w-6 h-6" />
          </button>
        </div>
        
        {/* Page content */}
        <main className="p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}