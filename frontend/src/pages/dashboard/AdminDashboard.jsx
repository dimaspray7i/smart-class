import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  Users, School, BookOpen, Calendar, 
  Activity, TrendingUp, AlertCircle, RefreshCw,
  Plus, Eye, Settings, BarChart3
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api';

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');

  const { 
    data: dashboard, 
    isLoading, 
    isError, 
    error, 
    refetch,
    isFetching 
  } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => api.get('/admin/dashboard'),
    retry: 2,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const { data: analyticsData } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: () => api.get('/admin/analytics/attendance'),
    enabled: activeTab === 'analytics',
    staleTime: 5 * 60 * 1000,
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
  };

  const quickActions = [
    {
      label: 'Kelola Users',
      icon: Users,
      action: () => navigate('/dashboard/admin/users'),
      color: 'bg-blue-500 hover:bg-blue-600',
      description: 'Tambah, edit, atau hapus user',
    },
    {
      label: 'Kelola Kelas',
      icon: School,
      action: () => navigate('/dashboard/admin/classes'),
      color: 'bg-green-500 hover:bg-green-600',
      description: 'Atur kelas dan penjadwalan',
    },
    {
      label: 'Kelola Mapel',
      icon: BookOpen,
      action: () => navigate('/dashboard/admin/subjects'),
      color: 'bg-purple-500 hover:bg-purple-600',
      description: 'Tambah atau edit mata pelajaran',
    },
    {
      label: 'Jadwal Pelajaran',
      icon: Calendar,
      action: () => navigate('/dashboard/admin/schedules'),
      color: 'bg-orange-500 hover:bg-orange-600',
      description: 'Atur jadwal mengajar',
    },
    {
      label: 'Analytics',
      icon: BarChart3,
      action: () => setActiveTab('analytics'),
      color: 'bg-indigo-500 hover:bg-indigo-600',
      description: 'Lihat statistik dan laporan',
    },
    {
      label: 'Settings',
      icon: Settings,
      action: () => navigate('/dashboard/admin/settings'),
      color: 'bg-gray-500 hover:bg-gray-600',
      description: 'Konfigurasi sistem',
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-dark-muted">Memuat dashboard admin...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="card p-8 text-center max-w-lg mx-auto">
        <AlertCircle className="w-12 h-12 text-danger mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-3">Gagal memuat dashboard</h3>
        <p className="text-gray-600 dark:text-dark-muted mb-4">
          {error?.message || 'Terjadi kesalahan saat mengambil data.'}
        </p>
        <div className="flex gap-3 justify-center">
          <button 
            onClick={() => refetch()} 
            className="btn btn-primary inline-flex items-center gap-2"
            disabled={isFetching}
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            Coba Lagi
          </button>
          <button 
            onClick={() => navigate('/')}
            className="btn btn-outline"
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  const overview = dashboard?.data?.data?.overview || {};
  const systemHealth = dashboard?.data?.data?.system_health || {};
  const recentActivity = dashboard?.data?.data?.recent_activity || {};

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            Dashboard Admin 🛡️
            <button 
              onClick={handleRefresh}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-card transition-colors"
              title="Refresh data"
            >
              <RefreshCw className={`w-5 h-5 ${isFetching ? 'animate-spin' : ''}`} />
            </button>
          </h1>
          <p className="text-gray-600 dark:text-dark-muted mt-1">
            Selamat datang, {user?.name} • {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex bg-gray-100 dark:bg-dark-card rounded-lg p-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'overview'
                ? 'bg-white dark:bg-dark-bg shadow text-primary-600'
                : 'text-gray-600 dark:text-dark-muted hover:text-gray-900'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'analytics'
                ? 'bg-white dark:bg-dark-bg shadow text-primary-600'
                : 'text-gray-600 dark:text-dark-muted hover:text-gray-900'
            }`}
          >
            Analytics
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          label="Total Users" 
          value={overview.users?.total || 0} 
          icon={<Users className="w-6 h-6" />}
          color="text-blue-600"
          trend={overview.users?.total > 0 ? 'up' : null}
        />
        <StatCard 
          label="Total Kelas" 
          value={overview.classes || 0} 
          icon={<School className="w-6 h-6" />}
          color="text-green-600"
        />
        <StatCard 
          label="Total Mapel" 
          value={overview.subjects || 0} 
          icon={<BookOpen className="w-6 h-6" />}
          color="text-purple-600"
        />
        <StatCard 
          label="Absensi Hari Ini" 
          value={overview.attendance_today || 0} 
          icon={<Calendar className="w-6 h-6" />}
          color="text-orange-600"
        />
      </div>

      {/* Main Content Based on Tab */}
      {activeTab === 'overview' ? (
        <>
          {/* Quick Actions */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary-600" />
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <button
                    key={index}
                    onClick={action.action}
                    className={`p-4 rounded-xl ${action.color} text-white transition-all duration-200 hover:scale-105 hover:shadow-lg text-center group`}
                  >
                    <Icon className="w-6 h-6 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-medium block">{action.label}</span>
                    <span className="text-xs opacity-80 hidden lg:block">{action.description}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* System Health & User Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* System Health */}
            <div className="card">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-success" />
                System Health
              </h3>
              <div className="space-y-3">
                {Object.entries(systemHealth).length > 0 ? (
                  Object.entries(systemHealth).map(([key, value]) => {
                    // Handle nested objects - convert everything to string
                    let displayValue = 'N/A';
                    let statusColor = 'text-warning';
                    
                    try {
                      if (typeof value === 'object' && value !== null) {
                        // If value has a status property, use that
                        if (value.status && typeof value.status === 'string') {
                          displayValue = value.status;
                          statusColor = (value.status === 'connected' || value.status === 'active' || value.status === 'running') ? 'text-success' : 'text-warning';
                        } else {
                          // Otherwise, just show "Configured"
                          displayValue = 'Configured';
                          statusColor = 'text-success';
                        }
                      } else if (typeof value === 'string') {
                        // If it's a string, use it directly
                        displayValue = value;
                        statusColor = 'text-success';
                      } else if (typeof value === 'boolean') {
                        displayValue = value ? 'Active' : 'Inactive';
                        statusColor = value ? 'text-success' : 'text-warning';
                      } else if (typeof value === 'number') {
                        displayValue = value.toString();
                        statusColor = 'text-success';
                      }
                    } catch (e) {
                      displayValue = 'N/A';
                      statusColor = 'text-warning';
                    }
                    
                    return (
                      <div 
                        key={key}
                        className="flex justify-between items-center p-3 bg-gray-50 dark:bg-dark-card rounded-lg"
                      >
                        <span className="text-gray-600 dark:text-dark-muted capitalize">{key}</span>
                        <span className={`font-medium ${statusColor}`}>
                          {typeof displayValue === 'string' ? displayValue : 'N/A'}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-gray-600 dark:text-dark-muted text-center py-4">
                    No system health data available
                  </p>
                )}
              </div>
            </div>

            {/* User Distribution */}
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">User Distribution</h3>
              <div className="space-y-4">
                {[
                  { label: 'Admin', value: overview.users?.admin || 0, color: 'bg-blue-500', icon: '👨‍💼' },
                  { label: 'Guru', value: overview.users?.guru || 0, color: 'bg-green-500', icon: '👨‍🏫' },
                  { label: 'Siswa', value: overview.users?.siswa || 0, color: 'bg-purple-500', icon: '👨‍🎓' },
                ].map((item) => {
                  const total = (overview.users?.admin || 0) + (overview.users?.guru || 0) + (overview.users?.siswa || 0) || 1;
                  const percentage = Math.round((item.value / total) * 100);
                  
                  return (
                    <div key={item.label}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium flex items-center gap-2">
                          <span>{item.icon}</span>
                          {item.label}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-dark-muted">
                          {item.value} ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-dark-border rounded-full h-2">
                        <div 
                          className={`${item.color} h-2 rounded-full transition-all duration-500`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {recentActivity.recent_users?.slice(0, 5).map((user, index) => (
                <div 
                  key={user.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-card rounded-lg hover:bg-gray-100 dark:hover:bg-dark-card/80 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 font-semibold">
                      {user.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-gray-600 dark:text-dark-muted">{user.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                      user.role === 'guru' ? 'bg-green-100 text-green-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {user.role}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(user.created_at).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                </div>
              ))}
              
              {(!recentActivity.recent_users || recentActivity.recent_users.length === 0) && (
                <p className="text-center text-gray-500 dark:text-dark-muted py-4">
                  Belum ada aktivitas terbaru.
                </p>
              )}
            </div>
          </div>
        </>
      ) : (
        /* Analytics Tab */
        <div className="space-y-6">
          {/* Attendance Analytics */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary-600" />
              Attendance Analytics
            </h3>
            
            {analyticsData?.data ? (
              <div className="space-y-6">
                {/* Summary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-600">{analyticsData.data.summary?.present || 0}</div>
                    <div className="text-sm text-gray-600 dark:text-dark-muted">Hadir</div>
                  </div>
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-center">
                    <div className="text-2xl font-bold text-yellow-600">{analyticsData.data.summary?.absent || 0}</div>
                    <div className="text-sm text-gray-600 dark:text-dark-muted">Tidak Hadir</div>
                  </div>
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-600">{analyticsData.data.summary?.attendance_rate || 0}%</div>
                    <div className="text-sm text-gray-600 dark:text-dark-muted">Attendance Rate</div>
                  </div>
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-center">
                    <div className="text-2xl font-bold text-purple-600">{analyticsData.data.summary?.total_students || 0}</div>
                    <div className="text-sm text-gray-600 dark:text-dark-muted">Total Siswa</div>
                  </div>
                </div>

                {/* Chart Placeholder */}
                <div className="p-8 bg-gray-50 dark:bg-dark-card rounded-xl text-center">
                  <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-dark-muted">
                    Chart visualisasi akan ditampilkan disini.
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Periode: {analyticsData.data.period?.start} - {analyticsData.data.period?.end}
                  </p>
                </div>

                {/* Daily Data Table */}
                {analyticsData.data.daily?.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3">Data Harian</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-dark-border">
                            <th className="text-left py-2 px-3">Tanggal</th>
                            <th className="text-center py-2 px-3">Hadir</th>
                            <th className="text-center py-2 px-3">Terlambat</th>
                            <th className="text-center py-2 px-3">Izin</th>
                            <th className="text-center py-2 px-3">Sakit</th>
                            <th className="text-center py-2 px-3">Alpha</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analyticsData.data.daily.slice(0, 7).map((day, index) => (
                            <tr key={day.date} className="border-b border-gray-100 dark:border-dark-border/50">
                              <td className="py-2 px-3 font-medium">{day.date}</td>
                              <td className="text-center py-2 px-3 text-green-600">{day.hadir}</td>
                              <td className="text-center py-2 px-3 text-yellow-600">{day.terlambat}</td>
                              <td className="text-center py-2 px-3 text-blue-600">{day.izin}</td>
                              <td className="text-center py-2 px-3 text-orange-600">{day.sakit}</td>
                              <td className="text-center py-2 px-3 text-red-600">{day.alpha}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Memuat data analytics...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-component: Stat Card (Reusable)
function StatCard({ label, value, icon, color = 'text-gray-900 dark:text-dark-text', trend }) {
  return (
    <div className="card text-center hover:shadow-md transition-shadow cursor-pointer group">
      <div className={`mb-2 ${color} group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-sm text-gray-600 dark:text-dark-muted">{label}</div>
      {trend === 'up' && (
        <span className="inline-block mt-2 text-xs text-success">↑ Naik</span>
      )}
    </div>
  );
}