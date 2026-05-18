import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3, Plus, Search, Edit2, Trash2, Save, X,
  Users, BookOpen, TrendingUp, Award, Download
} from 'lucide-react';
import { api } from '../../api';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Toast from '../../components/ui/Toast';

const pageVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const cardVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } } };

const GRADE_TYPES = ['harian', 'tugas', 'ulangan', 'uts', 'uas'];

function GradeRow({ student, grades, onEdit }) {
  const avg = grades.length > 0 ? (grades.reduce((s, g) => s + (g.value || 0), 0) / grades.length).toFixed(1) : '—';
  const color = avg >= 80 ? '#00B894' : avg >= 65 ? '#E67E22' : '#E74C3C';

  return (
    <tr className="border-b-2 border-base-black border-dashed hover:bg-retro-yellow/10 transition-colors">
      <td className="p-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full border-2 border-base-black bg-retro-purple/20 flex items-center justify-center font-retro-display font-black text-xs text-retro-blue">
            {student.name?.[0]?.toUpperCase()}
          </div>
          <span className="font-retro-display font-black text-sm">{student.name}</span>
        </div>
      </td>
      {GRADE_TYPES.map(type => {
        const g = grades.find(gr => gr.type === type);
        return (
          <td key={type} className="p-3 text-center">
            <span className={`font-retro-display font-black text-sm ${g?.value >= 80 ? 'text-success' : g?.value >= 65 ? 'text-warning' : g?.value ? 'text-danger' : 'text-base-black/30'}`}>
              {g?.value ?? '—'}
            </span>
          </td>
        );
      })}
      <td className="p-3 text-center">
        <span className="font-retro-display font-black text-lg" style={{ color }}>{avg}</span>
      </td>
      <td className="p-3 text-center">
        <Button size="sm" variant="outline" onClick={() => onEdit(student)}>
          <Edit2 className="w-3 h-3 mr-1" /> Input
        </Button>
      </td>
    </tr>
  );
}

export default function TeacherGrades() {
  const queryClient = useQueryClient();
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [editStudent, setEditStudent] = useState(null);
  const [gradeForm, setGradeForm] = useState({ type: 'harian', value: '', notes: '' });

  const showToast = useCallback((msg, type = 'success') => { setToast({ message: msg, type }); setTimeout(() => setToast(null), 3500); }, []);

  const { data: students, isLoading } = useQuery({
    queryKey: ['teacher-students'],
    queryFn: () => api.get('/teacher/students'),
  });
  const { data: classes } = useQuery({ queryKey: ['teacher-classes'], queryFn: () => api.get('/teacher/classes') });

  const saveGrade = useMutation({
    mutationFn: (data) => api.post('/teacher/grades', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['teacher-students'] }); setEditStudent(null); showToast('✅ Nilai berhasil disimpan!'); },
    onError: () => showToast('❌ Gagal menyimpan nilai', 'error'),
  });

  const filtered = useMemo(() => {
    let list = students?.data || [];
    if (classFilter !== 'all') list = list.filter(s => String(s.class_id) === classFilter);
    if (search) list = list.filter(s => s.name?.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [students, search, classFilter]);

  return (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" className="space-y-6">
      <AnimatePresence>
        {toast && <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed top-24 right-6 z-50"><Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} /></motion.div>}
      </AnimatePresence>

      <motion.div variants={cardVariants} className="retro-card bg-base-white border-4 border-base-black p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="retro-heading retro-heading-xl text-retro-blue flex items-center gap-3"><BarChart3 className="w-8 h-8" /> Nilai & Penilaian</h1>
            <p className="font-retro-mono text-sm text-base-black/70 mt-1">Input dan kelola nilai harian, tugas, ulangan, dan ujian siswa</p>
          </div>
          <Button variant="outline" onClick={() => showToast('📥 Export dimulai...', 'info')}><Download className="w-4 h-4 mr-1" /> Export</Button>
        </div>
      </motion.div>

      <motion.div variants={cardVariants} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[['Total Siswa', filtered.length, '#6C5CE7', Users], ['Kelas', (classes?.data||[]).length, '#2E2BBF', BookOpen], ['Rata Nilai', '—', '#00B894', TrendingUp], ['Ranking', '—', '#E67E22', Award]].map(([l, v, c, Icon]) => (
          <div key={l} className="retro-card bg-base-white border-2 border-base-black p-3 flex items-center gap-3">
            <div className="p-2 rounded-retro border-2 border-base-black" style={{ background: `${c}20` }}><Icon className="w-4 h-4" style={{ color: c }} /></div>
            <div><p className="retro-heading text-xl" style={{ color: c }}>{v}</p><p className="font-retro-mono text-[10px] text-base-black/60 uppercase">{l}</p></div>
          </div>
        ))}
      </motion.div>

      <motion.div variants={cardVariants} className="retro-card bg-base-white border-4 border-base-black p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-40">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-black/40" />
          <input type="text" placeholder="Cari nama siswa..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 py-2 pr-3 border-2 border-base-black rounded-retro font-retro-mono text-sm bg-base-gray/20 focus:outline-none focus:border-retro-orange" />
        </div>
        <select value={classFilter} onChange={e => setClassFilter(e.target.value)}
          className="py-2 px-3 border-2 border-base-black rounded-retro font-retro-mono text-sm bg-base-white focus:outline-none focus:border-retro-orange">
          <option value="all">Semua Kelas</option>
          {(classes?.data || []).map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
        </select>
      </motion.div>

      <motion.div variants={cardVariants} className="retro-card bg-base-white border-4 border-base-black overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-retro-blue text-base-white border-b-4 border-base-black">
                <th className="p-3 font-retro-display tracking-widest text-sm">Nama Siswa</th>
                {GRADE_TYPES.map(t => <th key={t} className="p-3 font-retro-display tracking-widest text-sm capitalize text-center">{t}</th>)}
                <th className="p-3 font-retro-display tracking-widest text-sm text-center">Rata-rata</th>
                <th className="p-3 font-retro-display tracking-widest text-sm text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="8" className="p-10 text-center font-retro-mono text-base-black/50">Memuat data nilai...</td></tr>
              ) : filtered.length > 0 ? filtered.map(s => (
                <GradeRow key={s.id} student={s} grades={s.grades || []} onEdit={setEditStudent} />
              )) : (
                <tr><td colSpan="8" className="p-10 text-center font-retro-mono text-base-black/50">Tidak ada data siswa</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      <Modal isOpen={!!editStudent} onClose={() => setEditStudent(null)} title={`✏️ Input Nilai — ${editStudent?.name}`} maxWidth="md">
        <form onSubmit={e => { e.preventDefault(); saveGrade.mutate({ student_id: editStudent?.id, ...gradeForm }); }} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-retro-mono text-xs font-black uppercase tracking-wider mb-1">Jenis Penilaian</label>
              <select value={gradeForm.type} onChange={e => setGradeForm(f => ({ ...f, type: e.target.value }))}
                className="w-full py-2 px-3 border-2 border-base-black rounded-retro font-retro-mono text-sm bg-base-white focus:outline-none focus:border-retro-orange">
                {GRADE_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-retro-mono text-xs font-black uppercase tracking-wider mb-1">Nilai (0–100)</label>
              <input type="number" min="0" max="100" value={gradeForm.value} onChange={e => setGradeForm(f => ({ ...f, value: e.target.value }))} required
                className="w-full py-2 px-3 border-2 border-base-black rounded-retro font-retro-mono text-sm bg-base-white focus:outline-none focus:border-retro-orange" />
            </div>
            <div className="col-span-2">
              <label className="block font-retro-mono text-xs font-black uppercase tracking-wider mb-1">Catatan</label>
              <input type="text" placeholder="Opsional" value={gradeForm.notes} onChange={e => setGradeForm(f => ({ ...f, notes: e.target.value }))}
                className="w-full py-2 px-3 border-2 border-base-black rounded-retro font-retro-mono text-sm bg-base-white focus:outline-none focus:border-retro-orange" />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={() => setEditStudent(null)}>Batal</Button>
            <Button type="submit" disabled={saveGrade.isPending}><Save className="w-4 h-4 mr-1" />{saveGrade.isPending ? 'Menyimpan...' : 'Simpan Nilai'}</Button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}
