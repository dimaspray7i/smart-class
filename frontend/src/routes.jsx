import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Public Pages
import LoginPage from './pages/LoginPage';
import LandingPage from './pages/LandingPage';

// Student Pages
import StudentDashboard from './pages/dashboard/StudentDashboard';
import AttendancePage from './pages/dashboard/AttendancePage';

// Teacher Pages
import TeacherDashboard from './pages/dashboard/TeacherDashboard';

// Admin Pages
import AdminDashboard from './pages/dashboard/AdminDashboard';
import UserManagement from './pages/admin/UserManagement'; // ✅ IMPORT BARU

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
// ROUTE DEFINITIONS (Array format for createBrowserRouter)
// ═══════════════════════════════════════════════════════════
export const router = [
  // ─────────────────────────────────────────────────────────
  // PUBLIC ROUTES
  // ─────────────────────────────────────────────────────────
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'gallery', element: <div className="p-8 text-center">Gallery (Coming Soon)</div> },
      { path: 'simulator', element: <div className="p-8 text-center">Simulator (Coming Soon)</div> },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // DASHBOARD ROUTES (Protected)
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
          { path: 'projects', element: <div className="p-8 text-center text-gray-500">🚧 Projects (Coming Soon)</div> },
          { path: 'skills', element: <div className="p-8 text-center text-gray-500">🚧 Skills (Coming Soon)</div> },
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
          { path: 'attendance', element: <div className="p-8 text-center text-gray-500">🚧 Attendance (Coming Soon)</div> },
          { path: 'students', element: <div className="p-8 text-center text-gray-500">🚧 Students (Coming Soon)</div> },
          { path: 'permissions', element: <div className="p-8 text-center text-gray-500">🚧 Permissions (Coming Soon)</div> },
        ],
      },
      
      // ════════════════════════════════════════════════════
      // 👨‍💼 ADMIN ROUTES (role: admin)
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
          
          // ✅ USER MANAGEMENT (CRUD) - LIVE!
          { path: 'users', element: <UserManagement /> },
          
          // Coming Soon pages
          { path: 'classes', element: <div className="p-8 text-center text-gray-500">🚧 Classes (Coming Soon)</div> },
          { path: 'subjects', element: <div className="p-8 text-center text-gray-500">🚧 Subjects (Coming Soon)</div> },
          { path: 'schedules', element: <div className="p-8 text-center text-gray-500">🚧 Schedules (Coming Soon)</div> },
          { path: 'settings', element: <div className="p-8 text-center text-gray-500">🚧 Settings (Coming Soon)</div> },
          { path: 'analytics', element: <div className="p-8 text-center text-gray-500">🚧 Analytics (Coming Soon)</div> },
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