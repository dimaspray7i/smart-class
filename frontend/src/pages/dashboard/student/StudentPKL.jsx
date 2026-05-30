import { useState, useEffect } from 'react';
import { Briefcase, Calendar, MapPin, AlertCircle, CheckCircle, Clock, Upload, Plus, FileText } from 'lucide-react';
import studentApi from '../../../api/student';
import { motion, AnimatePresence } from 'framer-motion';
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

export default function StudentPKL() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Journal form state
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [activity, setActivity] = useState('');
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showAddJournal, setShowAddJournal] = useState(false);

  const fetchPklData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await studentApi.getPkl();
      if (res.status === 'success') {
        setData(res.data);
      }
    } catch (err) {
      console.error(err);
      setError('Gagal memuat data PKL dari server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPklData();
  }, []);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleJournalSubmit = async (e) => {
    e.preventDefault();
    if (!activity || !date) return;

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      const formData = new FormData();
      formData.append('date', date);
      formData.append('activity', activity);
      if (file) {
        formData.append('file', file);
      }

      const res = await studentApi.uploadJournal(formData);
      if (res.status === 'success') {
        setSuccess('Jurnal PKL harian berhasil dikirim!');
        setActivity('');
        setFile(null);
        setShowAddJournal(false);
        fetchPklData();
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Gagal mengirim jurnal PKL. Silakan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] retro-card bg-base-white p-8 shadow-hard">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 retro-card bg-retro-purple border-4 border-base-black flex items-center justify-center mb-4"
        >
          <Briefcase className="w-8 h-8 text-base-white animate-pulse" />
        </motion.div>
        <p className="font-retro-display font-black text-xs text-base-black uppercase tracking-widest animate-pulse">
          Mengambil Data PKL...
        </p>
        <div className="w-48 h-2 bg-base-gray border-2 border-base-black rounded-sm overflow-hidden mt-3">
          <motion.div 
            className="h-full bg-retro-purple"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            style={{ width: '50%' }}
          />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] border-4 border-base-black bg-danger/10 p-8 rounded-retro shadow-hard text-center">
        <AlertCircle className="w-12 h-12 text-danger mb-3 animate-bounce" />
        <h3 className="retro-heading text-lg mb-2">Oops! Gagal Memuat Data PKL</h3>
        <p className="font-retro-mono text-xs font-black text-base-black/70 uppercase tracking-widest mb-4">
          {error}
        </p>
        <button
          onClick={fetchPklData}
          className="retro-btn flex items-center gap-2 bg-base-black text-base-white hover:bg-retro-orange py-2 px-4"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  const pklLocation = data?.pkl_location || null;
  const journals = data?.journals || [];
  const isEligible = data?.is_eligible || false;

  return (
    <div className="space-y-6">
      
      {/* ── Page Header ──────────────────────────────────── */}
      <PageHeader 
        title="PKL & Jurnal"
        icon={Briefcase}
        description="Pantau kelayakan prakerin, informasi industri penempatan, serta unggah laporan jurnal harian Anda."
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard/student' },
          { label: 'PKL', path: '/dashboard/student/pkl' }
        ]}
        actions={
          pklLocation && (
            <button
              onClick={() => setShowAddJournal(!showAddJournal)}
              className="retro-btn bg-retro-purple text-base-white text-xs py-2.5 px-4 shadow-hard-sm flex items-center gap-1.5"
            >
              <Plus className="w-4.5 h-4.5" />
              <span>ISI JURNAL PKL</span>
            </button>
          )
        }
      />

      {success && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }}
          className="retro-card bg-retro-lime/10 border-4 border-base-black p-4 font-retro-mono text-xs font-black uppercase text-base-black tracking-wider shadow-hard-sm"
        >
          🎉 {success}
        </motion.div>
      )}

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }}
          className="retro-card bg-retro-pink/10 border-4 border-base-black p-4 font-retro-mono text-xs font-black uppercase text-base-black tracking-wider flex items-center gap-3 shadow-hard-sm"
        >
          <AlertCircle className="w-5 h-5 text-danger flex-shrink-0 animate-bounce" />
          <span>{error}</span>
        </motion.div>
      )}

      {/* ── Split Layout Grid ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Eligibility and Assignment */}
        <div className="lg:col-span-1 space-y-6">
          {/* Eligibility status */}
          <motion.div 
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className={`retro-card p-5 border-4 border-base-black shadow-hard-sm ${
              isEligible ? 'bg-retro-lime/10 border-retro-lime' : 'bg-retro-pink/10 border-retro-pink'
            }`}
          >
            <h3 className="font-retro-display font-black text-base-black uppercase tracking-tight text-xs border-b-2 border-base-black pb-2 mb-3">
              💼 Status Kelayakan
            </h3>
            <p className={`text-xs font-retro-display font-black uppercase ${
              isEligible ? 'text-retro-lime' : 'text-retro-pink'
            }`}>
              {isEligible ? 'MEMENUHI SYARAT (ELIGIBLE)' : 'BELUM MEMENUHI SYARAT'}
            </p>
            <p className="text-[9px] text-base-black/70 font-retro-mono mt-1.5 uppercase leading-normal">
              {isEligible 
                ? 'Anda memenuhi kualifikasi akademis & siap ditempatkan di industri.' 
                : 'Silakan selesaikan seluruh tugas akademik & nilai minimal Anda terlebih dahulu.'}
            </p>
          </motion.div>

          {/* Location details */}
          <motion.div 
            variants={cardVariants}
            initial="hidden"
            animate="visible"
          >
            {pklLocation ? (
              <RetroCard variant="white" className="space-y-4">
                <h3 className="font-retro-display font-black text-base-black uppercase tracking-tight text-xs border-b-4 border-base-black pb-2">
                  🏢 Penempatan Industri
                </h3>
                <div>
                  <h4 className="font-retro-display font-black text-sm text-base-black uppercase tracking-wide leading-tight">
                    {pklLocation.name}
                  </h4>
                  <div className="flex items-start gap-1.5 mt-2.5 text-[10px] font-bold text-base-black/50 font-retro-mono uppercase leading-tight">
                    <MapPin className="w-4 h-4 text-base-black flex-shrink-0" />
                    <span>{pklLocation.address}</span>
                  </div>
                </div>

                <div className="border-t-2 border-base-black/10 pt-3 text-[9px] font-retro-mono font-bold uppercase space-y-1">
                  <p className="text-base-black"><span className="text-base-black/45">Pembimbing:</span> {pklLocation.mentor_name || '—'}</p>
                  <p className="text-base-black"><span className="text-base-black/45">Kontak Industri:</span> {pklLocation.phone || '—'}</p>
                </div>
              </RetroCard>
            ) : (
              <RetroCard variant="white" className="text-center py-8">
                <AlertCircle className="w-12 h-12 mx-auto text-base-black/20 mb-2 animate-pulse" />
                <p className="text-xs font-retro-display font-black uppercase text-base-black leading-none">Belum Ditempatkan</p>
                <p className="text-[9px] text-base-black/45 uppercase mt-2 font-retro-mono leading-relaxed px-4">
                  Anda belum mendapatkan penempatan PKL dari Hubin. Silakan hubungi Koordinator Hubin sekolah untuk koordinasi penempatan.
                </p>
              </RetroCard>
            )}
          </motion.div>
        </div>

        {/* Right Column: Timeline / Add Journal */}
        <div className="lg:col-span-2 space-y-6">
          <RetroCard variant="white">
            <div className="flex items-center justify-between border-b-4 border-base-black pb-3 mb-5">
              <h3 className="font-retro-display font-black text-base-black uppercase tracking-tight text-xs">
                📝 Jurnal Harian PKL
              </h3>
              <span className="retro-sticker text-[7px] px-1.5 py-0.5 bg-retro-purple text-base-white font-black">PROGRESS LOG</span>
            </div>

            {/* Add Journal Form panel */}
            <AnimatePresence>
              {showAddJournal && (
                <motion.form 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleJournalSubmit}
                  className="bg-retro-yellow/10 border-4 border-base-black p-4 rounded-retro space-y-4 mb-6 shadow-hard-sm"
                >
                  <h4 className="font-retro-display font-black text-[9px] uppercase tracking-wider border-b-2 border-base-black/5 pb-2 text-base-black">
                    ⚡ INPUT JURNAL BARU
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[8px] font-retro-mono font-black uppercase text-base-black/60">Tanggal Aktivitas</label>
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                        className="w-full px-2 py-1.5 border-2 border-base-black rounded-retro text-xs font-retro-mono focus:outline-none bg-base-white shadow-hard-sm"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="block text-[8px] font-retro-mono font-black uppercase text-base-black/60">Foto/Lampiran Aktivitas (Opsional)</label>
                      <input
                        type="file"
                        onChange={handleFileChange}
                        className="w-full text-[9px] font-retro-mono text-base-black/60 pt-1.5"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[8px] font-retro-mono font-black uppercase text-base-black/60">Detail Aktivitas Kerja</label>
                    <textarea
                      value={activity}
                      onChange={(e) => setActivity(e.target.value)}
                      required
                      placeholder="Uraikan aktivitas kerja industri yang Anda selesaikan hari ini secara lengkap..."
                      rows="3"
                      className="w-full px-3 py-2 border-2 border-base-black rounded-retro text-xs font-retro-mono focus:outline-none bg-base-white shadow-hard-sm"
                    />
                  </div>

                  <div className="flex gap-2.5 justify-end pt-1">
                    <button
                      type="submit"
                      disabled={submitting}
                      className={`retro-btn text-xs py-2 px-4 flex items-center justify-center gap-1.5 ${
                        submitting ? 'opacity-40 cursor-not-allowed shadow-none' : 'bg-base-black text-base-white hover:bg-retro-purple'
                      }`}
                    >
                      {submitting ? (
                        <div className="w-4 h-4 border-2 border-base-white border-t-transparent rounded-full animate-spin" />
                      ) : null}
                      <span>KIRIM JURNAL</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddJournal(false)}
                      className="retro-btn bg-base-white text-base-black hover:bg-base-gray border-2 border-base-black text-xs py-2 px-4 shadow-hard-sm"
                    >
                      BATAL
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Timeline Journals list */}
            {journals.length === 0 ? (
              <div className="text-center py-16 border-4 border-dashed border-base-black/20 rounded-retro bg-base-cream/20">
                <FileText className="w-12 h-12 mx-auto text-base-black/25 mb-2 animate-pulse" />
                <p className="text-[10px] font-retro-mono font-bold uppercase text-base-black/40">Belum ada entri jurnal prakerin terkirim</p>
              </div>
            ) : (
              <div className="space-y-4">
                {journals.map((j, i) => (
                  <motion.div 
                    key={j.id || i} 
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    className="border-4 border-base-black p-4 rounded-retro hover:shadow-hard-sm hover:-translate-x-0.5 hover:-translate-y-0.5 bg-base-white shadow-hard-sm transition-all"
                  >
                    <div className="flex justify-between items-start mb-2.5 border-b-2 border-base-black/5 pb-2">
                      <span className="text-[8px] font-retro-mono font-black uppercase bg-retro-purple/15 text-retro-purple px-2 py-0.5 border border-retro-purple rounded leading-none">
                        {j.date}
                      </span>
                      <span className={`text-[8px] font-retro-mono font-black uppercase px-2 py-0.5 border-2 border-base-black rounded shadow-hard-sm ${
                        j.status === 'approved' ? 'bg-retro-lime text-base-black border-base-black' : 
                        j.status === 'rejected' ? 'bg-retro-pink text-base-white border-base-black' : 
                        'bg-retro-yellow text-base-black border-base-black'
                      }`}>
                        {j.status === 'approved' ? 'DISETUJUI' : j.status === 'rejected' ? 'DITOLAK' : 'DIPROSES'}
                      </span>
                    </div>

                    <p className="text-xs text-base-black font-retro-mono leading-relaxed whitespace-pre-line bg-base-cream/25 p-3 rounded border border-base-black/5">{j.activity}</p>

                    {j.file_path && (
                      <div className="mt-3.5 border-t-2 border-base-black/5 pt-2.5">
                        <a
                          href={j.file_path}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[8px] font-retro-mono font-black uppercase text-retro-purple hover:underline border-2 border-retro-purple/35 px-2 py-0.5 rounded bg-retro-purple/5 shadow-hard-sm"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Lihat Lampiran File</span>
                        </a>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </RetroCard>
        </div>

      </div>
    </div>
  );
}
