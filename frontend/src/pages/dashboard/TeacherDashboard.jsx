import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api';

export default function TeacherDashboard() {
  const { user } = useAuth();

  const { data: dashboard, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['teacher-dashboard'],
    queryFn: () => api.get('/teacher/dashboard'),
    retry: 1,
  });

  if (isLoading) {
    return <div className="p-8 text-center">Memuat dashboard...</div>;
  }

  if (isError) {
    return (
      <div className="card p-8 text-center">
        <h3 className="text-xl font-semibold mb-3">Gagal memuat dashboard</h3>
        <p className="text-gray-600 dark:text-dark-muted mb-4">
          {error?.message || 'Terjadi kesalahan saat mengambil data dashboard.'}
        </p>
        <button onClick={() => refetch()} className="btn btn-primary">
          Muat ulang
        </button>
      </div>
    );
  }

  const stats = dashboard?.data?.stats || {};

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Dashboard Guru 👨‍</h1>
        <p className="text-gray-600 dark:text-dark-muted mt-1">
          Selamat datang, {user?.name}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Siswa" value={stats.total_students || 0} icon="👨‍" />
        <StatCard label="Kelas Diampu" value={stats.total_classes || 0} icon="📚" />
        <StatCard 
          label="Absensi Hari Ini" 
          value={`${stats.today_attendance_rate || 0}%`} 
          icon="✅" 
          color="text-success" 
        />
        <StatCard 
          label="Izin Pending" 
          value={stats.pending_permissions || 0} 
          icon="📋" 
          color="text-warning" 
        />
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="btn btn-primary">Generate Kode Absensi</button>
          <button className="btn btn-outline">Lihat Riwayat Absensi</button>
          <button className="btn btn-outline">Kelola Izin Siswa</button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Izin Pending</h3>
        <div className="space-y-3">
          {dashboard?.data?.pending_permissions?.map((permission) => (
            <div key={permission.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-card rounded-lg">
              <div>
                <p className="font-medium">{permission.student?.name}</p>
                <p className="text-sm text-gray-600 dark:text-dark-muted">{permission.type} - {permission.reason}</p>
              </div>
              <div className="flex gap-2">
                <button className="btn btn-primary text-sm">Setujui</button>
                <button className="btn btn-outline text-sm">Tolak</button>
              </div>
            </div>
          ))}
          {(!dashboard?.data?.pending_permissions || dashboard.data.pending_permissions.length === 0) && (
            <p className="text-center text-gray-500 py-4">Tidak ada izin pending</p>
          )}
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