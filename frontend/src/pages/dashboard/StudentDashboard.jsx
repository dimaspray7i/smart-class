import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api';

export default function StudentDashboard() {
  const { user } = useAuth();

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['student-dashboard'],
    queryFn: () => api.get('/student/dashboard'),
  });

  if (isLoading) {
    return <div className="p-8 text-center">Memuat dashboard...</div>;
  }

  const stats = dashboard?.data?.stats || {};

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Halo, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="text-gray-600 dark:text-dark-muted mt-1">
          {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Absensi" value={stats.attendance?.total || 0} icon="📊" />
        <StatCard label="Hadir" value={stats.attendance?.hadir || 0} icon="✅" color="text-success" />
        <StatCard label="Izin/Sakit" value={(stats.attendance?.izin || 0) + (stats.attendance?.sakit || 0)} icon="📋" color="text-warning" />
        <StatCard label="Streak" value={`${stats.attendance?.streak || 0} hari`} icon="🔥" color="text-primary-600" />
      </div>

      {/* Quick Action - Absen */}
      <div className="card bg-gradient-to-br from-primary-500 to-primary-700 border-0 text-white">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold">Absensi Hari Ini</h3>
            <p className="text-primary-100 text-sm mt-1">Klik tombol di bawah untuk absen sekarang</p>
          </div>
          <button className="btn bg-white text-primary-700 hover:bg-primary-50 font-semibold px-6 py-3">
            📸 ABSEN SEKARANG
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Riwayat Absensi</h3>
        <div className="space-y-3">
          {dashboard?.data?.recent_attendance?.map((item) => (
            <div key={item.date} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-card rounded-lg">
              <div>
                <p className="font-medium">{item.date}</p>
                <p className="text-sm text-gray-600 dark:text-dark-muted">{item.time}</p>
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
      </div>
    </div>
  );
}

// Sub-component: Stat Card
function StatCard({ label, value, icon, color = 'text-gray-900 dark:text-dark-text' }) {
  return (
    <div className="card text-center hover:shadow-md transition-shadow">
      <div className="text-2xl mb-2">{icon}</div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-sm text-gray-600 dark:text-dark-muted">{label}</div>
    </div>
  );
}