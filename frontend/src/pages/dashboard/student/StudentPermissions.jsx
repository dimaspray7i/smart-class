import { useState, useEffect } from 'react';
import { FileText, ShieldCheck, AlertCircle, Upload, CheckCircle, Clock } from 'lucide-react';
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

export default function StudentPermissions() {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [meta, setMeta] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Form State
  const [type, setType] = useState('Izin');
  const [reason, setReason] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchPermissions = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const res = await studentApi.getPermissions({ page });
      if (res.status === 'success') {
        setHistory(res.data);
        setMeta(res.meta);
      }
    } catch (err) {
      console.error(err);
      setError('Gagal memuat riwayat pengajuan izin');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason || !dateFrom || !dateTo) return;

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      const formData = new FormData();
      formData.append('type', type);
      formData.append('reason', reason);
      formData.append('date_from', dateFrom);
      formData.append('date_to', dateTo);
      if (file) {
        formData.append('file', file);
      }

      const res = await studentApi.createPermission(formData);
      if (res.status === 'success') {
        setSuccess('Pengajuan izin/sakit berhasil dikirim ke Wali Kelas!');
        setType('Izin');
        setReason('');
        setDateFrom('');
        setDateTo('');
        setFile(null);
        fetchPermissions();
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Gagal mengirim pengajuan izin. Silakan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* ── Page Header ──────────────────────────────────── */}
      <PageHeader 
        title="Surat Izin"
        icon={FileText}
        description="Ajukan permohonan surat izin atau keterangan sakit secara langsung kepada Wali Kelas Anda."
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard/student' },
          { label: 'Surat Izin', path: '/dashboard/student/permissions' }
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
          <AlertCircle className="w-5 h-5 text-danger flex-shrink-0 animate-bounce" />
          <span>{error}</span>
        </motion.div>
      )}

      {/* ── Grid Split ───────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Form Pengajuan */}
        <div className="lg:col-span-1">
          <RetroCard variant="white" className="bg-retro-yellow/5">
            <h3 className="font-retro-display font-black text-base-black uppercase tracking-tight text-xs border-b-4 border-base-black pb-3 mb-5">
              📝 Form Pengajuan Izin
            </h3>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="block text-[9px] font-black uppercase tracking-wider text-base-black">Tipe Presensi</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Izin', 'Sakit'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={`py-2 border-2 border-base-black rounded-retro text-[10px] font-retro-display font-black uppercase tracking-wider transition-all shadow-hard-sm active:translate-y-[2px] ${
                        type === t
                          ? 'bg-base-black text-base-white border-base-black shadow-hard-sm'
                          : 'bg-base-white text-base-black hover:bg-base-black/5'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[8px] font-retro-mono font-black uppercase text-base-black/60">Mulai Tanggal</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    required
                    className="w-full px-2.5 py-1.5 border-2 border-base-black rounded-retro text-xs font-bold font-retro-mono focus:outline-none bg-base-white shadow-hard-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[8px] font-retro-mono font-black uppercase text-base-black/60">Sampai Tanggal</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    required
                    className="w-full px-2.5 py-1.5 border-2 border-base-black rounded-retro text-xs font-bold font-retro-mono focus:outline-none bg-base-white shadow-hard-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[8px] font-retro-mono font-black uppercase text-base-black/60">Alasan / Keterangan</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                  placeholder="Deskripsikan alasan detail ketidakhadiran Anda secara jelas..."
                  rows="3"
                  className="w-full px-3 py-2 border-2 border-base-black rounded-retro text-xs font-retro-mono focus:outline-none bg-base-white shadow-hard-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[8px] font-retro-mono font-black uppercase text-base-black/60">Upload Surat / Dokumen Pendukung</label>
                <div className="border-4 border-dashed border-base-black rounded-retro p-4 text-center bg-base-white hover:bg-retro-purple/5 transition-all relative cursor-pointer shadow-hard-sm">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <Upload className="w-8 h-8 mx-auto text-base-black/60 mb-1.5" />
                  <span className="text-[9px] font-retro-display font-black uppercase tracking-wider block text-base-black">
                    {file ? file.name : 'DRAG FILE ATAU KLIK'}
                  </span>
                  <span className="text-[7px] font-retro-mono text-base-black/45 block uppercase mt-1 leading-none">
                    PDF, JPG, JPEG, PNG (Max 5MB)
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className={`w-full retro-btn py-3.5 flex items-center justify-center gap-2 ${
                  submitting ? 'opacity-40 cursor-not-allowed shadow-none' : 'bg-base-black text-base-white hover:bg-retro-purple'
                }`}
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-base-white border-t-transparent rounded-full animate-spin" />
                ) : null}
                <span>KIRIM PERMOHONAN</span>
              </button>
            </form>
          </RetroCard>
        </div>

        {/* Right Column: Riwayat Pengajuan */}
        <div className="lg:col-span-2">
          <RetroCard variant="white">
            <h3 className="font-retro-display font-black text-base-black uppercase tracking-tight text-xs border-b-4 border-base-black pb-3 mb-5">
              📅 Riwayat Pengajuan Izin
            </h3>

            {loading && history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-retro-purple border-t-base-black rounded-full animate-spin mb-3" />
                <p className="font-retro-mono text-[9px] text-base-black/45 uppercase">MEMUAT RIWAYAT...</p>
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-16 border-4 border-dashed border-base-black/20 rounded-retro bg-base-cream/20">
                <ShieldCheck className="w-12 h-12 mx-auto text-base-black/20 mb-2 animate-pulse" />
                <p className="text-[10px] font-retro-mono font-bold uppercase text-base-black/40">Belum ada riwayat pengajuan izin/sakit</p>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((h, i) => (
                  <motion.div 
                    key={h.id || i} 
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    className="border-4 border-base-black p-4 rounded-retro hover:shadow-hard-sm hover:-translate-x-0.5 hover:-translate-y-0.5 bg-base-white shadow-hard-sm transition-all"
                  >
                    <div className="flex flex-wrap justify-between items-start gap-2 mb-2.5 border-b-2 border-base-black/5 pb-2">
                      <span className="text-[8px] font-retro-mono font-black uppercase bg-retro-purple/15 text-retro-purple px-2 py-0.5 border border-retro-purple rounded leading-none">
                        {h.date_from === h.date_to ? h.date_from : `${h.date_from} s.d ${h.date_to}`}
                      </span>
                      <span className={`text-[8px] font-retro-mono font-black uppercase px-2 py-0.5 border-2 border-base-black rounded shadow-hard-sm ${
                        h.status === 'approved' ? 'bg-retro-lime text-base-black border-base-black' : 
                        h.status === 'rejected' ? 'bg-retro-pink text-base-white border-base-black' : 
                        'bg-retro-yellow text-base-black border-base-black'
                      }`}>
                        {h.status === 'approved' ? 'DISETUJUI' : h.status === 'rejected' ? 'DITOLAK' : 'MENUNGGU WALI'}
                      </span>
                    </div>

                    <div className="text-[10px] font-retro-display font-black uppercase text-base-black flex items-center gap-1.5">
                      <span className={`w-3 h-3 rounded-full border-2 border-base-black inline-block ${
                        h.type === 'Izin' ? 'bg-retro-blue' : 'bg-retro-orange'
                      }`} />
                      <span>{h.type}</span>
                    </div>
                    
                    <p className="text-xs text-base-black/75 mt-2.5 font-retro-mono leading-relaxed whitespace-pre-line bg-base-cream/25 p-3 rounded border border-base-black/5"><span className="text-base-black/45 uppercase text-[9px] block mb-1">Alasan:</span> {h.reason}</p>

                    {h.note && (
                      <div className="mt-3.5 bg-retro-yellow/10 border-2 border-retro-yellow p-2.5 rounded text-[9px] font-retro-mono text-base-black leading-tight shadow-hard-sm">
                        <span className="font-black text-retro-orange">Catatan Wali Kelas:</span> {h.note}
                      </div>
                    )}

                    {h.attachment_url && (
                      <div className="mt-3 border-t-2 border-base-black/5 pt-2">
                        <a
                          href={h.attachment_url}
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
