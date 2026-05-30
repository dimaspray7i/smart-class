import { useState, useEffect } from 'react';
import { BookOpen, Clock, CheckCircle, AlertTriangle, UploadCloud, ShieldCheck, FileText, Sparkles } from 'lucide-react';
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

export default function StudentTasks() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState('pending'); // 'all', 'pending', 'submitted'
  const [selectedTask, setSelectedTask] = useState(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await studentApi.getTasks();
      if (res.status === 'success') {
        setData(res.data);
      }
    } catch (err) {
      console.error(err);
      setError('Gagal memuat tugas akademis Anda');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!file || !selectedTask) return;

    try {
      setUploading(true);
      setError(null);
      setSuccess(null);

      const formData = new FormData();
      formData.append('task_id', selectedTask.id);
      formData.append('file', file);

      const res = await studentApi.uploadTask(formData);
      if (res.status === 'success') {
        setSuccess('Tugas akademis berhasil dikirim!');
        setFile(null);
        setSelectedTask(null);
        fetchTasks();
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Gagal mengirim tugas. Silakan coba lagi.');
    } finally {
      setUploading(false);
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
          <BookOpen className="w-8 h-8 text-base-white animate-pulse" />
        </motion.div>
        <p className="font-retro-display font-black text-xs text-base-black uppercase tracking-widest animate-pulse">
          Mengambil Data Tugas...
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
        <AlertTriangle className="w-12 h-12 text-danger mb-3 animate-bounce" />
        <h3 className="retro-heading text-lg mb-2">Oops! Gagal Memuat Tugas</h3>
        <p className="font-retro-mono text-xs font-black text-base-black/70 uppercase tracking-widest mb-4">
          {error}
        </p>
        <button
          onClick={fetchTasks}
          className="retro-btn flex items-center gap-2 bg-base-black text-base-white hover:bg-retro-orange py-2 px-4"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  const tasks = data?.tasks || [];
  const summary = data?.summary || { total: 0, pending: 0, submitted: 0 };

  const filteredTasks = tasks.filter((t) => {
    if (activeTab === 'pending') return !t.is_submitted;
    if (activeTab === 'submitted') return t.is_submitted;
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* ── Page Header ──────────────────────────────────── */}
      <PageHeader 
        title="Tugas Akademik"
        icon={BookOpen}
        description="Monitor tenggat waktu penyerahan tugas dan unggah hasil pekerjaan Anda dengan mudah."
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard/student' },
          { label: 'Tugas', path: '/dashboard/student/tasks' }
        ]}
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
          <AlertTriangle className="w-5 h-5 text-danger flex-shrink-0 animate-bounce" />
          <span>{error}</span>
        </motion.div>
      )}

      {/* ── Summary Stats Grid ───────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        <motion.div 
          whileHover={{ y: -2 }}
          className="border-4 border-base-black p-4 rounded-retro shadow-hard-sm text-center bg-base-white"
        >
          <div className="font-retro-display font-black text-xl text-base-black leading-none">{summary.total}</div>
          <div className="text-[8px] font-retro-mono font-black text-base-black/50 uppercase tracking-widest mt-2 leading-none">Total Tugas</div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -2 }}
          className="border-4 border-base-black p-4 rounded-retro shadow-hard-sm text-center bg-retro-yellow/10"
        >
          <div className="font-retro-display font-black text-xl text-retro-orange leading-none">{summary.pending}</div>
          <div className="text-[8px] font-retro-mono font-black text-base-black/50 uppercase tracking-widest mt-2 leading-none">Belum Selesai</div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -2 }}
          className="border-4 border-base-black p-4 rounded-retro shadow-hard-sm text-center bg-retro-lime/10"
        >
          <div className="font-retro-display font-black text-xl text-retro-lime leading-none">{summary.submitted}</div>
          <div className="text-[8px] font-retro-mono font-black text-base-black/50 uppercase tracking-widest mt-2 leading-none">Sudah Selesai</div>
        </motion.div>
      </div>

      {/* ── Main Layout Splits ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Tasks List */}
        <div className="lg:col-span-2 space-y-4">
          <RetroCard variant="white">
            {/* Tab Controls */}
            <div className="flex gap-2 border-b-4 border-base-black pb-4 mb-5">
              {['pending', 'submitted', 'all'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 border-2 border-base-black rounded-retro text-[9px] font-retro-display font-black uppercase tracking-wider transition-all shadow-hard-sm hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 ${
                    activeTab === tab
                      ? 'bg-retro-purple text-base-white shadow-hard-sm border-base-black'
                      : 'bg-base-white text-base-black hover:bg-retro-purple/10'
                  }`}
                >
                  {tab === 'pending' ? 'Belum Selesai' : tab === 'submitted' ? 'Sudah Selesai' : 'Semua'}
                </button>
              ))}
            </div>

            {filteredTasks.length === 0 ? (
              <div className="text-center py-16 border-4 border-dashed border-base-black/20 rounded-retro bg-base-cream/20">
                <ShieldCheck className="w-12 h-12 mx-auto text-base-black/20 mb-2" />
                <p className="text-[10px] font-retro-mono font-bold uppercase text-base-black/40">Tidak ada tugas di kategori ini</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTasks.map((t) => (
                  <motion.div
                    key={t.id}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    onClick={() => {
                      if (!t.is_submitted) {
                        setSelectedTask(t);
                        setSuccess(null);
                        setError(null);
                      }
                    }}
                    className={`border-4 border-base-black p-4 rounded-retro transition-all shadow-hard-sm cursor-pointer ${
                      selectedTask?.id === t.id 
                        ? 'bg-retro-yellow/10 shadow-hard border-l-8 border-l-base-black' 
                        : 'bg-base-white hover:bg-retro-purple/5'
                    }`}
                  >
                    <div className="flex flex-wrap justify-between items-start gap-2 mb-2 border-b-2 border-base-black/5 pb-2">
                      <span className="text-[8px] font-retro-mono font-black uppercase bg-retro-purple/15 text-retro-purple px-1.5 py-0.5 border border-retro-purple rounded">
                        {t.subject_name}
                      </span>
                      <span className={`text-[8px] font-retro-mono font-black uppercase px-2 py-0.5 border-2 border-base-black rounded shadow-hard-sm ${
                        t.is_submitted ? 'bg-retro-lime text-base-black' : t.is_late ? 'bg-retro-pink text-base-white' : 'bg-retro-yellow text-base-black'
                      }`}>
                        {t.is_submitted ? 'SUDAH DIKIRIM' : t.is_late ? 'TERLAMBAT' : 'BELUM DIKIRIM'}
                      </span>
                    </div>

                    <h4 className="font-retro-display font-black text-sm text-base-black uppercase tracking-wide leading-tight">{t.title}</h4>
                    <p className="text-[9px] font-retro-mono font-bold text-base-black/50 uppercase mt-1 leading-none">Guru Pengampu: {t.teacher_name}</p>
                    <p className="text-xs text-base-black/75 mt-3 font-retro-mono leading-relaxed whitespace-pre-line bg-base-cream/25 p-3 rounded border border-base-black/5">{t.description}</p>

                    <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-3 border-t-2 border-base-black/5">
                      <div className="flex items-center gap-1.5 text-[9px] font-retro-mono font-bold text-base-black/50 uppercase">
                        <Clock className="w-4 h-4 text-base-black" />
                        <span>Deadline: {t.deadline_formatted || '—'}</span>
                      </div>

                      {t.is_submitted && (
                        <div className="flex items-center gap-1.5 text-[9px] font-retro-mono font-black uppercase text-retro-lime bg-base-black px-2 py-0.5 rounded border border-base-black shadow-hard-sm">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Nilai: {t.submission_grade !== null ? t.submission_grade : 'BELUM DINILAI'}</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </RetroCard>
        </div>

        {/* Right Column: Uploader Form */}
        <div className="lg:col-span-1">
          <RetroCard variant="white" className="h-full bg-retro-yellow/5">
            <div className="flex items-center justify-between border-b-4 border-base-black pb-3 mb-4">
              <h3 className="font-retro-display font-black text-base-black uppercase tracking-tight text-xs flex items-center gap-1.5">
                <span>📤</span> Upload Tugas
              </h3>
              <Sparkles className="w-4 h-4 text-retro-yellow fill-retro-yellow" />
            </div>

            {selectedTask ? (
              <form onSubmit={handleUploadSubmit} className="space-y-4">
                <div className="bg-base-white border-4 border-base-black p-3.5 rounded-retro shadow-hard-sm">
                  <p className="text-[8px] font-retro-mono font-black text-base-black/50 uppercase leading-none">Tugas Terpilih:</p>
                  <p className="font-retro-display font-black text-xs text-base-black uppercase truncate mt-1 leading-none">{selectedTask.title}</p>
                  <p className="text-[8px] font-retro-mono font-black text-retro-purple uppercase mt-2 leading-none">● {selectedTask.subject_name}</p>
                </div>

                <div className="space-y-2">
                  <label className="block text-[9px] font-black uppercase tracking-wider text-base-black">
                    File Lampiran Tugas
                  </label>
                  <div className="border-4 border-dashed border-base-black rounded-retro p-6 text-center bg-base-white hover:bg-retro-purple/5 transition-all relative cursor-pointer shadow-hard-sm">
                    <input
                      type="file"
                      onChange={handleFileChange}
                      required
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <UploadCloud className="w-8 h-8 mx-auto text-base-black/60 mb-2 animate-bounce" />
                    <span className="text-[9px] font-retro-display font-black uppercase tracking-wider block text-base-black leading-tight">
                      {file ? file.name : 'SERET FILE / KLIK UNTUK UNGGAH'}
                    </span>
                    <span className="text-[7px] font-retro-mono text-base-black/45 block uppercase mt-1 leading-none">
                      PDF, ZIP, DOC, JPG (MAX 10MB)
                    </span>
                  </div>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="submit"
                    disabled={uploading || !file}
                    className={`flex-1 retro-btn py-2.5 flex items-center justify-center gap-1.5 ${
                      uploading || !file ? 'opacity-40 cursor-not-allowed shadow-none' : 'bg-base-black text-base-white hover:bg-retro-purple'
                    }`}
                  >
                    {uploading ? (
                      <div className="w-4 h-4 border-2 border-base-white border-t-transparent rounded-full animate-spin" />
                    ) : null}
                    <span>KIRIM TUGAS</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTask(null);
                      setFile(null);
                    }}
                    className="retro-btn bg-base-white text-base-black text-xs py-2.5 border-4 border-base-black shadow-hard-sm hover:bg-base-gray"
                  >
                    BATAL
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-16 border-4 border-dashed border-base-black/20 rounded-retro bg-base-cream/10">
                <AlertTriangle className="w-10 h-10 mx-auto text-retro-orange mb-2 animate-pulse" />
                <p className="text-[9px] font-retro-mono font-black uppercase text-base-black/50 px-4 leading-normal">
                  PILIH SALAH SATU TUGAS TIMELINE UNTUK MEMBUKA PANEL UPLOAD LAMPIRAN.
                </p>
              </div>
            )}
          </RetroCard>
        </div>

      </div>
    </div>
  );
}
