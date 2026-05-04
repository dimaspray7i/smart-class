import { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CalendarCheck, TrendingUp, Award, Clock, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api';

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if this is the root student route (/dashboard/student)
  const isRootStudentRoute = location.pathname === '/dashboard/student';
  
  const [showAttendancePrompt, setShowAttendancePrompt] = useState(true);

  // Fetch dashboard data from API
  const { 
    data: dashboard, 
    isLoading, 
    isError, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['student-dashboard', user?.id],
    queryFn: () => api.get('/student/dashboard'),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });

  // If loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        <span className="ml-3 text-gray-600 dark:text-dark-muted">Memuat dashboard...</span>
      </div>
    );
  }

  // If error
  if (isError) {
    return (
      <div className="card text-center py-12">
        <AlertCircle className="w-12 h-12 mx-auto text-danger mb-4" />
        <h3 className="text-lg font-semibold mb-2">Gagal memuat data</h3>
        <p className="text-gray-600 dark:text-dark-muted mb-4">
          {error?.message || 'Terjadi kesalahan saat mengambil data dashboard'}
        </p>
        <button onClick={() => refetch()} className="btn btn-outline">
          Coba Lagi
        </button>
      </div>
    );
  }

  // If this is a child route (attendance, projects, etc.), render Outlet
  if (!isRootStudentRoute) {
    return <Outlet />;
  }

  // Extract stats from API response
  const stats = dashboard?.data?.stats || {};
  const attendanceStats = stats.attendance || {};
  const projectStats = stats.projects || {};
  const skillStats = stats.skills || {};
  const recentAttendance = dashboard?.data?.recent_attendance || [];
  const quickActions = dashboard?.data?.quick_actions || {};

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            Halo, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-600 dark:text-dark-muted mt-1">
            {new Date().toLocaleDateString('id-ID', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        
        {/* Quick Stats Badge */}
        <div className="flex items-center gap-2 px-4 py-2 bg-primary-50 dark:bg-primary-900/20 rounded-xl">
          <CalendarCheck className="w-5 h-5 text-primary-600" />
          <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
            Streak: {attendanceStats.streak || 0} hari
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          label="Total Absensi" 
          value={attendanceStats.total || 0} 
          icon={<TrendingUp className="w-6 h-6" />}
          color="text-primary-600"
        />
        <StatCard 
          label="Hadir" 
          value={attendanceStats.hadir || 0} 
          icon={<CalendarCheck className="w-6 h-6" />}
          color="text-success"
        />
        <StatCard 
          label="Izin/Sakit" 
          value={(attendanceStats.izin || 0) + (attendanceStats.sakit || 0)} 
          icon={<Clock className="w-6 h-6" />}
          color="text-warning"
        />
        <StatCard 
          label="Project Aktif" 
          value={projectStats.in_progress || 0} 
          icon={<Award className="w-6 h-6" />}
          color="text-accent-cyan"
        />
      </div>

      {/* Main Action Card - Attendance */}
      {quickActions?.can_attend !== false && (
        <div className="card bg-gradient-to-br from-primary-600 via-primary-500 to-primary-700 border-0 text-white relative overflow-hidden">
          {/* Decorative background */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent-cyan/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-xl"></div>
          
          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <h3 className="text-lg font-semibold">Absensi Hari Ini</h3>
              <p className="text-primary-100 text-sm mt-1">
                {quickActions?.has_attended_today 
                  ? '✅ Anda sudah absen hari ini' 
                  : 'Klik tombol di bawah untuk absen sekarang'}
              </p>
            </div>
            <button 
              onClick={() => navigate('/dashboard/student/attendance')}
              disabled={quickActions?.has_attended_today}
              className={`btn inline-flex items-center gap-2 font-semibold px-6 py-3 ${
                quickActions?.has_attended_today
                  ? 'bg-white/20 text-white/60 cursor-not-allowed'
                  : 'bg-white text-primary-700 hover:bg-primary-50'
              }`}
            >
              <CalendarCheck className="w-5 h-5" />
              {quickActions?.has_attended_today ? 'Sudah Absen' : 'ABSEN SEKARANG'}
              {!quickActions?.has_attended_today && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}

      {/* Content Grid: Recent Activity + Skills */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Attendance */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Riwayat Absensi</h3>
            <button 
              onClick={() => navigate('/dashboard/student/attendance')}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Lihat Semua →
            </button>
          </div>
          
          {recentAttendance.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-dark-muted">
              <CalendarCheck className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Belum ada riwayat absensi</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentAttendance.slice(0, 5).map((item, index) => (
                <div 
                  key={item.date || index} 
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-card/50 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-card transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      item.status === 'Hadir' ? 'bg-success' :
                      item.status === 'Terlambat' ? 'bg-warning' :
                      'bg-danger'
                    }`}></div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{item.date}</p>
                      <p className="text-xs text-gray-500 dark:text-dark-muted">{item.time}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    item.status === 'Hadir' ? 'bg-success/10 text-success' :
                    item.status === 'Terlambat' ? 'bg-warning/10 text-warning' :
                    'bg-danger/10 text-danger'
                  }`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Skill Progress Preview */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Progress Skill</h3>
            <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              Kelola →
            </button>
          </div>
          
          <div className="space-y-4">
            {[
              { name: 'Laravel', level: skillStats.laravel || 65, color: 'bg-red-500' },
              { name: 'Vue.js', level: skillStats.vue || 45, color: 'bg-green-500' },
              { name: 'MySQL', level: skillStats.mysql || 80, color: 'bg-blue-500' },
            ].map((skill) => (
              <div key={skill.name}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700 dark:text-dark-text">{skill.name}</span>
                  <span className="text-xs text-gray-500 dark:text-dark-muted">{skill.level}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-dark-border rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${skill.color}`}
                    style={{ width: `${skill.level}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Today's Schedule (if available) */}
      {dashboard?.data?.today_schedule?.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Jadwal Hari Ini</h3>
          <div className="space-y-3">
            {dashboard.data.today_schedule.map((schedule, index) => (
              <div 
                key={schedule.id || index}
                className={`p-4 rounded-xl border-l-4 ${
                  schedule.is_now 
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
                    : 'border-gray-300 dark:border-dark-border'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{schedule.subject}</p>
                    <p className="text-sm text-gray-600 dark:text-dark-muted">
                      {schedule.teacher} • {schedule.room}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm font-medium">{schedule.time}</p>
                    {schedule.is_now && (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-primary-500 text-white text-xs rounded-full animate-pulse">
                        Sedang Berlangsung
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Sub-component: Stat Card (Reusable)
// ─────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, color = 'text-gray-900 dark:text-dark-text' }) {
  return (
    <div className="card text-center hover:shadow-lg hover:border-primary-300 dark:hover:border-primary-700 transition-all duration-300 group">
      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gray-100 dark:bg-dark-card mb-3 group-hover:scale-110 transition-transform ${color}`}>
        {icon}
      </div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-sm text-gray-600 dark:text-dark-muted mt-1">{label}</div>
    </div>
  );
}