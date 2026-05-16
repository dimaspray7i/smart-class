import { useState, useEffect, useCallback } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, X, Rocket, Shield, Sparkles, Star, Zap, 
  ChevronRight, Home, Settings, LogOut, Bell, Search
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Sidebar from '../components/ui/sidebar';
import ThemeToggle from '../components/ui/ThemeToggle';
import RetroDesktopTopbar from '../components/ui/RetroDesktopTopbar';

// ═══════════════════════════════════════════════════════════
// 🎨 RETRO ANIMATION VARIANTS
// ═══════════════════════════════════════════════════════════
const layoutVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1, 
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } 
  }
};

const headerVariants = {
  hidden: { y: -20, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: { type: "spring", stiffness: 100, damping: 15 } 
  }
};

const contentVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { delay: 0.1, duration: 0.4 } 
  },
  exit: { 
    opacity: 0, 
    y: -10,
    transition: { duration: 0.2 } 
  }
};

const stickerVariants = {
  hidden: { scale: 0, rotate: -180, opacity: 0 },
  visible: { 
    scale: 1, 
    rotate: 0, 
    opacity: 1,
    transition: { type: "spring", stiffness: 200, damping: 10, delay: 0.5 } 
  },
  hover: { 
    scale: 1.15, 
    rotate: [0, -8, 8, -4, 4, 0],
    transition: { duration: 0.4 } 
  }
};

const floatVariants = {
  animate: {
    y: [0, -10, 0],
    rotate: [0, 3, -3, 0],
    transition: { duration: 5, repeat: Infinity, ease: "easeInOut" }
  }
};

const pulseVariants = {
  animate: {
    scale: [1, 1.05, 1],
    opacity: [0.7, 1, 0.7],
    transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
  }
};

// ═══════════════════════════════════════════════════════════
// 🎭 RETRO DECORATIVE COMPONENTS
// ═══════════════════════════════════════════════════════════

// Floating Decorative Elements for Dashboard
function DashboardDecorations() {
  return (
    <>
      {/* Floating Stars */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={`star-${i}`}
          variants={floatVariants}
          animate="animate"
          className="absolute hidden lg:block pointer-events-none"
          style={{
            top: `${10 + i * 18}%`,
            right: `${3 + i * 5}%`,
            animationDelay: `${i * 0.6}s`
          }}
        >
          <Star className={`w-${3 + (i % 3)} h-${3 + (i % 3)} text-retro-yellow fill-retro-yellow drop-shadow-retro animate-sparkle-retro`} />
        </motion.div>
      ))}
      
      {/* Floating Icons */}
      <motion.div variants={floatVariants} animate="animate" className="absolute top-24 right-8 hidden lg:block pointer-events-none">
        <Rocket className="w-6 h-6 text-retro-orange drop-shadow-retro animate-pulse" />
      </motion.div>
      <motion.div variants={floatVariants} animate="animate" className="absolute bottom-40 right-12 hidden lg:block pointer-events-none" style={{animationDelay: '2s'}}>
        <Shield className="w-6 h-6 text-retro-blue drop-shadow-retro animate-pulse" />
      </motion.div>
      <motion.div variants={floatVariants} animate="animate" className="absolute top-1/3 left-8 hidden xl:block pointer-events-none" style={{animationDelay: '1s'}}>
        <Zap className="w-5 h-5 text-retro-lime drop-shadow-retro animate-pulse" />
      </motion.div>
      
      {/* Decorative Blobs */}
      <div className="absolute top-1/4 left-1/4 w-40 h-40 bg-retro-orange/10 rounded-blob blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-32 h-32 bg-retro-blue/10 rounded-blob blur-3xl pointer-events-none animate-pulse" style={{animationDelay: '1.5s'}} />
      <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-retro-purple/10 rounded-blob blur-2xl pointer-events-none animate-pulse" style={{animationDelay: '2s'}} />
      
      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-retro-grid opacity-20 pointer-events-none" />
    </>
  );
}

// Retro Mobile Header
function RetroMobileHeader({ onMenuClick, user }) {
  const { isDark } = useTheme();
  
  return (
    <motion.header 
      variants={headerVariants}
      initial="hidden"
      animate="visible"
      className="lg:hidden h-20 flex items-center justify-between px-4 border-b-4 border-base-black bg-base-white/95 backdrop-blur-sm sticky top-0 z-50"
    >
      <div className="flex items-center gap-3">
        {/* Hamburger Menu Button - Retro Style */}
        <motion.button
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          onClick={onMenuClick}
          className="p-2.5 retro-btn retro-btn-sm"
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6" />
        </motion.button>
        
        {/* Logo - Retro Style */}
        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="flex items-center gap-2"
        >
          <motion.div 
            variants={pulseVariants}
            animate="animate"
            className="w-9 h-9 retro-card bg-retro-orange border-2 border-base-black flex items-center justify-center"
          >
            <Rocket className="w-5 h-5 text-base-white" />
          </motion.div>
          <span className="font-retro-display font-black text-base-black text-xl">
            RPL SMART
          </span>
        </motion.div>
      </div>
      
      {/* Right Side Actions */}
      <div className="flex items-center gap-2">
        {/* Search Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="p-2 retro-btn retro-btn-sm"
          aria-label="Search"
        >
          <Search className="w-5 h-5" />
        </motion.button>
        
        {/* Notifications */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="p-2 retro-btn retro-btn-sm relative"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          <motion.span 
            variants={pulseVariants}
            animate="animate"
            className="absolute -top-1 -right-1 w-4 h-4 retro-card bg-danger border-2 border-base-black flex items-center justify-center"
          >
            <span className="text-[8px] font-retro-mono text-base-white">3</span>
          </motion.span>
        </motion.button>
        
        {/* Theme Toggle - Scaled for Mobile */}
        <div className="scale-75 origin-right">
          <ThemeToggle size="sm" showTooltip={false} />
        </div>
      </div>
      
      {/* Decorative Sticker */}
      <motion.div 
        variants={stickerVariants}
        initial="hidden"
        animate="visible"
        className="absolute -top-2 -right-2"
      >
        <div className="retro-sticker bg-retro-yellow text-base-black text-[8px] px-2 py-0.5">
          DASHBOARD ✨
        </div>
      </motion.div>
    </motion.header>
  );
}

// Retro Skip Link for Accessibility
function RetroSkipLink() {
  return (
    <a 
      href="#main-content" 
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 retro-btn retro-btn-sm bg-retro-orange hover:bg-retro-orange/90 text-base-white"
    >
      Skip to main content
    </a>
  );
}

// Retro Loading Placeholder for Page Transitions
function RetroPageLoader() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center min-h-[400px] gap-4"
    >
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="w-16 h-16 retro-card bg-retro-orange border-4 border-base-black flex items-center justify-center"
      >
        <Rocket className="w-8 h-8 text-base-white" />
      </motion.div>
      <p className="font-retro-mono text-base-black/70 animate-pulse">Loading awesome content... 🚀</p>
      <div className="w-48 h-2 bg-base-gray border-2 border-base-black rounded-sm overflow-hidden">
        <motion.div 
          className="h-full bg-retro-orange"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          style={{ width: '50%' }}
        />
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════
// 🎯 MAIN RETRO DASHBOARD LAYOUT COMPONENT
// ═══════════════════════════════════════════════════════════
export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  const [keyboardHint, setKeyboardHint] = useState(false);
  
  const { user, logout, authEvent } = useAuth();
  const { isDark, themeEvent } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  // Combine auth and theme events for feedback toast
  const feedbackEvent = authEvent || themeEvent;

  // Handle body scroll lock when mobile sidebar is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [sidebarOpen]);

  // Track page transitions for loading state
  useEffect(() => {
    setPageLoading(true);
    const timer = setTimeout(() => setPageLoading(false), 300);
    if (window.innerWidth < 1024) setSidebarOpen(false); // Close sidebar on mobile route change
    return () => clearTimeout(timer);
  }, [location.pathname]);

  // Keyboard shortcuts support
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
      
      if (e.key === 'Escape') {
        setSidebarOpen(false);
        setKeyboardHint(false);
        return;
      }
      
      if (e.key === '?') {
        e.preventDefault();
        setKeyboardHint(prev => !prev);
        return;
      }

      if (e.ctrlKey && e.key === '[') {
        e.preventDefault();
        setSidebarCollapsed(prev => !prev);
        return;
      }
      
      if (e.ctrlKey && !e.altKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        const dashboardPath = user?.role === 'admin' ? '/dashboard/admin' : 
                             user?.role === 'guru' ? '/dashboard/teacher' : 
                             '/dashboard/student';
        navigate(dashboardPath);
        return;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [user, navigate, logout]);

  // ═══════════════════════════════════════════════════════════
  // 🎨 MAIN RENDER - RETRO FUTURISTIC DASHBOARD LAYOUT
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="relative min-h-screen bg-base-cream retro-grid-bg overflow-x-hidden selection:bg-retro-yellow selection:text-base-black">
      {/* Background Decorations */}
      <DashboardDecorations />
      
      {/* Skip Link for Accessibility */}
      <RetroSkipLink />

      {/* Unified Responsive Sidebar - FIXED */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      
      {/* Main Content Wrapper */}
      <div 
        className={`flex flex-col min-h-screen transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        {/* Desktop Topbar - Retro Global Header */}
        <RetroDesktopTopbar onMenuClick={() => setSidebarOpen(true)} />

        {/* Mobile Header - Retro Style */}
        <RetroMobileHeader onMenuClick={() => setSidebarOpen(true)} user={user} />
        
        {/* Main Content Area */}
        <main 
          id="main-content"
          className="flex-1 p-4 md:p-6 lg:p-8 relative z-10"
        >
          <div className="max-w-7xl mx-auto">
            {/* Page Content with Transition */}
            <AnimatePresence mode="wait">
              {pageLoading ? (
                <motion.div 
                  key="loader"
                  variants={contentVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <RetroPageLoader />
                </motion.div>
              ) : (
                <motion.div 
                  key={location.pathname}
                  variants={contentVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="w-full"
                >
                  <Outlet />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>

      
      {/* Keyboard Shortcut Hint */}
      <AnimatePresence>
        {keyboardHint && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 retro-card bg-base-white border-4 border-base-black px-4 py-3 flex items-center gap-3 max-w-md"
          >
            <Zap className="w-5 h-5 text-retro-orange" />
            <div className="flex-1">
              <p className="font-retro-display font-black text-base-black text-sm mb-1">Keyboard Shortcuts</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] font-retro-mono text-base-black/70">
                <span><kbd className="px-1.5 py-0.5 rounded-sm bg-base-gray border-2 border-base-black">Ctrl+D</kbd> Dashboard</span>
                <span><kbd className="px-1.5 py-0.5 rounded-sm bg-base-gray border-2 border-base-black">Ctrl+S</kbd> Settings</span>
                <span><kbd className="px-1.5 py-0.5 rounded-sm bg-base-gray border-2 border-base-black">Ctrl+L</kbd> Logout</span>
                <span><kbd className="px-1.5 py-0.5 rounded-sm bg-base-gray border-2 border-base-black">?</kbd> Toggle hints</span>
              </div>
            </div>
            <button onClick={() => setKeyboardHint(false)} className="p-1 retro-btn retro-btn-sm">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Auth/Theme Event Feedback Toast */}
      <AnimatePresence>
        {feedbackEvent && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-24 right-6 z-50"
          >
            <div className={`retro-card bg-base-white border-4 border-base-black p-4 min-w-[240px] shadow-[6px_6px_0px_0px_#111111] ${
              feedbackEvent.type === 'success' ? 'border-success' : 
              feedbackEvent.type === 'error' ? 'border-danger' : 
              feedbackEvent.type === 'warning' ? 'border-warning' : 'border-retro-blue'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-retro ${
                  feedbackEvent.type === 'success' ? 'bg-success/20 border-success' : 
                  feedbackEvent.type === 'error' ? 'bg-danger/20 border-danger' : 
                  feedbackEvent.type === 'warning' ? 'bg-warning/20 border-warning' : 'bg-retro-blue/20 border-retro-blue'
                } border-2`}>
                  {feedbackEvent.type === 'success' && <Sparkles className="w-4 h-4 text-success" />}
                  {feedbackEvent.type === 'error' && <X className="w-4 h-4 text-danger" />}
                  {feedbackEvent.type === 'warning' && <Zap className="w-4 h-4 text-warning" />}
                  {feedbackEvent.type === 'info' && <Star className="w-4 h-4 text-retro-blue" />}
                </div>
                <div className="flex-1">
                  <p className="font-retro-display font-black text-base-black text-sm">{feedbackEvent.message}</p>
                  {feedbackEvent.hint && (
                    <p className="font-retro-mono text-[10px] text-base-black/60 mt-1">{feedbackEvent.hint}</p>
                  )}
                </div>
              </div>
              {/* Decorative corner */}
              <div className="absolute top-1 right-1 w-2 h-2 bg-retro-yellow border border-base-black rounded-sm rotate-45" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      

      
      {/* Decorative Footer Stickers */}
      <div className="fixed bottom-4 left-4 z-0 hidden lg:block pointer-events-none">
        <motion.div 
          animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="retro-sticker bg-retro-pink text-base-white text-[10px] px-3 py-1"
        >
          POWERED BY RPL
        </motion.div>
      </div>
      <div className="fixed bottom-4 right-4 z-0 hidden lg:block pointer-events-none">
        <motion.div 
          animate={{ rotate: [0, 10, -10, 5, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity, delay: 1 }}
          className="retro-sticker bg-retro-lime text-base-black text-[10px] px-3 py-1"
        >
          v2.0 RETRO ✨
        </motion.div>
      </div>
      
      {/* Corner Accents */}
      <div className="fixed top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-retro-orange pointer-events-none z-0" />
      <div className="fixed bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-retro-blue pointer-events-none z-0" />
    </div>
  );
}