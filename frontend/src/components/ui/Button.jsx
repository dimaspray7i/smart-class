import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion } from 'framer-motion';
import { Sparkles, Zap, Star, AlertCircle, CheckCircle2 } from 'lucide-react';

// ═══════════════════════════════════════════════════════════
// 🎨 RETRO ANIMATION VARIANTS
// ═══════════════════════════════════════════════════════════
const buttonVariants = {
  rest: { 
    scale: 1, 
    rotate: 0,
    boxShadow: '4px 4px 0px 0px #111111',
    transition: { type: "spring", stiffness: 400, damping: 17 }
  },
  hover: { 
    scale: 1.03, 
    rotate: -1,
    boxShadow: '6px 6px 0px 0px #FF5C00',
    transition: { duration: 0.15 }
  },
  tap: { 
    scale: 0.97, 
    rotate: 1,
    boxShadow: '2px 2px 0px 0px #111111',
    y: 2,
    transition: { duration: 0.1 }
  },
  disabled: {
    opacity: 0.6,
    boxShadow: '2px 2px 0px 0px #11111140',
    cursor: 'not-allowed'
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

const loadingVariants = {
  animate: {
    rotate: 360,
    transition: { duration: 1, repeat: Infinity, ease: "linear" }
  }
};

// ═══════════════════════════════════════════════════════════
// 🎭 RETRO DECORATIVE COMPONENTS
// ═══════════════════════════════════════════════════════════

// Animated Sparkle Effect on Click
function ButtonSparkle({ show, color = 'yellow' }) {
  const colorClasses = {
    yellow: 'bg-retro-yellow text-base-black',
    orange: 'bg-retro-orange text-base-white',
    blue: 'bg-retro-blue text-base-white',
    purple: 'bg-retro-purple text-base-white',
  };

  return (
    <motion.div
      variants={sparkleVariants}
      initial="hidden"
      animate={show ? "visible" : "hidden"}
      exit="exit"
      className="absolute -top-6 left-1/2 -translate-x-1/2 z-10 pointer-events-none"
    >
      <div className={`retro-sticker ${colorClasses[color]} text-[9px] px-2 py-0.5 flex items-center gap-1`}>
        <Sparkles className="w-3 h-3" />
        Done!
      </div>
    </motion.div>
  );
}

// Retro Loading Spinner with Brutalist Style
function RetroSpinner({ color = 'currentColor' }) {
  return (
    <motion.svg
      variants={loadingVariants}
      animate="animate"
      className="w-4 h-4 mr-2"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle 
        className="opacity-25" 
        cx="12" 
        cy="12" 
        r="10" 
        stroke={color} 
        strokeWidth="4" 
        strokeLinecap="round"
      />
      <path 
        className="opacity-75" 
        fill={color} 
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" 
      />
    </motion.svg>
  );
}

// ═══════════════════════════════════════════════════════════
// 🎯 MAIN RETRO BUTTON COMPONENT
// ═══════════════════════════════════════════════════════════
export default function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className, 
  loading = false,
  disabled = false,
  showSparkle = false,
  sparkleColor,
  onClick,
  ...props 
}) {
  // Base retro styles - brutalist borders & hard shadows
  const baseStyles = 'relative inline-flex items-center justify-center font-retro-display font-black uppercase tracking-wide rounded-retro border-4 border-base-black transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-retro-orange/30 disabled:cursor-not-allowed overflow-hidden';
  
  // Retro color variants with brutalist styling
  const variants = {
    primary: 'bg-retro-orange hover:bg-retro-orange/90 text-white shadow-[4px_4px_0px_0px_#111111] hover:shadow-[6px_6px_0px_0px_#FF5C00] active:shadow-[2px_2px_0px_0px_#111111]',
    secondary: 'bg-retro-blue hover:bg-retro-blue/90 text-white shadow-[4px_4px_0px_0px_#111111] hover:shadow-[6px_6px_0px_0px_#2E2BBF] active:shadow-[2px_2px_0px_0px_#111111]',
    outline: 'bg-base-white hover:bg-retro-yellow/20 text-base-black shadow-[4px_4px_0px_0px_#111111] hover:shadow-[6px_6px_0px_0px_#FFC928] active:shadow-[2px_2px_0px_0px_#111111]',
    danger: 'bg-danger hover:bg-danger/90 text-white shadow-[4px_4px_0px_0px_#111111] hover:shadow-[6px_6px_0px_0px_#FF1744] active:shadow-[2px_2px_0px_0px_#111111]',
    success: 'bg-success hover:bg-success/90 text-white shadow-[4px_4px_0px_0px_#111111] hover:shadow-[6px_6px_0px_0px_#10b981] active:shadow-[2px_2px_0px_0px_#111111]',
    warning: 'bg-warning hover:bg-warning/90 text-base-black shadow-[4px_4px_0px_0px_#111111] hover:shadow-[6px_6px_0px_0px_#f59e0b] active:shadow-[2px_2px_0px_0px_#111111]',
    ghost: 'bg-transparent hover:bg-retro-yellow/10 text-base-black border-2 border-base-black shadow-none hover:shadow-[4px_4px_0px_0px_#FFC928] active:shadow-[2px_2px_0px_0px_#111111]',
  };

  // Retro size variants
  const sizes = {
    sm: 'px-3 py-1.5 text-[10px] min-h-[32px]',
    md: 'px-4 py-2 text-xs min-h-[40px]',
    lg: 'px-6 py-3 text-sm min-h-[48px]',
    xl: 'px-8 py-4 text-base min-h-[56px]',
  };

  // Get sparkle color based on variant if not specified
  const defaultSparkleColor = {
    primary: 'orange',
    secondary: 'blue',
    outline: 'yellow',
    danger: 'orange',
    success: 'lime',
    warning: 'yellow',
    ghost: 'yellow',
  }[variant];

  const finalSparkleColor = sparkleColor || defaultSparkleColor;

  // Handle click with optional sound effect & sparkle
  const handleClick = (e) => {
    // Optional: Play retro click sound
    // playRetroClickSound();
    
    // Call original onClick if provided
    if (onClick) onClick(e);
  };

  // Optional: Retro click sound effect (uncomment to enable)
  // const playRetroClickSound = () => {
  //   try {
  //     const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  //     const oscillator = audioCtx.createOscillator();
  //     const gainNode = audioCtx.createGain();
  //     
  //     oscillator.connect(gainNode);
  //     gainNode.connect(audioCtx.destination);
  //     
  //     // Retro "blip" sound
  //     oscillator.type = 'square';
  //     oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
  //     gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
  //     gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
  //     
  //     oscillator.start(audioCtx.currentTime);
  //     oscillator.stop(audioCtx.currentTime + 0.08);
  //   } catch (e) {
  //     // Silently fail if audio not supported
  //   }
  // };

  return (
    <motion.button
      variants={buttonVariants}
      initial="rest"
      whileHover={!disabled && !loading ? "hover" : undefined}
      whileTap={!disabled && !loading ? "tap" : undefined}
      animate={disabled ? "disabled" : "rest"}
      onClick={!disabled && !loading ? handleClick : undefined}
      className={twMerge(
        baseStyles,
        variants[variant],
        sizes[size],
        (disabled || loading) && 'opacity-60',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {/* Decorative Corner Accents */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-base-white/30 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-base-white/30 pointer-events-none" />

      {/* Animated Background Gradient on Hover */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-br from-base-white/10 via-transparent to-base-black/10 opacity-0"
        animate={{ 
          opacity: (!disabled && !loading) ? 1 : 0,
        }}
        transition={{ duration: 0.2 }}
      />

      {/* Loading State */}
      {loading && <RetroSpinner color="currentColor" />}

      {/* Children with optional icon spacing */}
      <span className="relative z-10 flex items-center gap-2">
        {children}
      </span>

      {/* Sparkle Effect on Success */}
      {showSparkle && !loading && (
        <ButtonSparkle show={showSparkle} color={finalSparkleColor} />
      )}

      {/* Hover Indicator Dots (Bottom Center) */}
      {!disabled && !loading && variant !== 'ghost' && (
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="w-1 h-1 rounded-sm bg-base-white"
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
      )}
    </motion.button>
  );
}