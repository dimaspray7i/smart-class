import { useState, useEffect } from 'react';
import { Megaphone, Pin, Calendar, User, Info, AlertTriangle } from 'lucide-react';
import studentApi from '../../../api/student';
import { motion } from 'framer-motion';
import { PageHeader, RetroCard } from '../../../components/ui/RetroLayouts';

// 🎨 ANIMATION VARIANTS
const cardVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 15 } 
  }
};

export default function StudentAnnouncements() {
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState([]);
  const [meta, setMeta] = useState(null);
  const [error, setError] = useState(null);
  const [priorityFilter, setPriorityFilter] = useState('all');

  const fetchAnnouncements = async (priority = 'all', page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const params = { page };
      if (priority !== 'all') {
        params.priority = priority;
      }
      const res = await studentApi.getAnnouncements(params);
      if (res.status === 'success') {
        setAnnouncements(res.data);
        setMeta(res.meta);
      }
    } catch (err) {
      console.error(err);
      setError('Gagal memuat pengumuman mading');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements(priorityFilter);
  }, [priorityFilter]);

  return (
    <div className="space-y-6">
      
      {/* ── Page Header ──────────────────────────────────── */}
      <PageHeader 
        title="Mading Sekolah"
        icon={Megaphone}
        description="Dapatkan pengumuman dan informasi akademis resmi langsung dari Bapak/Ibu guru Anda."
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard/student' },
          { label: 'Pengumuman', path: '/dashboard/student/announcements' }
        ]}
        actions={
          <div className="flex gap-1.5">
            {['all', 'high', 'normal'].map((filter) => (
              <button
                key={filter}
                onClick={() => setPriorityFilter(filter)}
                className={`px-3 py-1.5 border-2 border-base-black rounded-retro text-[9px] font-retro-display font-black uppercase tracking-wider transition-all shadow-hard-sm hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 ${
                  priorityFilter === filter
                    ? 'bg-base-black text-base-white border-base-black shadow-hard-sm'
                    : 'bg-base-white text-base-black hover:bg-base-black/5'
                }`}
              >
                {filter === 'all' ? 'Semua' : filter === 'high' ? '🚨 PENTING' : 'INFO'}
              </button>
            ))}
          </div>
        }
      />

      {error && (
        <div className="retro-card bg-retro-pink/10 border-4 border-base-black p-4 font-retro-mono text-xs font-black uppercase text-base-black tracking-wider shadow-hard-sm">
          🚨 {error}
        </div>
      )}

      {loading && announcements.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] retro-card bg-base-white p-8 shadow-hard">
          <div className="w-12 h-12 border-4 border-retro-purple border-t-base-black rounded-full animate-spin mb-4" />
          <p className="font-retro-display font-black text-xs text-base-black uppercase tracking-widest animate-pulse font-black">TUNING RADIO MATRIX...</p>
        </div>
      ) : announcements.length === 0 ? (
        <div className="text-center py-16 retro-card bg-base-white shadow-hard border-4 border-base-black">
          <Megaphone className="w-12 h-12 mx-auto text-base-black/20 mb-2 animate-pulse" />
          <p className="text-xs font-retro-display font-black uppercase text-base-black">Mading pengumuman kosong</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {announcements.map((ann, i) => (
            <motion.div
              key={ann.id || i}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              className={`retro-card p-5 shadow-hard-sm border-4 border-base-black relative overflow-hidden transition-all hover:shadow-hard hover:-translate-x-0.5 hover:-translate-y-0.5 ${
                ann.is_pinned ? 'bg-retro-yellow/10' : 'bg-base-white'
              }`}
            >
              {/* Pinned Indicator badge */}
              {ann.is_pinned && (
                <div className="absolute top-2 right-2 bg-retro-yellow border-2 border-base-black p-1 rounded-retro shadow-hard-sm">
                  <Pin className="w-4 h-4 text-base-black transform rotate-45" />
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 mb-3 border-b-2 border-base-black/5 pb-2">
                <span className={`text-[8px] font-retro-mono font-black uppercase px-2 py-0.5 border border-base-black rounded shadow-hard-sm ${
                  ann.priority === 'high' ? 'bg-retro-pink text-base-white border-retro-pink' : 'bg-retro-blue/10 text-retro-blue border-retro-blue/35'
                }`}>
                  {ann.priority === 'high' ? 'PENTING' : 'INFO'}
                </span>
                <span className="text-[9px] font-retro-mono font-bold text-base-black/40 uppercase">
                  {new Date(ann.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>

              <h3 className="text-sm md:text-base font-retro-display font-black text-base-black uppercase tracking-wide mb-2 leading-tight">{ann.title}</h3>
              <p className="text-xs text-base-black/75 font-retro-mono leading-relaxed whitespace-pre-line bg-base-cream/25 p-3 rounded border border-base-black/5">{ann.content}</p>

              <div className="flex items-center gap-2.5 mt-4 pt-3 border-t-2 border-base-black/5">
                <div className="w-7 h-7 rounded-retro border-2 border-base-black bg-retro-purple flex items-center justify-center text-base-white font-retro-display font-black text-[10px] shadow-hard-sm">
                  {ann.teacher?.name?.charAt(0).toUpperCase() || 'G'}
                </div>
                <div>
                  <p className="text-[10px] font-retro-display font-black uppercase text-base-black leading-none">{ann.teacher?.name || 'Guru RPL'}</p>
                  <p className="text-[8px] font-retro-mono font-bold uppercase text-base-black/40 mt-0.5 leading-none">Pengirim Pengumuman</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
