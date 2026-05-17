import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  // Icons
  Users, BookOpen, CalendarCheck, Bell, Clock, CheckCircle2, 
  AlertCircle, X, Plus, Edit2, Trash2, Eye, Search, Filter,
  ChevronRight, ChevronLeft, ChevronDown, ChevronUp, MoreVertical,
  Download, Upload, RefreshCw, Settings, Rocket, Sparkles, Star,
  Zap, TrendingUp, BarChart3, PieChart, Activity, MapPin, Camera,
  QrCode, Smartphone, Wifi, Shield, Award, Target, Smile, Frown,
  Menu, Home, LogOut, Moon, Sun, Palette
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../api';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Toast from '../../components/ui/Toast';
import Input from '../../components/ui/Input';

// ═══════════════════════════════════════════════════════════
// 🎨 RETRO TEXT AREA COMPONENT
// ═══════════════════════════════════════════════════════════
const RetroTextArea = ({ 
  label, 
  error, 
  className, 
  id,
  helperText,
  rows = 3,
  ...props 
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label 
          htmlFor={inputId} 
          className="block text-xs font-black uppercase tracking-wider text-base-black"
        >
          {label}
          {props.required && <span className="text-retro-orange ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <textarea
          id={inputId}
          rows={rows}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`w-full py-3 px-4 rounded-retro bg-base-white border-2 border-base-black text-base-black placeholder-base-black/40 focus:outline-none font-retro-mono text-sm transition-all duration-200 resize-none ${
            error ? 'border-danger shadow-[4px_4px_0px_0px_#FF1744]' : 'shadow-[4px_4px_0px_0px_#111111]'
          } ${
            !error && isFocused ? 'border-retro-orange shadow-[4px_4px_0px_0px_#FF5C00]' : ''
          } ${
            props.disabled ? 'opacity-50 cursor-not-allowed bg-base-gray' : ''
          } ${className || ''}`}
          {...props}
          value={props.value ?? ''}
        />
      </div>
      
      {helperText && !error && (
        <p className="text-[9px] font-retro-mono text-base-black/50">{helperText}</p>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// 🎨 RETRO ANIMATION VARIANTS
// ═══════════════════════════════════════════════════════════
const pageVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.1 } }
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, rotate: -1 },
  visible: { 
    opacity: 1, y: 0, rotate: 0,
    transition: { type: "spring", stiffness: 100, damping: 15, mass: 0.1 } 
  }
};

const stickerVariants = {
  hidden: { scale: 0, rotate: -180 },
  visible: { scale: 1, rotate: 0, transition: { type: "spring", stiffness: 200, damping: 10 } },
  hover: { scale: 1.1, rotate: [0, -5, 5, -3, 3, 0], transition: { duration: 0.3 } }
};

const floatVariants = {
  animate: {
    y: [0, -8, 0], rotate: [0, 2, -2, 0],
    transition: { duration: 4, repeat: Infinity, ease: "easeInOut" }
  }
};

const pulseVariants = {
  animate: {
    scale: [1, 1.05, 1],
    boxShadow: [
      '0 0 0px rgba(255,92,0,0)',
      '0 0 20px rgba(255,92,0,0.4)',
      '0 0 0px rgba(255,92,0,0)'
    ],
    transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
  }
};

const progressVariants = {
  animate: (progress) => ({
    width: `${progress}%`,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
  })
};

// ═══════════════════════════════════════════════════════════
// 🎭 RETRO HELPER COMPONENTS
// ═══════════════════════════════════════════════════════════

// Retro Stat Card with Animation
function RetroStatCard({ label, value, icon: Icon, color, trend, delay = 0, onClick }) {
  return (
    <motion.div 
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -4, scale: 1.02 }}
      onClick={onClick}
      className={`retro-card bg-base-white border-4 border-base-black p-4 relative overflow-hidden cursor-pointer ${onClick ? 'hover:shadow-[6px_6px_0px_0px_#FF5C00]' : ''}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between mb-3">
        <motion.div 
          className={`p-2.5 rounded-retro bg-${color}/20 border-2 border-${color}`}
          whileHover={{ scale: 1.1, rotate: 5 }}
        >
          <Icon className={`w-5 h-5 text-${color}`} />
        </motion.div>
        {trend !== undefined && (
          <motion.span 
            className={`text-xs font-black ${trend >= 0 ? 'text-success' : 'text-danger'}`}
            animate={{ scale: trend !== 0 ? [1, 1.1, 1] : 1 }}
            transition={{ duration: 0.5 }}
          >
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </motion.span>
        )}
      </div>
      
      <motion.p 
        className={`retro-heading retro-heading-lg text-${color}`}
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ delay: delay * 0.1 + 0.2 }}
      >
        {value}
      </motion.p>
      
      <p className="font-retro-mono text-[10px] text-base-black/70 uppercase tracking-wide mt-1">
        {label}
      </p>
      
      {/* Decorative corner */}
      <div className="absolute top-2 right-2 w-2 h-2 bg-retro-yellow border border-base-black rounded-sm rotate-45" />
      
      {/* Hover indicator */}
      {onClick && (
        <motion.div 
          className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
          whileHover={{ x: 2 }}
        >
          <ChevronRight className="w-4 h-4 text-retro-orange" />
        </motion.div>
      )}
    </motion.div>
  );
}

// Retro Progress Bar
function RetroProgressBar({ value, max = 100, label, color = 'retro-orange' }) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-retro-mono text-xs text-base-black/70">{label}</span>
        <span className="font-retro-display font-black text-xs text-base-black">{percentage.toFixed(0)}%</span>
      </div>
      <div className="h-3 bg-base-gray border-2 border-base-black rounded-sm overflow-hidden">
        <motion.div 
          className={`h-full bg-${color}`}
          variants={progressVariants}
          animate="animate"
          custom={percentage}
        />
      </div>
    </div>
  );
}

// Retro Permission Item
function RetroPermissionItem({ permission, onApprove, onReject }) {
  const [expanded, setExpanded] = useState(false);
  
  const typeConfig = {
    sakit: { icon: AlertCircle, color: 'text-danger', bg: 'bg-danger/10' },
    izin: { icon: CheckCircle2, color: 'text-warning', bg: 'bg-warning/10' },
    lainnya: { icon: Bell, color: 'text-retro-blue', bg: 'bg-retro-blue/10' },
  };
  
  const config = typeConfig[permission.type?.toLowerCase()] || typeConfig.lainnya;
  const Icon = config.icon;
  
  return (
    <motion.div 
      variants={cardVariants}
      className="retro-card bg-base-white border-2 border-base-black p-4"
      whileHover={{ borderColor: '#FF5C00' }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div className={`p-2 rounded-retro ${config.bg} border-2 border-base-black`}>
            <Icon className={`w-4 h-4 ${config.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-retro-display font-black text-base-black text-sm">
                {permission.student?.name}
              </p>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide border-2 border-base-black ${config.bg} ${config.color}`}>
                {permission.type}
              </span>
            </div>
            <p className="font-retro-mono text-[10px] text-base-black/50 mt-1">
              {new Date(permission.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}
            </p>
            
            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2"
                >
                  <p className="font-retro-mono text-xs text-base-black/70 bg-base-gray/50 p-2 rounded-retro border border-base-black/20">
                    {permission.reason}
                  </p>
                  {permission.attachment && (
                    <a 
                      href={permission.attachment} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-2 text-retro-orange hover:underline font-retro-mono text-[10px]"
                    >
                      <Download className="w-3 h-3" /> Lihat Lampiran
                    </a>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          <button 
            onClick={() => setExpanded(!expanded)}
            className="p-1 retro-btn retro-btn-sm"
          >
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          
          <div className="flex gap-1">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onApprove(permission.id)}
              className="p-1.5 retro-btn retro-btn-sm bg-success hover:bg-success/90 text-base-white"
              title="Setujui"
            >
              <CheckCircle2 className="w-4 h-4" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onReject(permission.id)}
              className="p-1.5 retro-btn retro-btn-sm bg-danger hover:bg-danger/90 text-base-white"
              title="Tolak"
            >
              <X className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Retro Schedule Item
function RetroScheduleItem({ schedule, isActive }) {
  const timeConfig = {
    pagi: { label: 'Pagi', color: 'bg-retro-lime/20 text-retro-lime' },
    siang: { label: 'Siang', color: 'bg-retro-yellow/20 text-retro-yellow' },
    sore: { label: 'Sore', color: 'bg-retro-orange/20 text-retro-orange' },
  };
  
  const config = timeConfig[schedule.time_slot] || timeConfig.pagi;
  
  return (
    <motion.div 
      whileHover={{ x: 4 }}
      className={`p-3 rounded-retro border-2 border-base-black transition-all ${
        isActive 
          ? 'bg-retro-orange/10 border-retro-orange shadow-[2px_2px_0px_0px_#FF5C00]' 
          : 'bg-base-white hover:bg-retro-yellow/10'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide border-2 border-base-black ${config.color}`}>
          {config.label}
        </span>
        <span className="font-retro-mono text-[10px] text-base-black/50">
          {schedule.start_time} - {schedule.end_time}
        </span>
      </div>
      <p className="font-retro-display font-black text-base-black text-sm mb-1">
        {schedule.subject?.name}
      </p>
      <p className="font-retro-mono text-[10px] text-base-black/50">
        {schedule.class?.name} • {schedule.room}
      </p>
    </motion.div>
  );
}

// Floating Decorations for Teacher Dashboard
function TeacherDecorations() {
  return (
    <>
      {/* Floating Stars */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={`star-${i}`}
          variants={floatVariants}
          animate="animate"
          className="absolute hidden lg:block pointer-events-none"
          style={{
            top: `${5 + i * 12}%`,
            left: `${3 + i * 10}%`,
            animationDelay: `${i * 0.5}s`
          }}
        >
          <Star className={`w-${3 + (i % 4)} h-${3 + (i % 4)} text-retro-yellow fill-retro-yellow drop-shadow-retro animate-sparkle-retro`} />
        </motion.div>
      ))}
      
      {/* Floating Icons */}
      <motion.div variants={floatVariants} animate="animate" className="absolute top-16 right-12 hidden lg:block pointer-events-none">
        <div className="retro-smiley text-2xl animate-wobble">👨‍🏫</div>
      </motion.div>
      <motion.div variants={floatVariants} animate="animate" className="absolute bottom-40 left-16 hidden lg:block pointer-events-none" style={{animationDelay: '1.5s'}}>
        <CalendarCheck className="w-8 h-8 text-retro-blue drop-shadow-retro animate-pulse" />
      </motion.div>
      <motion.div variants={floatVariants} animate="animate" className="absolute top-1/3 right-1/4 hidden xl:block pointer-events-none" style={{animationDelay: '2.5s'}}>
        <Users className="w-7 h-7 text-retro-purple drop-shadow-retro animate-pulse" />
      </motion.div>
      
      {/* Decorative Blobs */}
      <div className="absolute top-1/5 left-1/5 w-48 h-48 bg-retro-blue/20 rounded-blob blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/5 right-1/5 w-40 h-40 bg-retro-purple/20 rounded-blob blur-3xl pointer-events-none animate-pulse" style={{animationDelay: '1.5s'}} />
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-retro-grid opacity-20 pointer-events-none" />
    </>
  );
}

// ═══════════════════════════════════════════════════════════
// 🎯 MAIN COMPONENT - RETRO FUTURISTIC TEACHER DASHBOARD
// ═══════════════════════════════════════════════════════════
export default function TeacherDashboard() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Local State
  const [activeTab, setActiveTab] = useState(() => {
    const path = location.pathname;
    if (path.includes('/attendance')) return 'attendance';
    if (path.includes('/students')) return 'students';
    if (path.includes('/permissions')) return 'permissions';
    if (path.includes('/schedule')) return 'schedule';
    return 'overview';
  });

  // Sync state if navigation happens externally
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/attendance')) {
      setActiveTab('attendance');
    } else if (path.includes('/students')) {
      setActiveTab('students');
    } else if (path.includes('/permissions')) {
      setActiveTab('permissions');
    } else if (path.includes('/schedule')) {
      setActiveTab('schedule');
    } else {
      setActiveTab('overview');
    }
  }, [location.pathname]);

  // When changing tab locally, update the URL to match
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (tabId === 'overview') {
      navigate('/dashboard/teacher');
    } else {
      navigate(`/dashboard/teacher/${tabId}`);
    }
  };
  const [searchPermission, setSearchPermission] = useState('');
  const [filterClass, setFilterClass] = useState('all');
  const [isCreateSessionOpen, setIsCreateSessionOpen] = useState(false);
  const [isViewPermissionOpen, setIsViewPermissionOpen] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState(null);
  const [sessionForm, setSessionForm] = useState({
    class_id: '',
    subject_id: '',
    date: new Date().toISOString().split('T')[0],
    start_time: '07:00',
    end_time: '08:30',
    location: '',
    notes: '',
  });
  const [toast, setToast] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [qrCode, setQrCode] = useState('');

  // ═══════════════════════════════════════════════════════════
  // 🔌 API QUERIES
  // ═══════════════════════════════════════════════════════════
  
  // Dashboard Overview
  const { data: dashboard, isLoading: isLoadingDashboard, isError: isErrorDashboard, refetch: refetchDashboard } = useQuery({
    queryKey: ['teacher-dashboard', user?.id],
    queryFn: () => api.get('/teacher/dashboard'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Today's Attendance Sessions
  const { data: todaySessions, isLoading: isLoadingSessions } = useQuery({
    queryKey: ['teacher-attendance-sessions', 'today'],
    queryFn: () => api.get('/teacher/attendance/sessions', {
      params: { date: new Date().toISOString().split('T')[0], status: 'active' }
    }),
    enabled: !!user,
  });

  // Pending Permissions
  const { data: pendingPermissions, isLoading: isLoadingPermissions } = useQuery({
    queryKey: ['teacher-permissions', 'pending'],
    queryFn: () => api.get('/teacher/permissions', {
      params: { status: 'pending', class_id: filterClass === 'all' ? undefined : filterClass }
    }),
    enabled: !!user,
  });

  // Class Schedule for Today
  const { data: todaySchedule, isLoading: isLoadingSchedule } = useQuery({
    queryKey: ['teacher-schedule', 'today'],
    queryFn: () => api.get('/teacher/schedule/today'),
    enabled: !!user,
  });

  // Classes for Filter Dropdown
  const { data: classes } = useQuery({
    queryKey: ['teacher-classes'],
    queryFn: () => api.get('/teacher/classes'),
    enabled: !!user,
  });

  // Subjects for Dropdown
  const { data: subjects } = useQuery({
    queryKey: ['teacher-subjects'],
    queryFn: () => api.get('/teacher/subjects'),
    enabled: !!user,
  });

  // ═══════════════════════════════════════════════════════════
  // 🔌 MUTATIONS
  // ═══════════════════════════════════════════════════════════
  
  // Create Attendance Session
  const createSessionMutation = useMutation({
    mutationFn: (data) => api.post('/teacher/attendance/sessions', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-attendance-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-dashboard'] });
      setIsCreateSessionOpen(false);
      setSessionForm({
        class_id: '',
        subject_id: '',
        date: new Date().toISOString().split('T')[0],
        start_time: '07:00',
        end_time: '08:30',
        location: '',
        notes: '',
      });
      showToast('✅ Sesi absensi berhasil dibuat!', 'success');
    },
    onError: (err) => {
      showToast(`❌ ${err.message || 'Gagal membuat sesi absensi'}`, 'error');
    }
  });

  // Approve/Reject Permission
  const updatePermissionMutation = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/teacher/permissions/${id}/approve`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-permissions'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-dashboard'] });
      setIsViewPermissionOpen(false);
      setSelectedPermission(null);
      showToast('✅ Izin berhasil diproses!', 'success');
    },
    onError: (err) => {
      showToast(`❌ ${err.message || 'Gagal memproses izin'}`, 'error');
    }
  });

  // Generate QR Code for Session
  const generateQRMutation = useMutation({
    mutationFn: (sessionId) => api.post(`/teacher/attendance/sessions/${sessionId}/generate-code`),
    onSuccess: (res) => {
      if (res?.data?.code) {
        setQrCode(res.data.code);
        setIsQRModalOpen(true);
        showToast('✅ QR Code berhasil di-generate!', 'success');
      } else {
        showToast('❌ Gagal generate QR Code: format data salah', 'error');
      }
    },
    onError: (err) => showToast(`❌ Gagal generate QR Code: ${err.message || 'Server error'}`, 'error')
  });

  // ═══════════════════════════════════════════════════════════
  // 🎮 HANDLERS
  // ═══════════════════════════════════════════════════════════
  
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleCreateSession = (e) => {
    e.preventDefault();
    createSessionMutation.mutate(sessionForm);
  };

  const handleApprovePermission = (id) => {
    updatePermissionMutation.mutate({ id, status: 'approved' });
  };

  const handleRejectPermission = (id) => {
    updatePermissionMutation.mutate({ id, status: 'rejected' });
  };

  const handleGenerateQR = (sessionId) => {
    generateQRMutation.mutate(sessionId);
  };

  const filteredPermissions = useMemo(() => {
    if (!pendingPermissions?.data) return [];
    let perms = pendingPermissions.data;
    
    if (searchPermission) {
      perms = perms.filter(p => 
        p.student?.name?.toLowerCase().includes(searchPermission.toLowerCase()) ||
        p.reason?.toLowerCase().includes(searchPermission.toLowerCase())
      );
    }
    
    return perms;
  }, [pendingPermissions, searchPermission]);

  // ═══════════════════════════════════════════════════════════
  // ⌨️ KEYBOARD SHORTCUTS
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+N: New attendance session
      if (e.ctrlKey && !e.altKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setIsCreateSessionOpen(true);
      }
      // Ctrl+P: View pending permissions
      if (e.ctrlKey && !e.altKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        handleTabChange('permissions');
      }
      // Ctrl+R: Refresh data
      if (e.ctrlKey && !e.altKey && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        refetchDashboard();
        showToast('🔄 Data diperbarui!', 'info');
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [refetchDashboard, showToast]);

  // ═══════════════════════════════════════════════════════════
  // ⏳ LOADING & ERROR STATES
  // ═══════════════════════════════════════════════════════════
  
  if (isLoadingDashboard) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-base-cream retro-grid-bg">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }} 
          animate={{ opacity: 1, scale: 1 }} 
          className="text-center"
        >
          <motion.div 
            animate={{ rotate: 360 }} 
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 retro-card bg-retro-blue border-4 border-base-black flex items-center justify-center mx-auto mb-4"
          >
            <Users className="w-8 h-8 text-base-white" />
          </motion.div>
          <p className="font-retro-mono text-base-black/70">Memuat dashboard guru...</p>
        </motion.div>
      </div>
    );
  }
  
  if (isErrorDashboard) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-base-cream retro-grid-bg">
        <div className="retro-card bg-base-white border-4 border-danger p-8 text-center">
          <AlertCircle className="w-12 h-12 text-danger mx-auto mb-3" />
          <p className="retro-heading text-base-black mb-4">Gagal memuat dashboard</p>
          <Button variant="outline" onClick={refetchDashboard}>
            Muat Ulang
          </Button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // 📊 DERIVED DATA
  // ═══════════════════════════════════════════════════════════
  
  const stats = dashboard?.data?.stats || {};
  const activeSession = todaySessions?.data?.[0];
  const classList = classes?.data || [];
  const subjectList = subjects?.data || [];

  // ═══════════════════════════════════════════════════════════
  // 🎨 MAIN RENDER - RETRO FUTURISTIC UI
  // ═══════════════════════════════════════════════════════════
  
  return (
    <motion.div 
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="relative min-h-screen bg-base-cream retro-grid-bg"
    >
      {/* Decorative Elements */}
      <TeacherDecorations />

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0 }}
            className="fixed top-24 right-6 z-50"
          >
            <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER */}
      <motion.div variants={cardVariants} className="retro-card bg-base-white border-4 border-base-black p-6 mb-6 relative">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="retro-heading retro-heading-xl text-retro-blue flex items-center gap-3">
              <Users className="w-8 h-8 text-retro-blue" />
              Dashboard Guru
            </h1>
            <p className="font-retro-mono text-sm text-base-black/70 mt-2">
              Selamat datang, <span className="font-black text-retro-orange">{user?.name}</span> 👨‍🏫
            </p>
            <p className="font-retro-mono text-[10px] text-base-black/40 mt-1">
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            {/* Quick Stats Badge */}
            <div className="retro-card bg-retro-yellow/20 border-2 border-retro-yellow px-4 py-2">
              <span className="font-retro-mono text-xs text-base-black font-black">
                📊 {stats.total_classes || 0} Kelas • {stats.total_students || 0} Siswa
              </span>
            </div>
            
            {/* Create Session Button */}
            <Button 
              onClick={() => setIsCreateSessionOpen(true)}
              className="flex items-center gap-1.5"
              disabled={createSessionMutation.isLoading}
            >
              <Plus className="w-4 h-4" /> 
              {createSessionMutation.isLoading ? 'Membuat...' : 'Sesi Absensi'}
            </Button>
            
            {/* Refresh Button */}
            <motion.button
              whileHover={{ rotate: 180 }}
              whileTap={{ scale: 0.9 }}
              onClick={refetchDashboard}
              className="p-2 retro-btn retro-btn-sm"
              title="Refresh data (Ctrl+R)"
            >
              <RefreshCw className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
        
        {/* Decorative Sticker */}
        <motion.div variants={stickerVariants} initial="hidden" animate="visible" className="absolute -top-3 -right-3">
          <div className="retro-sticker bg-retro-lime text-base-black text-[10px] px-3 py-1">
            TEACHER ✨
          </div>
        </motion.div>
      </motion.div>

      {/* TAB NAVIGATION */}
      <motion.div variants={cardVariants} className="retro-card bg-base-white border-4 border-base-black p-2 mb-6 flex gap-1 overflow-x-auto">
        {[
          { id: 'overview', label: '📊 Overview', icon: BarChart3 },
          { id: 'attendance', label: '✅ Absensi', icon: CalendarCheck },
          { id: 'permissions', label: '📋 Izin', icon: Bell, badge: pendingPermissions?.data?.length || 0 },
          { id: 'schedule', label: '📅 Jadwal', icon: CalendarCheck },
          { id: 'students', label: '👥 Siswa', icon: Users },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-retro font-retro-mono text-xs font-black uppercase tracking-wide border-2 border-base-black transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-retro-blue text-base-white shadow-[2px_2px_0px_0px_#111111]'
                : 'bg-base-white text-base-black hover:bg-retro-yellow/20'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.badge > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-danger text-base-white text-[10px] font-black">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════
          TAB: OVERVIEW
          ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <motion.div variants={pageVariants} className="space-y-6">
          
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <RetroStatCard 
              label="Total Siswa" 
              value={stats.total_students || 0} 
              icon={Users} 
              color="retro-purple" 
              trend={5}
              delay={0}
              onClick={() => handleTabChange('students')}
            />
            <RetroStatCard 
              label="Kelas Diampu" 
              value={stats.total_classes || 0} 
              icon={BookOpen} 
              color="retro-blue" 
              delay={100}
              onClick={() => handleTabChange('schedule')}
            />
            <RetroStatCard 
              label="Absensi Hari Ini" 
              value={`${stats.today_attendance_rate || 0}%`} 
              icon={CalendarCheck} 
              color="success" 
              trend={stats.today_attendance_trend}
              delay={200}
              onClick={() => handleTabChange('attendance')}
            />
            <RetroStatCard 
              label="Izin Pending" 
              value={stats.pending_permissions || 0} 
              icon={Bell} 
              color="warning" 
              delay={300}
              onClick={() => handleTabChange('permissions')}
            />
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Today's Attendance Session */}
            <motion.div variants={cardVariants} className="retro-card bg-base-white border-4 border-base-black p-5 lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="retro-heading retro-heading-sm text-base-black flex items-center gap-2">
                  <CalendarCheck className="w-5 h-5 text-retro-orange" />
                  Sesi Absensi Hari Ini
                </h3>
                {activeSession && (
                  <span className="retro-badge retro-badge-green text-[10px]">Aktif</span>
                )}
              </div>
              
              {activeSession ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 p-4 retro-card bg-retro-orange/10 border-2 border-retro-orange">
                    <div>
                      <p className="font-retro-mono text-[10px] text-base-black/50">Kelas</p>
                      <p className="font-retro-display font-black text-base-black">{activeSession.class?.name}</p>
                    </div>
                    <div>
                      <p className="font-retro-mono text-[10px] text-base-black/50">Mapel</p>
                      <p className="font-retro-display font-black text-base-black">{activeSession.subject?.name}</p>
                    </div>
                    <div>
                      <p className="font-retro-mono text-[10px] text-base-black/50">Waktu</p>
                      <p className="font-retro-mono text-base-black font-black">{activeSession.start_time} - {activeSession.end_time}</p>
                    </div>
                    <div>
                      <p className="font-retro-mono text-[10px] text-base-black/50">Lokasi</p>
                      <p className="font-retro-mono text-base-black font-black flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {activeSession.location || '-'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Attendance Progress */}
                  <div className="space-y-3">
                    <RetroProgressBar 
                      value={activeSession.attended_count || 0} 
                      max={activeSession.total_students || 1} 
                      label={`Hadir: ${activeSession.attended_count || 0} / ${activeSession.total_students || 0} siswa`}
                      color="success"
                    />
                    
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 retro-card bg-success/10 border-2 border-success">
                        <p className="retro-heading text-success">{activeSession.attended_count || 0}</p>
                        <p className="font-retro-mono text-[9px]">Hadir</p>
                      </div>
                      <div className="p-2 retro-card bg-warning/10 border-2 border-warning">
                        <p className="retro-heading text-warning">{activeSession.late_count || 0}</p>
                        <p className="font-retro-mono text-[9px]">Terlambat</p>
                      </div>
                      <div className="p-2 retro-card bg-danger/10 border-2 border-danger">
                        <p className="retro-heading text-danger">{(activeSession.total_students || 0) - (activeSession.attended_count || 0) - (activeSession.late_count || 0)}</p>
                        <p className="font-retro-mono text-[9px]">Absen</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setQrCode(activeSession.code);
                        setIsQRModalOpen(true);
                      }}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Tampilkan QR
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleGenerateQR(activeSession.id)}
                      disabled={generateQRMutation.isLoading}
                    >
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Regenerate QR
                    </Button>
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-1" />
                      Lihat Detail
                    </Button>
                    <Button variant="danger" size="sm">
                      <X className="w-4 h-4 mr-1" />
                      Tutup Sesi
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <CalendarCheck className="w-12 h-12 text-base-black/30 mx-auto mb-3" />
                  <p className="font-retro-mono text-base-black/50 mb-4">Belum ada sesi absensi aktif hari ini</p>
                  <Button onClick={() => setIsCreateSessionOpen(true)}>
                    <Plus className="w-4 h-4 mr-1" />
                    Buat Sesi Baru
                  </Button>
                </div>
              )}
            </motion.div>

            {/* Quick Actions */}
            <motion.div variants={cardVariants} className="retro-card bg-base-white border-4 border-base-black p-5">
              <h3 className="retro-heading retro-heading-sm text-base-black mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-retro-yellow" />
                Quick Actions
              </h3>
              
              <div className="space-y-3">
                {[
                  { label: 'Generate Kode Absensi', icon: QrCode, action: () => setIsCreateSessionOpen(true), color: 'retro-orange' },
                  { label: 'Lihat Riwayat Absensi', icon: Clock, action: () => setActiveTab('attendance'), color: 'retro-blue' },
                  { label: 'Kelola Izin Siswa', icon: Bell, action: () => setActiveTab('permissions'), color: 'warning', badge: stats.pending_permissions },
                  { label: 'Export Laporan', icon: Download, action: () => showToast('📥 Export dimulai...', 'info'), color: 'retro-purple' },
                  { label: 'Setting Notifikasi', icon: Settings, action: () => showToast('⚙️ Opening settings...', 'info'), color: 'retro-lime' },
                ].map((action, idx) => (
                  <motion.button
                    key={idx}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={action.action}
                    className="w-full flex items-center justify-between p-3 retro-card bg-base-white border-2 border-base-black hover:border-retro-orange transition-colors"
                  >
                    <span className="flex items-center gap-3">
                      <span className={`p-2 rounded-retro bg-${action.color}/20 border-2 border-${action.color}`}>
                        <action.icon className={`w-4 h-4 text-${action.color}`} />
                      </span>
                      <span className="font-retro-mono text-xs text-base-black font-black">{action.label}</span>
                    </span>
                    {action.badge > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-danger text-base-white text-[10px] font-black">
                        {action.badge}
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-base-black/40" />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Recent Activity & Upcoming */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Recent Permissions */}
            <motion.div variants={cardVariants} className="retro-card bg-base-white border-4 border-base-black p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="retro-heading retro-heading-sm text-base-black flex items-center gap-2">
                  <Bell className="w-5 h-5 text-warning" />
                  Izin Pending
                </h3>
                <button 
                  onClick={() => setActiveTab('permissions')}
                  className="font-retro-mono text-[10px] text-retro-orange hover:underline"
                >
                  Lihat Semua →
                </button>
              </div>
              
              <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-thin">
                {isLoadingPermissions ? (
                  <div className="text-center py-4">
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-6 h-6 border-2 border-retro-orange border-t-transparent rounded-full mx-auto"
                    />
                  </div>
                ) : filteredPermissions?.length > 0 ? (
                  filteredPermissions.slice(0, 3).map((perm) => (
                    <RetroPermissionItem
                      key={perm.id}
                      permission={perm}
                      onApprove={handleApprovePermission}
                      onReject={handleRejectPermission}
                    />
                  ))
                ) : (
                  <p className="font-retro-mono text-sm text-base-black/50 text-center py-4">
                    🎉 Tidak ada izin pending
                  </p>
                )}
              </div>
            </motion.div>

            {/* Today's Schedule */}
            <motion.div variants={cardVariants} className="retro-card bg-base-white border-4 border-base-black p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="retro-heading retro-heading-sm text-base-black flex items-center gap-2">
                  <CalendarCheck className="w-5 h-5 text-retro-blue" />
                  Jadwal Hari Ini
                </h3>
                <button 
                  onClick={() => setActiveTab('schedule')}
                  className="font-retro-mono text-[10px] text-retro-orange hover:underline"
                >
                  Lihat Semua →
                </button>
              </div>
              
              <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-thin">
                {isLoadingSchedule ? (
                  <div className="text-center py-4">
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-6 h-6 border-2 border-retro-blue border-t-transparent rounded-full mx-auto"
                    />
                  </div>
                ) : todaySchedule?.data?.length > 0 ? (
                  todaySchedule.data.map((sched, idx) => (
                    <RetroScheduleItem 
                      key={sched.id} 
                      schedule={sched} 
                      isActive={idx === 0}
                    />
                  ))
                ) : (
                  <p className="font-retro-mono text-sm text-base-black/50 text-center py-4">
                    📭 Tidak ada jadwal hari ini
                  </p>
                )}
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          TAB: ATTENDANCE (Placeholder for future expansion)
          ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'attendance' && (
        <motion.div variants={cardVariants} className="retro-card bg-base-white border-4 border-base-black p-8 text-center">
          <CalendarCheck className="w-16 h-16 text-retro-orange mx-auto mb-4 animate-pulse" />
          <h3 className="retro-heading retro-heading-md text-base-black mb-2">Fitur Absensi</h3>
          <p className="font-retro-mono text-base-black/70 mb-6">
            Kelola riwayat absensi, export laporan, dan analisis kehadiran siswa.
          </p>
          <div className="flex justify-center gap-3">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-1" /> Export Laporan
            </Button>
            <Button>
              <Plus className="w-4 h-4 mr-1" /> Buat Sesi Baru
            </Button>
          </div>
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          TAB: PERMISSIONS
          ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'permissions' && (
        <motion.div variants={pageVariants} className="space-y-6">
          
          {/* Filter Bar */}
          <motion.div variants={cardVariants} className="retro-card bg-base-white border-4 border-base-black p-4">
            <div className="flex flex-col md:flex-row gap-4 items-end md:items-center justify-between">
              <div className="flex-1 w-full">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-black/40" />
                  <input 
                    type="text" 
                    placeholder="Cari nama siswa atau alasan..." 
                    value={searchPermission}
                    onChange={(e) => setSearchPermission(e.target.value)} 
                    className="retro-input w-full pl-10 pr-10" 
                  />
                  {searchPermission && (
                    <button 
                      onClick={() => setSearchPermission('')} 
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-base-black/40 hover:text-retro-orange"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <select 
                  value={filterClass}
                  onChange={(e) => setFilterClass(e.target.value)}
                  className="retro-input px-3 py-2"
                >
                  <option value="all">Semua Kelas</option>
                  {classList.map(cls => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-1" /> Filter
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Permissions List */}
          <motion.div variants={cardVariants} className="retro-card bg-base-white border-4 border-base-black p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="retro-heading retro-heading-sm text-base-black">
                Daftar Izin Pending ({filteredPermissions.length})
              </h3>
              <span className="retro-badge retro-badge-orange text-[10px]">
                Butuh Aksi
              </span>
            </div>
            
            <div className="space-y-3">
              {isLoadingPermissions ? (
                <div className="text-center py-8">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-8 h-8 border-3 border-retro-orange border-t-transparent rounded-full mx-auto mb-3"
                  />
                  <p className="font-retro-mono text-base-black/50">Memuat data izin...</p>
                </div>
              ) : filteredPermissions.length > 0 ? (
                filteredPermissions.map((perm) => (
                  <RetroPermissionItem
                    key={perm.id}
                    permission={perm}
                    onApprove={handleApprovePermission}
                    onReject={handleRejectPermission}
                  />
                ))
              ) : (
                <div className="text-center py-12">
                  <Smile className="w-16 h-16 text-success mx-auto mb-3" />
                  <p className="font-retro-mono text-base-black/70">
                    🎉 Semua izin telah diproses!
                  </p>
                  <p className="font-retro-mono text-[10px] text-base-black/40 mt-1">
                    Tidak ada izin pending untuk saat ini.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          TAB: SCHEDULE (Placeholder)
          ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'schedule' && (
        <motion.div variants={cardVariants} className="retro-card bg-base-white border-4 border-base-black p-8 text-center">
          <CalendarCheck className="w-16 h-16 text-retro-blue mx-auto mb-4 animate-pulse" />
          <h3 className="retro-heading retro-heading-md text-base-black mb-2">Jadwal Mengajar</h3>
          <p className="font-retro-mono text-base-black/70 mb-6">
            Kelola jadwal mengajar, tambah sesi, dan sinkronisasi dengan kalender.
          </p>
          <Button variant="outline">
            <Plus className="w-4 h-4 mr-1" /> Tambah Jadwal
          </Button>
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          TAB: STUDENTS (Placeholder)
          ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'students' && (
        <motion.div variants={cardVariants} className="retro-card bg-base-white border-4 border-base-black p-8 text-center">
          <Users className="w-16 h-16 text-retro-purple mx-auto mb-4 animate-pulse" />
          <h3 className="retro-heading retro-heading-md text-base-black mb-2">Data Siswa</h3>
          <p className="font-retro-mono text-base-black/70 mb-6">
            Lihat daftar siswa, nilai, kehadiran, dan progress pembelajaran.
          </p>
          <div className="flex justify-center gap-3">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-1" /> Export Data
            </Button>
            <Button>
              <Search className="w-4 h-4 mr-1" /> Cari Siswa
            </Button>
          </div>
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          MODAL: CREATE ATTENDANCE SESSION
          ═══════════════════════════════════════════════════════════ */}
      <Modal 
        isOpen={isCreateSessionOpen} 
        onClose={() => setIsCreateSessionOpen(false)} 
        title="✨ Buat Sesi Absensi Baru" 
        size="lg"
      >
        <form onSubmit={handleCreateSession} className="space-y-6">
          
          {/* Class & Subject Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-black uppercase tracking-wider text-base-black">
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" /> Kelas <span className="text-retro-orange">*</span>
                </span>
              </label>
              <select
                value={sessionForm.class_id}
                onChange={(e) => setSessionForm({...sessionForm, class_id: e.target.value})}
                className="retro-input w-full"
                required
              >
                <option value="">Pilih Kelas</option>
                {classList.map(cls => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-1.5">
              <label className="block text-xs font-black uppercase tracking-wider text-base-black">
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" /> Mapel <span className="text-retro-orange">*</span>
                </span>
              </label>
              <select
                value={sessionForm.subject_id}
                onChange={(e) => setSessionForm({...sessionForm, subject_id: e.target.value})}
                className="retro-input w-full"
                required
              >
                <option value="">Pilih Mapel</option>
                {subjectList.map(subj => (
                  <option key={subj.id} value={subj.id}>{subj.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input 
              label="Tanggal" 
              name="date" 
              type="date"
              value={sessionForm.date}
              onChange={(e) => setSessionForm(prev => ({...prev, date: e.target.value}))}
              required
            />
            <Input 
              label="Mulai" 
              name="start_time" 
              type="time"
              value={sessionForm.start_time}
              onChange={(e) => setSessionForm(prev => ({...prev, start_time: e.target.value}))}
              required
            />
            <Input 
              label="Selesai" 
              name="end_time" 
              type="time"
              value={sessionForm.end_time}
              onChange={(e) => setSessionForm(prev => ({...prev, end_time: e.target.value}))}
              required
            />
          </div>

          {/* Location & Notes */}
          <Input 
            label="Lokasi / Ruang" 
            name="location" 
            value={sessionForm.location}
            onChange={(e) => setSessionForm(prev => ({...prev, location: e.target.value}))}
            placeholder="Contoh: Ruang RPL-1, Lab Komputer"
            icon={MapPin}
          />
          
          <RetroTextArea 
            label="Catatan" 
            name="notes" 
            value={sessionForm.notes}
            onChange={(e) => setSessionForm(prev => ({...prev, notes: e.target.value}))}
            placeholder="Catatan tambahan untuk sesi ini..."
            rows={2}
          />

          {/* QR Code Option */}
          <div className="p-4 retro-card bg-retro-yellow/10 border-2 border-retro-yellow">
            <div className="flex items-center gap-3">
              <QrCode className="w-5 h-5 text-retro-orange" />
              <div>
                <p className="font-retro-display font-black text-base-black text-sm">Generate QR Code</p>
                <p className="font-retro-mono text-[10px] text-base-black/60">
                  QR code akan dibuat otomatis setelah sesi disimpan
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex justify-end gap-3 border-t-2 border-base-black/20">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsCreateSessionOpen(false)}
            >
              Batal
            </Button>
            <Button 
              type="submit" 
              loading={createSessionMutation.isLoading}
            >
              💾 Buat Sesi
            </Button>
          </div>
        </form>
      </Modal>

      {/* ═══════════════════════════════════════════════════════════
          MODAL: VIEW PERMISSION DETAIL
          ═══════════════════════════════════════════════════════════ */}
      {isViewPermissionOpen && selectedPermission && (
        <Modal 
          isOpen={isViewPermissionOpen} 
          onClose={() => { setIsViewPermissionOpen(false); setSelectedPermission(null); }} 
          title="📋 Detail Izin" 
          size="md"
        >
          <div className="space-y-4">
            {/* Student Info */}
            <div className="flex items-center gap-4 p-4 retro-card bg-base-gray border-2 border-base-black">
              <div className="w-12 h-12 rounded-retro bg-retro-purple/20 border-2 border-retro-purple flex items-center justify-center">
                <span className="font-retro-display font-black text-retro-purple text-lg">
                  {selectedPermission.student?.name?.charAt(0)}
                </span>
              </div>
              <div>
                <p className="font-retro-display font-black text-base-black">{selectedPermission.student?.name}</p>
                <p className="font-retro-mono text-[10px] text-base-black/50">{selectedPermission.student?.class?.name}</p>
              </div>
            </div>

            {/* Permission Details */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CalendarCheck className="w-4 h-4 text-base-black/40 mt-0.5" />
                <div>
                  <p className="font-retro-mono text-[10px] text-base-black/50">Tanggal</p>
                  <p className="font-retro-mono text-sm text-base-black font-black">
                    {new Date(selectedPermission.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Bell className="w-4 h-4 text-base-black/40 mt-0.5" />
                <div>
                  <p className="font-retro-mono text-[10px] text-base-black/50">Jenis Izin</p>
                  <p className="font-retro-mono text-sm text-base-black font-black uppercase">
                    {selectedPermission.type}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <BookOpen className="w-4 h-4 text-base-black/40 mt-0.5" />
                <div>
                  <p className="font-retro-mono text-[10px] text-base-black/50">Alasan</p>
                  <p className="font-retro-mono text-sm text-base-black/70">
                    {selectedPermission.reason}
                  </p>
                </div>
              </div>
              
              {selectedPermission.attachment && (
                <a 
                  href={selectedPermission.attachment} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 p-3 retro-card bg-retro-blue/10 border-2 border-retro-blue hover:border-retro-orange transition-colors"
                >
                  <Download className="w-4 h-4 text-retro-blue" />
                  <span className="font-retro-mono text-xs text-base-black">Lihat Lampiran</span>
                </a>
              )}
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t-2 border-base-black/20 flex justify-end gap-3">
              <Button 
                variant="danger" 
                onClick={() => handleRejectPermission(selectedPermission.id)}
                disabled={updatePermissionMutation.isLoading}
              >
                <X className="w-4 h-4 mr-1" /> Tolak
              </Button>
              <Button 
                onClick={() => handleApprovePermission(selectedPermission.id)}
                disabled={updatePermissionMutation.isLoading}
              >
                <CheckCircle2 className="w-4 h-4 mr-1" /> Setujui
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ═══════════════════════════════════════════════════════════
          MODAL: VIEW QR CODE SESSION
          ═══════════════════════════════════════════════════════════ */}
      {isQRModalOpen && qrCode && (
        <Modal 
          isOpen={isQRModalOpen} 
          onClose={() => { setIsQRModalOpen(false); setQrCode(''); }} 
          title="📡 SCAN ABSENSI QR CODE" 
          size="md"
        >
          <div className="space-y-6 text-center">
            {/* Header info */}
            <div className="p-3 retro-card bg-retro-blue/10 border-2 border-retro-blue">
              <p className="font-retro-display font-black text-sm text-retro-blue uppercase">
                {activeSession?.class?.name} • {activeSession?.subject?.name}
              </p>
              <p className="font-retro-mono text-[10px] text-base-black/60 mt-1">
                Waktu: {activeSession?.start_time} - {activeSession?.end_time}
              </p>
            </div>

            {/* QR Image */}
            <div className="flex justify-center p-6 bg-base-white border-4 border-base-black rounded-retro relative overflow-hidden shadow-[4px_4px_0px_0px_#111111] max-w-[280px] mx-auto">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&color=111111&bgcolor=FFFFFF&data=${qrCode}`} 
                alt={`QR Code Absen: ${qrCode}`}
                className="w-full h-auto aspect-square object-contain"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://placehold.co/250x250/f5f5f5/111111?text=Gagal+memuat+QR';
                }}
              />
            </div>

            {/* Text Code Display */}
            <div className="space-y-1">
              <p className="font-retro-mono text-[10px] text-base-black/50">KODE MANUAL</p>
              <div className="font-retro-display font-black text-3xl tracking-widest text-retro-orange bg-retro-orange/10 border-2 border-retro-orange p-3 rounded-retro shadow-[2px_2px_0px_0px_#FF5C00] inline-block px-8 select-all">
                {qrCode}
              </div>
            </div>

            {/* Scanning Instructions */}
            <div className="p-3 bg-retro-yellow/10 border-2 border-retro-yellow rounded-retro text-left">
              <p className="font-retro-display font-black text-xs text-base-black flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-retro-orange" /> PETUNJUK SCANNING:
              </p>
              <ol className="list-decimal list-inside font-retro-mono text-[10px] text-base-black/70 space-y-1 mt-1.5">
                <li>Siswa membuka aplikasi RPL Smart di HP.</li>
                <li>Klik tombol scan/input absensi.</li>
                <li>Scan QR di atas atau masukkan kode manual.</li>
                <li>Pastikan GPS aktif & berada di lokasi yang valid.</li>
              </ol>
            </div>

            {/* Close Button */}
            <div className="pt-4 border-t-2 border-base-black/20 flex justify-center">
              <Button 
                onClick={() => { setIsQRModalOpen(false); setQrCode(''); }}
                className="px-8"
              >
                Tutup Sesi Tampilan
              </Button>
            </div>
          </div>
        </Modal>
      )}


      {/* Decorative Footer Stickers */}
      <div className="fixed bottom-4 left-4 z-0 hidden lg:block pointer-events-none">
        <motion.div 
          animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="retro-sticker bg-retro-pink text-base-white text-[10px] px-3 py-1"
        >
          TEACHER MODE 🎓
        </motion.div>
      </div>
      <div className="fixed bottom-4 right-4 z-0 hidden lg:block pointer-events-none">
        <motion.div 
          animate={{ rotate: [0, 10, -10, 5, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity, delay: 1 }}
          className="retro-sticker bg-retro-lime text-base-black text-[10px] px-3 py-1"
        >
          v2.0 RETRO ✨
        </motion.div>
      </div>
    </motion.div>
  );
}