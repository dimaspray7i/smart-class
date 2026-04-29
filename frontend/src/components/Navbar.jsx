import { Link, useLocation } from 'react-router-dom';
import { Menu, X, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const navLinks = user 
    ? [
        { label: 'Dashboard', href: `/dashboard/${user.role}` },
        { label: 'Absensi', href: `/dashboard/${user.role}/attendance` },
        { label: 'Project', href: `/dashboard/${user.role}/projects` },
      ]
    : [
        { label: 'Beranda', href: '/' },
        { label: 'Galeri', href: '/gallery' },
        { label: 'Simulator', href: '/simulator' },
      ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled 
        ? 'bg-white/90 dark:bg-dark-card/90 backdrop-blur-md shadow-lg border-b border-gray-200 dark:border-dark-border' 
        : 'bg-transparent'
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
            <ThemeToggle />
            
            {user ? (
              <>
                <div className="hidden sm:flex items-center space-x-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-dark-card">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-600 to-primary-400 flex items-center justify-center text-white text-sm font-bold">
                    {user.name?.charAt(0)}
                  </div>
                  <span className="text-sm font-medium">{user.name}</span>
                </div>
                <button 
                  onClick={logout} 
                  className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-card transition-colors"
                  aria-label="Logout"
                >
                  <LogOut className="w-5 h-5 text-gray-600 dark:text-dark-muted" />
                </button>
              </>
            ) : (
              <Link to="/login" className="btn btn-primary text-sm">
                Login
              </Link>
            )}

            {/* Mobile Menu Button */}
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

      {/* Mobile Menu */}
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
            {!user && (
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="block w-full mt-4 btn btn-primary text-center"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}