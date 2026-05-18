import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Megaphone, Plus, Edit2, Trash2, Pin, Users, Clock } from 'lucide-react';
import { api } from '../../api';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Toast from '../../components/ui/Toast';

const pageVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const cardVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } } };

function AnnouncementCard({ item, onEdit, onDelete, onPin }) {
  return (
    <motion.div variants={cardVariants}
      className={`retro-card border-2 border-base-black p-5 hover:border-retro-orange transition-colors relative ${item.is_pinned ? 'bg-retro-yellow/10 border-retro-yellow shadow-[3px_3px_0px_0px_#FFC928]' : 'bg-base-white'}`}>
      {item.is_pinned && (
        <div className="absolute -top-2 -right-2 bg-retro-yellow border-2 border-base-black rounded-full p-1">
          <Pin className="w-3 h-3 text-base-black" />
        </div>
      )}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="font-retro-display font-black text-base-black text-lg leading-tight">{item.title}</h3>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            {item.target_class && (
              <span className="flex items-center gap-1 font-retro-mono text-[10px] text-base-black/50"><Users className="w-3 h-3" /> {item.target_class}</span>
            )}
            <span className="flex items-center gap-1 font-retro-mono text-[10px] text-base-black/50">
              <Clock className="w-3 h-3" /> {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>
        {item.priority === 'high' && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase border-2 border-danger bg-danger/10 text-danger flex-shrink-0">Penting</span>
        )}
      </div>
      <p className="font-retro-mono text-sm text-base-black/70 line-clamp-3">{item.content}</p>
      <div className="flex gap-2 mt-4 pt-3 border-t-2 border-dashed border-base-black">
        <button onClick={() => onPin(item.id)} className={`p-1.5 border-2 rounded-retro transition-colors ${item.is_pinned ? 'border-retro-yellow bg-retro-yellow text-base-black' : 'border-base-black hover:bg-base-gray/20'}`} title="Pin">
          <Pin className="w-3 h-3" />
        </button>
        <Button size="sm" variant="outline" onClick={() => onEdit(item)}><Edit2 className="w-3 h-3 mr-1" /> Edit</Button>
        <button onClick={() => onDelete(item.id)} className="ml-auto p-1.5 text-danger border-2 border-danger rounded-retro hover:bg-danger hover:text-base-white transition-colors">
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </motion.div>
  );
}

export default function TeacherAnnouncements() {
  const queryClient = useQueryClient();
  const [toast, setToast] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', content: '', target_class: '', priority: 'normal', is_pinned: false });

  const showToast = useCallback((msg, type = 'success') => { setToast({ message: msg, type }); setTimeout(() => setToast(null), 3500); }, []);

  const { data: announcements, isLoading } = useQuery({
    queryKey: ['teacher-announcements'],
    queryFn: () => api.get('/teacher/announcements'),
  });
  const { data: classes } = useQuery({ queryKey: ['teacher-classes'], queryFn: () => api.get('/teacher/classes') });

  const save = useMutation({
    mutationFn: (data) => editing ? api.put(`/teacher/announcements/${editing.id}`, data) : api.post('/teacher/announcements', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['teacher-announcements'] }); setIsOpen(false); setEditing(null); showToast('✅ Pengumuman disimpan!'); },
    onError: () => showToast('❌ Gagal menyimpan', 'error'),
  });
  const remove = useMutation({
    mutationFn: (id) => api.delete(`/teacher/announcements/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['teacher-announcements'] }); showToast('✅ Pengumuman dihapus'); },
    onError: () => showToast('❌ Gagal menghapus', 'error'),
  });
  const pin = useMutation({
    mutationFn: (id) => api.patch(`/teacher/announcements/${id}/pin`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teacher-announcements'] }),
  });

  const openEdit = (item) => {
    setEditing(item);
    setForm({ title: item.title, content: item.content, target_class: item.target_class || '', priority: item.priority || 'normal', is_pinned: item.is_pinned || false });
    setIsOpen(true);
  };
  const openCreate = () => {
    setEditing(null);
    setForm({ title: '', content: '', target_class: '', priority: 'normal', is_pinned: false });
    setIsOpen(true);
  };

  const list = announcements?.data || [];
  const pinned = list.filter(a => a.is_pinned);
  const regular = list.filter(a => !a.is_pinned);

  return (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" className="space-y-6">
      <AnimatePresence>
        {toast && <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed top-24 right-6 z-50"><Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} /></motion.div>}
      </AnimatePresence>

      <motion.div variants={cardVariants} className="retro-card bg-base-white border-4 border-base-black p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="retro-heading retro-heading-xl text-retro-blue flex items-center gap-3"><Megaphone className="w-8 h-8" /> Pengumuman</h1>
            <p className="font-retro-mono text-sm text-base-black/70 mt-1">Buat dan kelola pengumuman untuk siswa kelas Anda</p>
          </div>
          <Button onClick={openCreate}><Plus className="w-4 h-4 mr-1" /> Buat Pengumuman</Button>
        </div>
      </motion.div>

      {isLoading ? (
        <div className="retro-card bg-base-white border-4 border-base-black p-10 text-center font-retro-mono text-base-black/50">Memuat pengumuman...</div>
      ) : list.length > 0 ? (
        <>
          {pinned.length > 0 && (
            <div>
              <h2 className="font-retro-display font-black text-base-black mb-3 flex items-center gap-2"><Pin className="w-4 h-4 text-retro-yellow" /> Disematkan</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pinned.map(a => <AnnouncementCard key={a.id} item={a} onEdit={openEdit} onDelete={id => remove.mutate(id)} onPin={id => pin.mutate(id)} />)}
              </div>
            </div>
          )}
          {regular.length > 0 && (
            <div>
              {pinned.length > 0 && <h2 className="font-retro-display font-black text-base-black mb-3">Semua Pengumuman</h2>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {regular.map(a => <AnnouncementCard key={a.id} item={a} onEdit={openEdit} onDelete={id => remove.mutate(id)} onPin={id => pin.mutate(id)} />)}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="retro-card bg-base-white border-4 border-dashed border-base-black p-12 text-center">
          <Megaphone className="w-14 h-14 text-base-black/20 mx-auto mb-3" />
          <p className="font-retro-mono text-base-black/50 mb-5">Belum ada pengumuman</p>
          <Button onClick={openCreate}><Plus className="w-4 h-4 mr-1" /> Buat Pengumuman Pertama</Button>
        </div>
      )}

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={editing ? '✏️ Edit Pengumuman' : '📢 Buat Pengumuman'} maxWidth="lg">
        <form onSubmit={e => { e.preventDefault(); save.mutate(form); }} className="p-6 space-y-4">
          <div>
            <label className="block font-retro-mono text-xs font-black uppercase tracking-wider mb-1">Judul *</label>
            <input type="text" required placeholder="Judul pengumuman" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="w-full py-2 px-3 border-2 border-base-black rounded-retro font-retro-mono text-sm bg-base-white focus:outline-none focus:border-retro-orange" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-retro-mono text-xs font-black uppercase tracking-wider mb-1">Target Kelas</label>
              <select value={form.target_class} onChange={e => setForm(f => ({ ...f, target_class: e.target.value }))}
                className="w-full py-2 px-3 border-2 border-base-black rounded-retro font-retro-mono text-sm bg-base-white focus:outline-none focus:border-retro-orange">
                <option value="">Semua Kelas</option>
                {(classes?.data || []).map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-retro-mono text-xs font-black uppercase tracking-wider mb-1">Prioritas</label>
              <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                className="w-full py-2 px-3 border-2 border-base-black rounded-retro font-retro-mono text-sm bg-base-white focus:outline-none focus:border-retro-orange">
                <option value="normal">Normal</option>
                <option value="high">Penting</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block font-retro-mono text-xs font-black uppercase tracking-wider mb-1">Isi Pengumuman *</label>
            <textarea rows={5} required placeholder="Tulis isi pengumuman di sini..." value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              className="w-full py-2 px-3 border-2 border-base-black rounded-retro font-retro-mono text-sm bg-base-white focus:outline-none focus:border-retro-orange resize-none" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_pinned} onChange={e => setForm(f => ({ ...f, is_pinned: e.target.checked }))}
              className="w-4 h-4 border-2 border-base-black rounded" />
            <span className="font-retro-mono text-sm">📌 Sematkan pengumuman ini</span>
          </label>
          <div className="flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={() => setIsOpen(false)}>Batal</Button>
            <Button type="submit" disabled={save.isPending}>{save.isPending ? 'Menyimpan...' : editing ? 'Perbarui' : 'Publikasi'}</Button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}
