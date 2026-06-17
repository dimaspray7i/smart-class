import React from 'react';
import { motion } from 'framer-motion';

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

export function HealthItem({ label, value, icon: Icon }) {
  const getStatusConfig = (status) => {
    const configs = {
      connected: { color: 'text-success', bg: 'bg-success', border: 'border-base-black', dot: 'bg-success', label: 'OK' },
      active: { color: 'text-success', bg: 'bg-success', border: 'border-base-black', dot: 'bg-success', label: 'AKTIF' },
      running: { color: 'text-success', bg: 'bg-success', border: 'border-base-black', dot: 'bg-success', label: 'BERJALAN' },
      configured: { color: 'text-retro-blue', bg: 'bg-retro-blue', border: 'border-base-black', dot: 'bg-retro-blue', label: 'SIAP' },
      disconnected: { color: 'text-danger', bg: 'bg-danger', border: 'border-base-black', dot: 'bg-danger', label: 'OFFLINE' },
      inactive: { color: 'text-warning', bg: 'bg-warning', border: 'border-base-black', dot: 'bg-warning', label: 'STANDBY' },
    };
    return configs[status?.toLowerCase()] || configs.configured;
  };

  const status = typeof value === 'object' ? value.status : String(value).toLowerCase();
  const config = getStatusConfig(status);

  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ x: 4, backgroundColor: 'rgba(255,201,40,0.1)' }}
      className="flex items-center justify-between p-3 retro-card bg-base-white"
    >
      <div className="flex items-center gap-3">
        {Icon && <Icon className="w-4 h-4 text-base-black" />}
        <span className="text-xs font-black uppercase tracking-wide text-base-black">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <motion.span
          className={`w-2.5 h-2.5 rounded-sm ${config.dot} border border-base-black`}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <span className={`retro-badge ${config.bg} text-base-white text-[10px] px-2 py-0.5 border-2 border-base-black`}>
          {config.label}
        </span>
      </div>
    </motion.div>
  );
}
