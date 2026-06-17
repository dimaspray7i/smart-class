import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, ShieldAlert, Sparkles, CheckSquare, Camera } from 'lucide-react';
import { motion } from 'framer-motion';
import { PageHeader, RetroCard } from '../../../components/ui/RetroLayouts';

// 🎨 ANIMATION VARIANTS
const cardVariants = {
  hidden: { opacity: 0, scale: 0.98 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { type: "spring", stiffness: 120, damping: 15 } 
  }
};

export default function StudentQRScan() {
  const navigate = useNavigate();
  const [qrCodeData, setQrCodeData] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleScanSubmit = async (e) => {
    e.preventDefault();
    if (!qrCodeData.trim()) return;

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      // Extract code from QR data - QR contains code or URL with code parameter
      let code = qrCodeData.trim();

      // If QR contains full URL, extract code parameter
      if (code.includes('code=')) {
        const urlParams = new URLSearchParams(code.split('?')[1] || '');
        code = urlParams.get('code');
      }

      // If QR contains session ID, extract code as well
      if (code.includes('sid=')) {
        const urlParams = new URLSearchParams(code.split('?')[1] || '');
        code = urlParams.get('code');
      }

      if (!code || code.length !== 6) {
        setError('Format kode QR tidak valid. Kode harus 6 karakter alphanumerik.');
        return;
      }

      // Redirect to attendance page with code for actual submission
      setSuccess('Kode QR valid. Mengarahkan ke halaman absensi...');
      setTimeout(() => {
        navigate(`/dashboard/student/attendance?code=${encodeURIComponent(code.toUpperCase())}`);
      }, 600);

    } catch (err) {
      console.error('QR Scan Error:', err);
      setError('Gagal memproses kode QR. Silakan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  const simulateQuickScan = () => {
    // Generate a proper 6-character attendance code
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setQrCodeData(code);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      
      {/* ── Page Header ──────────────────────────────────── */}
      <PageHeader 
        title="Scan QR Code"
        icon={QrCode}
        description="Arahkan kamera ke QR Code absensi harian yang ditayangkan oleh guru Anda."
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard/student' },
          { label: 'Scan QR', path: '/dashboard/student/qrscan' }
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
          <ShieldAlert className="w-5 h-5 text-danger flex-shrink-0 animate-bounce" />
          <span>{error}</span>
        </motion.div>
      )}

      {/* ── Scanner Card ─────────────────────────────────── */}
      <motion.div 
        variants={cardVariants}
        initial="hidden"
        animate="visible"
      >
        <RetroCard bg="white" className="space-y-6">
          {/* Animated Scanning Box */}
          <div className="relative border-4 border-base-black bg-base-black h-64 rounded-retro overflow-hidden flex flex-col items-center justify-center p-4 shadow-[inset_0_0_24px_rgba(0,0,0,0.8)]">
            <div className="absolute inset-0 bg-retro-grid opacity-15 pointer-events-none" />
            
            {/* Glowing laser line */}
            <motion.div 
              animate={{ y: [-100, 100] }} 
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              className="absolute left-0 w-full h-1.5 bg-retro-orange shadow-[0_0_15px_#ff5c00]" 
              style={{ width: '100%' }} 
            />

            {/* Corner Decors */}
            <div className="absolute top-3 left-3 border-t-4 border-l-4 border-retro-orange w-6 h-6" />
            <div className="absolute top-3 right-3 border-t-4 border-r-4 border-retro-orange w-6 h-6" />
            <div className="absolute bottom-3 left-3 border-b-4 border-l-4 border-retro-orange w-6 h-6" />
            <div className="absolute bottom-3 right-3 border-b-4 border-r-4 border-retro-orange w-6 h-6" />

            <Camera className="w-12 h-12 text-retro-orange/45 mb-2 animate-pulse relative z-10" />
            <p className="font-retro-display font-black text-[9px] text-retro-orange tracking-widest uppercase relative z-10 bg-base-black/70 px-2 py-0.5 rounded border border-retro-orange/20">
              [ CAMERA FEED ACTIVE ]
            </p>
            <p className="font-retro-mono text-[8px] text-base-white/50 uppercase mt-2.5 text-center leading-relaxed max-w-xs relative z-10">
              Silakan masukkan payload absen secara manual atau tekan tombol simulator generator di bawah.
            </p>
          </div>

          {/* Form Input */}
          <form onSubmit={handleScanSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="block text-[9px] font-black uppercase tracking-wider text-base-black">
                🔑 KODE QR PAYLOAD (TOKEN SESI)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={qrCodeData}
                  onChange={(e) => setQrCodeData(e.target.value)}
                  placeholder="Masukkan token absensi (e.g. CLASSROOM_SESSION_XXX)"
                  className="block w-full py-2 px-3 bg-base-white border-2 border-base-black rounded-retro text-xs font-retro-mono focus:outline-none focus:ring-4 focus:ring-retro-purple/20 focus:border-retro-purple transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={simulateQuickScan}
                  className="retro-btn bg-retro-yellow text-base-black text-xs py-2 px-4 flex items-center gap-1.5 flex-shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>GENERATE</span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || !qrCodeData}
              className={`retro-btn w-full py-3.5 flex items-center justify-center gap-2 ${
                submitting || !qrCodeData ? 'opacity-40 cursor-not-allowed shadow-none' : 'bg-base-black text-base-white hover:bg-retro-purple'
              }`}
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-base-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <CheckSquare className="w-4.5 h-4.5" />
              )}
              <span>KIRIM DATA KEHADIRAN</span>
            </button>
          </form>
        </RetroCard>
      </motion.div>
    </div>
  );
}
