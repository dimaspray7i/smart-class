import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  Users, School, BookOpen, Calendar, 
  Activity, TrendingUp, AlertCircle, RefreshCw,
  Plus, Eye, Settings, BarChart3, Shield,
  Zap, Database, Server, Clock,
  ChevronRight, ArrowUpRight, CheckCircle2,
  Sparkles, Star, Smile, ArrowRight, Target,
  MapPin, FileText, Award, Rocket, Flame,
  Menu, X, Cpu
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api';

// ═══════════════════════════════════════════════════════════
// 🎨 RETRO ANIMATION VARIANTS
// ═══════════════════════════════════════════════════════════
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

const floatVariants = {
  animate: {
    y: [0, -8, 0],
    rotate: [0, 2, -2, 0],
    transition: { duration: 4, repeat: Infinity, ease: "easeInOut" }
  }
};

// ═══════════════════════════════════════════════════════════
// 🎭 RETRO STAT CARD COMPONENT
// ═══════════════════════════════════════════════════════════
function RetroStatCard({ label, value, icon: Icon, color, trend, subtitle, onClick, sticker }) {
  const colorConfig = {
    orange: {
      bg: 'bg-retro-orange/10',
      border: 'border-retro-orange',
      icon: 'text-retro-orange',
      iconBg: 'bg-retro-orange',
      text: 'text-retro-orange',
      shadow: 'shadow-[4px_4px_0px_0px_#FF5C00]',
    },
    blue: {
      bg: 'bg-retro-blue/10',
      border: 'border-retro-blue',
      icon: 'text-retro-blue',
      iconBg: 'bg-retro-blue',
      text: 'text-retro-blue',
      shadow: 'shadow-[4px_4px_0px_0px_#2E2BBF]',
    },
    yellow: {
      bg: 'bg-retro-yellow/20',
      border: 'border-retro-yellow',
      icon: 'text-retro-yellow',
      iconBg: 'bg-retro-yellow',
      text: 'text-retro-yellow',
      shadow: 'shadow-[4px_4px_0px_0px_#FFC928]',
    },
    purple: {
      bg: 'bg-retro-purple/10',
      border: 'border-retro-purple',
      icon: 'text-retro-purple',
      iconBg: 'bg-retro-purple',
      text: 'text-retro-purple',
      shadow: 'shadow-[4px_4px_0px_0px_#9D4EDD]',
    },
    lime: {
      bg: 'bg-retro-lime/10',
      border: 'border-retro-lime',
      icon: 'text-retro-lime',
      iconBg: 'bg-retro-lime',
      text: 'text-retro-lime',
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
      {/* Decorative sticker corner */}
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

      {/* Card Content */}
      <div className={`p-5 ${config.bg} border-4 ${config.border} rounded-retro-lg shadow-hard transition-all duration-200 group-hover:shadow-hard-hover group-hover:-translate-x-0.5 group-hover:-translate-y-0.5`}>
        
        <div className="flex items-start justify-between mb-4">
          <motion.div 
            className={`p-3 rounded-retro ${config.iconBg} border-2 border-base-black ${config.shadow}`}
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Icon className={`w-6 h-6 text-base-white`} />
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
          <p className="text-sm font-black uppercase tracking-wider text-base-black/70">{label}</p>
          {subtitle && (
            <p className="text-xs font-medium text-base-black/50 mt-2 flex items-center gap-1">
              <ArrowRight className="w-3 h-3 rotate-[-45deg]" />
              {subtitle}
            </p>
          )}
        </div>
        
        {/* Decorative corner accent */}
        <div className={`absolute bottom-3 right-3 w-3 h-3 ${config.iconBg} border-2 border-base-black rounded-sm rotate-45`} />
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════
// 🎮 RETRO QUICK ACTION BUTTON
// ═══════════════════════════════════════════════════════════
function RetroQuickAction({ label, icon: Icon, action, color, description, badge, rotate = 0 }) {
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
      {/* Hover shine effect */}
      <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -skew-x-12 -translate-x-full group-hover:translate-x-full" />
      
      {/* Content */}
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
      
      {/* Animated arrow corner */}
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

// ═══════════════════════════════════════════════════════════
// 🖥️ RETRO SYSTEM HEALTH ITEM
// ═══════════════════════════════════════════════════════════
function RetroHealthItem({ label, value, icon: Icon }) {
  const getStatusConfig = (status) => {
    const configs = {
      connected: { color: 'text-success', bg: 'bg-success', border: 'border-base-black', dot: 'bg-success', label: 'OK' },
      active: { color: 'text-success', bg: 'bg-success', border: 'border-base-black', dot: 'bg-success', label: 'ACTIVE' },
      running: { color: 'text-success', bg: 'bg-success', border: 'border-base-black', dot: 'bg-success', label: 'RUNNING' },
      configured: { color: 'text-retro-blue', bg: 'bg-retro-blue', border: 'border-base-black', dot: 'bg-retro-blue', label: 'READY' },
      disconnected: { color: 'text-danger', bg: 'bg-danger', border: 'border-base-black', dot: 'bg-danger', label: 'OFFLINE' },
      inactive: { color: 'text-warning', bg: 'bg-warning', border: 'border-base-black', dot: 'bg-warning', label: 'IDLE' },
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

// ═══════════════════════════════════════════════════════════
// 🎪 DECORATIVE FLOATING ELEMENTS
// ═══════════════════════════════════════════════════════════
function RetroDecorations() {
  return (
    <>
      {/* Floating smiley */}
      <motion.div 
        variants={floatVariants}
        animate="animate"
        className="absolute top-20 right-10 z-0 hidden lg:block"
      >
        <div className="retro-smiley text-xl animate-wobble">😎</div>
      </motion.div>
      
      {/* Floating star */}
      <motion.div 
        variants={floatVariants}
        animate="animate"
        className="absolute bottom-32 left-20 z-0 hidden lg:block"
        style={{ animationDelay: '1s' }}
      >
        <Star className="w-8 h-8 text-retro-yellow fill-retro-yellow drop-shadow-retro animate-sparkle-retro" />
      </motion.div>
      
      {/* Floating arrow */}
      <motion.div 
        variants={floatVariants}
        animate="animate"
        className="absolute top-1/3 right-1/4 z-0 hidden xl:block"
        style={{ animationDelay: '2s' }}
      >
        <ArrowRight className="w-10 h-10 text-retro-orange drop-shadow-retro rotate-[-45deg] animate-wobble" />
      </motion.div>
      
      {/* Decorative blob */}
      <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-retro-purple/20 rounded-blob blur-2xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-retro-lime/20 rounded-blob blur-2xl pointer-events-none" />
    </>
  );
}

// ═══════════════════════════════════════════════════════════
// 🎯 MAIN RETRO DASHBOARD COMPONENT (SIDEBAR READY)
// ═══════════════════════════════════════════════════════════
export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false); // For mobile sidebar toggle

  // ═════════════════════════════════════════════════════════
  // 🔌 API QUERIES
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

  const { data: analyticsData } = useQuery({
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
  // 🎮 QUICK ACTIONS CONFIG
  // ═════════════════════════════════════════════════════════
  const quickActions = [
    {
      label: 'Users',
      icon: Users,
      action: () => navigate('/dashboard/admin/users'),
      color: 'orange',
      description: 'Manage accounts',
      badge: null,
      rotate: -2,
    },
    {
      label: 'Classes',
      icon: School,
      action: () => navigate('/dashboard/admin/classes'),
      color: 'blue',
      description: 'Manage classes',
      badge: null,
      rotate: 2,
    },
    {
      label: 'Subjects',
      icon: BookOpen,
      action: () => navigate('/dashboard/admin/subjects'),
      color: 'purple',
      description: 'Manage subjects',
      badge: 'NEW',
      rotate: -1,
    },
    {
      label: 'Schedule',
      icon: Calendar,
      action: () => navigate('/dashboard/admin/schedules'),
      color: 'yellow',
      description: 'Manage schedule',
      badge: null,
      rotate: 1,
    },
    {
      label: 'Analytics',
      icon: BarChart3,
      action: () => setActiveTab('analytics'),
      color: 'lime',
      description: 'View reports',
      badge: '📊',
      rotate: -3,
    },
    {
      label: 'Settings',
      icon: Settings,
      action: () => navigate('/dashboard/admin/settings'),
      color: 'pink',
      description: 'System config',
      badge: null,
      rotate: 2,
    },
  ];

  // ═════════════════════════════════════════════════════════
  // ⏳ LOADING STATE (RETRO STYLE)
  // ═════════════════════════════════════════════════════════
  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-retro-grid">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          {/* Retro loading animation */}
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-20 h-20 mx-auto mb-4 border-4 border-base-black rounded-retro-lg flex items-center justify-center bg-retro-orange shadow-hard"
          >
            <Sparkles className="w-10 h-10 text-base-white animate-pulse" />
          </motion.div>
          
          <h2 className="retro-heading retro-heading-orange text-2xl mb-2">RPL SMART</h2>
          <p className="font-retro-mono text-sm text-base-black/70 mb-4">Loading awesome stuff...</p>
          
          {/* Retro progress bar */}
          <div className="w-48 mx-auto h-4 border-4 border-base-black rounded-sm overflow-hidden bg-base-white">
            <motion.div 
              className="h-full bg-retro-blue"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              style={{ width: '50%' }}
            />
          </div>
          
          {/* Decorative elements */}
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

  // ═════════════════════════════════════════════════════════
  // ❌ ERROR STATE (RETRO STYLE)
  // ═════════════════════════════════════════════════════════
  if (isError) {
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
        
        <h3 className="retro-heading text-xl mb-3 text-base-black">Oops! Connection Error</h3>
        <p className="font-retro-mono text-sm text-base-black/70 mb-5">
          {error?.message || 'Failed to connect to server.'}
        </p>
        
        <div className="flex gap-3 justify-center">
          <button 
            onClick={() => refetch()} 
            className="retro-btn retro-btn-secondary flex items-center gap-2"
            disabled={isFetching}
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            Retry
          </button>
          <button 
            onClick={() => navigate('/')}
            className="retro-btn retro-btn-outline"
          >
            Go Home
          </button>
        </div>
        
        {/* Decorative error sticker */}
        <div className="absolute -top-3 -right-3 retro-sticker bg-retro-yellow text-base-black text-xs px-3 py-1">
          ERROR!
        </div>
      </motion.div>
    );
  }

  // ═════════════════════════════════════════════════════════
  // 📊 DATA EXTRACTION
  // ═════════════════════════════════════════════════════════
  const overview = dashboard?.data?.overview || {};
  const systemHealth = dashboard?.data?.system_health || {};
  const recentActivity = dashboard?.data?.recent_activity || {};

  // ═════════════════════════════════════════════════════════
  // 🎨 MAIN RENDER - RETRO FUTURISTIC DASHBOARD
  // ═════════════════════════════════════════════════════════
  return (
    <motion.div 
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="relative min-h-screen bg-base-cream retro-grid-bg"
    >
      {/* Decorative floating elements */}
      <RetroDecorations />
      
      {/* ═══════════════════════════════════════════════════
          🎪 RETRO HEADER (Content Area Header - Not Navbar)
          ═══════════════════════════════════════════════════ */}
      <motion.div 
        variants={cardVariants}
        className="sticky top-4 z-30 px-4 md:px-6"
      >
        <div className="retro-card max-w-4xl mx-auto p-4 flex items-center justify-between">
          {/* Page Title */}
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-retro-orange" />
            <span className="font-retro-display font-black text-base-black text-lg">ADMIN DASHBOARD</span>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex items-center gap-1">
            {['overview', 'analytics'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 font-black text-xs uppercase tracking-wide rounded-retro border-2 border-base-black transition-all ${
                  activeTab === tab
                    ? 'bg-retro-orange text-base-white shadow-[2px_2px_0px_0px_#111111]'
                    : 'bg-base-white text-base-black hover:bg-retro-yellow'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          
          {/* Refresh Button */}
          <motion.button 
            whileHover={{ rotate: 180 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleRefresh}
            className="retro-btn retro-btn-sm retro-btn-outline"
            title="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </motion.button>
        </div>
      </motion.div>

      {/* Main Content Area */}
      <div className="px-4 md:px-6 py-6 max-w-7xl mx-auto">
        
        {/* ═══════════════════════════════════════════════════
            🎯 PAGE HEADER WITH RETRO TYPOGRAPHY
            ═══════════════════════════════════════════════════ */}
        <motion.div variants={cardVariants} className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="retro-heading retro-heading-xl text-retro-orange mb-2 flex items-center gap-3">
                <span className="inline-block animate-wobble">🚀</span>
                ADMIN DASHBOARD
                <span className="inline-block animate-bounce-retro">✨</span>
              </h1>
              <p className="font-retro-mono text-base-black/70 flex items-center gap-2">
                <span className="retro-badge retro-badge-blue text-[10px]">Welcome</span>
                <span className="font-bold">{user?.name}</span>
                <span className="text-base-black/40">•</span>
                <span>{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}</span>
              </p>
            </div>
            
            {/* Quick Stats Pills */}
            <div className="flex flex-wrap gap-2">
              <div className="retro-badge retro-badge-green">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                System Online
              </div>
              <div className="retro-badge retro-badge-purple">
                <Clock className="w-3 h-3 mr-1" />
                {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════════════
            📈 RETRO STATS GRID (BENTO STYLE)
            ═══════════════════════════════════════════════════ */}
        <motion.div 
          variants={pageVariants}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          <RetroStatCard 
            label="Total Users" 
            value={overview.users?.total || 0} 
            icon={Users}
            color="orange"
            trend={12}
            subtitle="Active accounts"
            onClick={() => navigate('/dashboard/admin/users')}
            sticker="👥"
          />
          <RetroStatCard 
            label="Total Classes" 
            value={overview.classes || 0} 
            icon={School}
            color="blue"
            subtitle="All levels"
            onClick={() => navigate('/dashboard/admin/classes')}
            sticker="🏫"
          />
          <RetroStatCard 
            label="Total Subjects" 
            value={overview.subjects || 0} 
            icon={BookOpen}
            color="purple"
            subtitle="Curriculum"
            onClick={() => navigate('/dashboard/admin/subjects')}
            sticker="📚"
          />
          <RetroStatCard 
            label="Today's Attendance" 
            value={overview.attendance_today || 0} 
            icon={Calendar}
            color="lime"
            subtitle="Students present"
            onClick={() => setActiveTab('analytics')}
            sticker="✅"
          />
        </motion.div>

        {/* ═══════════════════════════════════════════════════
            🎮 TAB CONTENT: OVERVIEW
            ═══════════════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <motion.div variants={pageVariants} className="space-y-8">
            
            {/* Quick Actions - Bento Grid */}
            <motion.div variants={cardVariants} className="retro-card p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="retro-heading retro-heading-md text-retro-blue flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  QUICK ACTIONS
                </h3>
                <div className="retro-badge retro-badge-yellow text-[10px] animate-pulse">
                  ⚡ FAST ACCESS
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {quickActions.map((action, index) => (
                  <RetroQuickAction key={index} {...action} />
                ))}
              </div>
            </motion.div>

            {/* System Health & User Distribution - Split Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* System Health */}
              <motion.div variants={cardVariants} className="retro-card p-6">
                <h3 className="retro-heading retro-heading-sm text-retro-purple mb-5 flex items-center gap-2">
                  <Server className="w-5 h-5" />
                  SYSTEM HEALTH
                </h3>
                <div className="space-y-3">
                  {Object.entries(systemHealth).length > 0 ? (
                    Object.entries(systemHealth).map(([key, value], index) => (
                      <RetroHealthItem 
                        key={key} 
                        label={key} 
                        value={value}
                        icon={key === 'database' ? Database : key === 'cache' ? Zap : Server}
                      />
                    ))
                  ) : (
                    <div className="text-center py-6">
                      <Database className="w-10 h-10 text-base-black/30 mx-auto mb-2" />
                      <p className="font-retro-mono text-sm text-base-black/50">No system data</p>
                    </div>
                  )}
                </div>
                
                {/* Decorative corner */}
                <div className="absolute bottom-4 right-4 opacity-20">
                  <Cpu className="w-16 h-16 text-retro-purple" />
                </div>
              </motion.div>

              {/* User Distribution */}
              <motion.div variants={cardVariants} className="retro-card p-6">
                <h3 className="retro-heading retro-heading-sm text-retro-orange mb-5 flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  USER DISTRIBUTION
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
                            {/* Striped pattern overlay */}
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
                  RECENT ACTIVITY
                </h3>
                <button 
                  onClick={() => navigate('/dashboard/admin/users')} 
                  className="retro-btn retro-btn-sm retro-btn-outline flex items-center gap-1"
                >
                  View All
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
                    whileHover={{ x: 4, backgroundColor: 'rgba(255,201,40,0.1)' }}
                    className="flex items-center justify-between p-4 retro-card bg-base-white cursor-pointer group"
                  >
                    <div className="flex items-center gap-4">
                      <motion.div 
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className="w-12 h-12 retro-card bg-retro-orange/20 border-retro-orange flex items-center justify-center"
                      >
                        <span className="font-retro-display font-black text-retro-orange text-lg">
                          {user.name?.charAt(0) || 'U'}
                        </span>
                      </motion.div>
                      <div>
                        <p className="font-retro-display font-black text-base-black text-lg leading-none">{user.name}</p>
                        <p className="font-retro-mono text-xs text-base-black/50">{user.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`retro-badge ${
                        user.role === 'admin' ? 'retro-badge-blue' :
                        user.role === 'guru' ? 'retro-badge-green' :
                        'retro-badge-purple'
                      } text-[10px]`}>
                        {user.role.toUpperCase()}
                      </span>
                      <p className="font-retro-mono text-[10px] text-base-black/40 mt-2">
                        {new Date(user.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  </motion.div>
                ))}
                
                {(!recentActivity.recent_users || recentActivity.recent_users.length === 0) && (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-base-black/20 mx-auto mb-3" />
                    <p className="font-retro-mono text-sm text-base-black/50">No recent activity</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════
            📊 TAB CONTENT: ANALYTICS
            ═══════════════════════════════════════════════════ */}
        {activeTab === 'analytics' && (
          <motion.div variants={pageVariants} className="space-y-8">
            
            {/* Analytics Header */}
            <motion.div variants={cardVariants} className="retro-card p-6 bg-gradient-to-r from-retro-orange/10 to-retro-blue/10">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-retro-orange border-4 border-base-black rounded-retro-lg shadow-[4px_4px_0px_0px_#111111]">
                  <BarChart3 className="w-8 h-8 text-base-white" />
                </div>
                <div>
                  <h3 className="retro-heading retro-heading-lg text-retro-orange">ATTENDANCE ANALYTICS</h3>
                  <p className="font-retro-mono text-sm text-base-black/70">Real-time attendance data & insights</p>
                </div>
              </div>
            </motion.div>
            
            {analyticsData?.data ? (
              <>
                {/* Summary Stats */}
                <motion.div variants={pageVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Hadir', value: analyticsData.data.summary?.present || 0, color: 'text-success', bg: 'bg-success/20', border: 'border-success', icon: CheckCircle2 },
                    { label: 'Tidak Hadir', value: analyticsData.data.summary?.absent || 0, color: 'text-danger', bg: 'bg-danger/20', border: 'border-danger', icon: AlertCircle },
                    { label: 'Attendance Rate', value: `${analyticsData.data.summary?.attendance_rate || 0}%`, color: 'text-retro-orange', bg: 'bg-retro-orange/20', border: 'border-retro-orange', icon: Target },
                    { label: 'Total Siswa', value: analyticsData.data.summary?.total_students || 0, color: 'text-retro-blue', bg: 'bg-retro-blue/20', border: 'border-retro-blue', icon: Users },
                  ].map((stat, index) => (
                    <motion.div
                      key={stat.label}
                      variants={cardVariants}
                      whileHover={{ scale: 1.03, rotate: 1 }}
                      className={`retro-card p-4 ${stat.bg} border-4 ${stat.border} text-center`}
                      style={{ transitionDelay: `${index * 50}ms` }}
                    >
                      <stat.icon className={`w-6 h-6 ${stat.color} mx-auto mb-2`} />
                      <div className={`text-2xl font-retro-display font-black ${stat.color}`}>{stat.value}</div>
                      <div className="font-retro-mono text-[10px] uppercase tracking-wide text-base-black/70 mt-1">{stat.label}</div>
                    </motion.div>
                  ))}
                </motion.div>

                {/* Chart Placeholder - Retro Style */}
                <motion.div variants={cardVariants} className="retro-card p-6">
                  <div className="text-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      className="w-28 h-28 mx-auto mb-4 border-4 border-dashed border-retro-orange rounded-full flex items-center justify-center bg-retro-orange/10"
                    >
                      <BarChart3 className="w-14 h-14 text-retro-orange" />
                    </motion.div>
                    <p className="font-retro-display font-black text-base-black text-lg mb-1">Interactive Chart</p>
                    <p className="font-retro-mono text-xs text-base-black/50 mb-3">
                      Period: <span className="font-bold">{analyticsData.data.period?.start}</span> → <span className="font-bold">{analyticsData.data.period?.end}</span>
                    </p>
                    <button className="retro-btn retro-btn-sm retro-btn-outline">
                      Launch Full Analytics →
                    </button>
                  </div>
                </motion.div>

                {/* Daily Data Table - Retro Style */}
                {analyticsData.data.daily?.length > 0 && (
                  <motion.div variants={cardVariants} className="retro-card overflow-hidden">
                    <div className="p-4 border-b-4 border-base-black bg-retro-blue text-base-white">
                      <h4 className="font-retro-display font-black uppercase tracking-wide">Daily Breakdown</h4>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full font-retro-mono text-sm">
                        <thead>
                          <tr className="bg-retro-yellow/20 border-b-4 border-base-black">
                            {['Tanggal', 'Hadir', 'Terlambat', 'Izin', 'Sakit', 'Alpha'].map((header) => (
                              <th key={header} className="text-left py-3 px-4 font-black uppercase tracking-wide text-xs text-base-black">
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y-2 divide-base-black/10">
                          {analyticsData.data.daily.slice(0, 7).map((day, index) => (
                            <motion.tr 
                              key={day.date}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: index * 0.03 }}
                              whileHover={{ backgroundColor: 'rgba(255,201,40,0.2)' }}
                              className="transition-colors"
                            >
                              <td className="py-3 px-4 font-bold text-base-black">{day.date}</td>
                              <td className="py-3 px-4 text-center font-bold text-success">{day.hadir}</td>
                              <td className="py-3 px-4 text-center font-bold text-warning">{day.terlambat}</td>
                              <td className="py-3 px-4 text-center font-bold text-retro-blue">{day.izin}</td>
                              <td className="py-3 px-4 text-center font-bold text-retro-orange">{day.sakit}</td>
                              <td className="py-3 px-4 text-center font-bold text-danger">{day.alpha}</td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                )}
              </>
            ) : (
              <motion.div variants={cardVariants} className="retro-card p-8 text-center">
                <Clock className="w-16 h-16 text-base-black/20 mx-auto mb-4" />
                <p className="font-retro-display font-black text-base-black text-lg mb-2">Loading Analytics...</p>
                <p className="font-retro-mono text-sm text-base-black/50">Please wait while we fetch your data</p>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════
          🎯 FLOATING ACTION BUTTON (Desktop - Sidebar Ready)
          ═══════════════════════════════════════════════════ */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => navigate('/dashboard/admin/users')}
        className="fixed bottom-6 right-6 z-50 retro-btn retro-btn-lg retro-btn-sticker hidden md:flex items-center gap-2"
      >
        <Plus className="w-5 h-5" />
        <span className="hidden lg:inline">Add New</span>
      </motion.button>

      {/* ═══════════════════════════════════════════════════
          🎪 DECORATIVE FOOTER STICKERS
          ═══════════════════════════════════════════════════ */}
      <div className="fixed bottom-4 left-4 z-0 hidden lg:block pointer-events-none">
        <motion.div 
          animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="retro-sticker bg-retro-pink text-base-white text-xs px-3 py-1"
        >
          POWERED BY RPL
        </motion.div>
      </div>
      
      <div className="fixed bottom-4 right-4 z-0 hidden lg:block pointer-events-none">
        <motion.div 
          animate={{ rotate: [0, 10, -10, 5, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity, delay: 1 }}
          className="retro-sticker bg-retro-lime text-base-black text-xs px-3 py-1"
        >
          v2.0 RETRO ✨
        </motion.div>
      </div>
    </motion.div>
  );
}