import { createBrowserRouter, Navigate, Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Loader2, Rocket, Shield, AlertCircle, CheckCircle2, 
  Sparkles, Zap, Star, ArrowLeft, Home, X
} from 'lucide-react';
import { useAuth } from './context/AuthContext';

// ═══════════════════════════════════════════════════════════
// 🎨 RETRO ANIMATION VARIANTS
// ═══════════════════════════════════════════════════════════
const pageVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } 
  },
  exit: { 
    opacity: 0, 
    y: -10,
    transition: { duration: 0.2 } 
  }
};

const loadingVariants = {
  animate: {
    rotate: 360,
    transition: { duration: 1, repeat: Infinity, ease: "linear" }
  }
};

const stickerVariants = {
  hidden: { scale: 0, rotate: -180, opacity: 0 },
  visible: { 
    scale: 1, 
    rotate: 0, 
    opacity: 1,
    transition: { type: "spring", stiffness: 200, damping: 10, delay: 0.3 } 
  },
  hover: { 
    scale: 1.15, 
    rotate: [0, -8, 8, -4, 4, 0],
    transition: { duration: 0.4 } 
  }
};

const floatVariants = {
  animate: {
    y: [0, -10, 0],
    rotate: [0, 3, -3, 0],
    transition: { duration: 4, repeat: Infinity, ease: "easeInOut" }
  }
};

// ═══════════════════════════════════════════════════════════
// 🎭 RETRO DECORATIVE COMPONENTS
// ═══════════════════════════════════════════════════════════

// Floating Stars for Loading/Coming Soon Pages
function RetroDecorations() {
  return (
    <>
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={`star-${i}`}
          variants={floatVariants}
          animate="animate"
          className="absolute hidden lg:block pointer-events-none"
          style={{
            top: `${10 + i * 15}%`,
            left: `${5 + i * 14}%`,
            animationDelay: `${i * 0.5}s`
          }}
        >
          <Star className={`w-${3 + (i % 3)} h-${3 + (i % 3)} text-retro-yellow fill-retro-yellow drop-shadow-retro animate-sparkle-retro`} />
        </motion.div>
      ))}
      <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-retro-orange/10 rounded-blob blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-retro-blue/10 rounded-blob blur-2xl pointer-events-none animate-pulse" style={{animationDelay: '1.5s'}} />
    </>
  );
}

// Retro Loading Spinner Component
function RetroLoadingSpinner() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-base-cream/95 backdrop-blur-sm retro-grid-bg"
    >
      <RetroDecorations />
      
      <motion.div 
        variants={loadingVariants}
        animate="animate"
        className="w-20 h-20 retro-card bg-retro-orange border-4 border-base-black flex items-center justify-center mb-6 relative"
      >
        <Rocket className="w-10 h-10 text-base-white" />
        {/* Decorative corners */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-base-white" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-base-white" />
      </motion.div>
      
      <motion.h2 
        className="retro-heading retro-heading-md text-retro-orange mb-3"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        Loading...
      </motion.h2>
      
      <p className="font-retro-mono text-base-black/70 mb-6 animate-pulse">
        Preparing your retro experience 🚀
      </p>
      
      {/* Retro Progress Bar */}
      <div className="w-64 h-3 bg-base-gray border-2 border-base-black rounded-sm overflow-hidden">
        <motion.div 
          className="h-full bg-gradient-to-r from-retro-orange via-retro-yellow to-retro-blue"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          style={{ width: '60%' }}
        />
      </div>
      
      {/* Decorative Sticker */}
      <motion.div 
        variants={stickerVariants}
        initial="hidden"
        animate="visible"
        className="absolute -top-3 -right-3"
      >
        <div className="retro-sticker bg-retro-yellow text-base-black text-[10px] px-2 py-0.5">
          LOADING ✨
        </div>
      </motion.div>
    </motion.div>
  );
}

// Retro Coming Soon Page Component
function RetroComingSoon({ title = "Fitur", icon = "🚧", description }) {
  const location = useLocation();
  const { user } = useAuth();
  
  return (
    <motion.div 
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="relative min-h-screen flex flex-col items-center justify-center bg-base-cream retro-grid-bg p-4"
    >
      <RetroDecorations />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="retro-card bg-base-white border-4 border-base-black p-8 max-w-md w-full text-center relative shadow-[8px_8px_0px_0px_#111111]"
      >
        {/* Animated Icon */}
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-6xl mb-4"
        >
          {icon}
        </motion.div>
        
        {/* Title */}
        <h2 className="retro-heading retro-heading-lg text-base-black mb-3">
          {title} Coming Soon
        </h2>
        
        {/* Description */}
        <p className="font-retro-mono text-sm text-base-black/70 mb-6">
          {description || `Fitur "${title}" sedang dalam pengembangan retro-futuristic. Silakan kembali nanti untuk update terbaru! ✨`}
        </p>
        
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button 
            onClick={() => window.history.back()}
            className="retro-btn retro-btn-outline flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-retro-mono text-xs">Kembali</span>
          </button>
          <button 
            onClick={() => window.location.href = user ? '/dashboard' : '/'}
            className="retro-btn bg-retro-orange hover:bg-retro-orange/90 text-base-white flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span className="font-retro-mono text-xs">{user ? 'Ke Dashboard' : 'Ke Home'}</span>
          </button>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute top-2 left-2 w-2 h-2 bg-retro-yellow border border-base-black rounded-sm rotate-45" />
        <div className="absolute bottom-2 right-2 w-2 h-2 bg-retro-blue border border-base-black rounded-sm rotate-45" />
      </motion.div>
      
      {/* Floating Sticker */}
      <motion.div 
        variants={stickerVariants}
        initial="hidden"
        animate="visible"
        className="absolute -top-3 -right-3 md:right-10"
      >
        <div className="retro-sticker bg-retro-pink text-base-white text-[10px] px-3 py-1 rotate-3">
          SOON! 🎮
        </div>
      </motion.div>
    </motion.div>
  );
}

// Retro Unauthorized/Access Denied Page
function RetroAccessDenied({ message, role }) {
  return (
    <motion.div 
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="relative min-h-screen flex flex-col items-center justify-center bg-base-cream retro-grid-bg p-4"
    >
      <RetroDecorations />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="retro-card bg-base-white border-4 border-danger p-8 max-w-md w-full text-center relative shadow-[8px_8px_0px_0px_#FF1744]"
      >
        {/* Animated Warning Icon */}
        <motion.div 
          animate={{ scale: [1, 1.1, 1], rotate: [0, -5, 5, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="w-16 h-16 mx-auto mb-4 retro-card bg-danger/10 border-2 border-danger flex items-center justify-center"
        >
          <AlertCircle className="w-8 h-8 text-danger" />
        </motion.div>
        
        {/* Title */}
        <h2 className="retro-heading retro-heading-lg text-base-black mb-3">
          Access Denied 🔐
        </h2>
        
        {/* Message */}
        <p className="font-retro-mono text-sm text-base-black/70 mb-2">
          {message || "You don't have permission to access this area."}
        </p>
        {role && (
          <p className="font-retro-mono text-xs text-base-black/50 mb-4">
            Required role: <span className="retro-badge retro-badge-orange">{role}</span>
          </p>
        )}
        
        {/* Action Button */}
        <button 
          onClick={() => window.location.href = '/'}
          className="retro-btn retro-btn-outline flex items-center justify-center gap-2 mx-auto"
        >
          <Home className="w-4 h-4" />
          <span className="font-retro-mono text-xs">Go Home 🏠</span>
        </button>
        
        {/* Decorative Sticker */}
        <motion.div variants={stickerVariants} initial="hidden" animate="visible" className="absolute -top-3 -right-3">
          <div className="retro-sticker bg-retro-yellow text-base-black text-[10px] px-2 py-0.5">
            RESTRICTED
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════
// 🔐 PROTECTED ROUTE COMPONENT (Retro-Enhanced)
// ═══════════════════════════════════════════════════════════
const ProtectedRoute = ({ children, roles = [] }) => {
  const { user, loading, authEvent } = useAuth();
  const location = useLocation();
  
  // Show retro loading spinner while checking auth
  if (loading) {
    return <RetroLoadingSpinner />;
  }
  
  // Show auth event feedback if present (from login/verification)
  if (authEvent && !user) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-base-cream/95 backdrop-blur-sm p-4"
      >
        <div className={`retro-card bg-base-white border-4 p-6 max-w-md w-full text-center ${
          authEvent.type === 'success' ? 'border-success' : 
          authEvent.type === 'error' ? 'border-danger' : 'border-retro-blue'
        }`}>
          <div className={`p-3 rounded-retro inline-block mb-4 ${
            authEvent.type === 'success' ? 'bg-success/20' : 
            authEvent.type === 'error' ? 'bg-danger/20' : 'bg-retro-blue/20'
          }`}>
            {authEvent.type === 'success' && <CheckCircle2 className="w-8 h-8 text-success" />}
            {authEvent.type === 'error' && <AlertCircle className="w-8 h-8 text-danger" />}
            {authEvent.type === 'info' && <Star className="w-8 h-8 text-retro-blue" />}
          </div>
          <p className="font-retro-display font-black text-base-black text-lg mb-2">{authEvent.message}</p>
          {authEvent.hint && (
            <p className="font-retro-mono text-xs text-base-black/60">{authEvent.hint}</p>
          )}
        </div>
      </motion.div>
    );
  }
  
  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // Check role-based access with retro feedback
  if (roles.length > 0 && !roles.includes(user.role)) {
    return <RetroAccessDenied role={roles.join(', ')} />;
  }
  
  // Render children with page transition
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

// ═══════════════════════════════════════════════════════════
// 🎯 DASHBOARD REDIRECT HELPER (Retro-Enhanced)
// ═══════════════════════════════════════════════════════════
function DashboardRedirect() {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <RetroLoadingSpinner />;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Role-based redirect with animated transition
  const redirectPaths = {
    siswa: '/dashboard/student',
    guru: '/dashboard/teacher',
    admin: '/dashboard/admin',
  };
  
  return <Navigate to={redirectPaths[user.role] || '/dashboard'} replace />;
}

// ═══════════════════════════════════════════════════════════
// 🚧 COMING SOON PLACEHOLDER (Retro-Enhanced)
// ═══════════════════════════════════════════════════════════
function ComingSoon({ title = "Fitur", icon = "🚧", description }) {
  return <RetroComingSoon title={title} icon={icon} description={description} />;
}

// ═══════════════════════════════════════════════════════════
// 🗂️ LAYOUT IMPORTS
// ═══════════════════════════════════════════════════════════
import PublicLayout from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';

// ═══════════════════════════════════════════════════════════
// 🌐 PUBLIC PAGE IMPORTS
// ═══════════════════════════════════════════════════════════
import LoginPage from './pages/LoginPage';
import LandingPage from './pages/LandingPage';
// Note: Gallery and Simulator pages would be imported here when created
// import GalleryPage from './pages/public/GalleryPage';
// import SimulatorPage from './pages/public/SimulatorPage';

// ═══════════════════════════════════════════════════════════
// 👨‍🎓 STUDENT PAGE IMPORTS
// ═══════════════════════════════════════════════════════════
import StudentLayout from './layouts/StudentLayout';
import StudentDashboard from './pages/dashboard/StudentDashboard';
import StudentSchedule from './pages/dashboard/student/StudentSchedule';
import StudentAttendancePage from './pages/dashboard/student/StudentAttendancePage';
import StudentQRScan from './pages/dashboard/student/StudentQRScan';
import StudentGrades from './pages/dashboard/student/StudentGrades';
import StudentTasks from './pages/dashboard/student/StudentTasks';
import StudentPKL from './pages/dashboard/student/StudentPKL';
import StudentPermissions from './pages/dashboard/student/StudentPermissions';
import StudentAnnouncements from './pages/dashboard/student/StudentAnnouncements';
import StudentProfile from './pages/dashboard/student/StudentProfile';
import StudentSettings from './pages/dashboard/student/StudentSettings';

// ═══════════════════════════════════════════════════════════
// 👨‍🏫 TEACHER PAGE IMPORTS
// ═══════════════════════════════════════════════════════════
import TeacherDashboard from './pages/dashboard/TeacherDashboard';
import TeacherAttendance from './pages/teacher/TeacherAttendance';
import TeacherStudents from './pages/teacher/TeacherStudents';
import TeacherPermissions from './pages/teacher/TeacherPermissions';
import TeacherSchedules from './pages/teacher/TeacherSchedules';
import TeacherGrades from './pages/teacher/TeacherGrades';
import TeacherMaterials from './pages/teacher/TeacherMaterials';
import TeacherAnnouncements from './pages/teacher/TeacherAnnouncements';
import TeacherMessages from './pages/teacher/TeacherMessages';
import TeacherReports from './pages/teacher/TeacherReports';
import TeacherProfile from './pages/teacher/TeacherProfile';
import TeacherSettings from './pages/teacher/TeacherSettings';

// ═══════════════════════════════════════════════════════════
// 🛡️ ADMIN PAGE IMPORTS (LIVE FEATURES!)
// ═══════════════════════════════════════════════════════════
import AdminDashboard from './pages/dashboard/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import ClassManagement from './pages/admin/ClassManagement';
import SubjectManagement from './pages/admin/SubjectManagement';
import ScheduleManagement from './pages/admin/ScheduleManagement';
import SettingsPage from './pages/admin/SettingsPage';
import PKLManagement from './pages/admin/PKLManagement';
import AdminTeachers from './pages/admin/AdminTeachers';
import AdminStudents from './pages/admin/AdminStudents';
import AdminAnnouncements from './pages/admin/AdminAnnouncements';
import AdminReports from './pages/admin/AdminReports';
import AdminSecurity from './pages/admin/AdminSecurity';
import AdminProfile from './pages/admin/AdminProfile';

// ═══════════════════════════════════════════════════════════
// 🗺️ ROUTE DEFINITIONS (Array format for createBrowserRouter)
// ═══════════════════════════════════════════════════════════
export const router = createBrowserRouter([
  // ─────────────────────────────────────────────────────────
  // 🌐 PUBLIC ROUTES (No Authentication Required)
  // Layout: PublicLayout (mobile sidebar, public header)
  // ─────────────────────────────────────────────────────────
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'gallery', element: <ComingSoon title="Galeri Siswa" icon="🖼️" /> },
      { path: 'simulator', element: <ComingSoon title="Career Simulator" icon="🎮" /> },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // 👨‍💻 STUDENT ROUTES (role: siswa) — Standalone StudentLayout
  // Layout: StudentLayout only (neobrutalist sidebar + topbar)
  // ─────────────────────────────────────────────────────────
  {
    path: '/dashboard/student',
    element: (
      <ProtectedRoute roles={['siswa']}>
        <StudentLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <StudentDashboard /> },
      { path: 'schedule', element: <StudentSchedule /> },
      { path: 'attendance', element: <StudentAttendancePage /> },
      { path: 'qrscan', element: <StudentQRScan /> },
      { path: 'grades', element: <StudentGrades /> },
      { path: 'tasks', element: <StudentTasks /> },
      { path: 'pkl', element: <StudentPKL /> },
      { path: 'permissions', element: <StudentPermissions /> },
      { path: 'announcements', element: <StudentAnnouncements /> },
      { path: 'profile', element: <StudentProfile /> },
      { path: 'settings', element: <StudentSettings /> },
      { path: 'projects', element: <ComingSoon title="Project Management" icon="💻" /> },
      { path: 'skills', element: <ComingSoon title="Skill Tracker" icon="🧠" /> },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // 🔐 DASHBOARD ROUTES (Admin + Teacher — Protected)
  // Layout: DashboardLayout (retro sidebar + topbar)
  // ─────────────────────────────────────────────────────────
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      
      // ════════════════════════════════════════════════════
      // 👨‍🏫 TEACHER ROUTES (role: guru)
      // ════════════════════════════════════════════════════
      {
        path: 'teacher',
        element: (
          <ProtectedRoute roles={['guru']}>
            <Outlet />
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <TeacherDashboard /> },
          { path: 'attendance', element: <TeacherAttendance /> },
          { path: 'students', element: <TeacherStudents /> },
          { path: 'permissions', element: <TeacherPermissions /> },
          { path: 'schedules', element: <TeacherSchedules /> },
          { path: 'grades', element: <TeacherGrades /> },
          { path: 'materials', element: <TeacherMaterials /> },
          { path: 'announcements', element: <TeacherAnnouncements /> },
          { path: 'messages', element: <TeacherMessages /> },
          { path: 'reports', element: <TeacherReports /> },
          { path: 'profile', element: <TeacherProfile /> },
          { path: 'settings', element: <TeacherSettings /> },
        ],
      },
      
      // ════════════════════════════════════════════════════
      // 🛡️ ADMIN ROUTES (role: admin) - LIVE FEATURES!
      // ════════════════════════════════════════════════════
      {
        path: 'admin',
        element: (
          <ProtectedRoute roles={['admin']}>
            <Outlet />
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <AdminDashboard /> },
          { path: 'users', element: <UserManagement /> },
          { path: 'teachers', element: <AdminTeachers /> },
          { path: 'students', element: <AdminStudents /> },
          { path: 'classes', element: <ClassManagement /> },
          { path: 'subjects', element: <SubjectManagement /> },
          { path: 'schedules', element: <ScheduleManagement /> },
          { path: 'pkl', element: <PKLManagement /> },
          { path: 'announcements', element: <AdminAnnouncements /> },
          { path: 'reports', element: <AdminReports /> },
          { path: 'security', element: <AdminSecurity /> },
          { path: 'settings', element: <SettingsPage /> },
          { path: 'profile', element: <AdminProfile /> },
        ],
      },
      
      // Default: redirect to role-based dashboard
      { index: true, element: <DashboardRedirect /> },
    ],
  },
  
  // ─────────────────────────────────────────────────────────
  // ⚠️ FALLBACK ROUTES
  // ─────────────────────────────────────────────────────────
  
  // Unauthorized Access Page
  { 
    path: '/unauthorized', 
    element: <RetroAccessDenied /> 
  },
  
  // 404 Not Found Page
  { 
    path: '*', 
    element: (
      <motion.div 
        variants={pageVariants}
        initial="hidden"
        animate="visible"
        className="relative min-h-screen flex flex-col items-center justify-center bg-base-cream retro-grid-bg p-4"
      >
        <RetroDecorations />
        
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="retro-card bg-base-white border-4 border-base-black p-8 max-w-md w-full text-center relative"
        >
          <motion.div 
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-16 h-16 mx-auto mb-4 retro-card bg-retro-orange border-2 border-base-black flex items-center justify-center"
          >
            <Rocket className="w-8 h-8 text-base-white animate-pulse" />
          </motion.div>
          
          <h2 className="retro-heading retro-heading-lg text-base-black mb-3">
            404 - Lost in Space 🚀
          </h2>
          
          <p className="font-retro-mono text-base-black/70 mb-6">
            The page you're looking for has drifted into the cosmic void.
          </p>
          
          <a href="/" className="retro-btn bg-retro-orange hover:bg-retro-orange/90 text-base-white">
            Return to Earth 🌍
          </a>
          
          {/* Decorative Sticker */}
          <motion.div variants={stickerVariants} initial="hidden" animate="visible" className="absolute -top-3 -right-3">
            <div className="retro-sticker bg-retro-lime text-base-black text-[10px] px-2 py-0.5">
              NOT FOUND
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    ) 
  },
]);