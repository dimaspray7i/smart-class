import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

// ═══════════════════════════════════════════════════════════
// 🎨 RETRO THEME CONFIG
// ═══════════════════════════════════════════════════════════
const RETRO_THEME_CONFIG = {
  // Theme names with emoji for fun
  themes: {
    light: { name: '☀️ Light', class: '', bg: 'bg-base-cream', text: 'text-base-black' },
    dark: { name: '🌙 Dark', class: 'dark', bg: 'bg-[#0f0f1a]', text: 'text-base-white' },
    // Could add more: 'retro', 'cyber', 'pastel', etc.
  },
  
  // Animation settings
  animations: {
    transitionDuration: 300, // ms
    transitionEasing: 'cubic-bezier(0.22, 1, 0.36, 1)',
    flashDuration: 150, // for theme switch flash effect
  },
  
  // Keyboard shortcuts
  shortcuts: {
    toggle: { key: 't', ctrl: true, alt: false }, // Ctrl+T to toggle theme
  },
  
  // Storage keys
  storage: {
    theme: '🎨_rpl_theme',
    lastToggle: '🎨_rpl_last_toggle',
  },
  
  // System preference fallback
  system: {
    prefersDark: '(prefers-color-scheme: dark)',
    prefersLight: '(prefers-color-scheme: light)',
  },
};

// ═══════════════════════════════════════════════════════════
// 🎭 RETRO THEME TRANSITION EFFECT
// ═══════════════════════════════════════════════════════════
const applyThemeTransition = (isDark) => {
  // Add transition class to html element for smooth CSS transitions
  document.documentElement.style.transition = `background-color ${RETRO_THEME_CONFIG.animations.transitionDuration}ms ${RETRO_THEME_CONFIG.animations.transitionEasing}, color ${RETRO_THEME_CONFIG.animations.transitionDuration}ms ${RETRO_THEME_CONFIG.animations.transitionEasing}`;
  
  // Optional: Flash effect on theme change (comment out if too flashy)
  // const flash = document.createElement('div');
  // flash.style.cssText = `
  //   position: fixed;
  //   inset: 0;
  //   background: ${isDark ? '#fff' : '#000'};
  //   opacity: 0.1;
  //   pointer-events: none;
  //   z-index: 9999;
  //   animation: fadeOut ${RETRO_THEME_CONFIG.animations.flashDuration}ms forwards;
  // `;
  // document.body.appendChild(flash);
  // setTimeout(() => flash.remove(), RETRO_THEME_CONFIG.animations.flashDuration);
};

// ═══════════════════════════════════════════════════════════
// 🎯 RETRO THEME CONTEXT
// ═══════════════════════════════════════════════════════════
const ThemeContext = createContext(undefined);

/**
 * ThemeProvider - Manage theme (dark/light) state globally with retro enhancements
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children
 */
export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    // Initial check from encrypted localStorage or system preference
    try {
      const savedTheme = localStorage.getItem(RETRO_THEME_CONFIG.storage.theme);
      const decrypted = savedTheme ? atob(savedTheme.replace('🎨_', '')) : null;
      
      if (decrypted === 'dark' || decrypted === 'light') {
        return decrypted === 'dark';
      }
    } catch {
      // Fallback if decryption fails
    }
    
    // Check system preference
    return window.matchMedia(RETRO_THEME_CONFIG.system.prefersDark).matches;
  });

  const [themeEvent, setThemeEvent] = useState(null); // For animated feedback
  const [systemPrefersDark, setSystemPrefersDark] = useState(
    window.matchMedia(RETRO_THEME_CONFIG.system.prefersDark).matches
  );

  // ═══════════════════════════════════════════════════════════
  // 🔄 APPLY THEME TO DOCUMENT
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    // Apply smooth transition
    applyThemeTransition(isDark);
    
    // Apply theme class to document
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Save with simple obfuscation
    try {
      const encrypted = '🎨_' + btoa(isDark ? 'dark' : 'light');
      localStorage.setItem(RETRO_THEME_CONFIG.storage.theme, encrypted);
      localStorage.setItem(RETRO_THEME_CONFIG.storage.lastToggle, new Date().toISOString());
    } catch (e) {
      console.warn('🎨 Theme save failed:', e.message);
    }
    
    // Show theme event for feedback
    const themeName = isDark ? RETRO_THEME_CONFIG.themes.dark.name : RETRO_THEME_CONFIG.themes.light.name;
    setThemeEvent({ type: 'changed', message: `Theme: ${themeName} ✨`, isDark });
    
    // Clear event after delay
    const timer = setTimeout(() => setThemeEvent(null), 1500);
    return () => clearTimeout(timer);
  }, [isDark]);

  // ═══════════════════════════════════════════════════════════
  // 👁️ LISTEN TO SYSTEM PREFERENCE CHANGES
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    const mediaQuery = window.matchMedia(RETRO_THEME_CONFIG.system.prefersDark);
    
    const handleChange = (e) => {
      setSystemPrefersDark(e.matches);
      // Only auto-switch if user hasn't manually set a preference
      if (!localStorage.getItem(RETRO_THEME_CONFIG.storage.theme)) {
        setIsDark(e.matches);
      }
    };
    
    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // Legacy support
      mediaQuery.addListener(handleChange);
    }
    
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  // ═══════════════════════════════════════════════════════════
  // 🎮 TOGGLE THEME FUNCTION (Retro-enhanced)
  // ═══════════════════════════════════════════════════════════
  const toggleTheme = useCallback(() => {
    setIsDark(prev => {
      const newMode = !prev;
      
      // Play optional retro sound (uncomment playRetroSound if added)
      // playRetroSound(newMode ? 'dark' : 'light');
      
      return newMode;
    });
  }, []);

  // Set specific theme
  const setTheme = useCallback((themeName) => {
    if (themeName === 'dark') {
      setIsDark(true);
    } else if (themeName === 'light') {
      setIsDark(false);
    }
    // Could add more themes in the future
  }, []);

  // Reset to system preference
  const resetToSystem = useCallback(() => {
    localStorage.removeItem(RETRO_THEME_CONFIG.storage.theme);
    setIsDark(systemPrefersDark);
    setThemeEvent({ type: 'reset', message: 'Using system preference 🖥️' });
  }, [systemPrefersDark]);


  // ═══════════════════════════════════════════════════════════
  // 🎨 MEMOIZED CONTEXT VALUE (Prevents unnecessary re-renders)
  // ═══════════════════════════════════════════════════════════
  const contextValue = useMemo(() => ({
    // Core state
    isDark,
    
    // Actions
    toggleTheme,
    setTheme,
    resetToSystem,
    
    // Theme event for animated feedback
    themeEvent,
    clearThemeEvent: () => setThemeEvent(null),
    
    // Theme metadata
    theme: isDark ? RETRO_THEME_CONFIG.themes.dark : RETRO_THEME_CONFIG.themes.light,
    availableThemes: Object.values(RETRO_THEME_CONFIG.themes),
    
    // System preference info
    systemPrefersDark,
    hasUserPreference: !!localStorage.getItem(RETRO_THEME_CONFIG.storage.theme),
    
    // Retro metadata
    retro: {
      version: '2.0.0',
      style: 'retro-futuristic',
      shortcuts: RETRO_THEME_CONFIG.shortcuts,
      animations: RETRO_THEME_CONFIG.animations,
    },
    
    // Helper to get theme class names
    getThemeClasses: (baseClasses = '') => {
      const theme = isDark ? RETRO_THEME_CONFIG.themes.dark : RETRO_THEME_CONFIG.themes.light;
      return `${baseClasses} ${theme.bg} ${theme.text}`.trim();
    },
    
    // Debug info (dev only)
    _debug: process.env.NODE_ENV === 'development' ? {
      storageKey: RETRO_THEME_CONFIG.storage.theme,
      lastToggle: localStorage.getItem(RETRO_THEME_CONFIG.storage.lastToggle),
      systemPrefersDark,
    } : undefined,
  }), [isDark, toggleTheme, setTheme, resetToSystem, themeEvent, systemPrefersDark]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Custom hook to use theme context
 * @throws Error if used outside ThemeProvider
 * @returns {Object} Theme context value
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error('🎨 useTheme must be used within a ThemeProvider\n\nWrap your app with:\n<ThemeProvider>\n  <App />\n</ThemeProvider>');
  }
  
  return context;
};