import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, LayoutDashboard, CalendarCheck, FolderKanban, GraduationCap, 
  Users, BookOpen, Settings, LogOut, Rocket, Shield, School,
  Sparkles, Star, Zap, ChevronRight, ArrowRight, Palette,
  Menu, Home, Briefcase, Award, Target, Clock, CheckCircle2,
  BarChart3, Megaphone, MessageSquare, User, FileText,
  Bell, ShieldAlert, TrendingUp, UserCheck, UserCog
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import { ID } from '../../i18n/id';

// ═══════════════════════════════════════════════════════════
// 🎨 RETRO ANIMATION VARIANTS
// ═══════════════════════════════════════════════════════════
const sidebarVariants = {
  hidden: { x: '-100%', opacity: 0 },
  visible: { 
    x: 0, 
    opacity: 1,
    transition: { type: "spring", stiffness: 100, damping: 20, mass: 0.1 }
  },
  exit: { 
    x: '-100%', 
    opacity: 0,
    transition: { duration: 0.2 }
  }
};

const menuItemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i) => ({ 
    opacity: 1, 
    x: 0,
    transition: { delay: i * 0.05, duration: 0.3 }
  }),
  hover: { x: 4, transition: { duration: 0.15 } }
};

const stickerVariants = {
  hidden: { scale: 0, rotate: -180, opacity: 0 },
  visible: { 
    scale: 1, 
    rotate: 0, 
    opacity: 1,
    transition: { type: "spring", stiffness: 200, damping: 10 }
  },
  hover: { 
    scale: 1.15, 
    rotate: [0, -8, 8, -4, 4, 0],
    transition: { duration: 0.4 }
  }
};

const floatVariants = {
  animate: {
    y: [0, -6, 0],
    rotate: [0, 2, -2, 0],
    transition: { duration: 4, repeat: Infinity, ease: "easeInOut" }
  }
};

const pulseVariants = {
  animate: {
    scale: [1, 1.05, 1],
    boxShadow: [
      '0 0 0px rgba(255,92,0,0)',
      '0 0 15px rgba(255,92,0,0.4)',
      '0 0 0px rgba(255,92,0,0)'
    ],
    transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
  }
};

// ═══════════════════════════════════════════════════════════
// 🎭 RETRO DECORATIVE COMPONENTS
// ═══════════════════════════════════════════════════════════

// Floating Decorative Elements for Sidebar
function SidebarDecorations() {
  return (
    <>
      {/* Floating Stars */}
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={`star-${i}`}
          variants={floatVariants}
          animate="animate"
          className="absolute hidden lg:block"
          style={{
            top: `${15 + i * 20}%`,
            right: `${5 + i * 3}%`,
            animationDelay: `${i * 0.8}s`
          }}
        >
          <Star className="w-3 h-3 text-retro-yellow fill-retro-yellow drop-shadow-retro animate-sparkle-retro" />
        </motion.div>
      ))}
      
      {/* Floating Icons */}
      <motion.div variants={floatVariants} animate="animate" className="absolute top-24 right-4 hidden lg:block">
        <Rocket className="w-5 h-5 text-retro-orange drop-shadow-retro animate-pulse" />
      </motion.div>
      <motion.div variants={floatVariants} animate="animate" className="absolute bottom-32 right-6 hidden lg:block" style={{animationDelay: '1.5s'}}>
        <School className="w-5 h-5 text-retro-blue drop-shadow-retro animate-pulse" />
      </motion.div>
      
      {/* Decorative Corner Accents - Brutalist Style */}
      <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-retro-orange pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-retro-blue pointer-events-none" />
      
      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-retro-grid opacity-20 pointer-events-none" />
    </>
  );
}

// Retro Menu Item with Sticker & Animation
function RetroMenuItem({ item, isActive, index, onClick }) {
  const Icon = item.icon;
  
  // Role-based color mapping for active state
  const roleColors = {
    siswa: { active: 'bg-retro-purple/20 border-retro-purple text-retro-purple', sticker: 'bg-retro-purple text-base-white' },
    guru: { active: 'bg-retro-blue/20 border-retro-blue text-retro-blue', sticker: 'bg-retro-blue text-base-white' },
    admin: { active: 'bg-retro-orange/20 border-retro-orange text-retro-orange', sticker: 'bg-retro-orange text-base-white' },
    public: { active: 'bg-retro-yellow/20 border-retro-yellow text-retro-yellow', sticker: 'bg-retro-yellow text-base-black' },
  };
  
  const getRole = (href) => {
    if (href.includes('/student')) return 'siswa';
    if (href.includes('/teacher')) return 'guru';
    if (href.includes('/admin')) return 'admin';
    return 'public';
  };
  
  const role = getRole(item.href);
  const colors = roleColors[role];
  
  return (
    <motion.div
      variants={menuItemVariants}
      custom={index}
      initial="hidden"
      animate="visible"
      whileHover="hover"
    >
      <Link
        to={item.href}
        onClick={onClick}
        className={`relative flex items-center gap-3 px-4 py-3 rounded-retro border-2 border-base-black transition-all duration-200 group ${
          isActive 
            ? `${colors.active} shadow-[4px_4px_0px_0px_#111111]` 
            : 'bg-base-white hover:bg-retro-yellow/10 hover:border-retro-blue text-base-black/80'
        }`}
      >
        {/* Decorative corner for active item */}
        {isActive && (
          <motion.div 
            variants={stickerVariants}
            initial="hidden"
            animate="visible"
            className="absolute -top-1.5 -right-1.5"
          >
            <div className={`retro-sticker ${colors.sticker} text-[8px] px-1.5 py-0.5`}>
              AKTIF
            </div>
          </motion.div>
        )}
        
        {/* Icon with animation */}
        <motion.div 
          className={`p-2 rounded-retro ${isActive ? 'bg-base-black' : 'bg-base-gray'}`}
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Icon className={`w-5 h-5 ${isActive ? 'text-base-white' : 'text-base-black/60 group-hover:text-retro-orange'}`} />
        </motion.div>
        
        {/* Label */}
        <span className={`font-retro-display font-black text-sm flex-1 ${isActive ? 'text-base-black' : 'text-base-black/80'}`}>
          {item.label}
        </span>
        
        {/* Arrow indicator for active */}
        {isActive && (
          <motion.div
            initial={{ x: -10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="text-retro-orange"
          >
            <ChevronRight className="w-4 h-4" />
          </motion.div>
        )}
        
        {/* Hover sparkle effect */}
        <motion.div 
          className="absolute right-3 opacity-0 group-hover:opacity-100 transition-opacity"
          whileHover={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 0.3 }}
        >
          <Sparkles className="w-4 h-4 text-retro-yellow" />
        </motion.div>
      </Link>
    </motion.div>
  );
}

// Retro User Profile Section
function RetroUserProfile({ user, onLogout }) {
  return (
    <motion.div 
      variants={cardVariants}
      className="retro-card bg-base-white border-4 border-base-black p-4"
    >
      <div className="flex items-center gap-3 mb-4">
        <motion.div 
          variants={pulseVariants}
          animate="animate"
          className="w-12 h-12 rounded-retro bg-retro-orange/20 border-2 border-retro-orange flex items-center justify-center flex-shrink-0"
        >
          <span className="font-retro-display font-black text-retro-orange text-lg">
            {user.name?.charAt(0)?.toUpperCase() || 'U'}
          </span>
        </motion.div>
        <div className="flex-1 min-w-0">
          <p className="font-retro-display font-black text-base-black text-sm truncate">{user.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`retro-badge text-[9px] ${
              user.role === 'admin' ? 'retro-badge-orange' : 
              user.role === 'guru' ? 'retro-badge-blue' : 'retro-badge-purple'
            }`}>
              {user.role.toUpperCase()}
            </span>
            <span className="font-retro-mono text-[9px] text-base-black/50">Aktif</span>
          </div>
        </div>
      </div>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { label: 'Masuk', value: '✓', icon: CheckCircle2, color: 'text-success' },
          { label: 'Peran', value: user.role === 'siswa' ? 'Siswa' : user.role === 'guru' ? 'Guru' : 'Admin', icon: Shield, color: 'text-retro-orange' },
          { label: 'Status', value: '●', icon: Clock, color: 'text-retro-lime' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="text-center p-2 rounded-retro bg-base-gray border-2 border-base-black/30">
              <Icon className={`w-3 h-3 ${stat.color} mx-auto mb-1`} />
              <p className="font-retro-mono text-[8px] text-base-black/60">{stat.label}</p>
              <p className={`font-retro-display font-black text-xs ${stat.color}`}>{stat.value}</p>
            </div>
          );
        })}
      </div>
      
      {/* Logout Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onLogout}
        className="w-full retro-btn retro-btn-sm bg-danger hover:bg-danger/90 text-base-white flex items-center justify-center gap-2"
      >
        <LogOut className="w-4 h-4" />
        <span className="font-retro-mono text-xs">KELUAR</span>
      </motion.button>
      
      {/* Decorative sticker */}
      <motion.div 
        variants={stickerVariants}
        initial="hidden"
        animate="visible"
        className="absolute -top-2 -left-2"
      >
        <div className="retro-sticker bg-retro-lime text-base-black text-[8px] px-2 py-0.5">
          AMAN 🔐
        </div>
      </motion.div>
    </motion.div>
  );
}

// Retro Public Login Section
function RetroPublicLogin({ onClose }) {
  return (
    <motion.div 
      variants={cardVariants}
      className="retro-card bg-base-white border-4 border-base-black p-4 text-center"
    >
      <div className="w-12 h-12 mx-auto mb-3 rounded-retro bg-retro-orange/20 border-2 border-retro-orange flex items-center justify-center">
        <Rocket className="w-6 h-6 text-retro-orange" />
      </div>
      <p className="font-retro-mono text-xs text-base-black/70 mb-4">
        Masuk untuk mengakses beranda pribadi Anda
      </p>
      <Link
        to="/login"
        onClick={onClose}
        className="retro-btn retro-btn-sm w-full flex items-center justify-center gap-2"
      >
        <Shield className="w-4 h-4" />
        <span className="font-retro-mono text-xs">MASUK SEKARANG</span>
      </Link>
      
      {/* Decorative corner */}
      <div className="absolute bottom-2 right-2 w-2 h-2 bg-retro-yellow border border-base-black rounded-sm rotate-45" />
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════
// 🔧 HELPER VARIANTS (defined before Sidebar to avoid hoisting issues)
// ═══════════════════════════════════════════════════════════
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 15 }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 }
  }
};

// ═══════════════════════════════════════════════════════════
// 🎯 MAIN RETRO SIDEBAR COMPONENT
// ═══════════════════════════════════════════════════════════
export default function Sidebar({ isOpen, onClose, isCollapsed, onToggleCollapse }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  // Role-based menu items with retro metadata
  const getMenuItems = () => {
    if (!user) {
      return [
        { icon: Home, label: ID.nav.home, href: '/', description: 'Halaman depan' },
        { icon: Users, label: ID.nav.gallery, href: '/gallery', description: 'Galeri karya siswa' },
        { icon: BookOpen, label: ID.nav.simulator, href: '/simulator', description: 'Simulasi karir' },
      ];
    }

    if (user.role === 'siswa') {
      return [
        { icon: LayoutDashboard, label: ID.nav.dashboard, href: '/dashboard/student', description: 'Ikhtisar' },
        { icon: CalendarCheck, label: ID.nav.attendance, href: '/dashboard/student/attendance', description: 'Presensi harian' },
        { icon: FolderKanban, label: ID.nav.projects, href: '/dashboard/student/projects', description: 'Proyek saya' },
        { icon: GraduationCap, label: ID.nav.skills, href: '/dashboard/student/skills', description: 'Perkembangan keahlian' },
      ];
    } else if (user.role === 'guru') {
      return [
        { icon: LayoutDashboard, label: ID.nav.dashboard,      href: '/dashboard/teacher',               description: 'Beranda overview' },
        { icon: CalendarCheck,   label: ID.nav.attendance,     href: '/dashboard/teacher/attendance',    description: 'Kelola presensi' },
        { icon: CalendarCheck,   label: ID.nav.schedules,      href: '/dashboard/teacher/schedules',     description: 'Jadwal pelajaran' },
        { icon: Users,           label: ID.nav.student,        href: '/dashboard/teacher/students',      description: 'Daftar siswa' },
        { icon: BookOpen,        label: ID.nav.permissions,    href: '/dashboard/teacher/permissions',   description: 'Persetujuan izin' },
        { icon: BarChart3,       label: ID.nav.grades,         href: '/dashboard/teacher/grades',        description: 'Nilai & penilaian' },
        { icon: FileText,        label: ID.nav.materials,      href: '/dashboard/teacher/materials',     description: 'Tugas & materi' },
        { icon: Megaphone,       label: ID.nav.announcements,  href: '/dashboard/teacher/announcements', description: 'Pengumuman kelas' },
        { icon: MessageSquare,   label: ID.nav.messages,       href: '/dashboard/teacher/messages',      description: 'Pesan siswa' },
        { icon: Award,           label: ID.nav.reports,        href: '/dashboard/teacher/reports',       description: 'Laporan & analitik' },
        { icon: User,            label: ID.nav.profile,        href: '/dashboard/teacher/profile',       description: 'Profil saya' },
        { icon: Settings,        label: ID.nav.settings,       href: '/dashboard/teacher/settings',      description: 'Pengaturan akun' },
      ];
    } else if (user.role === 'admin') {
      return [
        { icon: LayoutDashboard, label: ID.nav.dashboard,          href: '/dashboard/admin',              description: 'Ikhtisar sistem' },
        { icon: Users,           label: ID.nav.users,              href: '/dashboard/admin/users',        description: 'Kelola akun pengguna' },
        { icon: UserCheck,       label: ID.nav.teachers,           href: '/dashboard/admin/teachers',     description: 'Data & performa guru' },
        { icon: GraduationCap,   label: ID.nav.students_admin,     href: '/dashboard/admin/students',     description: 'Data siswa lengkap' },
        { icon: School,          label: ID.nav.classes,            href: '/dashboard/admin/classes',      description: 'Kelola data kelas' },
        { icon: BookOpen,        label: ID.nav.subjects,           href: '/dashboard/admin/subjects',     description: 'Mata pelajaran' },
        { icon: CalendarCheck,   label: ID.nav.schedules,          href: '/dashboard/admin/schedules',    description: 'Jadwal pelajaran' },
        { icon: Clock,           label: ID.nav.attendance,         href: '/dashboard/admin/attendance',   description: 'Presensi waktu nyata' },
        { icon: Briefcase,       label: ID.nav.pkl,                href: '/dashboard/admin/pkl',          description: 'Praktik Kerja Lapangan' },
        { icon: Bell,            label: ID.nav.permissions_admin,  href: '/dashboard/admin/permissions',  description: 'Kelola izin siswa & guru' },
        { icon: Megaphone,       label: ID.nav.announcements_admin,href: '/dashboard/admin/announcements',description: 'Broadcast pengumuman' },
        { icon: TrendingUp,      label: ID.nav.reports_admin,      href: '/dashboard/admin/reports',      description: 'Laporan & analitik' },
        { icon: ShieldAlert,     label: ID.nav.security,           href: '/dashboard/admin/security',     description: 'Keamanan & audit log' },
        { icon: User,            label: ID.nav.profile,            href: '/dashboard/admin/profile',      description: 'Profil saya' },
        { icon: Settings,        label: ID.nav.settings,           href: '/dashboard/admin/settings',     description: 'Pengaturan sistem' },
      ];
    }
    return [];
  };

  const menuItems = getMenuItems();

  // Escape key down listener to close sidebar on mobile
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && window.innerWidth < 1024) {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleLogout = () => {
    if (window.confirm('Apakah Anda yakin ingin keluar?')) {
      logout();
      if (window.innerWidth < 1024) onClose();
    }
  };

  if (!user && !isOpen && window.innerWidth < 1024) return null;

  return (
    <>
      {/* Mobile Overlay - Retro Style */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-base-black/70 backdrop-blur-md z-[100] lg:hidden" 
            onClick={onClose}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Panel - Retro Style */}
      <motion.aside
        key="sidebar"
        initial={false}
        animate={{ 
          x: (window.innerWidth < 1024 && !isOpen) ? '-100%' : 0,
          width: isCollapsed ? 80 : 256
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={`
          fixed top-0 left-0 z-[110] h-screen
          bg-base-cream retro-grid-bg border-r-4 border-base-black
          flex flex-col shadow-[4px_0px_0px_0px_rgba(17,17,17,0.1)]
        `}
      >
        {/* Decorative Elements */}
        <SidebarDecorations />
        
        <div className="flex flex-col h-full relative overflow-hidden">
          
          {/* Sidebar Header - Retro Style */}
          <div className={`h-20 flex items-center border-b-4 border-base-black bg-base-white px-4 shrink-0 overflow-hidden ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
            {!isCollapsed && (
              <Link to="/" onClick={() => window.innerWidth < 1024 && onClose()} className="flex items-center gap-2 group whitespace-nowrap">
                <motion.div 
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                  className="w-9 h-9 retro-card bg-retro-orange border-2 border-base-black flex items-center justify-center shrink-0"
                >
                  <Rocket className="w-5 h-5 text-base-white" />
                </motion.div>
                <span className="font-retro-display font-black text-base-black text-xl group-hover:text-retro-orange transition-colors">
                  RPL SMART
                </span>
              </Link>
            )}
            
            {isCollapsed && (
              <Link to="/" onClick={() => window.innerWidth < 1024 && onClose()}>
                <motion.div 
                  whileHover={{ rotate: 360 }}
                  className="w-10 h-10 retro-card bg-retro-orange border-2 border-base-black flex items-center justify-center"
                >
                  <Rocket className="w-6 h-6 text-base-white" />
                </motion.div>
              </Link>
            )}

            {!isCollapsed && window.innerWidth < 1024 && (
              <motion.button 
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose} 
                className="p-2 retro-btn retro-btn-sm"
              >
                <X className="w-5 h-5" />
              </motion.button>
            )}
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 px-3 py-6 space-y-3 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-retro-orange scrollbar-track-transparent">
            {menuItems.map((item, index) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;
              
              const roleColors = {
                siswa: 'border-retro-purple bg-retro-purple/10 text-retro-purple',
                guru: 'border-retro-blue bg-retro-blue/10 text-retro-blue',
                admin: 'border-retro-orange bg-retro-orange/10 text-retro-orange',
                public: 'border-retro-yellow bg-retro-yellow/10 text-retro-yellow'
              };
              
              const getRole = (href) => {
                if (href.includes('/student')) return 'siswa';
                if (href.includes('/teacher')) return 'guru';
                if (href.includes('/admin')) return 'admin';
                return 'public';
              };
              
              const colors = roleColors[getRole(item.href)];

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => window.innerWidth < 1024 && onClose()}
                  className={`
                    relative flex items-center gap-3 px-3 py-3 rounded-retro border-2 border-base-black transition-all duration-200 group
                    ${isActive ? `${colors} shadow-[3px_3px_0px_0px_#111111]` : 'bg-base-white hover:bg-retro-orange/5 text-base-black/70'}
                    ${isCollapsed ? 'justify-center' : ''}
                  `}
                >
                  <div className={`p-2 rounded-retro shrink-0 ${isActive ? 'bg-base-black' : 'bg-base-gray group-hover:bg-retro-orange/20'}`}>
                    <Icon className={`w-5 h-5 ${isActive ? 'text-base-white' : 'text-base-black group-hover:text-retro-orange'}`} />
                  </div>
                  
                  {!isCollapsed && (
                    <span className={`font-retro-display font-black text-sm whitespace-nowrap overflow-hidden transition-all duration-300 ${isActive ? 'text-base-black' : ''}`}>
                      {item.label}
                    </span>
                  )}

                  {isActive && !isCollapsed && (
                    <ChevronRight className="w-4 h-4 ml-auto text-retro-orange" />
                  )}

                  {isCollapsed && (
                    <div className="absolute left-full ml-4 px-3 py-1.5 bg-base-black text-base-white text-[10px] font-retro-mono rounded-retro opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-50 whitespace-nowrap shadow-retro">
                      {item.label}
                      <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-base-black rotate-45" />
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer Toggle & User Profile */}
          <div className="p-4 border-t-4 border-base-black bg-base-white shrink-0">
            {/* Collapse Toggle Desktop */}
            <div className="hidden lg:flex justify-center mb-4">
              <motion.button
                whileHover={{ scale: 1.1, rotate: isCollapsed ? 180 : 0 }}
                whileTap={{ scale: 0.9 }}
                onClick={onToggleCollapse}
                className="p-2.5 retro-btn retro-btn-sm w-full flex items-center justify-center"
              >
                {isCollapsed ? <ArrowRight className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </motion.button>
            </div>

            {user ? (
              <div className={`flex flex-col gap-3 ${isCollapsed ? 'items-center' : ''}`}>
                <div className={`flex items-center gap-3 overflow-hidden ${isCollapsed ? 'justify-center' : ''}`}>
                  <div className="w-10 h-10 rounded-retro bg-retro-orange/20 border-2 border-retro-orange flex items-center justify-center shrink-0">
                    <span className="font-retro-display font-black text-retro-orange">{user.name?.charAt(0).toUpperCase()}</span>
                  </div>
                  {!isCollapsed && (
                    <div className="min-w-0">
                      <p className="font-retro-display font-black text-xs truncate">{user.name}</p>
                      <span className="retro-badge text-[8px] py-0.5">{user.role}</span>
                    </div>
                  )}
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleLogout}
                  className={`retro-btn retro-btn-sm bg-danger text-base-white flex items-center justify-center gap-2 ${isCollapsed ? 'px-0 w-10 h-10' : 'w-full'}`}
                >
                  <LogOut className="w-4 h-4" />
                  {!isCollapsed && <span className="font-retro-mono text-[10px]">LOGOUT</span>}
                </motion.button>
              </div>
            ) : (
              <Link
                to="/login"
                className={`retro-btn retro-btn-sm w-full flex items-center justify-center gap-2 ${isCollapsed ? 'px-0 w-10 h-10' : ''}`}
              >
                <Shield className="w-4 h-4" />
                {!isCollapsed && <span className="font-retro-mono text-[10px]">LOGIN</span>}
              </Link>
            )}
          </div>
          
          {/* Decorative Corner */}
          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-retro-blue pointer-events-none" />
        </div>
      </motion.aside>
    </>
  );
}

// Import Keyboard icon for hint display
const Keyboard = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M6 16h12" />
  </svg>
);