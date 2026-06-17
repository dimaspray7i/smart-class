import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, ArrowRight } from 'lucide-react';

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

const stickerVariants = {
  hidden: { scale: 0, rotate: -180 },
  visible: {
    scale: 1,
    rotate: 0,
    transition: { type: "spring", stiffness: 200, damping: 10 }
  },
  hover: {
    scale: 1.1,
    rotate: [0, -5, 5, -3, 3, 0],
    transition: { duration: 0.3 }
  }
};

export function StatCard({ label, value, icon: Icon, color, trend, subtitle, onClick, sticker }) {
  const colorConfig = {
    orange: {
      bg: 'bg-retro-orange/10',
      border: 'border-retro-orange',
      iconBg: 'bg-retro-orange',
      shadow: 'shadow-[4px_4px_0px_0px_#FF5C00]',
    },
    blue: {
      bg: 'bg-retro-blue/10',
      border: 'border-retro-blue',
      iconBg: 'bg-retro-blue',
      shadow: 'shadow-[4px_4px_0px_0px_#2E2BBF]',
    },
    yellow: {
      bg: 'bg-retro-yellow/20',
      border: 'border-retro-yellow',
      iconBg: 'bg-retro-yellow',
      shadow: 'shadow-[4px_4px_0px_0px_#FFC928]',
    },
    purple: {
      bg: 'bg-retro-purple/10',
      border: 'border-retro-purple',
      iconBg: 'bg-retro-purple',
      shadow: 'shadow-[4px_4px_0px_0px_#9D4EDD]',
    },
    lime: {
      bg: 'bg-retro-lime/10',
      border: 'border-retro-lime',
      iconBg: 'bg-retro-lime',
      shadow: 'shadow-[4px_4px_0px_0px_#B8F64E]',
    },
  };

  const config = colorConfig[color] || colorConfig.orange;

  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -4, rotate: sticker ? [0, -2, 2, -1, 1, 0] : 0 }}
      onClick={onClick}
      className={`relative retro-card cursor-pointer group ${onClick ? '' : 'pointer-events-none'}`}
    >
      {sticker && (
        <motion.div
          variants={stickerVariants}
          initial="hidden"
          animate="visible"
          whileHover="hover"
          className="absolute -top-2 -right-2 z-10"
        >
          <div className="retro-sticker bg-retro-yellow text-base-black text-[10px] px-2 py-0.5">
            {sticker}
          </div>
        </motion.div>
      )}

      <div className={`p-5 ${config.bg} border-4 ${config.border} rounded-retro-lg shadow-hard transition-all duration-200 group-hover:shadow-hard-hover group-hover:-translate-x-0.5 group-hover:-translate-y-0.5`}>
        <div className="flex items-start justify-between mb-4">
          <motion.div
            className={`p-3 rounded-retro ${config.iconBg} border-2 border-base-black ${config.shadow}`}
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Icon className="w-6 h-6 text-base-white" />
          </motion.div>

          {trend && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="retro-badge retro-badge-orange rotate-[-3deg]"
            >
              <TrendingUp className="w-3 h-3 mr-1" />
              +{trend}%
            </motion.div>
          )}
        </div>

        <div>
          <motion.h3
            className="text-3xl font-retro-display font-black text-base-black mb-1 leading-none"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
          >
            {value.toLocaleString('id-ID')}
          </motion.h3>
          <p className="text-xs font-black uppercase tracking-wider text-base-black/70">{label}</p>
          {subtitle && (
            <p className="text-[10px] font-medium text-base-black/50 mt-2 flex items-center gap-1">
              <ArrowRight className="w-3 h-3 rotate-[-45deg]" />
              {subtitle}
            </p>
          )}
        </div>

        <div className={`absolute bottom-3 right-3 w-3 h-3 ${config.iconBg} border-2 border-base-black rounded-sm rotate-45`} />
      </div>
    </motion.div>
  );
}
