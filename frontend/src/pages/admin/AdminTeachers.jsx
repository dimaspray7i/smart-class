import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserCheck, Search, Eye, Trash2, RefreshCw,
  BookOpen, Users, TrendingUp, Download, Plus,
  Mail, Phone, School, Calendar, X, Save, UserPlus
} from 'lucide-react';
import { api } from '../../api';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Toast from '../../components/ui/Toast';

const pageVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const cardVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } } };

const EMPTY_FORM = {
  name: '', email: '', password: '', phone: '',
  nip: '', role: 'guru', status: 'active', subjects: []
};

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

function TeacherDetailModal({ teacherId }) {
  const { data: response, isLoading } = useQuery({
    queryKey: ['admin-teacher-detail', teacherId],
    queryFn: () => api.get(`/admin/users/${teacherId}`),
    enabled: !!teacherId
  });

  if (isLoading) return <div className="p-10 text-center"><RefreshCw className="w-6 h-6 animate-spin mx-auto text-retro-orange mb-2" /><p className="font-retro-mono text-sm text-base-black/50">Memuat detail...</p></div>;

  // Normalize response: api returns { status, message, code, data: payload }
  const payload = response?.data ?? response ?? null;
  if (!payload) return null;

  const teacher = payload.teacher ?? payload.user ?? payload;
  const profile = payload.profile ?? (teacher?.profile ?? null);
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full border-4 border-base-black bg-retro-blue/20 flex items-center justify-center font-retro-display font-black text-2xl text-retro-blue">
          {teacher.name?.[0]?.toUpperCase()}
        </div>
        <div>
          <p className="font-retro-display font-black text-xl">{teacher.name}</p>
          <p className="font-retro-mono text-sm text-base-black/60">{teacher.email}</p>
          <span className={`px-2 py-0.5 text-[10px] font-black uppercase border-2 border-base-black rounded-full ${teacher.status === 'inactive' ? 'bg-danger/10 text-danger border-danger' : 'bg-success/10 text-success border-success'}`}>
            {teacher.status === 'inactive' ? 'Non-aktif' : 'Aktif'}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
          {[
          ['NIP', profile?.nip || teacher.nip || '—', School],
          ['Telepon', teacher.phone || '—', Phone],
          ['Kelas Diampu', payload.class_count ?? teacher.classes_count ?? 0, Users],
          ['Total Siswa', payload.total_students ?? teacher.students_count ?? 0, Users],
          ['Mapel', (payload.subjects ?? teacher.subjects ?? []).map(s => s.name).join(', ') || '—', BookOpen],
          ['Bergabung', teacher.created_at ? new Date(teacher.created_at).toLocaleDateString('id-ID') : '—', Calendar],
        ].map(([k, v, Icon]) => (
          <div key={k} className="p-3 border-2 border-dashed border-base-black rounded-retro">
            <div className="flex items-center gap-1 mb-0.5">
              <Icon className="w-3 h-3 text-base-black/40" />
              <p className="font-retro-mono text-[10px] text-base-black/50 uppercase">{k}</p>
            </div>
            <p className="font-retro-display font-black text-sm">{v}</p>
          </div>
        ))}
      </div>
      {payload.recent_schedules?.length > 0 && (
        <div>
          <p className="font-retro-mono text-xs font-black uppercase mb-2">Jadwal Aktif</p>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {payload.recent_schedules.slice(0, 5).map((s, i) => (
              <div key={i} className="p-2 border-2 border-base-black rounded-retro flex items-center justify-between bg-base-gray/10">
                <span className="font-retro-mono text-xs">{s.subject?.name} — {s.class?.name}</span>
                <span className="font-retro-mono text-[10px] text-base-black/50">{s.day} {s.start_time}–{s.end_time}</span>
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
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(null); // teacher object
  const [form, setForm] = useState(EMPTY_FORM);
  const [page, setPage] = useState(1);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const setField = useCallback((key, val) => setForm(f => ({ ...f, [key]: val })), []);

  const { data: teachers, isLoading, refetch } = useQuery({
    queryKey: ['admin-teachers', page, search],
    queryFn: () => api.get('/admin/users', { params: { role: 'guru', page, search: search || undefined, per_page: 15 } }),
    keepPreviousData: true,
  });

  const { data: subjectsData } = useQuery({
    queryKey: ['admin-subjects-list'],
    queryFn: () => api.get('/admin/subjects', { params: { per_page: 100 } }),
  });
  const subjectList = subjectsData?.data?.data || subjectsData?.data || [];

  // ─── Mutations ─────────────────────────────────────────
  const createTeacher = useMutation({
    mutationFn: (data) => api.post('/admin/users', { ...data, role: 'guru' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-teachers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      setIsCreateOpen(false);
      setForm(EMPTY_FORM);
      showToast('✅ Guru berhasil ditambahkan!');
    },
    onError: (e) => showToast(`❌ ${e.response?.data?.message || 'Gagal tambah guru'}`, 'error'),
  });

  const deleteTeacher = useMutation({
    mutationFn: (id) => api.delete(`/admin/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-teachers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      setIsDeleteOpen(null);
      showToast('✅ Data guru dihapus');
    },
    onError: () => showToast('❌ Gagal menghapus', 'error'),
  });

  const responseData = teachers?.data || teachers || {};
  const list = Array.isArray(responseData.data) ? responseData.data : (Array.isArray(responseData) ? responseData : []);
  const meta = responseData.meta || responseData;
  const totalPages = meta.last_page || 1;

  const stats = useMemo(() => ({
    total: meta.total || list.length,
    active: list.filter(t => t.status !== 'inactive').length,
    avgClasses: list.length > 0
      ? (list.reduce((a, t) => a + (t.classes_count || 0), 0) / list.length).toFixed(1)
      : 0,
  }), [list, meta]);

  const handleSubmitCreate = (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      showToast('❌ Nama, email, dan password wajib diisi', 'error');
      return;
    }
    if (form.subjects.length === 0) {
      showToast('❌ Minimal pilih satu mata pelajaran', 'error');
      return;
    }
    createTeacher.mutate(form);
  };

  return (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" className="space-y-6">
      {/* Toast */}
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
              <UserCheck className="w-8 h-8" />Data Guru
            </h1>
            <p className="font-retro-mono text-sm text-base-black/70 mt-1">Kelola data, profil, dan performa seluruh guru</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={() => { refetch(); showToast('🔄 Diperbarui', 'info'); }}>
              <RefreshCw className="w-4 h-4 mr-1" />Refresh
            </Button>
            <Button onClick={() => { setForm(EMPTY_FORM); setIsCreateOpen(true); }}>
              <UserPlus className="w-4 h-4 mr-1" />Tambah Guru
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
          <input type="text" placeholder="Cari nama atau email guru..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 py-2 pr-3 border-2 border-base-black rounded-retro font-retro-mono text-sm bg-base-gray/20 focus:outline-none focus:border-retro-orange" />
        </div>
        {search && (
          <button onClick={() => { setSearch(''); setPage(1); }}
            className="p-2 border-2 border-base-black rounded-retro hover:bg-base-gray/20">
            <X className="w-4 h-4" />
          </button>
        )}
      </motion.div>

      {/* Table */}
      <motion.div variants={cardVariants} className="retro-card bg-base-white border-4 border-base-black overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-retro-blue text-base-white border-b-4 border-base-black">
                {['#', 'Nama Guru', 'Email', 'Kelas', 'Siswa', 'Status', 'Bergabung', 'Aksi'].map(h => (
                  <th key={h} className="p-4 font-retro-display tracking-widest text-sm">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="8" className="p-10 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                      <RefreshCw className="w-5 h-5 text-retro-orange" />
                    </motion.div>
                    <span className="font-retro-mono text-base-black/50">Memuat data guru...</span>
                  </div>
                </td></tr>
              ) : list.length > 0 ? list.map((teacher, i) => (
                <motion.tr key={teacher.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className="border-b-2 border-dashed border-base-black hover:bg-retro-yellow/10 transition-colors">
                  <td className="p-4 font-retro-mono text-sm text-base-black/50">{(page - 1) * 15 + i + 1}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full border-2 border-base-black bg-retro-blue/20 flex items-center justify-center font-retro-display font-black text-sm text-retro-blue flex-shrink-0">
                        {teacher.name?.[0]?.toUpperCase()}
                      </div>
                      <span className="font-retro-display font-black text-sm">{teacher.name}</span>
                    </div>
                  </td>
                  <td className="p-4 font-retro-mono text-xs text-base-black/60">{teacher.email}</td>
                  <td className="p-4 text-center font-retro-display font-black text-retro-blue">{teacher.classes_count ?? 0}</td>
                  <td className="p-4 text-center font-retro-display font-black text-success">{teacher.students_count ?? 0}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 text-[10px] font-black uppercase rounded-full border-2 ${teacher.status === 'inactive' ? 'text-danger border-danger bg-danger/10' : 'text-success border-success bg-success/10'}`}>
                      {teacher.status === 'inactive' ? 'Non-aktif' : 'Aktif'}
                    </span>
                  </td>
                  <td className="p-4 font-retro-mono text-xs text-base-black/50">
                    {teacher.created_at ? new Date(teacher.created_at).toLocaleDateString('id-ID') : '—'}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => setSelectedTeacher(teacher)}>
                        <Eye className="w-3 h-3 mr-1" />Detail
                      </Button>
                      <button onClick={() => setIsDeleteOpen(teacher)}
                        className="p-1.5 text-danger border-2 border-danger rounded-retro hover:bg-danger hover:text-base-white transition-colors">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              )) : (
                <tr><td colSpan="8" className="p-10 text-center">
                  <UserCheck className="w-10 h-10 text-base-black/20 mx-auto mb-2" />
                  <p className="font-retro-mono text-base-black/50">
                    {search ? `Tidak ada guru dengan kata kunci "${search}"` : 'Belum ada data guru'}
                  </p>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t-2 border-base-black flex items-center justify-between">
            <p className="font-retro-mono text-xs text-base-black/50">
              Halaman {page} dari {totalPages} • Total {meta.total || 0} guru
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>←</Button>
              <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>→</Button>
            </div>
          </div>
        )}
      </motion.div>

      {/* ── Detail Modal ─────────────────────────────────── */}
      <Modal isOpen={!!selectedTeacher} onClose={() => setSelectedTeacher(null)}
        title={`👨‍🏫 Detail Guru`} size="md">
        <TeacherDetailModal teacherId={selectedTeacher?.id} />
      </Modal>

      {/* ── Create Modal ─────────────────────────────────── */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="➕ Tambah Guru Baru" size="lg">
        <form onSubmit={handleSubmitCreate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block font-retro-mono text-xs font-black uppercase tracking-wider mb-1">Nama Lengkap *</label>
              <input type="text" value={form.name} onChange={e => setField('name', e.target.value)} required
                placeholder="Contoh: Budi Santoso, S.Pd"
                className="w-full py-2 px-3 border-2 border-base-black rounded-retro font-retro-mono text-sm focus:outline-none focus:border-retro-orange" />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-retro-mono text-xs font-black uppercase tracking-wider mb-1">Mata Pelajaran yang Diampu *</label>
              <div className="flex flex-wrap gap-2 p-2 border-2 border-base-black rounded-retro bg-base-gray/10 max-h-40 overflow-y-auto">
                {subjectList.length === 0 ? (
                  <span className="text-xs text-base-black/50 p-2">Memuat atau belum ada mata pelajaran...</span>
                ) : (
                  subjectList.map(sub => (
                    <label key={sub.id} className="flex items-center gap-2 p-2 border-2 border-dashed border-base-black rounded-retro cursor-pointer hover:bg-retro-yellow/20 transition-colors">
                      <input 
                        type="checkbox" 
                        className="retro-checkbox w-4 h-4 accent-retro-orange"
                        checked={form.subjects.includes(sub.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setField('subjects', [...form.subjects, sub.id]);
                          } else {
                            setField('subjects', form.subjects.filter(id => id !== sub.id));
                          }
                        }}
                      />
                      <span className="font-retro-mono text-xs">{sub.name}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
            <div>
              <label className="block font-retro-mono text-xs font-black uppercase tracking-wider mb-1">Email *</label>
              <input type="email" value={form.email} onChange={e => setField('email', e.target.value)} required
                placeholder="guru@sekolah.id"
                className="w-full py-2 px-3 border-2 border-base-black rounded-retro font-retro-mono text-sm focus:outline-none focus:border-retro-orange" />
            </div>
            <div>
              <label className="block font-retro-mono text-xs font-black uppercase tracking-wider mb-1">Password *</label>
              <input type="password" value={form.password} onChange={e => setField('password', e.target.value)} required
                placeholder="Min. 8 karakter"
                className="w-full py-2 px-3 border-2 border-base-black rounded-retro font-retro-mono text-sm focus:outline-none focus:border-retro-orange" />
            </div>
            <div>
              <label className="block font-retro-mono text-xs font-black uppercase tracking-wider mb-1">NIP</label>
              <input type="text" value={form.nip} onChange={e => setField('nip', e.target.value)}
                placeholder="Nomor Induk Pegawai"
                className="w-full py-2 px-3 border-2 border-base-black rounded-retro font-retro-mono text-sm focus:outline-none focus:border-retro-orange" />
            </div>
            <div>
              <label className="block font-retro-mono text-xs font-black uppercase tracking-wider mb-1">No. Telepon</label>
              <input type="tel" value={form.phone} onChange={e => setField('phone', e.target.value)}
                placeholder="08xxxxxxxxxx"
                className="w-full py-2 px-3 border-2 border-base-black rounded-retro font-retro-mono text-sm focus:outline-none focus:border-retro-orange" />
            </div>
            <div>
              <label className="block font-retro-mono text-xs font-black uppercase tracking-wider mb-1">Status</label>
              <select value={form.status} onChange={e => setField('status', e.target.value)}
                className="w-full py-2 px-3 border-2 border-base-black rounded-retro font-retro-mono text-sm bg-base-white focus:outline-none focus:border-retro-orange">
                <option value="active">Aktif</option>
                <option value="inactive">Non-aktif</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t-2 border-dashed border-base-black">
            <Button variant="outline" type="button" onClick={() => setIsCreateOpen(false)}>Batal</Button>
            <Button type="submit" disabled={createTeacher.isPending}>
              <Save className="w-4 h-4 mr-1" />
              {createTeacher.isPending ? 'Menyimpan...' : 'Simpan Guru'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Delete Confirm Modal ──────────────────────────── */}
      <Modal isOpen={!!isDeleteOpen} onClose={() => setIsDeleteOpen(null)} title="🗑️ Hapus Data Guru" size="sm">
        <div className="space-y-4">
          <div className="p-4 bg-danger/10 border-2 border-danger rounded-retro">
            <p className="font-retro-mono text-sm text-base-black">
              Yakin ingin menghapus data guru <strong>{isDeleteOpen?.name}</strong>?
              Tindakan ini tidak dapat dibatalkan.
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsDeleteOpen(null)}>Batal</Button>
            <Button variant="danger" onClick={() => deleteTeacher.mutate(isDeleteOpen?.id)}
              disabled={deleteTeacher.isPending}>
              <Trash2 className="w-4 h-4 mr-1" />
              {deleteTeacher.isPending ? 'Menghapus...' : 'Ya, Hapus'}
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
