import { useState, useCallback } from 'react';
import { Users, School, BookOpen, Calendar, BarChart3, Settings } from 'lucide-react';

export function useDashboardActions(navigate) {
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const quickActions = [
    {
      label: 'Pengguna',
      icon: Users,
      action: () => navigate('/dashboard/admin/users'),
      color: 'orange',
      description: 'Kelola akun pengguna',
      badge: null,
      rotate: -2,
    },
    {
      label: 'Kelas',
      icon: School,
      action: () => navigate('/dashboard/admin/classes'),
      color: 'blue',
      description: 'Kelola data kelas',
      badge: null,
      rotate: 2,
    },
    {
      label: 'Pelajaran',
      icon: BookOpen,
      action: () => navigate('/dashboard/admin/subjects'),
      color: 'purple',
      description: 'Kurikulum mata pelajaran',
      badge: 'BARU',
      rotate: -1,
    },
    {
      label: 'Jadwal',
      icon: Calendar,
      action: () => navigate('/dashboard/admin/schedules'),
      color: 'yellow',
      description: 'Kelola jadwal belajar',
      badge: null,
      rotate: 1,
    },
    {
      label: 'Analisis',
      icon: BarChart3,
      action: () => setActiveTab('analytics'),
      color: 'lime',
      description: 'Laporan statistik absensi',
      badge: '📊',
      rotate: -3,
    },
    {
      label: 'Pengaturan',
      icon: Settings,
      action: () => navigate('/dashboard/admin/settings'),
      color: 'pink',
      description: 'Konfigurasi sistem',
      badge: null,
      rotate: 2,
    },
  ];

  return {
    activeTab,
    setActiveTab,
    sidebarOpen,
    setSidebarOpen,
    quickActions,
  };
}
