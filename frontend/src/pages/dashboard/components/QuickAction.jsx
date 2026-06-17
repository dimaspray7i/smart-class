import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';

const cardVariants = {
  hidden: { opacity: 0, y: 30, rotate: -1 },
  visible: {
    opacity: 1,
    y: 0,
    rotate: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
      mass: 0.1
    }
  }
};

export function QuickAction({ label, icon: Icon, action, color, description, badge, rotate = 0 }) {
  const colorConfig = {
    orange: 'bg-retro-orange hover:bg-retro-orange/90',
    blue: 'bg-retro-blue hover:bg-retro-blue/90',
    yellow: 'bg-retro-yellow hover:bg-retro-yellow/90 text-base-black',
    purple: 'bg-retro-purple hover:bg-retro-purple/90',
    lime: 'bg-retro-lime hover:bg-retro-lime/90 text-base-black',
    pink: 'bg-retro-pink hover:bg-retro-pink/90',
  };

  return (
    <motion.button
      variants={cardVariants}
      whileHover={{ scale: 1.05, y: -3, rotate: rotate + 1 }}
      whileTap={{ scale: 0.95, rotate: rotate - 1 }}
      onClick={action}
      className={`relative retro-btn ${colorConfig[color]} text-base-white overflow-hidden text-left`}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -skew-x-12 -translate-x-full group-hover:translate-x-full" />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-2">
          <Icon className="w-6 h-6" />
          {badge && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="retro-badge retro-badge-yellow text-[10px] px-1.5 py-0.5 rotate-[3deg]"
            >
              {badge}
            </motion.span>
          )}
        </div>
        <span className="text-xs font-black uppercase tracking-wide block mb-0.5">{label}</span>
        <span className="text-[10px] opacity-90 hidden xl:block font-medium">{description}</span>
      </div>

      <motion.div
        className="absolute bottom-1 right-1"
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
      >
        <ArrowUpRight className="w-4 h-4 text-base-white/80" />
      </motion.div>
    </motion.button>
  );
}
