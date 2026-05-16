import { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Rocket, Sparkles, Star, Zap, AlertCircle, CheckCircle2,
  Loader2, X, ChevronUp
} from 'lucide-react';

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

// Floating Decorative Elements for Root Layout
function RootDecorations() {
  return (
    <>
      {/* Floating Stars */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={`star-${i}`}
          variants={floatVariants}
          animate="animate"
          className="absolute hidden lg:block pointer-events-none"
          style={{
            top: `${5 + i * 12}%`,
            left: `${3 + i * 10}%`,
            animationDelay: `${i * 0.6}s`
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
        <Zap className="w-6 h-6 text-retro-lime drop-shadow-retro animate-pulse" />
      </motion.div>
      
      {/* Decorative Blobs */}
      <div className="absolute top-1/5 left-1/5 w-48 h-48 bg-retro-orange/10 rounded-blob blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/5 right-1/5 w-40 h-40 bg-retro-blue/10 rounded-blob blur-3xl pointer-events-none animate-pulse" style={{animationDelay: '1.5s'}} />
      
      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-retro-grid opacity-20 pointer-events-none" />
    </>
  );
}

// Retro Global Loading Spinner
function RetroGlobalLoader() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-base-cream/95 backdrop-blur-sm"
    >
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="w-20 h-20 retro-card bg-retro-orange border-4 border-base-black flex items-center justify-center mb-6"
      >
        <Rocket className="w-10 h-10 text-base-white" />
      </motion.div>
      <p className="font-retro-mono text-base-black text-lg animate-pulse">Loading RPL Smart... 🚀</p>
      <div className="w-64 h-3 bg-base-gray border-2 border-base-black rounded-sm overflow-hidden mt-4">
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

// Retro Error Boundary Display
function RetroErrorDisplay({ error, onReset }) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-base-cream/95 backdrop-blur-sm p-4"
    >
      <div className="retro-card bg-base-white border-4 border-danger p-8 max-w-md w-full text-center shadow-[8px_8px_0px_0px_#FF1744]">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], rotate: [0, -5, 5, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="w-16 h-16 mx-auto mb-4 retro-card bg-danger/10 border-2 border-danger flex items-center justify-center"
        >
          <AlertCircle className="w-8 h-8 text-danger" />
        </motion.div>
        <h2 className="retro-heading retro-heading-lg text-base-black mb-3">Oops! Something went wrong</h2>
        <p className="font-retro-mono text-sm text-base-black/70 mb-6">{error?.message || 'An unexpected error occurred'}</p>
        <div className="flex gap-3 justify-center">
          <button onClick={onReset} className="retro-btn retro-btn-outline">
            Try Again
          </button>
          <button onClick={() => window.location.href = '/'} className="retro-btn bg-retro-orange hover:bg-retro-orange/90 text-base-white">
            Go Home
          </button>
        </div>
        {/* Decorative sticker */}
        <motion.div variants={stickerVariants} initial="hidden" animate="visible" className="absolute -top-3 -right-3">
          <div className="retro-sticker bg-retro-yellow text-base-black text-[10px] px-2 py-0.5">ERROR!</div>
        </motion.div>
      </div>
    </motion.div>
  );
}

// Retro Scroll to Top Button
function RetroScrollToTop() {
  const [visible, setVisible] = useState(false);
  const location = useLocation();
  
  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 400);
    };
    
    // Also hide on route change
    setVisible(false);
    
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [location.pathname]);
  
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
          <ChevronUp className="w-5 h-5" />
          <span className="hidden md:inline font-retro-mono text-xs">TOP</span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════
// 🎯 MAIN RETRO ROOT LAYOUT COMPONENT
// ═══════════════════════════════════════════════════════════
export default function RootLayout() {
  const [globalLoading, setGlobalLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Simulate initial app loading (for retro effect)
  useEffect(() => {
    const timer = setTimeout(() => {
      setGlobalLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Track page changes for analytics/loading
  useEffect(() => {
    // Could add page view tracking here
    // analytics.pageView(location.pathname);
    
    // Scroll to top on route change
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  // Global error handler
  useEffect(() => {
    const handleError = (event) => {
      setError({
        message: event.error?.message || 'An unexpected error occurred',
        source: event.filename || 'unknown',
        line: event.lineno,
      });
    };
    
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  // Reset error state
  const handleReset = () => {
    setError(null);
    // Could trigger a soft reload or navigation here
    navigate(location.pathname, { replace: true });
  };

  // ═══════════════════════════════════════════════════════════
  // 🎨 MAIN RENDER - RETRO FUTURISTIC ROOT LAYOUT
  // ═══════════════════════════════════════════════════════════
  
  // Show global loader while initializing
  if (globalLoading) {
    return <RetroGlobalLoader />;
  }
  
  // Show error boundary if error occurred
  if (error) {
    return <RetroErrorDisplay error={error} onReset={handleReset} />;
  }

  return (
    <motion.div 
      variants={layoutVariants}
      initial="hidden"
      animate="visible"
      className="relative min-h-screen bg-base-cream retro-grid-bg overflow-x-hidden"
    >
      {/* Background Decorations */}
      <RootDecorations />
      
      {/* Main Content Area with Page Transitions */}
      <main id="main-content" className="relative z-10">
        <AnimatePresence mode="wait">
          <motion.div 
            key={location.pathname}
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Outlet renders the current route's component */}
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      
      {/* Scroll to Top Button */}
      <RetroScrollToTop />
      
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
      
      {/* Global Toast Container for Auth/Theme Events */}
      <div id="global-toast-container" className="fixed top-24 right-6 z-50 space-y-2 pointer-events-none" />
    </motion.div>
  );
}