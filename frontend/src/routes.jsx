import { Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import PublicLayout from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';
import LoginPage from './pages/LoginPage';
import LandingPage from './pages/LandingPage';
import StudentDashboard from './pages/dashboard/StudentDashboard';
import TeacherDashboard from './pages/dashboard/TeacherDashboard';
import AdminDashboard from './pages/dashboard/AdminDashboard';

// Protected Route Component
const ProtectedRoute = ({ children, roles = [] }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
      </div>
    );
  }
  
  if (!user) return <Navigate to="/login" replace />;
  if (roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

// ✅ Export routes ARRAY (bukan router object)
export const router = [
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'gallery', element: <div className="p-8">Gallery (Coming Soon)</div> },
      { path: 'simulator', element: <div className="p-8">Simulator (Coming Soon)</div> },
    ],
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: 'student',
        element: (
          <ProtectedRoute roles={['siswa']}>
            <StudentDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: 'teacher',
        element: (
          <ProtectedRoute roles={['guru']}>
            <TeacherDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin',
        element: (
          <ProtectedRoute roles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        ),
      },
      { index: true, element: <Navigate to="student" replace /> },
    ],
  },
  { path: '*', element: <Navigate to="/login" replace /> },
];