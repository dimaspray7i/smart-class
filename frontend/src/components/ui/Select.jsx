import React, { forwardRef, useState } from 'react';
import { twMerge } from 'tailwind-merge';
import { motion } from 'framer-motion';
import { ChevronDown, AlertCircle } from 'lucide-react';

/**
 * 🎭 Standardized Retro Select Component
 */
const Select = forwardRef(({ 
  label, 
  options = [], 
  error, 
  className, 
  id, 
  icon: Icon, 
  helperText, 
  placeholder,
  ...props 
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="space-y-1.5">
      {/* Label */}
      {label && (
        <label 
          htmlFor={selectId} 
          className="block text-xs font-black uppercase tracking-wider text-base-black flex items-center gap-1.5"
        >
          {Icon && <Icon className="w-4 h-4 text-base-black/40" />}
          {label}
          {props.required && <span className="text-retro-orange">*</span>}
        </label>
      )}

      {/* Select Container */}
      <div className="relative group">
        <select
          ref={ref}
          id={selectId}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={twMerge(
            'w-full px-4 py-3 rounded-retro bg-base-white border-2 border-base-black text-base-black appearance-none focus:outline-none font-retro-mono text-sm transition-all duration-200 cursor-pointer',
            error && 'border-danger shadow-[4px_4px_0px_0px_#FF1744]',
            !error && isFocused && 'border-retro-orange shadow-[4px_4px_0px_0px_#FF5C00]',
            props.disabled && 'opacity-50 cursor-not-allowed bg-base-gray',
            className
          )}
          {...props}
        >
          {placeholder && <option value="" disabled>{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value} className="bg-base-cream text-base-black">
              {option.label}
            </option>
          ))}
        </select>

        {/* Custom Arrow */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-base-black/50 group-focus-within:text-retro-orange transition-colors">
          <ChevronDown className={twMerge("w-4 h-4 transition-transform duration-200", isFocused && "rotate-180")} />
        </div>

        {/* Error Icon */}
        {error && (
          <div className="absolute right-10 top-1/2 -translate-y-1/2">
            <AlertCircle className="w-4 h-4 text-danger" />
          </div>
        )}
      </div>

      {/* Helper / Error Text */}
      {error ? (
        <p className="text-danger text-[9px] font-retro-mono flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      ) : helperText && (
        <p className="text-[9px] font-retro-mono text-base-black/50">{helperText}</p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

export default Select;
