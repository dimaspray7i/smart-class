import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';

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

export function AnalyticsTab({ analyticsData }) {
  return (
    <motion.div variants={cardVariants} className="retro-card p-8 text-center">
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="w-20 h-20 mx-auto mb-6 border-4 border-base-black rounded-retro bg-retro-blue/20 flex items-center justify-center"
      >
        <BarChart3 className="w-10 h-10 text-retro-blue" />
      </motion.div>

      <h3 className="retro-heading text-2xl mb-3">ANALISIS STATISTIK ABSENSI</h3>
      <p className="font-retro-mono text-sm text-base-black/70 mb-6">
        Laporan lengkap data kehadiran siswa dari semua kelas
      </p>

      {analyticsData?.data ? (
        <div className="mt-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {analyticsData.data?.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="retro-card p-4 bg-retro-blue/10 border-retro-blue"
              >
                <p className="text-[10px] font-black uppercase text-base-black/70 mb-2">{item.date}</p>
                <p className="text-2xl font-retro-display font-black text-retro-blue">{item.hadir || 0}</p>
                <p className="text-xs font-black text-base-black/60">Hadir</p>
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        <div className="py-12">
          <p className="font-retro-mono text-base-black/50">Memuat data analisis...</p>
        </div>
      )}
    </motion.div>
  );
}
