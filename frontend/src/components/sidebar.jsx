import { Link, useLocation } from 'react-router-dom';
import { X, LayoutDashboard, CalendarCheck, FolderKanban, GraduationCap, Users, BookOpen, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const getMenuItems = () => {
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
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-40 h-screen w-64 bg-white dark:bg-dark-card 
        border-r border-gray-200 dark:border-dark-border 
        transform transition-transform duration-300 lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-dark-border">
            <span className="text-lg font-bold bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
              RPL Smart
            </span>
            <button onClick={onClose} className="lg:hidden ml-auto p-2">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Menu */}
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
                    text-sm font-medium transition-colors
                    ${isActive 
                      ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/20' 
                      : 'text-gray-600 dark:text-dark-muted hover:bg-gray-100 dark:hover:bg-dark-card'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-dark-border">
            <p className="text-xs text-gray-500 dark:text-dark-muted text-center">
              RPL Smart v1.0
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}