import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// ═══════════════════════════════════════════════════════════
// LAYOUTS
// ═══════════════════════════════════════════════════════════
import PublicLayout from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';

// ═══════════════════════════════════════════════════════════
// PUBLIC PAGES
// ═══════════════════════════════════════════════════════════
import LoginPage from './pages/LoginPage';
import LandingPage from './pages/LandingPage';

// ═══════════════════════════════════════════════════════════
// STUDENT PAGES
// ═══════════════════════════════════════════════════════════
import StudentDashboard from './pages/dashboard/StudentDashboard';
import AttendancePage from './pages/dashboard/AttendancePage';

// ═══════════════════════════════════════════════════════════
// TEACHER PAGES
// ═══════════════════════════════════════════════════════════
import TeacherDashboard from './pages/dashboard/TeacherDashboard';

// ═══════════════════════════════════════════════════════════
// ADMIN PAGES
// ═══════════════════════════════════════════════════════════
import AdminDashboard from './pages/dashboard/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import ClassManagement from './pages/admin/ClassManagement';
import SubjectManagement from './pages/admin/SubjectManagement';
import ScheduleManagement from './pages/admin/ScheduleManagement';
import SettingsPage from './pages/admin/SettingsPage'; 

// ═══════════════════════════════════════════════════════════
// PROTECTED ROUTE COMPONENT
// ═══════════════════════════════════════════════════════════
const ProtectedRoute = ({ children, roles = [] }) => {
  const { user, loading } = useAuth();
  
  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Redirect to role-based dashboard if role not allowed
  if (roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to={`/dashboard/${user.role}`} replace />;
  }
  
  return children;
};

// ═══════════════════════════════════════════════════════════
// DASHBOARD REDIRECT HELPER
// ═══════════════════════════════════════════════════════════
function DashboardRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={`/dashboard/${user.role}`} replace />;
}

// ═══════════════════════════════════════════════════════════
// PLACEHOLDER COMPONENT (Reusable for Coming Soon pages)
// ═══════════════════════════════════════════════════════════
function ComingSoon({ title = "Fitur", icon = "🚧" }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8">
      <div className="text-6xl mb-4 animate-bounce">{icon}</div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        {title} Coming Soon
      </h2>
      <p className="text-gray-600 dark:text-dark-muted max-w-md">
        Fitur ini sedang dalam pengembangan. Silakan kembali nanti untuk update terbaru.
      </p>
      <div className="mt-6 flex gap-3">
        <button 
          onClick={() => window.history.back()}
          className="btn btn-outline"
        >
          ← Kembali
        </button>
        <button 
          onClick={() => window.location.href = '/dashboard'}
          className="btn btn-primary"
        >
          Ke Dashboard
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// ROUTE DEFINITIONS (Array format for createBrowserRouter)
// ═══════════════════════════════════════════════════════════
export const router = [
  // ─────────────────────────────────────────────────────────
  // PUBLIC ROUTES (No Authentication Required)
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
  // DASHBOARD ROUTES (Protected - Auth Required)
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
      // 👨‍💻 STUDENT ROUTES (role: siswa)
      // ════════════════════════════════════════════════════
      {
        path: 'student',
        element: (
          <ProtectedRoute roles={['siswa']}>
            <Outlet />
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <StudentDashboard /> },
          { path: 'attendance', element: <AttendancePage /> },
          { path: 'projects', element: <ComingSoon title="Project Management" icon="💻" /> },
          { path: 'skills', element: <ComingSoon title="Skill Tracker" icon="🧠" /> },
        ],
      },
      
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
          { path: 'attendance', element: <ComingSoon title="Attendance Control" icon="📊" /> },
          { path: 'students', element: <ComingSoon title="Student Management" icon="👥" /> },
          { path: 'permissions', element: <ComingSoon title="Permission Requests" icon="📋" /> },
        ],
      },
      
      // ════════════════════════════════════════════════════
      // 👨‍💼 ADMIN ROUTES (role: admin) - LIVE FEATURES!
      // ════════════════════════════════════════════════════
      {
        path: 'admin',
        element: (
          <ProtectedRoute roles={['admin']}>
            <Outlet />
          </ProtectedRoute>
        ),
        children: [
          // Dashboard
          { index: true, element: <AdminDashboard /> },
          
          // User Management 
          { path: 'users', element: <UserManagement /> },
          
          // Class Management
          { path: 'classes', element: <ClassManagement /> },
          
          // Subject Management 
          { path: 'subjects', element: <SubjectManagement /> },
          
          // Schedule Management
          { path: 'schedules', element: <ScheduleManagement /> },
          
          // Settings Page
          { path: 'settings', element: <SettingsPage /> },
          
          // 🚧 Coming Soon: Other admin features
          { path: 'analytics', element: <ComingSoon title="Analytics & Reports" icon="📈" /> },
        ],
      },
      
      // Default: redirect to role-based dashboard
      { index: true, element: <DashboardRedirect /> },
    ],
  },
  
  // ─────────────────────────────────────────────────────────
  // CATCH-ALL: Redirect unknown routes to home
  // ─────────────────────────────────────────────────────────
  { path: '*', element: <Navigate to="/" replace /> },
];