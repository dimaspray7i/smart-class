import { Link, useLocation } from 'react-router-dom';
import { X, LayoutDashboard, CalendarCheck, FolderKanban, GraduationCap, Users, BookOpen, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  // Don't render if no user and not open (shouldn't happen in layouts)
  if (!user && !isOpen) return null;

  // Role-based menu items
  const getMenuItems = () => {
    if (!user) {
      // Public menu items when not logged in
      return [
        { icon: LayoutDashboard, label: 'Beranda', href: '/' },
        { icon: Users, label: 'Gallery', href: '/gallery' },
        { icon: BookOpen, label: 'Simulator', href: '/simulator' },
      ];
    }

    if (user.role === 'siswa') {
      return [
        { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard/student' },
        { icon: CalendarCheck, label: 'Absensi', href: '/dashboard/student/attendance' },
        { icon: FolderKanban, label: 'Project', href: '/dashboard/student/projects' },
        { icon: GraduationCap, label: 'Skill', href: '/dashboard/student/skills' },
      ];
    } else if (user.role === 'guru') {
      return [
        { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard/teacher' },
        { icon: CalendarCheck, label: 'Absensi', href: '/dashboard/teacher/attendance' },
        { icon: Users, label: 'Siswa', href: '/dashboard/teacher/students' },
        { icon: BookOpen, label: 'Izin', href: '/dashboard/teacher/permissions' },
      ];
    } else if (user.role === 'admin') {
      return [
        { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard/admin' },
        { icon: Users, label: 'Users', href: '/dashboard/admin/users' },
        { icon: GraduationCap, label: 'Kelas', href: '/dashboard/admin/classes' },
        { icon: BookOpen, label: 'Mapel', href: '/dashboard/admin/subjects' },
        { icon: CalendarCheck, label: 'Jadwal', href: '/dashboard/admin/schedules' },
        { icon: Settings, label: 'Settings', href: '/dashboard/admin/settings' },
      ];
    }
    return [];
  };

  const menuItems = getMenuItems();

  return (
    <>
      {/* Mobile Overlay - Close sidebar when clicking outside */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Panel */}
      <aside className={`
        fixed top-0 left-0 z-40 h-screen w-64 
        bg-white dark:bg-dark-card 
        border-r border-gray-200 dark:border-dark-border 
        transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:z-auto
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          
          {/* Sidebar Header */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200 dark:border-dark-border">
            <span className="text-lg font-bold bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
              RPL Smart
            </span>
            <div className="flex items-center space-x-2">
              <ThemeToggle />
              {/* Close button for mobile */}
              <button 
                onClick={onClose} 
                className="lg:hidden p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-card"
                aria-label="Close menu"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-dark-muted" />
              </button>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={onClose}
                  className={`
                    flex items-center space-x-3 px-3 py-2.5 rounded-lg 
                    text-sm font-medium transition-all duration-200
                    ${isActive 
                      ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400 shadow-sm' 
                      : 'text-gray-600 dark:text-dark-muted hover:bg-gray-100 dark:hover:bg-dark-card hover:text-primary-600'
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-primary-600' : ''}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Info & Logout Section */}
          <div className="p-4 border-t border-gray-200 dark:border-dark-border space-y-3">
            {user ? (
              <>
                {/* User Info */}
                <div className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-gray-50 dark:bg-dark-card">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-600 to-primary-400 flex items-center justify-center text-white text-sm font-bold">
                    {user.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-dark-muted capitalize">
                      {user.role}
                    </p>
                  </div>
                </div>

                {/* Logout Button */}
                <button
                  onClick={() => {
                    if (window.confirm('Apakah Anda yakin ingin logout?')) {
                      logout();
                      onClose(); // Close sidebar after logout
                    }
                  }}
                  className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              /* Login Button for public users */
              <Link
                to="/login"
                onClick={onClose}
                className="w-full flex items-center justify-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium bg-primary-600 hover:bg-primary-700 text-white transition-colors"
              >
                <span>Login</span>
              </Link>
            )}

            {/* Version Info */}
            <p className="text-xs text-gray-500 dark:text-dark-muted text-center pt-2 border-t border-gray-200 dark:border-dark-border">
              RPL Smart v1.0
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}