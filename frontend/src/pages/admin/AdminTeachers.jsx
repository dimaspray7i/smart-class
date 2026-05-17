import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserCheck, Search, Eye, Edit2, Trash2, RefreshCw,
  CalendarCheck, BookOpen, Users, TrendingUp, Download,
  Plus, ChevronDown, ChevronUp, Clock
} from 'lucide-react';
import { api } from '../../api';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Toast from '../../components/ui/Toast';

const pageVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const cardVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } } };

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="retro-card bg-base-white border-4 border-base-black p-4 flex items-center gap-3">
      <div className="p-2.5 rounded-retro border-2 border-base-black" style={{ background: `${color}20` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div>
        <p className="retro-heading text-2xl" style={{ color }}>{value}</p>
        <p className="font-retro-mono text-[10px] text-base-black/60 uppercase">{label}</p>
      </div>
    </div>
  );
}

function TeacherDetailModal({ teacher, onClose }) {
  if (!teacher) return null;
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full border-4 border-base-black bg-retro-blue/20 flex items-center justify-center font-retro-display font-black text-2xl text-retro-blue">
          {teacher.name?.[0]?.toUpperCase()}
        </div>
        <div>
          <p className="font-retro-display font-black text-xl">{teacher.name}</p>
          <p className="font-retro-mono text-sm text-base-black/60">{teacher.email}</p>
          <span className="px-2 py-0.5 text-[10px] font-black uppercase border-2 border-success bg-success/10 text-success rounded-full">Guru Aktif</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[
          ['NIP', teacher.nip || '—'],
          ['Telepon', teacher.phone || '—'],
          ['Kelas Diampu', teacher.classes_count || 0],
          ['Total Siswa', teacher.students_count || 0],
          ['Mapel', teacher.subjects?.map(s => s.name).join(', ') || '—'],
          ['Bergabung', teacher.created_at ? new Date(teacher.created_at).toLocaleDateString('id-ID') : '—'],
        ].map(([k, v]) => (
          <div key={k} className="p-3 border-2 border-dashed border-base-black rounded-retro">
            <p className="font-retro-mono text-[10px] text-base-black/50 uppercase">{k}</p>
            <p className="font-retro-display font-black mt-0.5 text-sm">{v}</p>
          </div>
        ))}
      </div>
      {teacher.recent_schedules?.length > 0 && (
        <div>
          <p className="font-retro-mono text-xs font-black uppercase mb-2">Jadwal Aktif</p>
          <div className="space-y-2">
            {teacher.recent_schedules.slice(0, 3).map((s, i) => (
              <div key={i} className="p-2 border-2 border-base-black rounded-retro flex items-center justify-between bg-base-gray/10">
                <span className="font-retro-mono text-xs">{s.subject?.name} — {s.class?.name}</span>
                <span className="font-retro-mono text-[10px] text-base-black/50">{s.start_time}–{s.end_time}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminTeachers() {
  const queryClient = useQueryClient();
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [page, setPage] = useState(1);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const { data: teachers, isLoading, refetch } = useQuery({
    queryKey: ['admin-teachers', page, search],
    queryFn: () => api.get('/admin/users', { params: { role: 'guru', page, search: search || undefined } }),
    keepPreviousData: true,
  });

  const deleteTeacher = useMutation({
    mutationFn: (id) => api.delete(`/admin/users/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-teachers'] }); showToast('✅ Data guru dihapus'); },
    onError: () => showToast('❌ Gagal menghapus', 'error'),
  });

  const list = teachers?.data?.data || teachers?.data || [];
  const meta = teachers?.data?.meta || {};
  const totalPages = meta.last_page || 1;

  const stats = useMemo(() => ({
    total: meta.total || list.length,
    active: list.filter(t => t.status !== 'inactive').length,
    avgClasses: list.length > 0 ? (list.reduce((a, t) => a + (t.classes_count || 0), 0) / list.length).toFixed(1) : 0,
  }), [list, meta]);

  return (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" className="space-y-6">
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed top-24 right-6 z-50">
            <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div variants={cardVariants} className="retro-card bg-base-white border-4 border-base-black p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="retro-heading retro-heading-xl text-retro-blue flex items-center gap-3">
              <UserCheck className="w-8 h-8" /> Data Guru
            </h1>
            <p className="font-retro-mono text-sm text-base-black/70 mt-1">Kelola data, profil, dan performa seluruh guru</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { refetch(); showToast('🔄 Diperbarui', 'info'); }}>
              <RefreshCw className="w-4 h-4 mr-1" /> Refresh
            </Button>
            <Button variant="outline" onClick={() => showToast('📥 Export dimulai...', 'info')}>
              <Download className="w-4 h-4 mr-1" /> Export
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Guru" value={stats.total} icon={UserCheck} color="#2E2BBF" />
        <StatCard label="Guru Aktif" value={stats.active} icon={TrendingUp} color="#00B894" />
        <StatCard label="Rata Kelas/Guru" value={stats.avgClasses} icon={BookOpen} color="#E67E22" />
      </div>

      {/* Search */}
      <motion.div variants={cardVariants} className="retro-card bg-base-white border-4 border-base-black p-4 flex gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-black/40" />
          <input type="text" placeholder="Cari nama atau email guru..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 py-2 pr-3 border-2 border-base-black rounded-retro font-retro-mono text-sm bg-base-gray/20 focus:outline-none focus:border-retro-orange" />
        </div>
      </motion.div>

      {/* Table */}
      <motion.div variants={cardVariants} className="retro-card bg-base-white border-4 border-base-black overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-retro-blue text-base-white border-b-4 border-base-black">
                {['#', 'Nama Guru', 'Email', 'Kelas', 'Siswa', 'Bergabung', 'Aksi'].map(h => (
                  <th key={h} className="p-4 font-retro-display tracking-widest text-sm">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="7" className="p-10 text-center font-retro-mono text-base-black/50">Memuat data guru...</td></tr>
              ) : list.length > 0 ? list.map((teacher, i) => (
                <motion.tr key={teacher.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className="border-b-2 border-dashed border-base-black hover:bg-retro-yellow/10 transition-colors">
                  <td className="p-4 font-retro-mono text-sm text-base-black/50">{(page - 1) * 15 + i + 1}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full border-2 border-base-black bg-retro-blue/20 flex items-center justify-center font-retro-display font-black text-sm text-retro-blue">
                        {teacher.name?.[0]?.toUpperCase()}
                      </div>
                      <span className="font-retro-display font-black text-sm">{teacher.name}</span>
                    </div>
                  </td>
                  <td className="p-4 font-retro-mono text-xs text-base-black/60">{teacher.email}</td>
                  <td className="p-4 text-center font-retro-display font-black text-retro-blue">{teacher.classes_count || 0}</td>
                  <td className="p-4 text-center font-retro-display font-black text-success">{teacher.students_count || 0}</td>
                  <td className="p-4 font-retro-mono text-xs text-base-black/50">
                    {teacher.created_at ? new Date(teacher.created_at).toLocaleDateString('id-ID') : '—'}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => setSelectedTeacher(teacher)}>
                        <Eye className="w-3 h-3 mr-1" /> Detail
                      </Button>
                      <button onClick={() => { if (confirm('Hapus guru ini?')) deleteTeacher.mutate(teacher.id); }}
                        className="p-1.5 text-danger border-2 border-danger rounded-retro hover:bg-danger hover:text-base-white">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              )) : (
                <tr><td colSpan="7" className="p-10 text-center">
                  <UserCheck className="w-10 h-10 text-base-black/20 mx-auto mb-2" />
                  <p className="font-retro-mono text-base-black/50">Tidak ada data guru</p>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t-2 border-base-black flex items-center justify-between">
            <p className="font-retro-mono text-xs text-base-black/50">Halaman {page} dari {totalPages}</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>←</Button>
              <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>→</Button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Detail Modal */}
      <Modal isOpen={!!selectedTeacher} onClose={() => setSelectedTeacher(null)} title={`👨‍🏫 ${selectedTeacher?.name}`} maxWidth="md">
        <TeacherDetailModal teacher={selectedTeacher} onClose={() => setSelectedTeacher(null)} />
      </Modal>
    </motion.div>
  );
}
