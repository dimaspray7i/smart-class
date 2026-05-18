import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap, Search, Eye, Trash2, RefreshCw,
  TrendingUp, Users, Award, Plus, X, Save, UserPlus
} from 'lucide-react';
import { api } from '../../api';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Toast from '../../components/ui/Toast';

const pageVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const cardVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } } };

const EMPTY_FORM = { name: '', email: '', password: '', phone: '', nis: '', class_id: '', status: 'active' };
const attendanceColor = (r) => r >= 80 ? '#00B894' : r >= 65 ? '#E67E22' : '#E74C3C';

export default function AdminStudents() {
  const queryClient = useQueryClient();
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [page, setPage] = useState(1);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const setField = useCallback((k, v) => setForm(f => ({ ...f, [k]: v })), []);

  const { data: students, isLoading, refetch } = useQuery({
    queryKey: ['admin-students', page, search, classFilter],
    queryFn: () => api.get('/admin/users', {
      params: { role: 'siswa', page, search: search || undefined, class_id: classFilter !== 'all' ? classFilter : undefined, per_page: 15 }
    }),
    keepPreviousData: true,
  });
  const { data: classes } = useQuery({ queryKey: ['admin-classes-list'], queryFn: () => api.get('/admin/classes') });

  const createStudent = useMutation({
    mutationFn: (data) => api.post('/admin/users', { ...data, role: 'siswa' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-students'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
      setIsCreateOpen(false); setForm(EMPTY_FORM);
      showToast('✅ Siswa berhasil ditambahkan!');
    },
    onError: (e) => showToast(`❌ ${e.response?.data?.message || 'Gagal tambah siswa'}`, 'error'),
  });

  const deleteStudent = useMutation({
    mutationFn: (id) => api.delete(`/admin/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-students'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
      setIsDeleteOpen(null);
      showToast('✅ Data siswa dihapus');
    },
    onError: () => showToast('❌ Gagal menghapus', 'error'),
  });

  const list = students?.data?.data || students?.data || [];
  const meta = students?.data?.meta || {};
  const totalPages = meta.last_page || 1;
  const classList = classes?.data || [];

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
              <GraduationCap className="w-8 h-8" /> Data Siswa
            </h1>
            <p className="font-retro-mono text-sm text-base-black/70 mt-1">Kelola data siswa, pantau kehadiran dan perkembangan akademik</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={() => { refetch(); showToast('🔄 Diperbarui', 'info'); }}>
              <RefreshCw className="w-4 h-4 mr-1" />Refresh
            </Button>
            <Button onClick={() => { setForm(EMPTY_FORM); setIsCreateOpen(true); }}>
              <UserPlus className="w-4 h-4 mr-1" />Tambah Siswa
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          ['Total Siswa', meta.total || list.length, '#6C5CE7', GraduationCap],
          ['Siswa Aktif', list.filter(s => s.status !== 'inactive').length, '#00B894', TrendingUp],
          ['Rata Kehadiran', list.length > 0 ? Math.round(list.reduce((a, s) => a + (s.attendance_rate || 0), 0) / list.length) + '%' : '—', '#E67E22', Award],
          ['Jumlah Kelas', classList.length, '#2E2BBF', Users],
        ].map(([label, value, color, Icon]) => (
          <div key={label} className="retro-card bg-base-white border-2 border-base-black p-3 flex items-center gap-3">
            <div className="p-2 rounded-retro border-2 border-base-black" style={{ background: `${color}20` }}>
              <Icon className="w-4 h-4" style={{ color }} />
            </div>
            <div>
              <p className="retro-heading text-xl" style={{ color }}>{value}</p>
              <p className="font-retro-mono text-[10px] text-base-black/60 uppercase">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <motion.div variants={cardVariants} className="retro-card bg-base-white border-4 border-base-black p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-black/40" />
          <input type="text" placeholder="Cari nama atau NIS..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 py-2 pr-3 border-2 border-base-black rounded-retro font-retro-mono text-sm bg-base-gray/20 focus:outline-none focus:border-retro-orange" />
        </div>
        <select value={classFilter} onChange={e => { setClassFilter(e.target.value); setPage(1); }}
          className="py-2 px-3 border-2 border-base-black rounded-retro font-retro-mono text-sm bg-base-white focus:outline-none focus:border-retro-orange">
          <option value="all">Semua Kelas</option>
          {classList.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
        </select>
        {(search || classFilter !== 'all') && (
          <button onClick={() => { setSearch(''); setClassFilter('all'); setPage(1); }}
            className="p-2 border-2 border-base-black rounded-retro hover:bg-base-gray/20">
            <X className="w-4 h-4" />
          </button>
        )}
      </motion.div>

      {/* Table */}
      <motion.div variants={cardVariants} className="retro-card bg-base-white border-4 border-base-black overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[750px]">
            <thead>
              <tr className="bg-retro-blue text-base-white border-b-4 border-base-black">
                {['#', 'Nama', 'NIS', 'Kelas', 'Kehadiran', 'Status', 'Aksi'].map(h => (
                  <th key={h} className="p-4 font-retro-display tracking-widest text-sm">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="7" className="p-10 text-center font-retro-mono text-base-black/50">Memuat data siswa...</td></tr>
              ) : list.length > 0 ? list.map((student, i) => (
                <motion.tr key={student.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  className="border-b-2 border-dashed border-base-black hover:bg-retro-yellow/10 transition-colors">
                  <td className="p-4 font-retro-mono text-sm text-base-black/50">{(page - 1) * 15 + i + 1}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full border-2 border-base-black bg-retro-purple/20 flex items-center justify-center font-retro-display font-black text-sm text-retro-blue">
                        {student.name?.[0]?.toUpperCase()}
                      </div>
                      <span className="font-retro-display font-black text-sm">{student.name}</span>
                    </div>
                  </td>
                  <td className="p-4 font-retro-mono text-xs text-base-black/60">{student.profile?.nis || student.nis || '—'}</td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 bg-retro-lime/20 border-2 border-retro-lime rounded-full text-xs font-black">
                      {student.class?.name || student.classes?.[0]?.name || '—'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-base-gray border border-base-black rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${student.attendance_rate || 0}%`, background: attendanceColor(student.attendance_rate || 0) }} />
                      </div>
                      <span className="font-retro-mono text-xs" style={{ color: attendanceColor(student.attendance_rate || 0) }}>
                        {student.attendance_rate || 0}%
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 text-[10px] font-black uppercase border-2 rounded-full ${student.status === 'inactive' ? 'border-danger bg-danger/10 text-danger' : 'border-success bg-success/10 text-success'}`}>
                      {student.status === 'inactive' ? 'Non-aktif' : 'Aktif'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => setSelected(student)}>
                        <Eye className="w-3 h-3 mr-1" />Detail
                      </Button>
                      <button onClick={() => setIsDeleteOpen(student)}
                        className="p-1.5 text-danger border-2 border-danger rounded-retro hover:bg-danger hover:text-base-white transition-colors">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              )) : (
                <tr><td colSpan="7" className="p-10 text-center">
                  <GraduationCap className="w-10 h-10 text-base-black/20 mx-auto mb-2" />
                  <p className="font-retro-mono text-base-black/50">
                    {search ? `Tidak ada siswa dengan kata kunci "${search}"` : 'Belum ada data siswa'}
                  </p>
                  <button onClick={() => { setForm(EMPTY_FORM); setIsCreateOpen(true); }}
                    className="mt-3 font-retro-mono text-xs text-retro-orange hover:underline">
                    + Tambah siswa baru
                  </button>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="p-4 border-t-2 border-base-black flex items-center justify-between">
            <p className="font-retro-mono text-xs text-base-black/50">Halaman {page} dari {totalPages} • Total {meta.total || 0} siswa</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>←</Button>
              <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>→</Button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Detail Modal */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={`👤 ${selected?.name}`} size="md">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full border-4 border-base-black bg-retro-purple/20 flex items-center justify-center font-retro-display font-black text-2xl text-retro-blue">
                {selected.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="font-retro-display font-black text-xl">{selected.name}</p>
                <p className="font-retro-mono text-sm text-base-black/60">{selected.email}</p>
                <span className={`px-2 py-0.5 text-[10px] font-black uppercase border-2 rounded-full ${selected.status === 'inactive' ? 'border-danger bg-danger/10 text-danger' : 'border-success bg-success/10 text-success'}`}>
                  {selected.status === 'inactive' ? 'Non-aktif' : 'Aktif'}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                ['NIS', selected.profile?.nis || selected.nis || '—'],
                ['Kelas', selected.class?.name || selected.classes?.[0]?.name || '—'],
                ['Telepon', selected.phone || '—'],
                ['Kehadiran', `${selected.attendance_rate || 0}%`],
                ['Bergabung', selected.created_at ? new Date(selected.created_at).toLocaleDateString('id-ID') : '—'],
                ['Status', selected.status === 'inactive' ? 'Non-aktif' : 'Aktif'],
              ].map(([k, v]) => (
                <div key={k} className="p-3 border-2 border-dashed border-base-black rounded-retro">
                  <p className="font-retro-mono text-[10px] text-base-black/50 uppercase">{k}</p>
                  <p className="font-retro-display font-black mt-0.5 text-sm">{v}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* Create Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="➕ Tambah Siswa Baru" size="lg">
        <form onSubmit={e => { e.preventDefault(); createStudent.mutate(form); }} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block font-retro-mono text-xs font-black uppercase tracking-wider mb-1">Nama Lengkap *</label>
              <input type="text" value={form.name} onChange={e => setField('name', e.target.value)} required
                placeholder="Contoh: Ahmad Fauzi"
                className="w-full py-2 px-3 border-2 border-base-black rounded-retro font-retro-mono text-sm focus:outline-none focus:border-retro-orange" />
            </div>
            <div>
              <label className="block font-retro-mono text-xs font-black uppercase tracking-wider mb-1">Email *</label>
              <input type="email" value={form.email} onChange={e => setField('email', e.target.value)} required
                placeholder="siswa@sekolah.id"
                className="w-full py-2 px-3 border-2 border-base-black rounded-retro font-retro-mono text-sm focus:outline-none focus:border-retro-orange" />
            </div>
            <div>
              <label className="block font-retro-mono text-xs font-black uppercase tracking-wider mb-1">Password *</label>
              <input type="password" value={form.password} onChange={e => setField('password', e.target.value)} required
                placeholder="Min. 8 karakter"
                className="w-full py-2 px-3 border-2 border-base-black rounded-retro font-retro-mono text-sm focus:outline-none focus:border-retro-orange" />
            </div>
            <div>
              <label className="block font-retro-mono text-xs font-black uppercase tracking-wider mb-1">NIS</label>
              <input type="text" value={form.nis} onChange={e => setField('nis', e.target.value)}
                placeholder="Nomor Induk Siswa"
                className="w-full py-2 px-3 border-2 border-base-black rounded-retro font-retro-mono text-sm focus:outline-none focus:border-retro-orange" />
            </div>
            <div>
              <label className="block font-retro-mono text-xs font-black uppercase tracking-wider mb-1">Kelas</label>
              <select value={form.class_id} onChange={e => setField('class_id', e.target.value)}
                className="w-full py-2 px-3 border-2 border-base-black rounded-retro font-retro-mono text-sm bg-base-white focus:outline-none focus:border-retro-orange">
                <option value="">-- Pilih Kelas --</option>
                {classList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-retro-mono text-xs font-black uppercase tracking-wider mb-1">No. Telepon</label>
              <input type="tel" value={form.phone} onChange={e => setField('phone', e.target.value)}
                placeholder="08xxxxxxxxxx"
                className="w-full py-2 px-3 border-2 border-base-black rounded-retro font-retro-mono text-sm focus:outline-none focus:border-retro-orange" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t-2 border-dashed border-base-black">
            <Button variant="outline" type="button" onClick={() => setIsCreateOpen(false)}>Batal</Button>
            <Button type="submit" disabled={createStudent.isPending}>
              <Save className="w-4 h-4 mr-1" />
              {createStudent.isPending ? 'Menyimpan...' : 'Simpan Siswa'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <Modal isOpen={!!isDeleteOpen} onClose={() => setIsDeleteOpen(null)} title="🗑️ Hapus Data Siswa" size="sm">
        <div className="space-y-4">
          <div className="p-4 bg-danger/10 border-2 border-danger rounded-retro">
            <p className="font-retro-mono text-sm">Yakin hapus siswa <strong>{isDeleteOpen?.name}</strong>? Tindakan ini tidak dapat dibatalkan.</p>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsDeleteOpen(null)}>Batal</Button>
            <Button variant="danger" onClick={() => deleteStudent.mutate(isDeleteOpen?.id)} disabled={deleteStudent.isPending}>
              <Trash2 className="w-4 h-4 mr-1" />
              {deleteStudent.isPending ? 'Menghapus...' : 'Ya, Hapus'}
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
