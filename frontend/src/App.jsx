import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';

// ═══════════════════════════════════════════════════════════
// 🎨 RETRO ASSETS & STYLES
// ═══════════════════════════════════════════════════════════
import './index.css';
import retroLogo from './assets/retro-logo.svg';
import viteRetro from './assets/vite-retro.svg';
import reactRetro from './assets/react-retro.svg';
import heroRetro from './assets/hero-retro.png';

// ═══════════════════════════════════════════════════════════
// 🔐 CONTEXT PROVIDERS - IMPORT ONCE AT ROOT
// ═══════════════════════════════════════════════════════════
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

// ═══════════════════════════════════════════════════════════
// 🗂️ LAYOUTS
// ═══════════════════════════════════════════════════════════
import RootLayout from './layouts/RootLayout';
import PublicLayout from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';

// ═══════════════════════════════════════════════════════════
// 🌐 PUBLIC PAGES
// ═══════════════════════════════════════════════════════════
import LandingPage from './pages/public/LandingPage';
import GalleryPage from './pages/public/GalleryPage';
import GalleryDetailPage from './pages/public/GalleryDetailPage';
import SimulatorPage from './pages/public/SimulatorPage';
import SimulatorDetailPage from './pages/public/SimulatorDetailPage';

// ═══════════════════════════════════════════════════════════
// 🔐 AUTH PAGES
// ═══════════════════════════════════════════════════════════
import LoginPage from './pages/auth/LoginPage';

// ═══════════════════════════════════════════════════════════
// 👨‍🎓 STUDENT DASHBOARD PAGES
// ═══════════════════════════════════════════════════════════
import StudentDashboard from './pages/student/Dashboard';
import StudentAttendance from './pages/student/Attendance';
import StudentProjects from './pages/student/Projects';
import StudentSkills from './pages/student/Skills';

// ═══════════════════════════════════════════════════════════
// 👨‍🏫 TEACHER DASHBOARD PAGES
// ═══════════════════════════════════════════════════════════
import TeacherDashboard from './pages/teacher/Dashboard';
import TeacherAttendance from './pages/teacher/Attendance';
import TeacherStudents from './pages/teacher/Students';
import TeacherPermissions from './pages/teacher/Permissions';

// ═══════════════════════════════════════════════════════════
// 🛡️ ADMIN DASHBOARD PAGES
// ═══════════════════════════════════════════════════════════
import AdminDashboard from './pages/admin/Dashboard';
import UserManagement from './pages/admin/UserManagement';
import ClassManagement from './pages/admin/ClassManagement';
import SubjectManagement from './pages/admin/SubjectManagement';
import ScheduleManagement from './pages/admin/ScheduleManagement';
import SettingsPage from './pages/admin/SettingsPage';

// ═══════════════════════════════════════════════════════════
// 🔐 PROTECTED ROUTE COMPONENT
// ═══════════════════════════════════════════════════════════
import ProtectedRoute from './components/ProtectedRoute';

// ═══════════════════════════════════════════════════════════
// 🎨 RETRO ANIMATION VARIANTS
// ═══════════════════════════════════════════════════════════
const appVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1, 
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } 
  }
};

const stickerVariants = {
  hidden: { scale: 0, rotate: -180, opacity: 0 },
  visible: { 
    scale: 1, 
    rotate: 0, 
    opacity: 1,
    transition: { type: "spring", stiffness: 200, damping: 10, delay: 0.8 } 
  },
  hover: { 
    scale: 1.15, 
    rotate: [0, -8, 8, -4, 4, 0],
    transition: { duration: 0.4 } 
  }
};

const floatVariants = {
  animate: {
    y: [0, -12, 0],
    rotate: [0, 4, -4, 0],
    transition: { duration: 6, repeat: Infinity, ease: "easeInOut" }
  }
};

// ═══════════════════════════════════════════════════════════
// 🎭 RETRO DECORATIVE COMPONENTS (For App Root)
// ═══════════════════════════════════════════════════════════

// Floating Retro Elements for App Background
function AppDecorations() {
  return (
    <>
      {/* Floating Stars */}
      {[...Array(10)].map((_, i) => (
        <motion.div
          key={`star-${i}`}
          variants={floatVariants}
          animate="animate"
          className="absolute hidden lg:block pointer-events-none"
          style={{
            top: `${5 + i * 9}%`,
            left: `${2 + i * 8}%`,
            animationDelay: `${i * 0.5}s`,
            zIndex: 0
          }}
        >
          <div className={`w-${3 + (i % 4)} h-${3 + (i % 4)} bg-retro-yellow rounded-sm rotate-45 animate-pulse`} />
        </motion.div>
      ))}
      
      {/* Floating Retro Icons */}
      <motion.div variants={floatVariants} animate="animate" className="absolute top-16 right-16 hidden lg:block pointer-events-none z-0">
        <img src={reactRetro} alt="" className="w-10 h-10 opacity-60 animate-pulse" />
      </motion.div>
      <motion.div variants={floatVariants} animate="animate" className="absolute bottom-24 left-20 hidden lg:block pointer-events-none z-0" style={{animationDelay: '2s'}}>
        <img src={viteRetro} alt="" className="w-10 h-10 opacity-60 animate-pulse" />
      </motion.div>
      
      {/* Decorative Blobs */}
      <div className="absolute top-1/4 left-1/4 w-56 h-56 bg-retro-orange/10 rounded-blob blur-3xl pointer-events-none animate-pulse z-0" />
      <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-retro-blue/10 rounded-blob blur-3xl pointer-events-none animate-pulse z-0" style={{animationDelay: '1.5s'}} />
      <div className="absolute top-1/2 left-1/3 w-36 h-36 bg-retro-purple/10 rounded-blob blur-2xl pointer-events-none animate-pulse z-0" style={{animationDelay: '2s'}} />
      
      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-retro-grid opacity-15 pointer-events-none z-0" />
    </>
  );
}

// Retro Loading Screen (Initial App Load)
function RetroAppLoader() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-base-cream retro-grid-bg"
    >
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        className="w-24 h-24 retro-card bg-retro-orange border-4 border-base-black flex items-center justify-center mb-6 relative"
      >
        <img src={retroLogo} alt="RPL Smart" className="w-14 h-14" />
        {/* Decorative corners */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-base-white" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-base-white" />
      </motion.div>
      
      <motion.h1 
        className="retro-heading retro-heading-xl text-retro-orange mb-2"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        RPL SMART
      </motion.h1>
      
      <motion.p 
        className="font-retro-mono text-base-black/70 mb-6"
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        Loading awesome experience... 🚀
      </motion.p>
      
      {/* Retro Progress Bar */}
      <div className="w-64 h-4 bg-base-gray border-2 border-base-black rounded-sm overflow-hidden">
        <motion.div 
          className="h-full bg-gradient-to-r from-retro-orange via-retro-yellow to-retro-blue"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
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
        <div className="retro-sticker bg-retro-lime text-base-black text-[10px] px-3 py-1">
          v2.0 ✨
        </div>
      </motion.div>
    </motion.div>
  );
}

// Retro Error Fallback Component
function RetroErrorFallback({ error, resetErrorBoundary }) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="min-h-screen flex items-center justify-center bg-base-cream retro-grid-bg p-4"
    >
      <div className="retro-card bg-base-white border-4 border-danger p-8 max-w-md w-full text-center shadow-[8px_8px_0px_0px_#FF1744] relative">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], rotate: [0, -5, 5, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="w-16 h-16 mx-auto mb-4 retro-card bg-danger/10 border-2 border-danger flex items-center justify-center"
        >
          <svg className="w-8 h-8 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </motion.div>
        
        <h2 className="retro-heading retro-heading-lg text-base-black mb-3">Oops! System Glitch</h2>
        <p className="font-retro-mono text-sm text-base-black/70 mb-2">{error?.message || 'An unexpected error occurred'}</p>
        {error?.source && (
          <p className="font-retro-mono text-[10px] text-base-black/40 mb-4">
            Source: {error.source}:{error.line}
          </p>
        )}
        
        <div className="flex gap-3 justify-center">
          <button 
            onClick={resetErrorBoundary}
            className="retro-btn retro-btn-outline"
          >
            Try Again 🔄
          </button>
          <button 
            onClick={() => window.location.href = '/'}
            className="retro-btn bg-retro-orange hover:bg-retro-orange/90 text-base-white"
          >
            Go Home 🏠
          </button>
        </div>
        
        {/* Decorative sticker */}
        <motion.div variants={stickerVariants} initial="hidden" animate="visible" className="absolute -top-3 -right-3">
          <div className="retro-sticker bg-retro-yellow text-base-black text-[10px] px-2 py-0.5">
            ERROR!
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════
// 🎯 MAIN APP COMPONENT - RETRO FUTURISTIC ENTRY POINT
// ═══════════════════════════════════════════════════════════
function App() {
  const [appLoading, setAppLoading] = useState(true);
  
  // Create query client with retro-themed defaults
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 1,
        refetchOnWindowFocus: false,
        retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
      mutations: {
        retry: 1,
      },
    },
  });

  // Simulate initial app loading (for retro effect + real initialization)
  useEffect(() => {
    const initApp = async () => {
      // Could add real initialization here:
      // - Check for updates
      // - Load config
      // - Initialize analytics
      // - Prefetch critical data
      
      // Simulate loading time for retro effect
      await new Promise(resolve => setTimeout(resolve, 1200));
      setAppLoading(false);
    };
    
    initApp();
  }, []);

  // Show loading screen while initializing
  if (appLoading) {
    return <RetroAppLoader />;
  }

  return (
    // ═══════════════════════════════════════════════════════════
    // 🔐 CONTEXT PROVIDERS - WRAP ONCE AT ROOT LEVEL ONLY
    // ═══════════════════════════════════════════════════════════
    <motion.div 
      variants={appVariants}
      initial="hidden"
      animate="visible"
      className="relative min-h-screen"
    >
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <Router>
              {/* Background Decorations (z-0, pointer-events-none) */}
              <AppDecorations />
              
              
              {/* Main Routing with RootLayout wrapper */}
              <Routes>
                {/* ═══════════════════════════════════════════
                    🌐 ROOT LAYOUT - Wraps entire app
                    Handles: global loader, error boundary, decorations
                    ═══════════════════════════════════════════ */}
                <Route element={<RootLayout />}>
                  
                  {/* ═══════════════════════════════════════════
                      🌍 PUBLIC ROUTES - No auth required
                      Layout: PublicLayout (mobile sidebar, public header)
                      ═══════════════════════════════════════════ */}
                  <Route element={<PublicLayout />}>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/gallery" element={<GalleryPage />} />
                    <Route path="/gallery/:slug" element={<GalleryDetailPage />} />
                    <Route path="/simulator" element={<SimulatorPage />} />
                    <Route path="/simulator/:pathSlug" element={<SimulatorDetailPage />} />
                  </Route>
                  
                  {/* ═══════════════════════════════════════════
                      🔐 AUTH ROUTES
                      ═══════════════════════════════════════════ */}
                  <Route path="/login" element={<LoginPage />} />
                  
                  {/* ═══════════════════════════════════════════
                      👨‍🎓 STUDENT DASHBOARD - Protected (role: siswa)
                      Layout: DashboardLayout (sidebar, admin header)
                      ═══════════════════════════════════════════ */}
                  <Route 
                    element={
                      <ProtectedRoute roles={['siswa']}>
                        <DashboardLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route path="/dashboard/student" element={<StudentDashboard />} />
                    <Route path="/dashboard/student/attendance" element={<StudentAttendance />} />
                    <Route path="/dashboard/student/projects" element={<StudentProjects />} />
                    <Route path="/dashboard/student/projects/:id" element={<StudentProjects />} />
                    <Route path="/dashboard/student/skills" element={<StudentSkills />} />
                  </Route>
                  
                  {/* ═══════════════════════════════════════════
                      👨‍🏫 TEACHER DASHBOARD - Protected (role: guru)
                      ═══════════════════════════════════════════ */}
                  <Route 
                    element={
                      <ProtectedRoute roles={['guru']}>
                        <DashboardLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route path="/dashboard/teacher" element={<TeacherDashboard />} />
                    <Route path="/dashboard/teacher/attendance" element={<TeacherAttendance />} />
                    <Route path="/dashboard/teacher/students" element={<TeacherStudents />} />
                    <Route path="/dashboard/teacher/permissions" element={<TeacherPermissions />} />
                  </Route>
                  
                  {/* ═══════════════════════════════════════════
                      🛡️ ADMIN DASHBOARD - Protected (role: admin)
                      ═══════════════════════════════════════════ */}
                  <Route 
                    element={
                      <ProtectedRoute roles={['admin']}>
                        <DashboardLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route path="/dashboard/admin" element={<AdminDashboard />} />
                    <Route path="/dashboard/admin/users" element={<UserManagement />} />
                    <Route path="/dashboard/admin/classes" element={<ClassManagement />} />
                    <Route path="/dashboard/admin/subjects" element={<SubjectManagement />} />
                    <Route path="/dashboard/admin/schedules" element={<ScheduleManagement />} />
                    <Route path="/dashboard/admin/settings" element={<SettingsPage />} />
                  </Route>
                  
                  {/* ═══════════════════════════════════════════
                      ⚠️ FALLBACK & ERROR ROUTES
                      ═══════════════════════════════════════════ */}
                  
                  {/* Unauthorized Access */}
                  <Route path="/unauthorized" element={
                    <div className="min-h-screen flex items-center justify-center bg-base-cream retro-grid-bg p-4">
                      <div className="retro-card bg-base-white border-4 border-base-black p-8 text-center max-w-md relative">
                        <motion.div 
                          animate={{ scale: [1, 1.1, 1], rotate: [0, -5, 5, 0] }}
                          transition={{ duration: 0.5, repeat: Infinity }}
                          className="w-16 h-16 mx-auto mb-4 retro-card bg-danger/10 border-2 border-danger flex items-center justify-center"
                        >
                          <svg className="w-8 h-8 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </motion.div>
                        <h2 className="retro-heading retro-heading-lg text-base-black mb-3">Access Denied 🔐</h2>
                        <p className="font-retro-mono text-base-black/70 mb-6">You don't have permission to access this area.</p>
                        <a href="/" className="retro-btn retro-btn-outline">Go Home 🏠</a>
                        {/* Decorative sticker */}
                        <motion.div variants={stickerVariants} initial="hidden" animate="visible" className="absolute -top-3 -right-3">
                          <div className="retro-sticker bg-retro-yellow text-base-black text-[10px] px-2 py-0.5">
                            RESTRICTED
                          </div>
                        </motion.div>
                      </div>
                    </div>
                  } />
                  
                  {/* 404 Not Found */}
                  <Route path="*" element={
                    <div className="min-h-screen flex items-center justify-center bg-base-cream retro-grid-bg p-4">
                      <div className="retro-card bg-base-white border-4 border-base-black p-8 text-center max-w-md relative">
                        <motion.div 
                          animate={{ y: [0, -10, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="w-16 h-16 mx-auto mb-4 retro-card bg-retro-orange border-2 border-base-black flex items-center justify-center"
                        >
                          <Rocket className="w-8 h-8 text-base-white animate-pulse" />
                        </motion.div>
                        <h2 className="retro-heading retro-heading-lg text-base-black mb-3">404 - Lost in Space 🚀</h2>
                        <p className="font-retro-mono text-base-black/70 mb-6">The page you're looking for has drifted into the cosmic void.</p>
                        <a href="/" className="retro-btn bg-retro-orange hover:bg-retro-orange/90 text-base-white">Return to Earth 🌍</a>
                        {/* Decorative sticker */}
                        <motion.div variants={stickerVariants} initial="hidden" animate="visible" className="absolute -top-3 -right-3">
                          <div className="retro-sticker bg-retro-lime text-base-black text-[10px] px-2 py-0.5">
                            NOT FOUND
                          </div>
                        </motion.div>
                      </div>
                    </div>
                  } />
                  
                </Route>
              </Routes>
            </Router>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
      
      {/* Global Decorative Footer Stickers */}
      <div className="fixed bottom-4 left-4 z-0 hidden lg:block pointer-events-none">
        <motion.div 
          animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="retro-sticker bg-retro-pink text-base-white text-[10px] px-3 py-1"
        >
          POWERED BY RPL 💻
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
      
      {/* Corner Accents - Brutalist Style */}
      <div className="fixed top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-retro-orange pointer-events-none z-0" />
      <div className="fixed bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-retro-blue pointer-events-none z-0" />
    </motion.div>
  );
}

export default App;