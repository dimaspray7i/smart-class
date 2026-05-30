import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from './theme';

export const buttonVariants = {
  primary: `bg-[${COLORS.primary}] text-white border-4 border-black shadow-[${SHADOWS.hard}]`,
  secondary: `bg-[${COLORS.secondary}] text-white border-4 border-black shadow-[${SHADOWS.hard}]`,
  outline: `bg-white text-black border-4 border-black shadow-[${SHADOWS.hard}]`,
  success: `bg-[${COLORS.accentGreen}] text-black border-4 border-black shadow-[${SHADOWS.hard}]`,
  warning: `bg-[${COLORS.accentYellow}] text-black border-4 border-black shadow-[${SHADOWS.hard}]`,
  danger: `bg-[${COLORS.accentPink}] text-white border-4 border-black shadow-[${SHADOWS.hard}]`,
  ghost: `bg-transparent text-black border-2 border-black`,
};

export const cardStyles = {
  base: 'retro-card',
  soft: 'bg-white/90 border-base-black',
  accent: 'bg-[#FF6B00]/10 border-[#FF6B00]',
  overlay: 'bg-white/70 backdrop-blur-xl',
};

export const modalSizes = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-[95vw]',
};

export const inputVariants = {
  default: 'border-4 border-black bg-white text-black placeholder:text-black/40',
  focus: 'ring-4 ring-[#FF6B00]/30 shadow-[4px_4px_0px_0px_#FF6B00]',
  error: 'border-4 border-[#FF1744] shadow-[4px_4px_0px_0px_#FF1744]',
};

export const gridTokens = {
  gap: SPACING.lg,
  padding: SPACING.lg,
  maxWidth: '1440px',
};
