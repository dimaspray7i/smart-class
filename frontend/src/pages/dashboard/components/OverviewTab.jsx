import React from 'react';
import { motion } from 'framer-motion';
import { Users, School, BookOpen, Calendar, Activity, Target, Server, Database, Zap, Cpu, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { StatCard } from './StatCard';
import { QuickAction } from './QuickAction';
import { HealthItem } from './HealthItem';

const pageVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 }
  }
};

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

export function OverviewTab({
  overview,
  systemHealth,
  recentActivity,
  quickActions,
  onViewAll,
}) {
  const navigate = useNavigate();

  return (
    <motion.div variants={pageVariants} className="space-y-8">
      {/* Stats Grid */}
      <motion.div
        variants={pageVariants}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <StatCard
          label="Total Pengguna"
          value={overview.users?.total || 0}
          icon={Users}
          color="orange"
          trend={12}
          subtitle="Akun aktif terdaftar"
          onClick={() => navigate('/dashboard/admin/users')}
          sticker="👥"
        />
        <StatCard
          label="Total Kelas"
          value={overview.classes || 0}
          icon={School}
          color="blue"
          subtitle="Semua tingkatan kelas"
          onClick={() => navigate('/dashboard/admin/classes')}
          sticker="🏫"
        />
        <StatCard
          label="Total Pelajaran"
          value={overview.subjects || 0}
          icon={BookOpen}
          color="purple"
          subtitle="Kurikulum aktif"
          onClick={() => navigate('/dashboard/admin/subjects')}
          sticker="📚"
        />
        <StatCard
          label="Absensi Hari Ini"
          value={overview.attendance_today || 0}
          icon={Calendar}
          color="lime"
          subtitle="Siswa yang sudah hadir"
          onClick={() => onViewAll('analytics')}
          sticker="✅"
        />
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={cardVariants} className="retro-card p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="retro-heading retro-heading-md text-retro-blue flex items-center gap-2">
            <Zap className="w-5 h-5" />
            AKSI CEPAT
          </h3>
          <div className="retro-badge retro-badge-yellow text-[10px] animate-pulse">
            ⚡ AKSES CEPAT
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickActions.map((action, index) => (
            <QuickAction key={index} {...action} />
          ))}
        </div>
      </motion.div>

      {/* System Health & User Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Health */}
        <motion.div variants={cardVariants} className="retro-card p-6">
          <h3 className="retro-heading retro-heading-sm text-retro-purple mb-5 flex items-center gap-2">
            <Server className="w-5 h-5" />
            KESEHATAN SISTEM
          </h3>
          <div className="space-y-3">
            {Object.entries(systemHealth).length > 0 ? (
              Object.entries(systemHealth).map(([key, value]) => (
                <HealthItem
                  key={key}
                  label={key === 'database' ? 'Basis Data / DB' : key === 'cache' ? 'Penyimpanan Cache' : key}
                  value={value}
                  icon={key === 'database' ? Database : key === 'cache' ? Zap : Server}
                />
              ))
            ) : (
              <div className="text-center py-6">
                <Database className="w-10 h-10 text-base-black/30 mx-auto mb-2" />
                <p className="font-retro-mono text-sm text-base-black/50">Tidak ada data sistem</p>
              </div>
            )}
          </div>

          <div className="absolute bottom-4 right-4 opacity-20">
            <Cpu className="w-16 h-16 text-retro-purple" />
          </div>
        </motion.div>

        {/* User Distribution */}
        <motion.div variants={cardVariants} className="retro-card p-6">
          <h3 className="retro-heading retro-heading-sm text-retro-orange mb-5 flex items-center gap-2">
            <Target className="w-5 h-5" />
            DISTRIBUSI PENGGUNA
          </h3>
          <div className="space-y-4">
            {[
              { label: 'Admin', value: overview.users?.admin || 0, color: 'bg-retro-blue', icon: '👨‍💼', badge: 'retro-badge-blue' },
              { label: 'Guru', value: overview.users?.guru || 0, color: 'bg-success', icon: '👨‍🏫', badge: 'retro-badge-green' },
              { label: 'Siswa', value: overview.users?.siswa || 0, color: 'bg-retro-purple', icon: '👨‍🎓', badge: 'retro-badge-purple' },
            ].map((item, index) => {
              const total = (overview.users?.admin || 0) + (overview.users?.guru || 0) + (overview.users?.siswa || 0) || 1;
              const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;

              return (
                <motion.div
                  key={item.label}
                  variants={cardVariants}
                  whileHover={{ scale: 1.02 }}
                  className="group"
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-black uppercase tracking-wide text-base-black flex items-center gap-2">
                      <span className="text-lg">{item.icon}</span>
                      {item.label}
                    </span>
                    <span className={`retro-badge ${item.badge} text-[10px]`}>
                      {item.value} ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-base-gray border-2 border-base-black rounded-sm overflow-hidden h-4">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 1, delay: 0.3 + (index * 0.1), ease: [0.22, 1, 0.36, 1] }}
                      className={`h-full ${item.color} border-r-2 border-base-black relative`}
                    >
                      <div className="absolute inset-0 opacity-20" style={{
                        backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,0.3) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0.3) 75%, transparent 75%, transparent)',
                        backgroundSize: '10px 10px'
                      }} />
                    </motion.div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div variants={cardVariants} className="retro-card p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="retro-heading retro-heading-sm text-retro-blue flex items-center gap-2">
            <Activity className="w-5 h-5" />
            AKTIVITAS TERBARU PENGGUNA
          </h3>
          <button
            onClick={() => navigate('/dashboard/admin/users')}
            className="retro-btn retro-btn-sm retro-btn-outline flex items-center gap-1"
          >
            Lihat Semua
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        <div className="space-y-3">
          {recentActivity.recent_users?.slice(0, 5).map((user, index) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center justify-between p-3 bg-base-gray/20 rounded-retro border-2 border-base-black/10 hover:border-retro-orange transition-colors"
            >
              <div>
                <p className="text-xs font-black uppercase text-base-black">{user.name}</p>
                <p className="text-[10px] font-retro-mono text-base-black/60">{user.email}</p>
              </div>
              <span className={`retro-badge text-[9px] ${
                user.role === 'admin' ? 'retro-badge-orange' :
                user.role === 'guru' ? 'retro-badge-blue' :
                'retro-badge-purple'
              }`}>
                {user.role}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
