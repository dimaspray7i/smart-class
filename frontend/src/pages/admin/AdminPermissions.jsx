import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, CheckCircle2, X, AlertCircle, Search,
  ChevronDown, ChevronUp, Download, Clock, Filter, RefreshCw
} from 'lucide-react';
import { api } from '../../api';
import Button from '../../components/ui/Button';
import Toast from '../../components/ui/Toast';

const pageVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const cardVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } } };

const TYPE_CFG = {
  sakit:   { color: '#E74C3C', bg: '#E74C3C20', label: 'Sakit' },
  izin:    { color: '#E67E22', bg: '#E67E2220', label: 'Izin' },
  lainnya: { color: '#2E2BBF', bg: '#2E2BBF20', label: 'Lainnya' },
};

function PermCard({ perm, onApprove, onReject, isMutating }) {
  const [exp, setExp] = useState(false);
  const cfg = TYPE_CFG[perm.type?.toLowerCase()] || TYPE_CFG.lainnya;

  return (
    <motion.div variants={cardVariants} className="retro-card bg-base-white border-2 border-base-black hover:border-retro-orange transition-colors overflow-hidden">
      <div className="p-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="p-2 rounded-retro border-2 border-base-black flex-shrink-0" style={{ background: cfg.bg }}>
            <AlertCircle className="w-4 h-4" style={{ color: cfg.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-retro-display font-black">{perm.student?.name || perm.user?.name}</p>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase border-2 border-base-black" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase border-2 border-base-black bg-base-gray/30 text-base-black/60">
                {perm.user_role === 'guru' ? 'Guru' : 'Siswa'}
              </span>
            </div>
            <p className="font-retro-mono text-[10px] text-base-black/50 mt-0.5 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(perm.date || perm.created_at).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <AnimatePresence>
              {exp && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-3">
                  <p className="font-retro-mono text-xs bg-base-gray/40 p-3 rounded-retro border border-base-black/20">{perm.reason || 'Tidak ada keterangan'}</p>
                  {perm.attachment && (
                    <a href={perm.attachment} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-2 text-retro-orange hover:underline font-retro-mono text-[10px]">
                      <Download className="w-3 h-3" /> Lihat Lampiran
                    </a>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <button onClick={() => setExp(v => !v)} className="p-1.5 border-2 border-base-black rounded-retro hover:bg-base-gray/20">
            {exp ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          <div className="flex gap-1">
            <button onClick={() => onApprove(perm.id)} disabled={isMutating}
              className="p-1.5 bg-success text-base-white border-2 border-base-black rounded-retro hover:opacity-90 disabled:opacity-50 shadow-[2px_2px_0px_0px_#111]" title="Setujui">
              <CheckCircle2 className="w-4 h-4" />
            </button>
            <button onClick={() => onReject(perm.id)} disabled={isMutating}
              className="p-1.5 bg-danger text-base-white border-2 border-base-black rounded-retro hover:opacity-90 disabled:opacity-50 shadow-[2px_2px_0px_0px_#111]" title="Tolak">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function AdminPermissions() {
  const queryClient = useQueryClient();
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('pending');
  const [roleFilter, setRoleFilter] = useState('all');

  const showToast = useCallback((msg, type = 'success') => { setToast({ message: msg, type }); setTimeout(() => setToast(null), 3500); }, []);

  const { data: permissions, isLoading, refetch } = useQuery({
    queryKey: ['admin-permissions', status, roleFilter],
    queryFn: () => api.get('/admin/permissions', { params: { status, role: roleFilter !== 'all' ? roleFilter : undefined } }),
  });

  const updatePerm = useMutation({
    mutationFn: ({ id, s }) => api.patch(`/admin/permissions/${id}`, { status: s }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-permissions'] }); showToast('✅ Izin diperbarui!'); },
    onError: () => showToast('❌ Gagal memperbarui', 'error'),
  });

  const filtered = useMemo(() => {
    const list = permissions?.data || [];
    if (!search) return list;
    return list.filter(p => (p.student?.name || p.user?.name || '').toLowerCase().includes(search.toLowerCase()));
  }, [permissions, search]);

  const pendingCount = permissions?.data?.filter(p => p.status === 'pending')?.length || 0;

  return (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" className="space-y-6">
      <AnimatePresence>
        {toast && <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed top-24 right-6 z-50">
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        </motion.div>}
      </AnimatePresence>

      <motion.div variants={cardVariants} className="retro-card bg-base-white border-4 border-base-black p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="retro-heading retro-heading-xl text-retro-blue flex items-center gap-3">
              <Bell className="w-8 h-8" /> Manajemen Izin
            </h1>
            <p className="font-retro-mono text-sm text-base-black/70 mt-1">Kelola dan proses permohonan izin siswa & guru</p>
          </div>
          <Button variant="outline" onClick={() => { refetch(); showToast('🔄 Diperbarui', 'info'); }}>
            <RefreshCw className="w-4 h-4 mr-1" /> Refresh
          </Button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[['Menunggu', pendingCount, '#E67E22'], ['Disetujui', '—', '#00B894'], ['Ditolak', '—', '#E74C3C']].map(([l, v, c]) => (
          <div key={l} className="retro-card bg-base-white border-2 border-base-black p-4 text-center">
            <p className="retro-heading text-2xl" style={{ color: c }}>{v}</p>
            <p className="font-retro-mono text-[10px] text-base-black/60 uppercase mt-1">{l}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <motion.div variants={cardVariants} className="retro-card bg-base-white border-4 border-base-black p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-black/40" />
          <input type="text" placeholder="Cari nama..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 py-2 pr-3 border-2 border-base-black rounded-retro font-retro-mono text-sm bg-base-gray/20 focus:outline-none focus:border-retro-orange" />
        </div>
        <select value={status} onChange={e => setStatus(e.target.value)}
          className="py-2 px-3 border-2 border-base-black rounded-retro font-retro-mono text-sm bg-base-white focus:outline-none focus:border-retro-orange">
          <option value="pending">Menunggu</option>
          <option value="approved">Disetujui</option>
          <option value="rejected">Ditolak</option>
        </select>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          className="py-2 px-3 border-2 border-base-black rounded-retro font-retro-mono text-sm bg-base-white focus:outline-none focus:border-retro-orange">
          <option value="all">Semua</option>
          <option value="siswa">Siswa</option>
          <option value="guru">Guru</option>
        </select>
      </motion.div>

      {/* Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {isLoading ? (
          <div className="lg:col-span-2 retro-card bg-base-white border-4 border-base-black p-10 text-center font-retro-mono text-base-black/50">Memuat data...</div>
        ) : filtered.length > 0 ? filtered.map(p => (
          <PermCard key={p.id} perm={p}
            onApprove={id => updatePerm.mutate({ id, s: 'approved' })}
            onReject={id => updatePerm.mutate({ id, s: 'rejected' })}
            isMutating={updatePerm.isLoading}
          />
        )) : (
          <div className="lg:col-span-2 retro-card bg-base-white border-4 border-dashed border-base-black p-12 text-center">
            <CheckCircle2 className="w-14 h-14 text-success/40 mx-auto mb-3" />
            <p className="font-retro-mono text-base-black/50">
              {status === 'pending' ? '🎉 Tidak ada izin menunggu persetujuan' : 'Tidak ada data izin'}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
