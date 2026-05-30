import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, CheckCircle, AlertTriangle, Clock, RefreshCw, QrCode, Sparkles } from 'lucide-react';
import studentApi from '../../../api/student';
import { motion } from 'framer-motion';
import { PageHeader, StatGrid, RetroCard } from '../../../components/ui/RetroLayouts';

// 🎨 ANIMATION VARIANTS
const cardVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 15 } 
  }
};

export default function StudentAttendancePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [todayStatus, setTodayStatus] = useState(null);
  const [error, setError] = useState(null);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [statsRes, historyRes, todayRes] = await Promise.all([
        studentApi.getAttendanceStats().catch(() => ({ status: 'success', data: { summary: { total: 0, hadir: 0, sakit: 0, izin: 0, alpha: 0, terlambat: 0 }, percentage: { hadir: 100 } } })),
        studentApi.getAttendanceHistory().catch(() => ({ status: 'success', data: { data: [] } })),
        studentApi.getTodayAttendance().catch(() => ({ status: 'success', data: null }))
      ]);

      setStats(statsRes.data);
      setHistory(historyRes.data?.data || []);
      setTodayStatus(todayRes.data);
    } catch (err) {
      console.error(err);
      setError('Gagal memuat data absensi dari server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceData();
  }, []);

  if (loading && !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] retro-card bg-base-white p-8 shadow-hard">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 retro-card bg-retro-purple border-4 border-base-black flex items-center justify-center mb-4"
        >
          <Calendar className="w-8 h-8 text-base-white animate-pulse" />
        </motion.div>
        <p className="font-retro-display font-black text-xs text-base-black uppercase tracking-widest animate-pulse">
          Mengambil Data Presensi...
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
        <h3 className="retro-heading text-lg mb-2">Oops! Gagal Memuat Absensi</h3>
        <p className="font-retro-mono text-xs font-black text-base-black/70 uppercase tracking-widest mb-4">
          {error}
        </p>
        <button
          onClick={fetchAttendanceData}
          className="retro-btn flex items-center gap-2 bg-base-black text-base-white hover:bg-retro-orange py-2 px-4"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  const summary = stats?.summary || { total: 0, hadir: 0, sakit: 0, izin: 0, alpha: 0, terlambat: 0 };
  const percentage = stats?.percentage?.hadir || 0;

  return (
    <div className="space-y-6">
      
      {/* ── Page Header ──────────────────────────────────── */}
      <PageHeader 
        title="Absensi Mandiri"
        icon={Calendar}
        description="Pantau statistik kehadiran harian Anda dan pastikan rekam jejak kedisiplinan Anda tetap optimal."
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard/student' },
          { label: 'Absensi', path: '/dashboard/student/attendance' }
        ]}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/dashboard/student/qrscan')}
              className="retro-btn flex items-center gap-2 bg-retro-yellow text-base-black text-xs py-2.5 px-4 shadow-hard-sm"
            >
              <QrCode className="w-4.5 h-4.5" />
              <span>SCAN QR PRESENSI</span>
            </button>
            <button
              onClick={fetchAttendanceData}
              className="p-2.5 bg-base-white hover:bg-base-gray text-base-black border-2 border-base-black rounded-retro shadow-hard-sm active:translate-x-[1px] active:translate-y-[1px] transition-all"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        }
      />

      {/* ── Today's Status Banner ────────────────────────── */}
      {todayStatus ? (
        <motion.div 
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="retro-card p-4 border-4 border-base-black bg-retro-lime/10 flex items-center gap-3 shadow-hard-sm"
        >
          <div className="w-10 h-10 border-2 border-base-black bg-base-white rounded-retro flex items-center justify-center shadow-hard-sm text-success">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[8px] font-retro-mono font-black uppercase tracking-wider text-base-black/50">
              Status Presensi Hari Ini:
            </p>
            <p className="text-xs font-retro-display font-black text-base-black uppercase mt-0.5">
              SUDAH PRESENSI ({todayStatus.status}) — CHECK-IN: {todayStatus.check_in_time || '—'}
            </p>
          </div>
        </motion.div>
      ) : (
        <motion.div 
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="retro-card p-4 border-4 border-base-black bg-retro-pink/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-hard-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 border-2 border-base-black bg-base-white rounded-retro flex items-center justify-center shadow-hard-sm text-danger animate-bounce">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[8px] font-retro-mono font-black uppercase tracking-wider text-base-black/50">
                Status Presensi Hari Ini:
              </p>
              <p className="text-xs font-retro-display font-black text-base-black uppercase mt-0.5">
                BELUM MELAKUKAN PRESENSI HARI INI
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/dashboard/student/qrscan')}
            className="retro-btn bg-base-black text-base-white text-[9px] py-1.5 px-3"
          >
            PRESENSI SEKARANG →
          </button>
        </motion.div>
      )}

      {/* ── Stats Grid ───────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <StatBox label="Hadir" value={summary.hadir} color="border-retro-lime bg-retro-lime/5 text-retro-lime" />
        <StatBox label="Terlambat" value={summary.terlambat} color="border-retro-yellow bg-retro-yellow/5 text-retro-orange" />
        <StatBox label="Izin" value={summary.izin} color="border-retro-purple bg-retro-purple/5 text-retro-purple" />
        <StatBox label="Sakit" value={summary.sakit} color="border-retro-blue bg-retro-blue/5 text-retro-blue" />
        <StatBox label="Alpha" value={summary.alpha} color="border-retro-pink bg-retro-pink/5 text-retro-pink" />
      </div>

      {/* ── Main Content Split ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Presensi Visualizer (Left Column) */}
        <div className="lg:col-span-1">
          <RetroCard variant="white" className="h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b-4 border-base-black pb-3 mb-4">
                <h3 className="font-retro-display font-black text-base-black uppercase tracking-tight text-xs flex items-center gap-1.5">
                  <span>📈</span> Presensi Chart
                </h3>
                <Sparkles className="w-4 h-4 text-retro-yellow fill-retro-yellow" />
              </div>
              
              <div className="flex flex-col items-center justify-center py-6 bg-base-black rounded-retro border-4 border-base-black relative overflow-hidden shadow-hard">
                <div className="absolute inset-0 bg-retro-grid opacity-15 pointer-events-none" />
                <svg viewBox="0 0 100 100" className="w-36 h-36 relative z-10">
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#222" strokeWidth="10" />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#B8F64E"
                    strokeWidth="10"
                    strokeDasharray={`${percentage * 2.51} 251`}
                    strokeDashoffset="0"
                    transform="rotate(-90 50 50)"
                    strokeLinecap="round"
                  />
                  <text x="50" y="55" textAnchor="middle" fill="#fff" fontSize="16" fontWeight="bold" fontFamily="monospace">
                    {percentage}%
                  </text>
                </svg>
                <div className="text-base-white text-center font-retro-mono text-[8px] uppercase tracking-widest mt-4 relative z-10 leading-none">
                  ⚡ KUALITAS DISIPLIN MATRIX ⚡
                </div>
              </div>
            </div>
          </RetroCard>
        </div>

        {/* History Log (Right Column) */}
        <div className="lg:col-span-2">
          <RetroCard variant="white" className="h-full">
            <div className="flex items-center justify-between border-b-4 border-base-black pb-3 mb-4">
              <h3 className="font-retro-display font-black text-base-black uppercase tracking-tight text-xs flex items-center gap-1.5">
                <span>📅</span> Riwayat Kehadiran Terakhir
              </h3>
              <span className="retro-sticker text-[7px] px-1.5 py-0.5 bg-retro-purple text-base-white font-black">LOG DATA</span>
            </div>

            {history.length === 0 ? (
              <div className="text-center py-16 border-4 border-dashed border-base-black/20 rounded-retro bg-base-cream/20">
                <Calendar className="w-12 h-12 mx-auto text-base-black/20 mb-2" />
                <p className="text-[10px] font-retro-mono font-bold uppercase text-base-black/40">
                  Belum ada riwayat presensi tercatat
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto border-2 border-base-black rounded-retro">
                <table className="w-full text-left border-collapse overflow-hidden">
                  <thead>
                    <tr className="bg-base-gray border-b-2 border-base-black text-[9px] font-retro-display font-black uppercase tracking-wider text-base-black">
                      <th className="py-3 px-4 border-r-2 border-base-black w-32">Tanggal</th>
                      <th className="py-3 px-4 border-r-2 border-base-black">Jam</th>
                      <th className="py-3 px-4 border-r-2 border-base-black">Status</th>
                      <th className="py-3 px-4 text-right">Lokasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-base-black/15 font-retro-mono text-[11px] font-bold">
                    {history.map((h, i) => (
                      <tr key={h.id || i} className="hover:bg-retro-yellow/5 transition-colors">
                        <td className="py-3 px-4 border-r-2 border-base-black/15 text-base-black">{h.date}</td>
                        <td className="py-3 px-4 border-r-2 border-base-black/15 text-base-black/60">{h.time || '—'}</td>
                        <td className="py-3 px-4 border-r-2 border-base-black/15">
                          <span className={`px-2 py-0.5 border-2 border-base-black rounded text-[8px] font-retro-mono font-black uppercase shadow-hard-sm ${
                            h.status === 'Hadir' ? 'bg-retro-lime text-base-black border-base-black' :
                            h.status === 'Terlambat' ? 'bg-retro-yellow text-base-black border-base-black' :
                            h.status === 'Izin' ? 'bg-retro-purple text-base-white border-base-black' :
                            h.status === 'Sakit' ? 'bg-retro-blue text-base-white border-base-black' :
                            'bg-retro-pink text-base-white border-base-black'
                          }`}>
                            {h.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-base-black/50 text-[10px] truncate max-w-[150px]" title={h.location}>
                          {h.location || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </RetroCard>
        </div>

      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 🧩 Sub-Component: StatBox (Clean Neobrutalist design)
// ─────────────────────────────────────────────────────────────

function StatBox({ label, value, color }) {
  return (
    <motion.div 
      whileHover={{ y: -3, scale: 1.02 }}
      className={`border-4 border-base-black p-4 rounded-retro shadow-hard-sm text-center transition-all ${color}`}
    >
      <div className="font-retro-display font-black text-xl leading-none">{value}</div>
      <div className="text-[8px] font-retro-mono font-black uppercase tracking-widest mt-2 text-base-black/60 leading-none">{label}</div>
    </motion.div>
  );
}
