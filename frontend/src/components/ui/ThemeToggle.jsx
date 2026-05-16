import { useState, useEffect } from 'react';
import { Sun, Moon, Sparkles, Zap, Star, Palette } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

// ═══════════════════════════════════════════════════════════
// 🎨 RETRO ANIMATION VARIANTS
// ═══════════════════════════════════════════════════════════
const buttonVariants = {
  rest: { 
    scale: 1, 
    rotate: 0,
    transition: { type: "spring", stiffness: 400, damping: 17 }
  },
  hover: { 
    scale: 1.1, 
    rotate: [0, -5, 5, -3, 3, 0],
    transition: { duration: 0.3 }
  },
  tap: { 
    scale: 0.95, 
    rotate: 0,
    transition: { duration: 0.1 }
  }
};

const iconVariants = {
  light: { 
    rotate: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 20 }
  },
  dark: { 
    rotate: 180,
    scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 20 }
  }
};

const sparkleVariants = {
  hidden: { opacity: 0, scale: 0, rotate: -180 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    rotate: 0,
    transition: { type: "spring", stiffness: 200, damping: 10 }
  },
  exit: { 
    opacity: 0, 
    scale: 0, 
    rotate: 180,
    transition: { duration: 0.2 }
  }
};

const tooltipVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 20 }
  },
  exit: { 
    opacity: 0, 
    y: 10,
    transition: { duration: 0.15 }
  }
};

// ═══════════════════════════════════════════════════════════
// 🎭 RETRO DECORATIVE COMPONENTS
// ═══════════════════════════════════════════════════════════

// Animated Sparkle Effect on Toggle
function ToggleSparkle({ show }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          variants={sparkleVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="absolute -top-8 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="retro-sticker bg-retro-yellow text-base-black text-[9px] px-2 py-0.5 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Theme Changed!
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Retro Tooltip with Arrow
function RetroTooltip({ children, show, position = 'bottom' }) {
  if (!show) return null;
  
  const positionClasses = {
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };
  
  const arrowClasses = {
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-2 border-l-2 border-base-black',
    top: 'top-full left-1/2 -translate-x-1/2 border-t-2 border-r-2 border-base-black',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-2 border-t-2 border-base-black',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-2 border-b-2 border-base-black',
  };
  
  return (
    <AnimatePresence>
      <motion.div
        variants={tooltipVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className={`absolute ${positionClasses[position]} z-50`}
      >
        <div className="relative">
          {/* Tooltip Arrow */}
          <div className={`absolute w-2 h-2 bg-retro-orange rotate-45 ${arrowClasses[position]}`} />
          
          {/* Tooltip Content */}
          <div className="retro-card bg-base-white border-2 border-base-black px-3 py-1.5 whitespace-nowrap shadow-[4px_4px_0px_0px_#111111]">
            <span className="font-retro-mono text-[10px] text-base-black">{children}</span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════
// 🎯 MAIN RETRO THEME TOGGLE COMPONENT
// ═══════════════════════════════════════════════════════════
export default function ThemeToggle({ size = 'md', showTooltip = true, tooltipPosition = 'bottom', onToggleComplete }) {
  const { isDark, toggleTheme } = useTheme();
  const [showSparkle, setShowSparkle] = useState(false);
  const [showTooltipState, setShowTooltipState] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  // Size variants
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };
  
  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  // Handle toggle with animation feedback
  const handleToggle = () => {
    setIsPressed(true);
    toggleTheme();
    setShowSparkle(true);
    
    // Hide sparkle after animation
    setTimeout(() => setShowSparkle(false), 1500);
    
    // Callback if provided
    if (onToggleComplete) {
      onToggleComplete(isDark ? 'light' : 'dark');
    }
    
    // Reset pressed state
    setTimeout(() => setIsPressed(false), 100);
  };

  // Keyboard shortcut support
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + T to toggle theme
      if ((e.ctrlKey || e.metaKey) && e.key === 't') {
        e.preventDefault();
        handleToggle();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDark]);

  // Auto-hide tooltip after delay
  useEffect(() => {
    if (showTooltipState) {
      const timer = setTimeout(() => setShowTooltipState(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [showTooltipState]);

  return (
    <div className="relative inline-block">
      {/* Sparkle Effect */}
      <ToggleSparkle show={showSparkle} />
      
      {/* Tooltip */}
      {showTooltip && (
        <RetroTooltip show={showTooltipState} position={tooltipPosition}>
          {isDark ? '☀️ Switch to Light' : '🌙 Switch to Dark'}
          <span className="text-base-black/40 ml-1">[Ctrl+T]</span>
        </RetroTooltip>
      )}
      
      {/* Main Toggle Button */}
      <motion.button
        variants={buttonVariants}
        initial="rest"
        whileHover="hover"
        whileTap="tap"
        onClick={handleToggle}
        onMouseEnter={() => showTooltip && setShowTooltipState(true)}
        onMouseLeave={() => setShowTooltipState(false)}
        className={`relative retro-card bg-base-white border-4 border-base-black ${sizeClasses[size]} flex items-center justify-center overflow-hidden group cursor-pointer shadow-[4px_4px_0px_0px_#111111] hover:shadow-[6px_6px_0px_0px_#FF5C00] transition-shadow duration-200`}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        title={isDark ? 'Switch to light mode (Ctrl+T)' : 'Switch to dark mode (Ctrl+T)'}
      >
        {/* Decorative Corner Accents */}
        <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-retro-orange" />
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-retro-blue" />
        
        {/* Animated Background Gradient on Hover */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-br from-retro-orange/10 via-retro-yellow/10 to-retro-blue/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          animate={{ 
            backgroundPosition: isPressed ? ['0% 0%', '100% 100%'] : '0% 0%',
          }}
          transition={{ duration: 0.5 }}
        />
        
        {/* Icon Container with Animation */}
        <motion.div
          variants={iconVariants}
          animate={isDark ? 'dark' : 'light'}
          className="relative z-10"
        >
          <AnimatePresence mode="wait" initial={false}>
            {isDark ? (
              <motion.div
                key="sun"
                initial={{ opacity: 0, scale: 0.8, rotate: -90 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.8, rotate: 90 }}
                transition={{ duration: 0.2 }}
              >
                <Sun className={`${iconSizeClasses[size]} text-retro-orange drop-shadow-retro`} />
              </motion.div>
            ) : (
              <motion.div
                key="moon"
                initial={{ opacity: 0, scale: 0.8, rotate: 90 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.8, rotate: -90 }}
                transition={{ duration: 0.2 }}
              >
                <Moon className={`${iconSizeClasses[size]} text-retro-blue drop-shadow-retro`} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
        
        {/* Animated Ring Effect on Toggle */}
        <AnimatePresence>
          {isPressed && (
            <motion.div
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 2.5, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 rounded-retro border-2 border-retro-yellow"
            />
          )}
        </AnimatePresence>
        
        {/* Decorative Sticker Badge */}
        <motion.div 
          variants={sparkleVariants}
          initial="hidden"
          animate="visible"
          className="absolute -top-1 -right-1"
        >
          <div className="retro-sticker bg-retro-lime text-base-black text-[8px] px-1.5 py-0.5 flex items-center gap-0.5">
            <Palette className="w-2 h-2" />
            {isDark ? 'DARK' : 'LIGHT'}
          </div>
        </motion.div>
        
        {/* Hover Indicator Dots */}
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="w-1 h-1 rounded-sm bg-retro-orange"
              animate={{ 
                scale: [1, 1.3, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{ 
                duration: 1, 
                repeat: Infinity, 
                delay: i * 0.2 
              }}
            />
          ))}
        </div>
      </motion.button>
      
      {/* Keyboard Shortcut Hint (Desktop Only) */}
      <div className="hidden lg:block absolute -bottom-6 left-1/2 -translate-x-1/2">
        <span className="font-retro-mono text-[9px] text-base-black/40">
          <kbd className="px-1 py-0.5 rounded-sm bg-base-gray border border-base-black/30 font-retro-mono">Ctrl</kbd>
          <span className="mx-0.5">+</span>
          <kbd className="px-1 py-0.5 rounded-sm bg-base-gray border border-base-black/30 font-retro-mono">T</kbd>
        </span>
      </div>
    </div>
  );
}