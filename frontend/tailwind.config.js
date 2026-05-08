/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // Manual toggle via class on html element
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ═══════════════════════════════════════════════════════════
        // SPACE/TECH PURPLE THEME
        // ═══════════════════════════════════════════════════════════
        
        // Primary Purple Gradient
        primary: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7', // Main purple
          600: '#9333ea', // Hover purple
          700: '#7c3aed', // Deep purple
          800: '#6b21a8',
          900: '#581c87',
          950: '#3b0764', // Darkest
        },
        
        // Dark Mode - Space Colors
        dark: {
          bg: '#0f0f1a',        // Very dark purple-black (main bg)
          card: '#1a1a2e',      // Dark purple card surface
          border: '#2d2d44',    // Subtle border
          text: '#f8fafc',      // Primary text (light)
          muted: '#94a3b8',     // Secondary text (muted)
          hover: '#252542',     // Hover state for cards
        },
        
        // Accent Colors for Highlights
        accent: {
          cyan: '#06b6d4',   // Cyan accent
          pink: '#ec4899',   // Pink accent
          emerald: '#10b981', // Success green
          amber: '#f59e0b',   // Warning orange
          rose: '#f43f5e',    // Error red
        },
        
        // Status Colors
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#f43f5e',
        info: '#06b6d4',
      },
      
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-pattern': 'linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #0f0f1a 100%)',
        'grid-pattern': "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        'stars-pattern': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.03'/%3E%3C/svg%3E\")",
      },
      
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'float 10s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'sparkle': 'sparkle 2s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'slide-up': 'slideUp 0.5s ease-out',
        'fade-in': 'fadeIn 0.3s ease-in',
      },
      
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        sparkle: {
          '0%, 100%': { opacity: '0', transform: 'scale(0) rotate(0deg)' },
          '50%': { opacity: '1', transform: 'scale(1) rotate(180deg)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(168, 85, 247, 0.3)' },
          '100%': { boxShadow: '0 0 40px rgba(168, 85, 247, 0.6)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      
      boxShadow: {
        'neon-purple': '0 0 20px rgba(168, 85, 247, 0.4)',
        'neon-cyan': '0 0 20px rgba(6, 182, 212, 0.4)',
        'neon-pink': '0 0 20px rgba(236, 72, 153, 0.4)',
        'card': '0 4px 20px -2px rgba(0, 0, 0, 0.1)',
        'card-dark': '0 4px 20px -2px rgba(0, 0, 0, 0.4)',
        'card-hover': '0 8px 30px -4px rgba(168, 85, 247, 0.3)',
      },
      
      backdropBlur: {
        'xs': '2px',
      },
    },
  },
  plugins: [],
}