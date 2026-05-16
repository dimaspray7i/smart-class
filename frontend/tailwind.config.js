/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // ═══════════════════════════════════════════════════════════
      // 🌈 RETRO FUTURISTIC COLOR PALETTE (Y2K / MEMPHIS / BRUTALISM)
      // ═══════════════════════════════════════════════════════════
      colors: {
        // Primary Retro Colors
        retro: {
          orange: '#FF5C00',    // Electric Orange - Primary action
          blue: '#2E2BBF',      // Deep Royal Blue - Secondary
          yellow: '#FFC928',    // Bright Yellow - Accent/Highlight
          purple: '#9D4EDD',    // Neon Purple - Funky accent
          lime: '#B8F64E',      // Lime Green - Fresh accent
          pink: '#FF6B9D',      // Hot Pink - Playful accent
          red: '#FF1744',       // Retro Red - Semantic danger
        },
        
        // Base Colors
        base: {
          black: 'var(--base-black)',
          white: 'var(--base-white)',
          cream: 'var(--base-cream)',
          gray: 'var(--base-gray)',
        },
        
        // Semantic Colors (Retro Style)
        success: '#00C853',     // Retro green
        warning: '#FFAB00',     // Retro amber
        danger: '#FF1744',      // Retro red
        info: '#2979FF',        // Retro blue
        
        // Sticker/Label Colors
        sticker: {
          red: '#FF3B30',
          orange: '#FF9500',
          yellow: '#FFCC00',
          green: '#34C759',
          blue: '#007AFF',
          purple: '#AF52DE',
          pink: '#FF2D55',
        },
      },
      
      // ═══════════════════════════════════════════════════════════
      // 🖼️ RETRO BACKGROUNDS & PATTERNS
      // ═══════════════════════════════════════════════════════════
      backgroundImage: {
        // Retro Grid Patterns
        'retro-grid': `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0z' fill='none'/%3E%3Cpath d='M0 0h1v40H0z' fill='%2300000010'/%3E%3Cpath d='M0 0h40v1H0z' fill='%2300000010'/%3E%3C/svg%3E")`,
        'retro-grid-dark': `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0z' fill='none'/%3E%3Cpath d='M0 0h1v40H0z' fill='%23FFFFFF15'/%3E%3Cpath d='M0 0h40v1H0z' fill='%23FFFFFF15'/%3E%3C/svg%3E")`,
        
        // Memphis Style Patterns
        'memphis-1': `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23FF5C00' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        'memphis-2': `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%232E2BBF' fill-opacity='0.08'%3E%3Ccircle cx='20' cy='20' r='8'/%3E%3Ccircle cx='60' cy='60' r='8'/%3E%3Crect x='40' y='0' width='8' height='8'/%3E%3Crect x='0' y='40' width='8' height='8'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        
        // Noise/Texture Overlays
        'noise': `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E")`,
        'noise-light': `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.03'/%3E%3C/svg%3E")`,
        
        // Gradient Backgrounds (Retro Style)
        'gradient-orange-blue': 'linear-gradient(135deg, #FF5C00 0%, #2E2BBF 100%)',
        'gradient-yellow-pink': 'linear-gradient(135deg, #FFC928 0%, #FF6B9D 100%)',
        'gradient-purple-lime': 'linear-gradient(135deg, #9D4EDD 0%, #B8F64E 100%)',
        'gradient-split-orange': 'linear-gradient(90deg, #FF5C00 50%, #FFFFFF 50%)',
        'gradient-split-blue': 'linear-gradient(90deg, #2E2BBF 50%, #FFFFFF 50%)',
        
        // Sticker/Radial Effects
        'sticker-glow': 'radial-gradient(circle, rgba(255,92,0,0.3) 0%, transparent 70%)',
        'burst': `radial-gradient(circle, #FFC928 0%, #FF5C00 40%, transparent 70%)`,
      },
      
      // ═══════════════════════════════════════════════════════════
      // 🎭 RETRO ANIMATIONS (Y2K / CYBER / PLAYFUL)
      // ═══════════════════════════════════════════════════════════
      animation: {
        // Movement Animations
        'wobble': 'wobble 0.5s ease-in-out',
        'bounce-retro': 'bounce-retro 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'tilt': 'tilt 0.3s ease-out',
        'float-retro': 'float-retro 3s ease-in-out infinite',
        'shake': 'shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both',
        'pop': 'pop 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        
        // Visual Effects
        'flicker': 'flicker 2s ease-in-out infinite',
        'glitch': 'glitch 1s linear infinite',
        'pulse-retro': 'pulse-retro 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'sparkle-retro': 'sparkle-retro 1.5s ease-in-out infinite',
        
        // Entrance Animations
        'slide-in-retro': 'slide-in-retro 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'zoom-in-retro': 'zoom-in-retro 0.3s ease-out',
        'flip-in': 'flip-in 0.5s ease-out',
        
        // Continuous Decorative
        'spin-slow': 'spin 8s linear infinite',
        'spin-reverse': 'spin 4s linear infinite reverse',
        'marquee': 'marquee 20s linear infinite',
      },
      
      keyframes: {
        // Movement
        wobble: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(-3deg)' },
          '75%': { transform: 'rotate(3deg)' },
        },
        'bounce-retro': {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '50%': { transform: 'scale(1.1)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        tilt: {
          '0%': { transform: 'rotate(0deg)' },
          '50%': { transform: 'rotate(2deg)' },
          '100%': { transform: 'rotate(0deg)' },
        },
        'float-retro': {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-10px) rotate(1deg)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-4px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(4px)' },
        },
        pop: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '50%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        
        // Visual Effects
        flicker: {
          '0%, 19%, 21%, 23%, 25%, 54%, 56%, 100%': { opacity: '1' },
          '20%, 24%, 55%': { opacity: '0.7' },
        },
        glitch: {
          '0%': { transform: 'translate(0)' },
          '20%': { transform: 'translate(-2px, 2px)' },
          '40%': { transform: 'translate(-2px, -2px)' },
          '60%': { transform: 'translate(2px, 2px)' },
          '80%': { transform: 'translate(2px, -2px)' },
          '100%': { transform: 'translate(0)' },
        },
        'pulse-retro': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(0.98)' },
        },
        'sparkle-retro': {
          '0%, 100%': { opacity: '0', transform: 'scale(0) rotate(0deg)' },
          '50%': { opacity: '1', transform: 'scale(1) rotate(180deg)' },
        },
        
        // Entrance
        'slide-in-retro': {
          '0%': { transform: 'translateY(20px) scale(0.95)', opacity: '0' },
          '100%': { transform: 'translateY(0) scale(1)', opacity: '1' },
        },
        'zoom-in-retro': {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'flip-in': {
          '0%': { transform: 'perspective(400px) rotateX(90deg)', opacity: '0' },
          '100%': { transform: 'perspective(400px) rotateX(0deg)', opacity: '1' },
        },
        
        // Marquee
        marquee: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
      },
      
      // ═══════════════════════════════════════════════════════════
      // 🎨 BRUTALIST SHADOWS & BORDERS
      // ═══════════════════════════════════════════════════════════
      boxShadow: {
        // Hard/Offset Shadows (Brutalist Style)
        'hard': '4px 4px 0px 0px var(--base-black)',
        'hard-lg': '6px 6px 0px 0px var(--base-black)',
        'hard-xl': '8px 8px 0px 0px var(--base-black)',
        'hard-hover': '2px 2px 0px 0px var(--base-black)',
        
        // Neon Glow Shadows
        'neon-orange': '0 0 10px #FF5C00, 0 0 20px #FF5C0066, 0 0 40px #FF5C0033',
        'neon-blue': '0 0 10px #2E2BBF, 0 0 20px #2E2BBF66, 0 0 40px #2E2BBF33',
        'neon-yellow': '0 0 10px #FFC928, 0 0 20px #FFC92866, 0 0 40px #FFC92833',
        'neon-purple': '0 0 10px #9D4EDD, 0 0 20px #9D4EDD66, 0 0 40px #9D4EDD33',
        'neon-lime': '0 0 10px #B8F64E, 0 0 20px #B8F64E66, 0 0 40px #B8F64E33',
        
        // Sticker/Card Shadows
        'sticker': '3px 3px 0px 0px #111111, 6px 6px 0px 0px #FF5C00',
        'sticker-hover': '2px 2px 0px 0px #111111, 4px 4px 0px 0px #FF5C00',
        'card-retro': '5px 5px 0px 0px #111111, 0 0 0 4px #FFFFFF, 0 0 0 8px #111111',
        
        // Interactive Shadows
        'pressed': '2px 2px 0px 0px var(--base-black)',
        'hover-lift': '6px 6px 0px 0px var(--base-black), 0 0 20px rgba(255,92,0,0.3)',
      },
      
      dropShadow: {
        'retro': '2px 2px 0px var(--base-black)',
        'retro-lg': '4px 4px 0px var(--base-black)',
      },

      // ═══════════════════════════════════════════════════════════
      // 📐 BORDER STYLES (THICK & BOLD)
      // ═══════════════════════════════════════════════════════════
      borderWidth: {
        '3': '3px',
        '4': '4px',
        '5': '5px',
        '6': '6px',
      },
      
      borderColor: {
        'black': 'var(--base-black)',
        'white': 'var(--base-white)',
        'retro-orange': '#FF5C00',
        'retro-blue': '#2E2BBF',
        'retro-yellow': '#FFC928',
      },
      
      // ═══════════════════════════════════════════════════════════
      // 🔤 TYPOGRAPHY EXTENSIONS (RETRO STYLES)
      // ═══════════════════════════════════════════════════════════
      fontFamily: {
        // Fallback fonts - user should install retro fonts separately
        'retro-display': ['"Bebas Neue"', '"Anton"', '"Impact"', 'sans-serif'],
        'retro-condensed': ['"Oswald"', '"Barlow Condensed"', 'sans-serif'],
        'retro-wide': ['"Righteous"', '"Rajdhani"', 'sans-serif'],
        'retro-hand': ['"Caveat"', '"Kalam"', 'cursive'],
        'retro-mono': ['"Space Mono"', '"VT323"', 'monospace'],
      },
      
      fontSize: {
        // Oversized retro headings
        'retro-xs': ['0.75rem', { lineHeight: '1', fontWeight: '900', letterSpacing: '0.05em' }],
        'retro-sm': ['0.875rem', { lineHeight: '1', fontWeight: '900', letterSpacing: '0.05em' }],
        'retro-base': ['1rem', { lineHeight: '1', fontWeight: '900', letterSpacing: '0.025em' }],
        'retro-lg': ['1.25rem', { lineHeight: '1', fontWeight: '900', letterSpacing: '0.025em' }],
        'retro-xl': ['1.5rem', { lineHeight: '1', fontWeight: '900', letterSpacing: '0.025em' }],
        'retro-2xl': ['2rem', { lineHeight: '1', fontWeight: '900', letterSpacing: '0.025em' }],
        'retro-3xl': ['3rem', { lineHeight: '0.9', fontWeight: '900', letterSpacing: '0.025em' }],
        'retro-4xl': ['4rem', { lineHeight: '0.9', fontWeight: '900', letterSpacing: '0.025em' }],
        'retro-5xl': ['6rem', { lineHeight: '0.8', fontWeight: '900', letterSpacing: '0.025em' }],
        'retro-6xl': ['8rem', { lineHeight: '0.8', fontWeight: '900', letterSpacing: '0.025em' }],
      },
      
      letterSpacing: {
        'retro-tight': '-0.025em',
        'retro-wide': '0.1em',
        'retro-wider': '0.2em',
      },
      
      textShadow: {
        'retro': '2px 2px 0px var(--base-black)',
        'retro-lg': '4px 4px 0px var(--base-black)',
        'neon-orange': '0 0 5px #FF5C00, 0 0 10px #FF5C00',
        'neon-blue': '0 0 5px #2E2BBF, 0 0 10px #2E2BBF',
        'neon-yellow': '0 0 5px #FFC928, 0 0 10px #FFC928',
      },
      
      // ═══════════════════════════════════════════════════════════
      // 🎭 CUSTOM UTILITIES (Via class names)
      // ═══════════════════════════════════════════════════════════
      borderRadius: {
        'retro': '8px',
        'retro-lg': '16px',
        'sticker': '24px 8px 24px 8px',
        'blob': '45% 55% 70% 30% / 45% 45% 55% 55%',
      },
      
      // ═══════════════════════════════════════════════════════════
      // 🎪 DECORATIVE UTILITIES
      // ═══════════════════════════════════════════════════════════
      rotate: {
        '-3': '-3deg',
        '-6': '-6deg',
        '-12': '-12deg',
        '3': '3deg',
        '6': '6deg',
        '12': '12deg',
      },
      
      scale: {
        '98': '0.98',
        '102': '1.02',
        '105': '1.05',
        '110': '1.10',
      },
      
      // ═══════════════════════════════════════════════════════════
      // 🎨 GRADIENTS (RETRO STYLE)
      // ═══════════════════════════════════════════════════════════
      backgroundSize: {
        'auto': 'auto',
        'cover': 'cover',
        'contain': 'contain',
        '200%': '200% 200%',
      },
      
      backgroundPosition: {
        '0': '0% 0%',
        '100': '100% 100%',
        'top-right': 'top right',
        'bottom-left': 'bottom left',
      },
    },
  },
  
  // ═══════════════════════════════════════════════════════════
  // 🔧 PLUGINS (Optional - uncomment if installed)
  // ═══════════════════════════════════════════════════════════
  plugins: [
    // For text-shadow utility (optional)
    // require('tailwindcss-textshadow'),
    
    // For custom animations (optional)
    require('tailwindcss-animate'),
  ],
}