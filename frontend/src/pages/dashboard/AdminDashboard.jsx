import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  Users, School, BookOpen, Calendar, 
  Activity, TrendingUp, AlertCircle, RefreshCw,
  Plus, Eye, Settings, BarChart3, Shield,
  Zap, Database, Server, Clock, Moon, Sun,
  ChevronRight, ArrowUpRight, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api';

// ═══════════════════════════════════════════════════════════
// ANIMATION VARIANTS
// ═══════════════════════════════════════════════════════════
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.15 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

// ═══════════════════════════════════════════════════════════
// SPACE STAT CARD COMPONENT
// ═══════════════════════════════════════════════════════════
function SpaceStatCard({ label, value, icon: Icon, color, trend, subtitle, onClick }) {
  const colorConfig = {
    purple: {
      gradient: 'from-primary-600/20 to-primary-500/10',
      border: 'border-primary-500/30',
      icon: 'text-primary-400',
      iconBg: 'from-primary-600/30 to-primary-500/20',
      glow: 'hover:shadow-[0_0_30px_rgba(168,85,247,0.25)]',
    },
    cyan: {
      gradient: 'from-accent-cyan/20 to-primary-600/10',
      border: 'border-accent-cyan/30',
      icon: 'text-accent-cyan',
      iconBg: 'from-accent-cyan/30 to-primary-600/20',
      glow: 'hover:shadow-[0_0_30px_rgba(6,182,212,0.25)]',
    },
    pink: {
      gradient: 'from-accent-pink/20 to-primary-600/10',
      border: 'border-accent-pink/30',
      icon: 'text-accent-pink',
      iconBg: 'from-accent-pink/30 to-primary-600/20',
      glow: 'hover:shadow-[0_0_30px_rgba(236,72,153,0.25)]',
    },
    emerald: {
      gradient: 'from-success/20 to-primary-600/10',
      border: 'border-success/30',
      icon: 'text-success',
      iconBg: 'from-success/30 to-primary-600/20',
      glow: 'hover:shadow-[0_0_30px_rgba(16,185,129,0.25)]',
    },
  };

  const config = colorConfig[color] || colorConfig.purple;

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -6, scale: 1.02 }}
      onClick={onClick}
      className={`relative group cursor-pointer ${onClick ? '' : 'pointer-events-none'}`}
    >
      {/* Animated glow background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
      
      {/* Card */}
      <div className={`relative p-5 rounded-2xl backdrop-blur-xl border ${config.border} 
        bg-white/80 dark:bg-dark-card/80 
        shadow-lg ${config.glow} transition-all duration-300`}>
        
        <div className="flex items-start justify-between mb-4">
          <motion.div 
            className={`p-3 rounded-xl bg-gradient-to-br ${config.iconBg} shadow-lg`}
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Icon className={`w-6 h-6 ${config.icon}`} />
          </motion.div>
          
          {trend && (
            <motion.div 
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success/10 border border-success/30"
            >
              <TrendingUp className="w-3.5 h-3.5 text-success" />
              <span className="text-xs font-semibold text-success">+{trend}%</span>
            </motion.div>
          )}
        </div>
        
        <div>
          <motion.h3 
            className="text-3xl font-bold text-gray-900 dark:text-white mb-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            {value.toLocaleString('id-ID')}
          </motion.h3>
          <p className="text-gray-600 dark:text-dark-muted text-sm font-medium">{label}</p>
          {subtitle && (
            <p className="text-gray-500 dark:text-gray-600 text-xs mt-1.5 flex items-center gap-1">
              <ChevronRight className="w-3 h-3" />
              {subtitle}
            </p>
          )}
        </div>
        
        {/* Corner accent */}
        <div className={`absolute top-4 right-4 w-2 h-2 rounded-full bg-gradient-to-r ${config.iconBg} opacity-60 group-hover:opacity-100 transition-opacity`} />
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════
// QUICK ACTION BUTTON
// ═══════════════════════════════════════════════════════════
function QuickActionButton({ label, icon: Icon, action, gradient, description, badge }) {
  return (
    <motion.button
      variants={itemVariants}
      whileHover={{ scale: 1.03, y: -3 }}
      whileTap={{ scale: 0.98 }}
      onClick={action}
      className={`relative p-4 rounded-xl bg-gradient-to-br ${gradient} text-white 
        transition-all duration-300 group overflow-hidden text-left`}
    >
      {/* Hover overlay */}
      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-2">
          <Icon className="w-6 h-6" />
          {badge && (
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs font-medium">
              {badge}
            </span>
          )}
        </div>
        <span className="text-sm font-semibold block mb-0.5">{label}</span>
        <span className="text-xs opacity-80 hidden xl:block">{description}</span>
      </div>
      
      {/* Animated corner */}
      <motion.div 
        className="absolute bottom-0 right-0 w-8 h-8"
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
      >
        <ArrowUpRight className="w-4 h-4 text-white/60 ml-auto" />
      </motion.div>
    </motion.button>
  );
}

// ═══════════════════════════════════════════════════════════
// SYSTEM HEALTH ITEM
// ═══════════════════════════════════════════════════════════
function SystemHealthItem({ label, value, icon: Icon }) {
  const getStatusConfig = (status) => {
    const configs = {
      connected: { color: 'text-success', bg: 'bg-success/10', border: 'border-success/30', dot: 'bg-success' },
      active: { color: 'text-success', bg: 'bg-success/10', border: 'border-success/30', dot: 'bg-success' },
      running: { color: 'text-success', bg: 'bg-success/10', border: 'border-success/30', dot: 'bg-success' },
      configured: { color: 'text-accent-cyan', bg: 'bg-accent-cyan/10', border: 'border-accent-cyan/30', dot: 'bg-accent-cyan' },
      disconnected: { color: 'text-danger', bg: 'bg-danger/10', border: 'border-danger/30', dot: 'bg-danger' },
      inactive: { color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/30', dot: 'bg-warning' },
    };
    return configs[status?.toLowerCase()] || configs.configured;
  };

  const status = typeof value === 'object' ? value.status : String(value).toLowerCase();
  const config = getStatusConfig(status);
  const displayValue = typeof value === 'object' ? value.status : String(value);

  return (
    <motion.div 
      variants={itemVariants}
      whileHover={{ x: 4, backgroundColor: 'rgba(255,255,255,0.03)' }}
      className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 dark:bg-dark-card/50 border border-white/10"
    >
      <div className="flex items-center gap-3">
        {Icon && <Icon className="w-4 h-4 text-gray-400" />}
        <span className="text-gray-300 text-sm capitalize">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${config.dot} animate-pulse`} />
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${config.bg} ${config.border} ${config.color}`}>
          {displayValue}
        </span>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN DASHBOARD COMPONENT
// ═══════════════════════════════════════════════════════════
export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');



  // ═════════════════════════════════════════════════════════
  // API QUERIES
  // ═════════════════════════════════════════════════════════
  const { 
    data: dashboard, 
    isLoading, 
    isError, 
    error, 
    refetch,
    isFetching 
  } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => api.get('/admin/dashboard'),
    retry: 2,
    staleTime: 2 * 60 * 1000,
  });

  const {  analyticsData } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: () => api.get('/admin/analytics/attendance'),
    enabled: activeTab === 'analytics',
    staleTime: 5 * 60 * 1000,
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
  };

  // ═════════════════════════════════════════════════════════
  // QUICK ACTIONS
  // ═════════════════════════════════════════════════════════
  const quickActions = [
    {
      label: 'Kelola Users',
      icon: Users,
      action: () => navigate('/dashboard/admin/users'),
      gradient: 'from-blue-600 to-primary-600 hover:from-blue-500 hover:to-primary-500',
      description: 'Tambah, edit, hapus user',
      badge: null,
    },
    {
      label: 'Kelola Kelas',
      icon: School,
      action: () => navigate('/dashboard/admin/classes'),
      gradient: 'from-success to-emerald-600 hover:from-success hover:to-emerald-500',
      description: 'Atur kelas & penjadwalan',
      badge: null,
    },
    {
      label: 'Kelola Mapel',
      icon: BookOpen,
      action: () => navigate('/dashboard/admin/subjects'),
      gradient: 'from-primary-600 to-accent-pink hover:from-primary-500 hover:to-accent-pink',
      description: 'Tambah/edit mata pelajaran',
      badge: null,
    },
    {
      label: 'Jadwal',
      icon: Calendar,
      action: () => navigate('/dashboard/admin/schedules'),
      gradient: 'from-accent-cyan to-blue-600 hover:from-accent-cyan hover:to-blue-500',
      description: 'Atur jadwal mengajar',
      badge: null,
    },
    {
      label: 'Analytics',
      icon: BarChart3,
      action: () => setActiveTab('analytics'),
      gradient: 'from-primary-600 to-accent-cyan hover:from-primary-500 hover:to-accent-cyan',
      description: 'Statistik & laporan',
      badge: '',
    },
    {
      label: 'Settings',
      icon: Settings,
      action: () => navigate('/dashboard/admin/settings'),
      gradient: 'from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600',
      description: 'Konfigurasi sistem',
      badge: null,
    },
  ];

  // ═════════════════════════════════════════════════════════
  // LOADING STATE
  // ═════════════════════════════════════════════════════════
  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-3 border-primary-500/30 border-t-primary-400 rounded-full mx-auto mb-5"
          />
          <p className="text-gray-400 dark:text-dark-muted">Initializing dashboard...</p>
          <p className="text-gray-500 dark:text-gray-600 text-sm mt-1">Connecting to RPL Smart Ecosystem</p>
        </motion.div>
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════
  // ERROR STATE
  // ═════════════════════════════════════════════════════════
  if (isError) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-8 text-center max-w-lg mx-auto"
      >
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        >
          <AlertCircle className="w-14 h-14 text-danger mx-auto mb-4" />
        </motion.div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Connection Error</h3>
        <p className="text-gray-600 dark:text-dark-muted mb-5">
          {error?.message || 'Failed to connect to server.'}
        </p>
        <div className="flex gap-3 justify-center">
          <button 
            onClick={() => refetch()} 
            className="btn-primary inline-flex items-center gap-2"
            disabled={isFetching}
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            Retry Connection
          </button>
          <button 
            onClick={() => navigate('/')}
            className="btn-outline"
          >
            Back to Home
          </button>
        </div>
      </motion.div>
    );
  }

  // ═════════════════════════════════════════════════════════
  // DATA EXTRACTION
  // ═════════════════════════════════════════════════════════
  const overview = dashboard?.data?.data?.overview || {};
  const systemHealth = dashboard?.data?.data?.system_health || {};
  const recentActivity = dashboard?.data?.data?.recent_activity || {};

  // ═════════════════════════════════════════════════════════
  // MAIN RENDER
  // ═════════════════════════════════════════════════════════
  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 relative min-h-screen"
    >
      {/* ═══════════════════════════════════════════════════
          ANIMATED BACKGROUND ORBS (Space Effect)
          ═══════════════════════════════════════════════════ */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <motion.div 
          animate={{ 
            x: [0, 40, 0], 
            y: [0, -30, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-10 left-10 w-80 h-80 bg-primary-500/10 rounded-full blur-3xl"
        />
        <motion.div 
          animate={{ 
            x: [0, -35, 0], 
            y: [0, 35, 0],
            scale: [1, 0.9, 1]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-10 right-10 w-80 h-80 bg-accent-cyan/10 rounded-full blur-3xl"
        />
        <motion.div 
          animate={{ 
            x: [0, 25, 0], 
            y: [0, -20, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute top-1/2 left-1/3 w-64 h-64 bg-accent-pink/10 rounded-full blur-3xl"
        />
      </div>

      {/* ═══════════════════════════════════════════════════
          HEADER WITH THEME TOGGLE
          ═══════════════════════════════════════════════════ */}
      <motion.div 
        variants={itemVariants}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <Shield className="w-7 h-7 text-primary-400" />
            <span className="text-gradient">Admin Control Panel</span>
            <motion.button 
              whileHover={{ rotate: 180 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleRefresh}
              className="p-2 rounded-lg hover:bg-white/5 dark:hover:bg-dark-card/50 border border-white/10 dark:border-dark-border transition-colors"
              title="Refresh data"
            >
              <RefreshCw className={`w-5 h-5 text-primary-400 ${isFetching ? 'animate-spin' : ''}`} />
            </motion.button>
          </h1>
          <p className="text-gray-600 dark:text-dark-muted mt-1.5">
            Welcome, <span className="text-primary-400 font-semibold">{user?.name}</span> • 
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}

          
          {/* Tab Navigation */}
          <div className="flex bg-white dark:bg-dark-card rounded-xl p-1 border border-gray-200 dark:border-dark-border shadow-sm">
            {['overview', 'analytics'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 capitalize ${
                  activeTab === tab
                    ? 'bg-gradient-to-r from-primary-600/20 to-primary-500/20 text-primary-600 dark:text-primary-400 shadow-sm border border-primary-500/30'
                    : 'text-gray-600 dark:text-dark-muted hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-dark-card/50'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════
          STATS GRID
          ═══════════════════════════════════════════════════ */}
      <motion.div 
        variants={staggerContainer}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <SpaceStatCard 
          label="Total Users" 
          value={overview.users?.total || 0} 
          icon={Users}
          color="purple"
          trend={12}
          subtitle="Active accounts"
          onClick={() => navigate('/dashboard/admin/users')}
        />
        <SpaceStatCard 
          label="Total Classes" 
          value={overview.classes || 0} 
          icon={School}
          color="cyan"
          subtitle="Across all levels"
          onClick={() => navigate('/dashboard/admin/classes')}
        />
        <SpaceStatCard 
          label="Total Subjects" 
          value={overview.subjects || 0} 
          icon={BookOpen}
          color="pink"
          subtitle="Curriculum items"
          onClick={() => navigate('/dashboard/admin/subjects')}
        />
        <SpaceStatCard 
          label="Today's Attendance" 
          value={overview.attendance_today || 0} 
          icon={Calendar}
          color="emerald"
          subtitle="Students present"
          onClick={() => setActiveTab('analytics')}
        />
      </motion.div>

      {/* ═══════════════════════════════════════════════════
          MAIN CONTENT BASED ON TAB
          ═══════════════════════════════════════════════════ */}
      {activeTab === 'overview' ? (
        <>
          {/* Quick Actions */}
          <motion.div variants={itemVariants} className="card">
            <h3 className="text-lg font-semibold mb-5 flex items-center gap-2 text-gray-900 dark:text-white">
              <Zap className="w-5 h-5 text-primary-400" />
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {quickActions.map((action, index) => (
                <QuickActionButton key={index} {...action} />
              ))}
            </div>
          </motion.div>

          {/* System Health & User Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* System Health */}
            <motion.div variants={itemVariants} className="card">
              <h3 className="text-lg font-semibold mb-5 flex items-center gap-2 text-gray-900 dark:text-white">
                <Server className="w-5 h-5 text-success" />
                System Health
              </h3>
              <div className="space-y-2.5">
                {Object.entries(systemHealth).length > 0 ? (
                  Object.entries(systemHealth).map(([key, value]) => (
                    <SystemHealthItem 
                      key={key} 
                      label={key} 
                      value={value}
                      icon={key === 'database' ? Database : key === 'cache' ? Zap : Server}
                    />
                  ))
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-600 text-center py-4">
                    No system health data available
                  </p>
                )}
              </div>
            </motion.div>

            {/* User Distribution */}
            <motion.div variants={itemVariants} className="card">
              <h3 className="text-lg font-semibold mb-5 text-gray-900 dark:text-white">User Distribution</h3>
              <div className="space-y-5">
                {[
                  { label: 'Admin', value: overview.users?.admin || 0, gradient: 'from-blue-500 to-primary-600', icon: '👨‍💼', accent: 'text-blue-400' },
                  { label: 'Guru', value: overview.users?.guru || 0, gradient: 'from-success to-emerald-600', icon: '👨‍🏫', accent: 'text-success' },
                  { label: 'Siswa', value: overview.users?.siswa || 0, gradient: 'from-primary-500 to-accent-pink', icon: '👨‍🎓', accent: 'text-primary-400' },
                ].map((item) => {
                  const total = (overview.users?.admin || 0) + (overview.users?.guru || 0) + (overview.users?.siswa || 0) || 1;
                  const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;
                  
                  return (
                    <motion.div 
                      key={item.label}
                      variants={itemVariants}
                      whileHover={{ scale: 1.01 }}
                      className="group"
                    >
                      <div className="flex justify-between items-center mb-2.5">
                        <span className="text-sm font-medium flex items-center gap-2 text-gray-700 dark:text-gray-300">
                          <span className="text-lg">{item.icon}</span>
                          {item.label}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-dark-muted">
                          <span className="font-semibold text-gray-900 dark:text-white">{item.value}</span>
                          <span className="text-gray-500 dark:text-gray-600 ml-1">({percentage}%)</span>
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-dark-border rounded-full h-3 overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 1.2, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                          className={`h-3 rounded-full bg-gradient-to-r ${item.gradient} shadow-[0_0_10px_rgba(0,0,0,0.2)] group-hover:shadow-[0_0_15px_rgba(0,0,0,0.4)] transition-all`}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </div>

          {/* Recent Activity */}
          <motion.div variants={itemVariants} className="card">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
              <button onClick={() => navigate('/dashboard/admin/users')} className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium flex items-center gap-1 transition-colors">
                View All <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              {recentActivity.recent_users?.slice(0, 5).map((user, index) => (
                <motion.div 
                  key={user.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ backgroundColor: 'rgba(168, 85, 247, 0.05)' }}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-gray-100 dark:border-dark-border/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <motion.div 
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-500/20 to-primary-600/20 
                        border border-primary-500/30 flex items-center justify-center text-primary-400 font-semibold text-sm"
                    >
                      {user.name?.charAt(0) || 'U'}
                    </motion.div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{user.name}</p>
                      <p className="text-sm text-gray-500 dark:text-dark-muted">{user.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
                      user.role === 'admin' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                      user.role === 'guru' ? 'bg-success/10 text-success border-success/30' :
                      'bg-primary-500/10 text-primary-400 border-primary-500/30'
                    }`}>
                      {user.role.toUpperCase()}
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-600 mt-1.5">
                      {new Date(user.created_at).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                </motion.div>
              ))}
              
              {(!recentActivity.recent_users || recentActivity.recent_users.length === 0) && (
                <div className="text-center py-6">
                  <CheckCircle2 className="w-10 h-10 text-gray-400 mx-auto mb-3 opacity-50" />
                  <p className="text-gray-500 dark:text-dark-muted">No recent activity to display.</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      ) : (
        /* ═══════════════════════════════════════════════════
            ANALYTICS TAB
            ═══════════════════════════════════════════════════ */
        <motion.div variants={containerVariants} className="space-y-6">
          {/* Attendance Analytics */}
          <motion.div variants={itemVariants} className="card">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 text-gray-900 dark:text-white">
              <BarChart3 className="w-5 h-5 text-primary-400" />
              Attendance Analytics
            </h3>
            
            {analyticsData?.data ? (
              <div className="space-y-6">
                {/* Summary Stats */}
                <motion.div 
                  variants={staggerContainer}
                  className="grid grid-cols-2 md:grid-cols-4 gap-4"
                >
                  {[
                    { label: 'Hadir', value: analyticsData.data.summary?.present || 0, color: 'text-success', bg: 'bg-success/10', border: 'border-success/30' },
                    { label: 'Tidak Hadir', value: analyticsData.data.summary?.absent || 0, color: 'text-danger', bg: 'bg-danger/10', border: 'border-danger/30' },
                    { label: 'Attendance Rate', value: `${analyticsData.data.summary?.attendance_rate || 0}%`, color: 'text-primary-400', bg: 'bg-primary-500/10', border: 'border-primary-500/30' },
                    { label: 'Total Siswa', value: analyticsData.data.summary?.total_students || 0, color: 'text-accent-cyan', bg: 'bg-accent-cyan/10', border: 'border-accent-cyan/30' },
                  ].map((stat, index) => (
                    <motion.div
                      key={stat.label}
                      variants={itemVariants}
                      whileHover={{ scale: 1.03 }}
                      className={`p-4 rounded-xl ${stat.bg} border ${stat.border} text-center`}
                    >
                      <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                      <div className="text-sm text-gray-600 dark:text-dark-muted mt-1">{stat.label}</div>
                    </motion.div>
                  ))}
                </motion.div>

                {/* Chart Placeholder */}
                <motion.div 
                  variants={itemVariants}
                  whileHover={{ scale: 1.01 }}
                  className="p-8 bg-gray-50 dark:bg-dark-card/50 rounded-xl border border-gray-200 dark:border-dark-border text-center"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="w-24 h-24 mx-auto mb-5 rounded-full border-2 border-dashed border-primary-500/30 flex items-center justify-center"
                  >
                    <BarChart3 className="w-12 h-12 text-primary-400/60" />
                  </motion.div>
                  <p className="text-gray-600 dark:text-dark-muted font-medium">
                    Interactive chart visualization
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-600 mt-1.5">
                    Period: <span className="font-medium text-gray-700 dark:text-gray-300">{analyticsData.data.period?.start}</span> → <span className="font-medium text-gray-700 dark:text-gray-300">{analyticsData.data.period?.end}</span>
                  </p>
                </motion.div>

                {/* Daily Data Table */}
                {analyticsData.data.daily?.length > 0 && (
                  <motion.div variants={itemVariants}>
                    <h4 className="font-semibold mb-4 text-gray-900 dark:text-white">Daily Breakdown</h4>
                    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-dark-border">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 dark:bg-dark-card/50 border-b border-gray-200 dark:border-dark-border">
                            {['Tanggal', 'Hadir', 'Terlambat', 'Izin', 'Sakit', 'Alpha'].map((header) => (
                              <th key={header} className="text-left py-3.5 px-4 text-gray-600 dark:text-dark-muted font-semibold">
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-dark-border/50">
                          {analyticsData.data.daily.slice(0, 7).map((day, index) => (
                            <motion.tr 
                              key={day.date}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: index * 0.03 }}
                              whileHover={{ backgroundColor: 'rgba(168, 85, 247, 0.04)' }}
                              className="transition-colors"
                            >
                              <td className="py-3.5 px-4 font-medium text-gray-900 dark:text-white">{day.date}</td>
                              <td className="py-3.5 px-4 text-center text-success font-medium">{day.hadir}</td>
                              <td className="py-3.5 px-4 text-center text-warning font-medium">{day.terlambat}</td>
                              <td className="py-3.5 px-4 text-center text-info font-medium">{day.izin}</td>
                              <td className="py-3.5 px-4 text-center text-amber-500 font-medium">{day.sakit}</td>
                              <td className="py-3.5 px-4 text-center text-danger font-medium">{day.alpha}</td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                )}
              </div>
            ) : (
              <div className="text-center py-10 text-gray-500 dark:text-dark-muted">
                <Clock className="w-14 h-14 mx-auto mb-4 opacity-40" />
                <p>Loading analytics data...</p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}