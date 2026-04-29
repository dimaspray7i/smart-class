import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api';

export default function AdminDashboard() {
  const { user } = useAuth();

  const {  dashboard, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => api.get('/admin/dashboard'),
  });

  if (isLoading) {
    return <div className="p-8 text-center">Memuat dashboard...</div>;
  }

  const overview = dashboard?.data?.overview || {};

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Dashboard Admin 🛡️</h1>
        <p className="text-gray-600 dark:text-dark-muted mt-1">
          Sistem Management RPL Smart Ecosystem
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={overview.users?.total || 0} icon="👥" />
        <StatCard label="Total Kelas" value={overview.classes || 0} icon="🏫" />
        <StatCard label="Total Mapel" value={overview.subjects || 0} icon="📖" />
        <StatCard 
          label="System Status" 
          value="Online" 
          icon="✅" 
          color="text-success" 
        />
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">System Overview</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-dark-card rounded-lg">
              <span className="text-gray-600 dark:text-dark-muted">Database</span>
              <span className="text-success font-medium">Connected</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-dark-card rounded-lg">
              <span className="text-gray-600 dark:text-dark-muted">Cache</span>
              <span className="text-success font-medium">Active</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-dark-card rounded-lg">
              <span className="text-gray-600 dark:text-dark-muted">Queue</span>
              <span className="text-success font-medium">Running</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <button className="btn btn-primary">Manage Users</button>
            <button className="btn btn-outline">Manage Classes</button>
            <button className="btn btn-outline">Manage Subjects</button>
            <button className="btn btn-outline">View Analytics</button>
          </div>
        </div>
      </div>

      {/* User Distribution */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">User Distribution</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
            <div className="text-3xl font-bold text-blue-600">{overview.users?.admin || 0}</div>
            <div className="text-sm text-gray-600 dark:text-dark-muted mt-1">Admin</div>
          </div>
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
            <div className="text-3xl font-bold text-green-600">{overview.users?.guru || 0}</div>
            <div className="text-sm text-gray-600 dark:text-dark-muted mt-1">Guru</div>
          </div>
          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-center">
            <div className="text-3xl font-bold text-purple-600">{overview.users?.siswa || 0}</div>
            <div className="text-sm text-gray-600 dark:text-dark-muted mt-1">Siswa</div>
          </div>
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