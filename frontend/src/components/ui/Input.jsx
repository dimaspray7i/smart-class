import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { useState, forwardRef } from 'react';

// ═══════════════════════════════════════════════════════════
// 🎨 RETRO ANIMATION VARIANTS
// ═══════════════════════════════════════════════════════════
const inputVariants = {
  focus: {
    borderColor: '#FF5C00',
    boxShadow: '4px 4px 0px 0px #FF5C00',
    transition: { duration: 0.15 }
  },
  blur: {
    borderColor: '#111111',
    boxShadow: '4px 4px 0px 0px #111111',
    transition: { duration: 0.15 }
  },
  error: {
    borderColor: '#FF1744',
    boxShadow: '4px 4px 0px 0px #FF1744',
    transition: { duration: 0.15 }
  }
};

const iconVariants = {
  hover: { 
    scale: 1.1, 
    rotate: [0, -5, 5, 0],
    transition: { duration: 0.2 }
  }
};

// ═══════════════════════════════════════════════════════════
// 🎭 RETRO INPUT COMPONENT
// ═══════════════════════════════════════════════════════════
const Input = forwardRef(({ 
  label, 
  error, 
  type = 'text', 
  className, 
  id,
  showToggle = false,
  helperText,
  icon: Icon,
  ...props 
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  const inputType = showToggle ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="space-y-1.5">
      {/* Label */}
      {label && (
        <label 
          htmlFor={inputId} 
          className="block text-xs font-black uppercase tracking-wider text-base-black flex items-center gap-1.5"
        >
          {Icon && <Icon className="w-4 h-4 text-base-black/40" />}
          {label}
          {props.required && <span className="text-retro-orange">*</span>}
        </label>
      )}
      
      {/* Input Container */}
      <div className="relative">
        <motion.input
          ref={ref}
          id={inputId}
          type={inputType}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={twMerge(
            'w-full px-4 py-3 rounded-retro bg-base-white border-2 border-base-black text-base-black placeholder-base-black/40 focus:outline-none font-retro-mono text-sm transition-all duration-200',
            error && 'border-danger',
            !error && isFocused && 'border-retro-orange shadow-[4px_4px_0px_0px_#FF5C00]',
            props.disabled && 'opacity-50 cursor-not-allowed bg-base-gray',
            showToggle && 'pr-10',
            className
          )}
          variants={inputVariants}
          animate={error ? 'error' : isFocused ? 'focus' : 'blur'}
          {...props}
        />
        
        {/* Error Icon */}
        {error && (
          <motion.div 
            className="absolute right-3 top-1/2 -translate-y-1/2"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <AlertCircle className="w-4 h-4 text-danger" />
          </motion.div>
        )}
        
        {/* Success Icon (optional) */}
        {props.success && (
          <motion.div 
            className="absolute right-3 top-1/2 -translate-y-1/2"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          >
            <CheckCircle2 className="w-4 h-4 text-success" />
          </motion.div>
        )}
        
        {/* Password Toggle */}
        {showToggle && (
          <motion.button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            variants={iconVariants}
            whileHover="hover"
            whileTap={{ scale: 0.9 }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-base-black/50 hover:text-retro-orange transition-colors"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </motion.button>
        )}
      </div>
      
      {/* Helper Text */}
      {helperText && !error && (
        <p className="text-[9px] font-retro-mono text-base-black/50">{helperText}</p>
      )}
      
      {/* Error Message */}
      {error && (
        <motion.p 
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-danger text-[9px] font-retro-mono flex items-center gap-1"
        >
          <AlertCircle className="w-3 h-3" />
          {error}
        </motion.p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;