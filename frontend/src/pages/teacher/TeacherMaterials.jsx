import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Plus, Upload, Download, Trash2, Eye, FileText, Video, Link as LinkIcon, Clock, Users } from 'lucide-react';
import { api } from '../../api';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Toast from '../../components/ui/Toast';

const pageVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const cardVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } } };

const MATERIAL_TYPES = [
  { value: 'document', label: 'Dokumen', icon: FileText, color: '#2E2BBF' },
  { value: 'video', label: 'Video', icon: Video, color: '#E74C3C' },
  { value: 'link', label: 'Tautan', icon: LinkIcon, color: '#00B894' },
  { value: 'assignment', label: 'Tugas', icon: Clock, color: '#E67E22' },
];

function MaterialCard({ item, onDelete }) {
  const cfg = MATERIAL_TYPES.find(t => t.value === item.type) || MATERIAL_TYPES[0];
  const Icon = cfg.icon;

  return (
    <motion.div variants={cardVariants} className="retro-card bg-base-white border-2 border-base-black p-4 hover:border-retro-orange transition-colors group">
      <div className="flex items-start gap-3">
        <div className="p-2.5 rounded-retro border-2 border-base-black flex-shrink-0" style={{ background: `${cfg.color}20` }}>
          <Icon className="w-5 h-5" style={{ color: cfg.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-retro-display font-black text-base-black truncate">{item.title}</p>
              <p className="font-retro-mono text-[10px] text-base-black/50 mt-0.5">{item.subject?.name} • {item.class?.name}</p>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase border-2 border-base-black flex-shrink-0" style={{ background: `${cfg.color}20`, color: cfg.color }}>
              {cfg.label}
            </span>
          </div>
          {item.description && <p className="font-retro-mono text-xs text-base-black/60 mt-2 line-clamp-2">{item.description}</p>}
          {item.type === 'assignment' && item.deadline && (
            <p className="font-retro-mono text-[10px] text-danger mt-2 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Deadline: {new Date(item.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          )}
        </div>
      </div>
      <div className="flex gap-2 mt-3 pt-3 border-t-2 border-dashed border-base-black">
        {item.file_url && <Button size="sm" variant="outline"><Download className="w-3 h-3 mr-1" /> Unduh</Button>}
        {item.url && <a href={item.url} target="_blank" rel="noopener noreferrer"><Button size="sm" variant="outline"><Eye className="w-3 h-3 mr-1" /> Buka</Button></a>}
        <button onClick={() => onDelete(item.id)} className="ml-auto p-1.5 text-danger border-2 border-danger rounded-retro hover:bg-danger hover:text-base-white transition-colors">
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </motion.div>
  );
}

export default function TeacherMaterials() {
  const queryClient = useQueryClient();
  const [toast, setToast] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activeType, setActiveType] = useState('all');
  const [form, setForm] = useState({ title: '', description: '', type: 'document', class_id: '', subject_id: '', url: '', deadline: '' });

  const showToast = useCallback((msg, type = 'success') => { setToast({ message: msg, type }); setTimeout(() => setToast(null), 3500); }, []);

  const { data: materials, isLoading } = useQuery({
    queryKey: ['teacher-materials', activeType],
    queryFn: () => api.get('/teacher/materials', { params: activeType !== 'all' ? { type: activeType } : {} }),
  });
  const { data: classes } = useQuery({ queryKey: ['teacher-classes'], queryFn: () => api.get('/teacher/classes') });
  const { data: subjects } = useQuery({ queryKey: ['teacher-subjects'], queryFn: () => api.get('/teacher/subjects') });

  const createMaterial = useMutation({
    mutationFn: (data) => api.post('/teacher/materials', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['teacher-materials'] }); setIsCreateOpen(false); showToast('✅ Materi berhasil ditambahkan!'); },
    onError: () => showToast('❌ Gagal menambahkan materi', 'error'),
  });
  const deleteMaterial = useMutation({
    mutationFn: (id) => api.delete(`/teacher/materials/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['teacher-materials'] }); showToast('✅ Materi dihapus'); },
    onError: () => showToast('❌ Gagal menghapus', 'error'),
  });

  const materialList = materials?.data || [];

  return (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" className="space-y-6">
      <AnimatePresence>
        {toast && <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed top-24 right-6 z-50"><Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} /></motion.div>}
      </AnimatePresence>

      <motion.div variants={cardVariants} className="retro-card bg-base-white border-4 border-base-black p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="retro-heading retro-heading-xl text-retro-blue flex items-center gap-3"><BookOpen className="w-8 h-8" /> Tugas & Materi</h1>
            <p className="font-retro-mono text-sm text-base-black/70 mt-1">Kelola materi pembelajaran, tugas, dan assignment siswa</p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)}><Plus className="w-4 h-4 mr-1" /> Tambah Materi</Button>
        </div>
      </motion.div>

      <motion.div variants={cardVariants} className="retro-card bg-base-white border-4 border-base-black p-2 flex gap-1 overflow-x-auto">
        {[{ value: 'all', label: '📋 Semua' }, ...MATERIAL_TYPES.map(t => ({ value: t.value, label: t.label }))].map(tab => (
          <button key={tab.value} onClick={() => setActiveType(tab.value)}
            className={`px-4 py-2 rounded-retro font-retro-mono text-xs font-black uppercase tracking-wide border-2 border-base-black whitespace-nowrap transition-all ${activeType === tab.value ? 'bg-retro-blue text-base-white shadow-[2px_2px_0px_0px_#111]' : 'bg-base-white hover:bg-retro-yellow/20'}`}>
            {tab.label}
          </button>
        ))}
      </motion.div>

      {isLoading ? (
        <div className="retro-card bg-base-white border-4 border-base-black p-10 text-center font-retro-mono text-base-black/50">Memuat materi...</div>
      ) : materialList.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {materialList.map(item => <MaterialCard key={item.id} item={item} onDelete={id => deleteMaterial.mutate(id)} />)}
        </div>
      ) : (
        <div className="retro-card bg-base-white border-4 border-dashed border-base-black p-12 text-center">
          <BookOpen className="w-14 h-14 text-base-black/20 mx-auto mb-3" />
          <p className="font-retro-mono text-base-black/50 mb-5">Belum ada materi ditambahkan</p>
          <Button onClick={() => setIsCreateOpen(true)}><Plus className="w-4 h-4 mr-1" /> Tambah Materi</Button>
        </div>
      )}

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="📚 Tambah Materi / Tugas" maxWidth="lg">
        <form onSubmit={e => { e.preventDefault(); createMaterial.mutate(form); }} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block font-retro-mono text-xs font-black uppercase tracking-wider mb-1">Judul *</label>
              <input type="text" required placeholder="Judul materi atau tugas" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="w-full py-2 px-3 border-2 border-base-black rounded-retro font-retro-mono text-sm bg-base-white focus:outline-none focus:border-retro-orange" />
            </div>
            <div>
              <label className="block font-retro-mono text-xs font-black uppercase tracking-wider mb-1">Jenis</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                className="w-full py-2 px-3 border-2 border-base-black rounded-retro font-retro-mono text-sm bg-base-white focus:outline-none focus:border-retro-orange">
                {MATERIAL_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-retro-mono text-xs font-black uppercase tracking-wider mb-1">Kelas</label>
              <select value={form.class_id} onChange={e => setForm(f => ({ ...f, class_id: e.target.value }))}
                className="w-full py-2 px-3 border-2 border-base-black rounded-retro font-retro-mono text-sm bg-base-white focus:outline-none focus:border-retro-orange">
                <option value="">Semua Kelas</option>
                {(classes?.data || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            {(form.type === 'link' || form.type === 'video') && (
              <div className="sm:col-span-2">
                <label className="block font-retro-mono text-xs font-black uppercase tracking-wider mb-1">URL / Tautan</label>
                <input type="url" placeholder="https://..." value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                  className="w-full py-2 px-3 border-2 border-base-black rounded-retro font-retro-mono text-sm bg-base-white focus:outline-none focus:border-retro-orange" />
              </div>
            )}
            {form.type === 'assignment' && (
              <div>
                <label className="block font-retro-mono text-xs font-black uppercase tracking-wider mb-1">Deadline</label>
                <input type="datetime-local" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                  className="w-full py-2 px-3 border-2 border-base-black rounded-retro font-retro-mono text-sm bg-base-white focus:outline-none focus:border-retro-orange" />
              </div>
            )}
            <div className="sm:col-span-2">
              <label className="block font-retro-mono text-xs font-black uppercase tracking-wider mb-1">Deskripsi</label>
              <textarea rows={3} placeholder="Keterangan materi atau instruksi tugas..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full py-2 px-3 border-2 border-base-black rounded-retro font-retro-mono text-sm bg-base-white focus:outline-none focus:border-retro-orange resize-none" />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={() => setIsCreateOpen(false)}>Batal</Button>
            <Button type="submit" disabled={createMaterial.isLoading}><Upload className="w-4 h-4 mr-1" />{createMaterial.isLoading ? 'Menyimpan...' : 'Simpan'}</Button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}
