import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, X, Rocket, Sparkles, Star, Zap, Search, Bell,
  ChevronRight, Home, Shield, Code, Users, BookOpen
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Sidebar from '../components/ui/sidebar';
import Footer from '../components/ui/Footer';
import ThemeToggle from '../components/ui/ThemeToggle';

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

// Floating Decorative Elements for Public Pages
function PublicDecorations() {
  return (
    <>
      {/* Floating Stars */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={`star-${i}`}
          variants={floatVariants}
          animate="animate"
          className="absolute hidden lg:block pointer-events-none"
          style={{
            top: `${5 + i * 15}%`,
            left: `${2 + i * 12}%`,
            animationDelay: `${i * 0.7}s`
          }}
        >
          <Star className={`w-${3 + (i % 4)} h-${3 + (i % 4)} text-retro-yellow fill-retro-yellow drop-shadow-retro animate-sparkle-retro`} />
        </motion.div>
      ))}
      
      {/* Floating Icons */}
      <motion.div variants={floatVariants} animate="animate" className="absolute top-20 right-12 hidden lg:block pointer-events-none">
        <Rocket className="w-7 h-7 text-retro-orange drop-shadow-retro animate-pulse" />
      </motion.div>
      <motion.div variants={floatVariants} animate="animate" className="absolute bottom-40 left-16 hidden lg:block pointer-events-none" style={{animationDelay: '1.5s'}}>
        <Code className="w-7 h-7 text-retro-purple drop-shadow-retro animate-pulse" />
      </motion.div>
      <motion.div variants={floatVariants} animate="animate" className="absolute top-1/3 right-1/4 hidden xl:block pointer-events-none" style={{animationDelay: '2.5s'}}>
        <BookOpen className="w-6 h-6 text-retro-blue drop-shadow-retro animate-pulse" />
      </motion.div>
      <motion.div variants={floatVariants} animate="animate" className="absolute bottom-1/3 left-1/3 hidden xl:block pointer-events-none" style={{animationDelay: '3s'}}>
        <Users className="w-6 h-6 text-retro-lime drop-shadow-retro animate-pulse" />
      </motion.div>
      
      {/* Decorative Blobs */}
      <div className="absolute top-1/5 left-1/5 w-48 h-48 bg-retro-orange/10 rounded-blob blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/5 right-1/5 w-40 h-40 bg-retro-blue/10 rounded-blob blur-3xl pointer-events-none animate-pulse" style={{animationDelay: '1.5s'}} />
      <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-retro-purple/10 rounded-blob blur-2xl pointer-events-none animate-pulse" style={{animationDelay: '2s'}} />
      <div className="absolute bottom-1/4 right-1/3 w-28 h-28 bg-retro-lime/10 rounded-blob blur-2xl pointer-events-none animate-pulse" style={{animationDelay: '2.5s'}} />
      
      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-retro-grid opacity-20 pointer-events-none" />
    </>
  );
}

// Retro Mobile Header for Public Pages
function RetroPublicHeader({ onMenuClick }) {
  const { isDark } = useTheme();
  const { user } = useAuth();
  
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
        
        {/* Logo Link - Retro Style */}
        <Link to="/" className="flex items-center gap-2 group">
          <motion.div 
            variants={pulseVariants}
            animate="animate"
            className="w-9 h-9 retro-card bg-retro-orange border-2 border-base-black flex items-center justify-center"
          >
            <Rocket className="w-5 h-5 text-base-white" />
          </motion.div>
          <span className="font-retro-display font-black text-base-black text-xl group-hover:text-retro-orange transition-colors">
            RPL SMART
          </span>
        </Link>
      </div>
      
      {/* Right Side Actions */}
      <div className="flex items-center gap-2">
        {/* Search Button (Public Pages) */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="p-2 retro-btn retro-btn-sm"
          aria-label="Search"
        >
          <Search className="w-5 h-5" />
        </motion.button>
        
        {/* Theme Toggle - Scaled for Mobile */}
        <div className="scale-75 origin-right">
          <ThemeToggle size="sm" showTooltip={false} />
        </div>
        
        {/* User Avatar / Login CTA */}
        {user ? (
          <Link to={`/dashboard/${user.role}`} className="w-8 h-8 retro-card bg-retro-purple border-2 border-retro-purple flex items-center justify-center">
            <span className="font-retro-display font-black text-retro-purple text-sm">{user.name?.charAt(0)?.toUpperCase() || 'U'}</span>
          </Link>
        ) : (
          <Link to="/login" className="retro-btn retro-btn-sm bg-retro-orange hover:bg-retro-orange/90 text-base-white text-xs">
            Login
          </Link>
        )}
      </div>
      
      {/* Decorative Sticker */}
      <motion.div 
        variants={stickerVariants}
        initial="hidden"
        animate="visible"
        className="absolute -top-2 -right-2"
      >
        <div className="retro-sticker bg-retro-yellow text-base-black text-[8px] px-2 py-0.5">
          PUBLIC ✨
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

// Retro Page Loader for Transitions
function RetroPublicLoader() {
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
// 🎯 MAIN RETRO PUBLIC LAYOUT COMPONENT
// ═══════════════════════════════════════════════════════════
export default function PublicLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  
  const { user, loading, authEvent } = useAuth();
  const { isDark, themeEvent } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  // Redirect authenticated users away from login/public to their dashboard
  useEffect(() => {
    if (!loading && user) {
      const dashboardPaths = {
        admin: '/dashboard/admin',
        guru: '/dashboard/teacher',
        siswa: '/dashboard/student',
      };
      const target = dashboardPaths[user.role] || '/dashboard';
      // Only redirect if currently on login page
      if (location.pathname === '/login') {
        navigate(target, { replace: true });
      }
    }
  }, [user, loading, location.pathname, navigate]);

  // Track page transitions for loading state
  useEffect(() => {
    setPageLoading(true);
    const timer = setTimeout(() => setPageLoading(false), 300);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  // Escape key down listener to close mobile sidebar
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Feedback event from auth or theme
  const feedbackEvent = authEvent || themeEvent;

  // ═══════════════════════════════════════════════════════════
  // 🎨 MAIN RENDER - RETRO FUTURISTIC PUBLIC LAYOUT
  // ═══════════════════════════════════════════════════════════
  return (
    <motion.div 
      variants={layoutVariants}
      initial="hidden"
      animate="visible"
      className="relative min-h-screen flex flex-col bg-base-cream retro-grid-bg overflow-x-hidden"
    >
      {/* Background Decorations */}
      <PublicDecorations />
      
      {/* Skip Link for Accessibility */}
      <RetroSkipLink />
      
      {/* Mobile Sidebar - only on non-login public pages */}
      {location.pathname !== '/login' && (
        <div className="lg:hidden">
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        </div>
      )}
      
      {/* Mobile Header - Retro Style */}
      {location.pathname !== '/login' && (
        <RetroPublicHeader onMenuClick={() => setSidebarOpen(true)} />
      )}
      
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
              <p className="font-retro-display font-black text-base-black text-sm mb-1">Public Page Shortcuts</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] font-retro-mono text-base-black/70">
                <span><kbd className="px-1.5 py-0.5 rounded-sm bg-base-gray border-2 border-base-black">H</kbd> Home</span>
                <span><kbd className="px-1.5 py-0.5 rounded-sm bg-base-gray border-2 border-base-black">G</kbd> Gallery</span>
                <span><kbd className="px-1.5 py-0.5 rounded-sm bg-base-gray border-2 border-base-black">S</kbd> Simulator</span>
                <span><kbd className="px-1.5 py-0.5 rounded-sm bg-base-gray border-2 border-base-black">L</kbd> Login</span>
                <span><kbd className="px-1.5 py-0.5 rounded-sm bg-base-gray border-2 border-base-black">?</kbd> Toggle hints</span>
                <span><kbd className="px-1.5 py-0.5 rounded-sm bg-base-gray border-2 border-base-black">Esc</kbd> Close</span>
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
      
      {/* Main Content Area */}
      <main 
        id="main-content"
        className={`flex-1 pt-20 lg:pt-20 ${user ? 'lg:ml-64' : ''}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                <RetroPublicLoader />
              </motion.div>
            ) : (
              <motion.div 
                key={location.pathname}
                variants={contentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <Outlet />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
      
      {/* Retro Footer */}
      {location.pathname !== '/login' && <Footer />}
      
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
      
      {/* Scroll to Top Button (appears on scroll) */}
      <ScrollToTopButton />
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════
// 🎭 RETRO SCROLL TO TOP BUTTON
// ═══════════════════════════════════════════════════════════
function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 400);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          whileHover={{ scale: 1.1, y: -3 }}
          whileTap={{ scale: 0.95 }}
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-40 retro-btn retro-btn-lg retro-btn-sticker flex items-center gap-2"
          aria-label="Scroll to top"
        >
          <ChevronRight className="w-5 h-5 rotate-[-90deg]" />
          <span className="hidden md:inline font-retro-mono text-xs">TOP</span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}