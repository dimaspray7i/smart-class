import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, X, Info, Sparkles, Zap } from 'lucide-react';

// ═══════════════════════════════════════════════════════════
// 🎨 RETRO ANIMATION VARIANTS
// ═══════════════════════════════════════════════════════════
const toastVariants = {
  hidden: { 
    opacity: 0, 
    x: 100, 
    scale: 0.9,
    rotate: -5
  },
  visible: { 
    opacity: 1, 
    x: 0, 
    scale: 1,
    rotate: 0,
    transition: { 
      type: "spring", 
      stiffness: 300, 
      damping: 25 
    }
  },
  exit: { 
    opacity: 0, 
    x: 100, 
    scale: 0.9,
    rotate: 5,
    transition: { duration: 0.15 }
  }
};

const iconVariants = {
  animate: {
    scale: [1, 1.2, 1],
    rotate: [0, 10, -10, 0],
    transition: { duration: 0.5, repeat: Infinity, repeatDelay: 2 }
  }
};

const closeVariants = {
  hover: { 
    scale: 1.2, 
    rotate: 90,
    transition: { duration: 0.2 }
  },
  tap: { scale: 0.9 }
};

// ═══════════════════════════════════════════════════════════
// 🎭 RETRO TOAST COMPONENT
// ═══════════════════════════════════════════════════════════
export default function Toast({ 
  message, 
  type = 'success', 
  onClose, 
  duration = 3000,
  showIcon = true,
  showSparkle = true,
  position = 'top-right'
}) {
  const icons = {
    success: { 
      icon: CheckCircle2, 
      color: 'text-success', 
      bg: 'bg-success/10', 
      border: 'border-success',
      sticker: 'bg-success text-base-white',
      label: 'SUCCESS'
    },
    error: { 
      icon: AlertCircle, 
      color: 'text-danger', 
      bg: 'bg-danger/10', 
      border: 'border-danger',
      sticker: 'bg-danger text-base-white',
      label: 'ERROR'
    },
    warning: { 
      icon: AlertCircle, 
      color: 'text-warning', 
      bg: 'bg-warning/10', 
      border: 'border-warning',
      sticker: 'bg-warning text-base-black',
      label: 'WARNING'
    },
    info: { 
      icon: Info, 
      color: 'text-retro-blue', 
      bg: 'bg-retro-blue/10', 
      border: 'border-retro-blue',
      sticker: 'bg-retro-blue text-base-white',
      label: 'INFO'
    },
  };
  
  const config = icons[type] || icons.info;
  const Icon = config.icon;

  // Auto-close timer
  // Note: In production, use useEffect with cleanup
  // This is simplified for the component

  return (
    <AnimatePresence>
      <motion.div
        variants={toastVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className={`relative retro-card bg-base-white border-4 border-base-black shadow-[6px_6px_0px_0px_#111111] p-4 min-w-[280px] max-w-sm ${position === 'top-right' ? 'ml-auto' : ''}`}
      >
        {/* Decorative Corner Accents */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-retro-orange pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-retro-blue pointer-events-none" />
        
        {/* Content */}
        <div className="flex items-start gap-3">
          {/* Icon with Animation */}
          {showIcon && (
            <motion.div 
              variants={iconVariants}
              animate="animate"
              className={`p-2 rounded-retro ${config.bg} border-2 ${config.border} flex-shrink-0`}
            >
              <Icon className={`w-5 h-5 ${config.color}`} />
            </motion.div>
          )}
          
          {/* Message */}
          <div className="flex-1 min-w-0">
            <p className="font-retro-display font-black text-base-black text-sm leading-tight">
              {message}
            </p>
          </div>
          
          {/* Close Button */}
          {onClose && (
            <motion.button 
              variants={closeVariants}
              whileHover="hover"
              whileTap="tap"
              onClick={onClose}
              className="p-1.5 retro-btn retro-btn-sm rounded-retro border-2 border-base-black bg-base-white hover:bg-retro-yellow/20 transition-colors flex-shrink-0"
              aria-label="Close notification"
            >
              <X className="w-4 h-4 text-base-black" />
            </motion.button>
          )}
        </div>
        
        {/* Type Badge Sticker */}
        <motion.div 
          variants={iconVariants}
          animate="animate"
          className="absolute -top-2 -right-2"
        >
          <div className={`retro-sticker ${config.sticker} text-[8px] px-2 py-0.5 font-black uppercase tracking-wide`}>
            {config.label}
          </div>
        </motion.div>
        
        {/* Optional Sparkle Effect */}
        {showSparkle && type === 'success' && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute -top-6 left-1/2 -translate-x-1/2"
          >
            <div className="retro-sticker bg-retro-yellow text-base-black text-[9px] px-2 py-0.5 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Done!
            </div>
          </motion.div>
        )}
        
        {/* Progress Bar (for auto-close) */}
        {duration > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-base-gray rounded-b-retro overflow-hidden">
            <motion.div 
              className={`h-full ${type === 'success' ? 'bg-success' : type === 'error' ? 'bg-danger' : type === 'warning' ? 'bg-warning' : 'bg-retro-blue'}`}
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: duration / 1000, ease: "linear" }}
            />
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}