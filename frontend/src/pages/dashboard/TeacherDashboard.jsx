import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, BookOpen, CalendarCheck, Bell, Clock, CheckCircle2,
  AlertCircle, X, Plus, RefreshCw, Settings, Sparkles, Star,
  Zap, QrCode, Download, ChevronRight, MapPin, ArrowRight,
  Activity, TrendingUp, BarChart3
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Toast from '../../components/ui/Toast';

// ═══════════════════════════════════════════════════════════
// 🎨 ANIMATION VARIANTS
// ═══════════════════════════════════════════════════════════
const pageVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.1 } }
};

const cardVariants = {
  hidden: { opacity: 0, y: 24, rotate: -0.5 },
  visible: {
    opacity: 1, y: 0, rotate: 0,
    transition: { type: 'spring', stiffness: 90, damping: 14 }
  }
};

const floatVariants = {
  animate: {
    y: [0, -8, 0],
    transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' }
  }
};

// ═══════════════════════════════════════════════════════════
// 🃏 STAT CARD COMPONENT
// ═══════════════════════════════════════════════════════════
function StatCard({ label, value, icon: Icon, accent, trend, onClick }) {
  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -4, scale: 1.02 }}
      onClick={onClick}
      className="retro-card bg-base-white border-4 border-base-black p-5 relative overflow-hidden cursor-pointer group hover:shadow-[6px_6px_0px_0px_#FF5C00] transition-shadow"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-retro border-2 border-base-black`} style={{ background: `${accent}20` }}>
          <Icon className="w-5 h-5" style={{ color: accent }} />
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-black ${trend >= 0 ? 'text-success' : 'text-danger'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="retro-heading retro-heading-lg" style={{ color: accent }}>{value}</p>
      <p className="font-retro-mono text-[10px] text-base-black/60 uppercase tracking-wide mt-1">{label}</p>
      <div className="absolute top-2 right-2 w-2 h-2 bg-retro-yellow border border-base-black rounded-sm rotate-45" />
      <ChevronRight className="absolute bottom-3 right-3 w-4 h-4 text-base-black/20 group-hover:text-retro-orange transition-colors" />
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════
// ⚡ QUICK ACTION BUTTON
// ═══════════════════════════════════════════════════════════
function QuickAction({ label, description, icon: Icon, accent, badge, onClick }) {
  return (
    <motion.button
      whileHover={{ x: 5 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 retro-card bg-base-white border-2 border-base-black hover:border-retro-orange transition-colors group text-left"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-retro border-2 border-base-black" style={{ background: `${accent}18` }}>
          <Icon className="w-4 h-4" style={{ color: accent }} />
        </div>
        <div>
          <p className="font-retro-mono text-xs font-black text-base-black">{label}</p>
          {description && <p className="font-retro-mono text-[9px] text-base-black/50 mt-0.5">{description}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {badge > 0 && (
          <span className="px-2 py-0.5 rounded-full bg-danger text-base-white text-[10px] font-black">{badge}</span>
        )}
        <ArrowRight className="w-4 h-4 text-base-black/30 group-hover:text-retro-orange transition-colors" />
      </div>
    </motion.button>
  );
}

// ═══════════════════════════════════════════════════════════
// 🌟 FLOATING DECORATIONS
// ═══════════════════════════════════════════════════════════
function TeacherDecorations() {
  return (
    <>
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          variants={floatVariants}
          animate="animate"
          className="absolute hidden xl:block pointer-events-none"
          style={{ top: `${8 + i * 14}%`, left: `${2 + i * 12}%`, animationDelay: `${i * 0.6}s` }}
        >
          <Star className={`w-${3 + (i % 3)} h-${3 + (i % 3)} text-retro-yellow fill-retro-yellow opacity-60`} />
        </motion.div>
      ))}
      <motion.div variants={floatVariants} animate="animate" className="absolute top-12 right-16 hidden lg:block pointer-events-none text-3xl">👨‍🏫</motion.div>
      <div className="absolute inset-0 bg-retro-grid opacity-20 pointer-events-none" />
    </>
  );
}

// ═══════════════════════════════════════════════════════════
// 🎯 MAIN COMPONENT — TEACHER DASHBOARD (HOME ONLY)
// ═══════════════════════════════════════════════════════════
export default function TeacherDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [toast, setToast] = useState(null);
  const [isQROpen, setIsQROpen] = useState(false);
  const [qrCode, setQrCode] = useState('');

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // ─── DATA QUERIES ─────────────────────────────────────────
  const { data: dashboard, isLoading, isError, refetch } = useQuery({
    queryKey: ['teacher-dashboard', user?.id],
    queryFn: () => api.get('/teacher/dashboard'),
    staleTime: 5 * 60 * 1000,
  });

  const { data: todaySessions } = useQuery({
    queryKey: ['teacher-sessions-today'],
    queryFn: () => api.get('/teacher/attendance/sessions', {
      params: { date: new Date().toISOString().split('T')[0], status: 'active' }
    }),
    enabled: !!user,
  });

  const { data: pendingPermissions } = useQuery({
    queryKey: ['teacher-permissions-pending'],
    queryFn: () => api.get('/teacher/permissions', { params: { status: 'pending' } }),
    enabled: !!user,
  });

  const { data: todaySchedule } = useQuery({
    queryKey: ['teacher-schedule-today'],
    queryFn: () => api.get('/teacher/schedule/today'),
    enabled: !!user,
  });

  // ─── MUTATIONS ────────────────────────────────────────────
  const generateFromSchedule = useMutation({
    mutationFn: (scheduleId) => api.post(`/teacher/attendance/generate/${scheduleId}`),
    onSuccess: (res) => {
      if (res?.data?.code) {
        setQrCode(res.data.code);
        setIsQROpen(true);
        queryClient.invalidateQueries({ queryKey: ['teacher-sessions-today'] });
        showToast('✅ Sesi absensi dibuat dari jadwal!', 'success');
      }
    },
    onError: (err) => showToast(`❌ ${err.response?.data?.message || 'Gagal membuat sesi'}`, 'error')
  });

  // ─── KEYBOARD SHORTCUTS ───────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && !e.altKey) {
        if (e.key.toLowerCase() === 'r') { e.preventDefault(); refetch(); showToast('🔄 Data diperbarui!', 'info'); }
        if (e.key.toLowerCase() === 'a') { e.preventDefault(); navigate('/dashboard/teacher/attendance'); }
        if (e.key.toLowerCase() === 's') { e.preventDefault(); navigate('/dashboard/teacher/students'); }
        if (e.key.toLowerCase() === 'i') { e.preventDefault(); navigate('/dashboard/teacher/permissions'); }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate, refetch, showToast]);

  // ─── DERIVED ──────────────────────────────────────────────
  const stats = dashboard?.data?.stats || {};
  const activeSession = todaySessions?.data?.[0];
  const pendingCount = pendingPermissions?.data?.length || 0;
  const scheduleToday = todaySchedule?.data || [];

  // ─── LOADING STATE ────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 retro-card bg-retro-blue border-4 border-base-black flex items-center justify-center">
          <Users className="w-8 h-8 text-base-white" />
        </motion.div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="retro-card bg-base-white border-4 border-danger p-8 text-center">
          <AlertCircle className="w-12 h-12 text-danger mx-auto mb-3" />
          <p className="retro-heading text-base-black mb-4">Gagal memuat data</p>
          <Button onClick={refetch}>Muat Ulang</Button>
        </div>
      </div>
    );
  }

  // ─── RENDER ───────────────────────────────────────────────
  return (
    <motion.div variants={pageVariants} initial="hidden" animate="visible"
      className="relative min-h-screen space-y-6">

      <TeacherDecorations />

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="fixed top-24 right-6 z-50">
            <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HEADER ─────────────────────────────────────────── */}
      <motion.div variants={cardVariants} className="retro-card bg-base-white border-4 border-base-black p-6 relative">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="retro-heading retro-heading-xl text-retro-blue flex items-center gap-3">
              <Users className="w-8 h-8" /> Dashboard Guru
            </h1>
            <p className="font-retro-mono text-sm text-base-black/70 mt-2">
              Selamat datang kembali, <span className="font-black text-retro-orange">{user?.name}</span> 👨‍🏫
            </p>
            <p className="font-retro-mono text-[10px] text-base-black/40 mt-1">
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="retro-card bg-retro-yellow/20 border-2 border-retro-yellow px-4 py-2">
              <span className="font-retro-mono text-xs text-base-black font-black">
                📊 {stats.total_classes || 0} Kelas • {stats.total_students || 0} Siswa
              </span>
            </div>
            <motion.button whileHover={{ rotate: 180 }} whileTap={{ scale: 0.9 }}
              onClick={() => { refetch(); showToast('🔄 Data diperbarui!', 'info'); }}
              className="p-2 retro-btn retro-btn-sm" title="Refresh (Ctrl+R)">
              <RefreshCw className="w-4 h-4" />
            </motion.button>
          </div>
        </div>

        <motion.div
          initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.3 }}
          className="absolute -top-3 -right-3">
          <div className="retro-sticker bg-retro-lime text-base-black text-[10px] px-3 py-1 font-black uppercase tracking-wider">
            TEACHER ✨
          </div>
        </motion.div>
      </motion.div>

      {/* ── STAT CARDS ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Siswa" value={stats.total_students || 0} icon={Users} accent="#6C5CE7" trend={5}
          onClick={() => navigate('/dashboard/teacher/students')} />
        <StatCard label="Kelas Diampu" value={stats.total_classes || 0} icon={BookOpen} accent="#2E2BBF"
          onClick={() => navigate('/dashboard/teacher/schedules')} />
        <StatCard label="Absensi Hari Ini" value={`${stats.today_attendance_rate || 0}%`} icon={CalendarCheck} accent="#00B894" trend={stats.today_attendance_trend}
          onClick={() => navigate('/dashboard/teacher/attendance')} />
        <StatCard label="Izin Pending" value={pendingCount} icon={Bell} accent="#E17055"
          onClick={() => navigate('/dashboard/teacher/permissions')} />
      </div>

      {/* ── MAIN GRID ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Active Session Preview */}
        <motion.div variants={cardVariants} className="lg:col-span-2 retro-card bg-base-white border-4 border-base-black p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="retro-heading retro-heading-sm text-base-black flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-retro-orange" /> Sesi Absensi Hari Ini
            </h3>
            <button onClick={() => navigate('/dashboard/teacher/attendance')}
              className="font-retro-mono text-[10px] text-retro-orange hover:underline flex items-center gap-1">
              Kelola Absensi <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {activeSession ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 retro-card bg-retro-orange/10 border-2 border-retro-orange">
                {[
                  { label: 'Kelas', value: activeSession.class?.name },
                  { label: 'Mapel', value: activeSession.subject?.name },
                  { label: 'Waktu', value: `${activeSession.start_time} - ${activeSession.end_time}` },
                  { label: 'Hadir', value: `${activeSession.attended_count || 0} / ${activeSession.total_students || 0}` },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="font-retro-mono text-[10px] text-base-black/50">{label}</p>
                    <p className="font-retro-display font-black text-base-black text-sm">{value}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" onClick={() => { setQrCode(activeSession.code); setIsQROpen(true); }}>
                  <QrCode className="w-4 h-4 mr-1" /> Tampilkan QR
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/teacher/attendance')}>
                  <Activity className="w-4 h-4 mr-1" /> Monitor Live
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-10">
              <CalendarCheck className="w-14 h-14 text-base-black/20 mx-auto mb-3" />
              <p className="font-retro-mono text-base-black/50 mb-5">Belum ada sesi absensi aktif hari ini</p>
              <Button onClick={() => navigate('/dashboard/teacher/attendance')} className="inline-flex items-center gap-2">
                <Plus className="w-4 h-4" /> Buat Sesi Baru
              </Button>
            </div>
          )}
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={cardVariants} className="retro-card bg-base-white border-4 border-base-black p-5">
          <h3 className="retro-heading retro-heading-sm text-base-black mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-retro-yellow" /> Quick Actions
          </h3>
          <div className="space-y-2">
            <QuickAction
              label="Manajemen Absensi"
              description="Buat sesi & generate QR"
              icon={QrCode}
              accent="#FF5C00"
              onClick={() => navigate('/dashboard/teacher/attendance')}
            />
            <QuickAction
              label="Persetujuan Izin"
              description="Tinjau permohonan siswa"
              icon={Bell}
              accent="#E17055"
              badge={pendingCount}
              onClick={() => navigate('/dashboard/teacher/permissions')}
            />
            <QuickAction
              label="Data Siswa"
              description="Pantau perkembangan kelas"
              icon={Users}
              accent="#6C5CE7"
              onClick={() => navigate('/dashboard/teacher/students')}
            />
            <QuickAction
              label="Jadwal Mengajar"
              description="Lihat kalender kelas"
              icon={CalendarCheck}
              accent="#2E2BBF"
              onClick={() => navigate('/dashboard/teacher/schedules')}
            />
            <QuickAction
              label="Pengaturan"
              description="Profil & preferensi akun"
              icon={Settings}
              accent="#00B894"
              onClick={() => navigate('/dashboard/teacher/settings')}
            />
          </div>
        </motion.div>
      </div>

      {/* ── SCHEDULE + RECENT PERMISSIONS ──────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Today's Schedule Preview */}
        <motion.div variants={cardVariants} className="retro-card bg-base-white border-4 border-base-black p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="retro-heading retro-heading-sm text-base-black flex items-center gap-2">
              <Clock className="w-5 h-5 text-retro-blue" /> Jadwal Hari Ini
            </h3>
            <button onClick={() => navigate('/dashboard/teacher/schedules')}
              className="font-retro-mono text-[10px] text-retro-orange hover:underline flex items-center gap-1">
              Lihat Semua <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {scheduleToday.length > 0 ? (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {scheduleToday.slice(0, 4).map((sched, idx) => (
                <div key={sched.id} className={`p-3 rounded-retro border-2 border-base-black flex items-center justify-between gap-2 ${idx === 0 ? 'bg-retro-orange/10 border-retro-orange' : 'bg-base-white hover:bg-retro-yellow/10'}`}>
                  <div>
                    <p className="font-retro-display font-black text-sm">{sched.subject?.name}</p>
                    <p className="font-retro-mono text-[10px] text-base-black/50">{sched.class?.name} • {sched.start_time}–{sched.end_time}</p>
                  </div>
                  {idx === 0 && (
                    <Button size="sm" onClick={() => generateFromSchedule.mutate(sched.id)} disabled={generateFromSchedule.isLoading}>
                      <Sparkles className="w-3 h-3 mr-1" /> Gen QR
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="font-retro-mono text-sm text-base-black/50 text-center py-6">📭 Tidak ada jadwal hari ini</p>
          )}
        </motion.div>

        {/* Pending Permissions Preview */}
        <motion.div variants={cardVariants} className="retro-card bg-base-white border-4 border-base-black p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="retro-heading retro-heading-sm text-base-black flex items-center gap-2">
              <Bell className="w-5 h-5 text-warning" /> Izin Menunggu
              {pendingCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-danger text-base-white text-[10px] font-black">{pendingCount}</span>
              )}
            </h3>
            <button onClick={() => navigate('/dashboard/teacher/permissions')}
              className="font-retro-mono text-[10px] text-retro-orange hover:underline flex items-center gap-1">
              Proses Semua <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {pendingCount > 0 ? (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {(pendingPermissions?.data || []).slice(0, 3).map((perm) => (
                <div key={perm.id} className="p-3 border-2 border-base-black border-dashed rounded-retro flex items-center justify-between gap-3 hover:border-retro-orange hover:bg-retro-orange/5 transition-colors">
                  <div>
                    <p className="font-retro-display font-black text-sm">{perm.student?.name}</p>
                    <p className="font-retro-mono text-[10px] text-base-black/50">
                      {perm.type} • {new Date(perm.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <Button size="sm" onClick={() => navigate('/dashboard/teacher/permissions')}>
                    Tinjau
                  </Button>
                </div>
              ))}
              {pendingCount > 3 && (
                <button onClick={() => navigate('/dashboard/teacher/permissions')}
                  className="w-full text-center font-retro-mono text-xs text-retro-orange hover:underline py-2">
                  +{pendingCount - 3} izin lainnya menunggu →
                </button>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <CheckCircle2 className="w-12 h-12 text-success/50 mx-auto mb-2" />
              <p className="font-retro-mono text-sm text-base-black/50">🎉 Semua izin telah diproses</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* ── QR Modal ───────────────────────────────────────── */}
      <Modal isOpen={isQROpen} onClose={() => setIsQROpen(false)} title="🎯 QR Code Absensi" maxWidth="sm">
        <div className="text-center p-6">
          <div className="w-56 h-56 bg-base-gray border-4 border-base-black mx-auto mb-4 flex items-center justify-center font-retro-display text-5xl font-black rounded-retro">
            {qrCode}
          </div>
          <p className="font-retro-mono text-sm text-base-black/70 mb-4">Minta siswa pindai kode QR atau masukkan kode secara manual</p>
          <Button onClick={() => navigate('/dashboard/teacher/attendance')} className="w-full">
            <Activity className="w-4 h-4 mr-2" /> Monitor Sesi Lengkap
          </Button>
        </div>
      </Modal>
    </motion.div>
  );
}