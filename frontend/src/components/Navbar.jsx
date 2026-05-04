import { Link, useLocation } from 'react-router-dom';
import { Menu, X, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout, loading } = useAuth();
  const location = useLocation();

  // Handle scroll effect for navbar styling
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Navigation links based on auth state and user role
  const navLinks = user ? (
    user.role === 'siswa' ? [
      { label: 'Dashboard', href: `/dashboard/${user.role}` },
      { label: 'Absensi', href: `/dashboard/${user.role}/attendance` },
      { label: 'Project', href: `/dashboard/${user.role}/projects` },
    ] : user.role === 'guru' ? [
      { label: 'Dashboard', href: `/dashboard/${user.role}` },
      { label: 'Absensi', href: `/dashboard/${user.role}/attendance` },
      { label: 'Siswa', href: `/dashboard/${user.role}/students` },
      { label: 'Izin', href: `/dashboard/${user.role}/permissions` },
    ] : user.role === 'admin' ? [
      { label: 'Dashboard', href: `/dashboard/${user.role}` },
      { label: 'Users', href: `/dashboard/${user.role}/users` },
      { label: 'Kelas', href: `/dashboard/${user.role}/classes` },
      { label: 'Mapel', href: `/dashboard/${user.role}/subjects` },
      { label: 'Jadwal', href: `/dashboard/${user.role}/schedules` },
    ] : [
      { label: 'Dashboard', href: `/dashboard/${user.role}` },
    ]
  ) : [
    { label: 'Beranda', href: '/' },
    { label: 'Galeri', href: '/gallery' },
    { label: 'Simulator', href: '/simulator' },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled 
        ? 'bg-white/90 dark:bg-dark-card/90 backdrop-blur-md shadow-lg border-b border-gray-200 dark:border-dark-border' 
        : 'bg-white/80 dark:bg-dark-card/80 backdrop-blur-md border-b border-gray-200/50 dark:border-dark-border/50'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-primary-400 flex items-center justify-center text-white font-bold text-xl group-hover:scale-110 transition-transform">
              R
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
              RPL Smart
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                  location.pathname === link.href
                    ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400'
                    : 'text-gray-600 dark:text-dark-muted hover:bg-gray-100 dark:hover:bg-dark-card hover:text-primary-600'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center space-x-3">
            
            {/* Theme Toggle */}
            <ThemeToggle />
            
            {/* User Section - FIXED: Proper condition for logout button */}
            {loading ? (
              // Loading state
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-dark-card animate-pulse" />
            ) : user ? (
              // Authenticated: Show user info + logout
              <>
                {/* User Avatar + Name (Desktop) */}
                <div className="hidden sm:flex items-center space-x-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-dark-card">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-600 to-primary-400 flex items-center justify-center text-white text-sm font-bold">
                    {user.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-dark-text truncate max-w-32">
                    {user.name}
                  </span>
                </div>
                
                {/* Logout Button - FIXED: Now visible! */}
                <button 
                  onClick={logout} 
                  className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-card transition-colors"
                  aria-label="Logout"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5 text-gray-600 dark:text-dark-muted hover:text-red-500" />
                </button>
              </>
            ) : (
              // Not authenticated: Show login button
              <Link to="/login" className="btn btn-primary text-sm">
                Login
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-card"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card animate-fade-in">
          <div className="px-4 py-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setMobileOpen(false)}
                className={`block px-4 py-3 rounded-xl text-base font-medium transition-colors ${
                  location.pathname === link.href
                    ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400'
                    : 'text-gray-600 dark:text-dark-muted hover:bg-gray-100 dark:hover:bg-dark-card'
                }`}
              >
                {link.label}
              </Link>
            ))}
            
            {/* Mobile: Login or Logout button */}
            {!user && !loading && (
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="block w-full mt-4 btn btn-primary text-center"
              >
                Login
              </Link>
            )}
            {user && !loading && (
              <button
                onClick={() => { setMobileOpen(false); logout(); }}
                className="block w-full mt-2 btn btn-outline text-red-600 hover:text-red-700 text-center"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}