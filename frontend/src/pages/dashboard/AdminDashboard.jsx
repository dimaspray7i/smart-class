import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Shield, RefreshCw, AlertCircle, Sparkles, Smile } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useDashboardData } from '../../hooks/useDashboardData';
import { useDashboardActions } from '../../hooks/useDashboardActions';
import { Decorations } from './components/Decorations';
import { OverviewTab } from './components/OverviewTab';
import { AnalyticsTab } from './components/AnalyticsTab';

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

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Custom hooks
  const dashboardData = useDashboardData();
  const dashboardActions = useDashboardActions(navigate);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
  };

  // Loading state
  if (dashboardData.isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-retro-grid">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-20 h-20 mx-auto mb-4 border-4 border-base-black rounded-retro-lg flex items-center justify-center bg-retro-orange shadow-hard"
          >
            <Sparkles className="w-10 h-10 text-base-white animate-pulse" />
          </motion.div>

          <h2 className="retro-heading retro-heading-orange text-2xl mb-2">RPL SMART</h2>
          <p className="font-retro-mono text-sm text-base-black/70 mb-4">Memuat data menarik...</p>

          <div className="w-48 mx-auto h-4 border-4 border-base-black rounded-sm overflow-hidden bg-base-white">
            <motion.div
              className="h-full bg-retro-blue"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              style={{ width: '50%' }}
            />
          </div>

          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 0.5, repeat: Infinity }}
            className="mt-4"
          >
            <Smile className="w-6 h-6 text-retro-yellow mx-auto animate-wobble" />
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // Error state
  if (dashboardData.isError) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="retro-card p-8 text-center max-w-lg mx-auto bg-base-white"
      >
        <motion.div
          animate={{ scale: [1, 1.1, 1], rotate: [0, -5, 5, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="w-16 h-16 mx-auto mb-4 border-4 border-base-black rounded-retro-lg flex items-center justify-center bg-danger shadow-[4px_4px_0px_0px_#111111]"
        >
          <AlertCircle className="w-8 h-8 text-base-white" />
        </motion.div>

        <h3 className="retro-heading text-xl mb-3 text-base-black">Oops! Koneksi Bermasalah</h3>
        <p className="font-retro-mono text-sm text-base-black/70 mb-5">
          {dashboardData.error?.message || 'Gagal terhubung ke server.'}
        </p>

        <div className="flex gap-3 justify-center">
          <button
            onClick={() => dashboardData.refetch()}
            className="retro-btn retro-btn-secondary flex items-center gap-2"
            disabled={dashboardData.isFetching}
          >
            <RefreshCw className={`w-4 h-4 ${dashboardData.isFetching ? 'animate-spin' : ''}`} />
            Ulangi
          </button>
          <button
            onClick={() => navigate('/')}
            className="retro-btn retro-btn-outline"
          >
            Beranda
          </button>
        </div>

        <div className="absolute -top-3 -right-3 retro-sticker bg-retro-yellow text-base-black text-xs px-3 py-1">
          ERROR!
        </div>
      </motion.div>
    );
  }

  // Main render
  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="relative min-h-screen bg-base-cream retro-grid-bg"
    >
      <Decorations />

      {/* Header */}
      <motion.div
        variants={cardVariants}
        className="sticky top-4 z-30 px-4 md:px-6"
      >
        <div className="retro-card max-w-4xl mx-auto p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-retro-orange" />
            <span className="font-retro-display font-black text-base-black text-lg">PANEL KONTROL ADMIN</span>
          </div>

          <div className="flex items-center gap-1">
            {[
              { id: 'overview', label: 'Ringkasan' },
              { id: 'analytics', label: 'Analisis' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => dashboardActions.setActiveTab(tab.id)}
                className={`px-4 py-2 font-black text-xs uppercase tracking-wide rounded-retro border-2 border-base-black transition-all ${
                  dashboardActions.activeTab === tab.id
                    ? 'bg-retro-orange text-base-white shadow-[2px_2px_0px_0px_#111111]'
                    : 'bg-base-white text-base-black hover:bg-retro-yellow'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <motion.button
            whileHover={{ rotate: 180 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleRefresh}
            className="retro-btn retro-btn-sm retro-btn-outline"
            title="Muat ulang data"
          >
            <RefreshCw className={`w-4 h-4 ${dashboardData.isFetching ? 'animate-spin' : ''}`} />
          </motion.button>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="px-4 md:px-6 py-6 max-w-7xl mx-auto">
        {/* Page Header */}
        <motion.div variants={cardVariants} className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="retro-heading retro-heading-xl text-retro-orange mb-2 flex items-center gap-3">
                <span className="inline-block animate-wobble">🚀</span>
                PANEL UTAMA ADMIN
                <span className="inline-block animate-bounce-retro">✨</span>
              </h1>
              <p className="font-retro-mono text-base-black/70 flex items-center gap-2">
                <span className="retro-badge retro-badge-blue text-[10px]">Selamat Datang</span>
                <span className="font-bold">{user?.name}</span>
                <span className="text-base-black/40">•</span>
                <span>{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}</span>
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <div className="retro-badge retro-badge-green">
                ✓ Sistem Aktif
              </div>
              <div className="retro-badge retro-badge-purple">
                🕐 {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Content Tabs */}
        {dashboardActions.activeTab === 'overview' ? (
          <OverviewTab
            overview={dashboardData.overview}
            systemHealth={dashboardData.systemHealth}
            recentActivity={dashboardData.recentActivity}
            quickActions={dashboardActions.quickActions}
            onViewAll={dashboardActions.setActiveTab}
          />
        ) : (
          <AnalyticsTab analyticsData={dashboardData.analyticsData} />
        )}
      </div>
    </motion.div>
  );
}
