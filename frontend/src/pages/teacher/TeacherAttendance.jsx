import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarCheck, Plus, QrCode, RefreshCw, X, Clock,
  CheckCircle2, Activity, ChevronDown, ChevronUp, Sparkles,
  RotateCcw, Users, AlertCircle, BookOpen, Play
} from 'lucide-react';
import { api } from '../../api';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Toast from '../../components/ui/Toast';
import QRCodeDisplay from '../../components/ui/QRCodeDisplay';

const cardV = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } } };
const pageV = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };

// ─── Status badge helper ───────────────────────────────────
function StatusBadge({ status, isActive }) {
  const cfg = {
    active:   { label: '● AKTIF',    bg: '#00B894' },
    reopened: { label: '↺ DIBUKA',   bg: '#6C5CE7' },
    closed:   { label: '○ SELESAI',  bg: '#636e72' },
    expired:  { label: '✕ EXPIRED',  bg: '#E17055' },
  };
  const s = cfg[status] || (isActive ? cfg.active : cfg.closed);
  return (
    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase border-2 border-base-black"
      style={{ background: `${s.bg}20`, color: s.bg, borderColor: s.bg }}>
      {s.label}
    </span>
  );
}

// ─── Session row ───────────────────────────────────────────
function SessionRow({ session, onShowQR, onGenQR, onClose, onReopen }) {
  const [expanded, setExpanded] = useState(false);
  const queryClient = useQueryClient();
  const isActive = session.is_active;
  const status = session.session_status || (isActive ? 'active' : 'closed');

  // Load detailed real-time monitoring when expanded
  const { data: monitorData, isLoading: isMonitoring } = useQuery({
    queryKey: ['attendance-session-monitor', session.id],
    queryFn: () => api.get(`/teacher/attendance/session/${session.id}/monitor`, { params: { include_students: 1 } }),
    enabled: expanded,
    refetchInterval: isActive ? 10000 : false, // Poll every 10 seconds for live active monitoring!
  });

  const monitor = monitorData?.data || {};
  const studentAttendances = monitor.attendances || [];

  // Mutation to manually verify/modify student attendance status
  const updateStatus = useMutation({
    mutationFn: ({ attendanceId, newStatus }) => 
      api.patch(`/teacher/attendance/${attendanceId}/verify`, { status: newStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-session-monitor', session.id] });
      queryClient.invalidateQueries({ queryKey: ['teacher-attendance-sessions'] });
    }
  });

  return (
    <div className={`border-4 border-base-black rounded-retro overflow-hidden ${isActive ? 'shadow-[4px_4px_0px_0px_#FF5C00]' : 'shadow-[2px_2px_0px_0px_#111]'}`}>
      <div className={`p-4 flex flex-wrap items-center justify-between gap-3 ${isActive ? 'bg-retro-orange/10' : 'bg-base-white'}`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-retro border-2 border-base-black ${isActive ? 'bg-retro-orange text-base-white' : 'bg-base-gray'}`}>
            <CalendarCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-retro-display font-black">{session.subject?.name || 'Sesi Absensi'}</p>
              <StatusBadge status={status} isActive={isActive} />
            </div>
            <p className="font-retro-mono text-[10px] text-base-black/60">
              {session.class?.name} • {session.start_time || session.schedule?.start_time || '—'}–{session.end_time || session.schedule?.end_time || '—'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {isActive ? (
            <>
              <Button size="sm" onClick={() => onShowQR(session)}>
                <QrCode className="w-4 h-4 mr-1" />QR
              </Button>
              <Button size="sm" variant="outline" onClick={() => onGenQR(session.id)}>
                <RefreshCw className="w-4 h-4 mr-1" />Baru
              </Button>
              <Button size="sm" variant="danger" onClick={() => onClose(session.id)}>
                <X className="w-4 h-4 mr-1" />Tutup
              </Button>
            </>
          ) : (
            <Button size="sm" variant="outline" onClick={() => onReopen(session)}>
              <RotateCcw className="w-4 h-4 mr-1" />Buka Ulang
            </Button>
          )}
          <button onClick={() => setExpanded(v => !v)} className="p-2 border-2 border-base-black rounded-retro hover:bg-base-gray/20">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="border-t-2 border-dashed border-base-black">
            
            {/* Quick Stats Grid */}
            <div className="p-4 grid grid-cols-2 sm:grid-cols-5 gap-4 bg-base-gray/10 border-b border-dashed border-base-black">
              {[
                ['Hadir', monitor.attended_count ?? session.attended_count ?? 0, '#00B894'],
                ['Terlambat', monitor.late_count ?? session.late_count ?? 0, '#E17055'],
                ['Total Siswa', monitor.total_students ?? session.total_students ?? 0, '#2E2BBF'],
                ['Kode', session.code || '—', '#6C5CE7'],
                ['Dibuat', new Date(session.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }), '#636e72'],
              ].map(([l, v, c]) => (
                <div key={l}>
                  <p className="font-retro-mono text-[10px] text-base-black/50">{l}</p>
                  <p className="font-retro-display font-black text-lg" style={{ color: c }}>{v}</p>
                </div>
              ))}
            </div>

            {/* Student Check-in List (Real-Time Monitor) */}
            <div className="p-4 bg-base-white space-y-3">
              <h4 className="font-retro-display font-black text-xs text-base-black uppercase tracking-wider flex items-center gap-1.5">
                🟢 Live Monitor Kehadiran {isActive && <span className="w-2 h-2 rounded-full bg-success animate-ping" />}
              </h4>
              
              {isMonitoring ? (
                <div className="text-center py-6 font-retro-mono text-xs text-base-black/40">
                  Mengambil data realtime...
                </div>
              ) : studentAttendances.length > 0 ? (
                <div className="overflow-x-auto rounded-retro border-2 border-base-black">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-base-gray font-retro-mono text-[10px] text-base-black uppercase border-b-2 border-base-black">
                        <th className="p-2">Siswa</th>
                        <th className="p-2">Waktu</th>
                        <th className="p-2">Status</th>
                        <th className="p-2">Device</th>
                        <th className="p-2 text-right">Verifikasi Manual</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y border-base-black/20 font-retro-mono text-xs">
                      {studentAttendances.map((att) => {
                        const avatarUrl = att.user?.avatar_url || 'https://api.dicebear.com/7.x/pixel-art/svg';
                        return (
                          <tr key={att.id} className="hover:bg-retro-yellow/5">
                            <td className="p-2 flex items-center gap-2 min-w-[150px]">
                              <img src={avatarUrl} alt="Avatar" className="w-6 h-6 rounded-full border border-base-black/30" />
                              <span className="font-bold text-base-black">{att.user?.name}</span>
                            </td>
                            <td className="p-2 text-base-black/70">
                              {att.check_in_time ? att.check_in_time.slice(0, 5) : '—'}
                            </td>
                            <td className="p-2">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border-2 ${
                                att.status === 'Hadir' ? 'bg-success/15 border-success text-success' :
                                att.status === 'Terlambat' ? 'bg-retro-orange/15 border-retro-orange text-retro-orange' :
                                'bg-danger/15 border-danger text-danger'
                              }`}>
                                {att.status}
                              </span>
                            </td>
                            <td className="p-2 text-base-black/60 capitalize">
                              {att.device || 'web'}
                            </td>
                            <td className="p-2 text-right min-w-[120px]">
                              <select 
                                value={att.status}
                                onChange={(e) => updateStatus.mutate({ attendanceId: att.id, newStatus: e.target.value })}
                                disabled={updateStatus.isPending}
                                className="px-2 py-1 rounded border-2 border-base-black font-retro-mono text-[10px] bg-white text-base-black focus:outline-none focus:border-retro-blue"
                              >
                                <option value="Hadir">Hadir</option>
                                <option value="Terlambat">Terlambat</option>
                                <option value="Izin">Izin</option>
                                <option value="Sakit">Sakit</option>
                                <option value="Alpha">Alpha</option>
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 border-2 border-dashed border-base-black/20 rounded-retro bg-base-gray/5 font-retro-mono text-xs text-base-black/50">
                  Belum ada siswa yang melakukan presensi untuk sesi ini
                </div>
              )}
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────
export default function TeacherAttendance() {
  const queryClient = useQueryClient();
  const [toast, setToast] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isQROpen, setIsQROpen] = useState(false);
  const [isReopenOpen, setIsReopenOpen] = useState(false);
  const [activeSession, setActiveSession] = useState(null);   // session object for QR display
  const [reopenTarget, setReopenTarget] = useState(null);
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState('');
  const [form, setForm] = useState({
    class_id: '', subject_id: '', date: new Date().toISOString().split('T')[0],
    start_time: '07:00', end_time: '08:30', location: ''
  });
  const [reopenForm, setReopenForm] = useState({ extra_minutes: 15, notes: '' });

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // ─── Queries ───────────────────────────────────────────
  const { data: sessionsData, isLoading, refetch } = useQuery({
    queryKey: ['teacher-attendance-sessions', dateFilter, statusFilter],
    queryFn: () => api.get('/teacher/attendance/sessions', {
      params: { date: dateFilter, status: statusFilter || undefined }
    }),
    refetchInterval: 30000, // Auto-refresh every 30s for live monitoring
  });

  const { data: classesData } = useQuery({
    queryKey: ['teacher-classes'],
    queryFn: () => api.get('/teacher/classes'),
  });

  const { data: subjectsData } = useQuery({
    queryKey: ['teacher-subjects'],
    queryFn: () => api.get('/teacher/subjects'),
  });

  const { data: todayScheduleData } = useQuery({
    queryKey: ['teacher-schedule-today'],
    queryFn: () => api.get('/teacher/schedule/today'),
  });

  // ─── Mutations ─────────────────────────────────────────
  const createSession = useMutation({
    mutationFn: (data) => api.post('/teacher/attendance/sessions', data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['teacher-attendance-sessions'] });
      setIsCreateOpen(false);
      showToast('✅ Sesi berhasil dibuat!');
      // Auto-open QR for new session
      if (res?.data) {
        setActiveSession(res.data);
        setIsQROpen(true);
      }
    },
    onError: (e) => showToast(`❌ ${e.message || 'Gagal membuat sesi'}`, 'error'),
  });

  const generateFromSchedule = useMutation({
    mutationFn: (scheduleId) => api.post(`/teacher/attendance/generate/${scheduleId}`),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['teacher-attendance-sessions'] });
      if (res?.data) { setActiveSession(res.data); setIsQROpen(true); }
      showToast('✅ Sesi dibuat dari jadwal!');
    },
    onError: (e) => showToast(`❌ ${e.message || 'Gagal buat sesi dari jadwal'}`, 'error'),
  });

  const generateQR = useMutation({
    mutationFn: (id) => api.post(`/teacher/attendance/sessions/${id}/generate-code`),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['teacher-attendance-sessions'] });
      if (res?.data?.code && activeSession) {
        setActiveSession(prev => ({ ...prev, code: res.data.code }));
      }
      showToast('✅ QR Code baru digenerate!');
    },
    onError: () => showToast('❌ Gagal generate QR', 'error'),
  });

  const closeSession = useMutation({
    mutationFn: (id) => api.post(`/teacher/attendance/session/${id}/close`, { auto_mark_absent: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-attendance-sessions'] });
      setIsQROpen(false);
      showToast('✅ Sesi ditutup');
    },
    onError: () => showToast('❌ Gagal menutup sesi', 'error'),
  });

  const reopenSession = useMutation({
    mutationFn: ({ id, data }) => api.post(`/teacher/attendance/session/${id}/reopen`, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['teacher-attendance-sessions'] });
      setIsReopenOpen(false);
      if (res?.data) { setActiveSession(res.data); setIsQROpen(true); }
      showToast('✅ Sesi berhasil dibuka ulang!');
    },
    onError: (e) => showToast(`❌ ${e.message || 'Gagal membuka ulang sesi'}`, 'error'),
  });

  const sessionList = sessionsData?.data || [];
  const activeCount = sessionList.filter(s => s.is_active).length;
  const totalAttended = sessionList.reduce((a, s) => a + (s.attended_count || 0), 0);
  const classes = classesData?.data || [];
  const subjects = subjectsData?.data || [];
  const todaySchedules = todayScheduleData?.data || [];

  const handleShowQR = useCallback((session) => {
    setActiveSession(session);
    setIsQROpen(true);
  }, []);

  const handleReopen = useCallback((session) => {
    setReopenTarget(session);
    setReopenForm({ extra_minutes: 15, notes: '' });
    setIsReopenOpen(true);
  }, []);

  const handleGenFromSchedule = useCallback((scheduleId) => {
    if (generateFromSchedule.isPending) return;
    generateFromSchedule.mutate(scheduleId);
  }, [generateFromSchedule]);

  return (
    <motion.div variants={pageV} initial="hidden" animate="visible" className="space-y-6">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="fixed top-24 right-6 z-50">
            <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div variants={cardV} className="retro-card bg-base-white border-4 border-base-black p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="retro-heading retro-heading-xl text-retro-blue flex items-center gap-3">
              <CalendarCheck className="w-8 h-8" />Manajemen Absensi
            </h1>
            <p className="font-retro-mono text-sm text-base-black/70 mt-1">
              Buat sesi, generate QR, pantau kehadiran siswa secara realtime
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={() => { refetch(); showToast('🔄 Diperbarui', 'info'); }}>
              <RefreshCw className="w-4 h-4 mr-1" />Refresh
            </Button>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-1" />Sesi Baru
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div variants={cardV} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          ['Sesi Aktif', activeCount, '#FF5C00', Activity],
          ['Total Sesi', sessionList.length, '#2E2BBF', CalendarCheck],
          ['Total Hadir', totalAttended, '#00B894', CheckCircle2],
          ['Jadwal Hari Ini', todaySchedules.length, '#6C5CE7', BookOpen],
        ].map(([label, value, color, Icon]) => (
          <div key={label} className="retro-card bg-base-white border-2 border-base-black p-3 flex items-center gap-3">
            <div className="p-2 rounded-retro border-2 border-base-black" style={{ background: `${color}20` }}>
              <Icon className="w-4 h-4" style={{ color }} />
            </div>
            <div>
              <p className="retro-heading text-xl" style={{ color }}>{value}</p>
              <p className="font-retro-mono text-[10px] text-base-black/60 uppercase">{label}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Today's Schedule - Quick Generate */}
      {todaySchedules.length > 0 && (
        <motion.div variants={cardV} className="retro-card bg-base-white border-4 border-base-black p-5">
          <h3 className="retro-heading retro-heading-sm text-base-black mb-3 flex items-center gap-2">
            <Play className="w-4 h-4 text-retro-orange" />
            Jadwal Hari Ini — Buat Sesi Cepat
          </h3>
          <div className="space-y-2">
            {todaySchedules.map(sched => {
              const hasActiveSession = sessionList.some(s => s.schedule_id === sched.id && s.is_active);
              return (
                <div key={sched.id}
                  className={`p-3 rounded-retro border-2 flex items-center justify-between gap-3 ${hasActiveSession ? 'border-success bg-success/5' : 'border-base-black hover:border-retro-orange hover:bg-retro-orange/5 transition-colors'}`}>
                  <div>
                    <p className="font-retro-display font-black text-sm">{sched.subject?.name}</p>
                    <p className="font-retro-mono text-[10px] text-base-black/50">
                      {sched.class?.name} • {sched.start_time}–{sched.end_time} • {sched.room || 'Ruang kelas'}
                    </p>
                  </div>
                  {hasActiveSession ? (
                    <span className="font-retro-mono text-[10px] text-success font-black flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Aktif
                    </span>
                  ) : (
                    <Button size="sm" onClick={() => handleGenFromSchedule(sched.id)}
                      disabled={generateFromSchedule.isPending}>
                      <Sparkles className="w-3 h-3 mr-1" />Gen QR
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Filter */}
      <motion.div variants={cardV} className="retro-card bg-base-white border-4 border-base-black p-4 flex gap-4 items-center flex-wrap">
        <span className="font-retro-mono text-xs font-black uppercase text-base-black/70">Filter:</span>
        <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)}
          className="py-2 px-3 rounded-retro bg-base-gray/30 border-2 border-base-black font-retro-mono text-sm focus:outline-none focus:border-retro-orange" />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="py-2 px-3 rounded-retro bg-base-gray/30 border-2 border-base-black font-retro-mono text-sm focus:outline-none focus:border-retro-orange">
          <option value="">Semua Status</option>
          <option value="active">Aktif</option>
          <option value="closed">Selesai</option>
        </select>
        <button onClick={() => { setDateFilter(new Date().toISOString().split('T')[0]); setStatusFilter(''); }}
          className="font-retro-mono text-xs text-retro-orange hover:underline">Reset</button>
      </motion.div>

      {/* Sessions list */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="retro-card bg-base-white border-4 border-base-black p-12 text-center">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
              <CalendarCheck className="w-10 h-10 text-retro-orange mx-auto" />
            </motion.div>
            <p className="font-retro-mono text-base-black/60 mt-3">Memuat data...</p>
          </div>
        ) : sessionList.length > 0 ? sessionList.map(s => (
          <SessionRow key={s.id} session={s}
            onShowQR={handleShowQR}
            onGenQR={id => generateQR.mutate(id)}
            onClose={id => { if (confirm('Tutup sesi ini?')) closeSession.mutate(id); }}
            onReopen={handleReopen}
          />
        )) : (
          <div className="retro-card bg-base-white border-4 border-dashed border-base-black p-12 text-center">
            <CalendarCheck className="w-14 h-14 text-base-black/20 mx-auto mb-3" />
            <p className="font-retro-mono text-base-black/50 mb-5">Belum ada sesi pada tanggal ini</p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-1" />Buat Sesi Baru
            </Button>
          </div>
        )}
      </div>

      {/* ── QR Modal ─────────────────────────────────────── */}
      <Modal isOpen={isQROpen} onClose={() => setIsQROpen(false)} title="🎯 QR Code Absensi" size="sm">
        <QRCodeDisplay
          code={activeSession?.code}
          sessionId={activeSession?.id}
          validUntil={activeSession?.valid_until}
          attendedCount={activeSession?.attended_count || 0}
          totalStudents={activeSession?.total_students || 0}
          sessionStatus={activeSession?.session_status || (activeSession?.is_active ? 'active' : 'closed')}
          onRefresh={() => activeSession?.id && generateQR.mutate(activeSession.id)}
          isRefreshing={generateQR.isPending}
        />
      </Modal>

      {/* ── Reopen Modal ──────────────────────────────────── */}
      <Modal isOpen={isReopenOpen} onClose={() => setIsReopenOpen(false)} title="↺ Buka Ulang Sesi" size="sm">
        <div className="space-y-4">
          <div className="p-3 bg-retro-yellow/10 border-2 border-retro-yellow rounded-retro">
            <p className="font-retro-mono text-xs text-base-black/70">
              Sesi: <strong>{reopenTarget?.subject?.name}</strong> — {reopenTarget?.class?.name}
            </p>
          </div>
          <div>
            <label className="block font-retro-mono text-xs font-black uppercase tracking-wider mb-1">
              Tambahan Waktu (menit)
            </label>
            <input type="number" min={1} max={120} value={reopenForm.extra_minutes}
              onChange={e => setReopenForm(f => ({ ...f, extra_minutes: +e.target.value }))}
              className="w-full py-2 px-3 border-2 border-base-black rounded-retro font-retro-mono text-sm focus:outline-none focus:border-retro-orange" />
          </div>
          <div>
            <label className="block font-retro-mono text-xs font-black uppercase tracking-wider mb-1">
              Catatan (opsional)
            </label>
            <textarea rows={2} value={reopenForm.notes}
              onChange={e => setReopenForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Alasan membuka ulang sesi..."
              className="w-full py-2 px-3 border-2 border-base-black rounded-retro font-retro-mono text-sm focus:outline-none focus:border-retro-orange resize-none" />
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setIsReopenOpen(false)}>Batal</Button>
            <Button onClick={() => reopenSession.mutate({ id: reopenTarget?.id, data: reopenForm })}
              disabled={reopenSession.isPending}>
              <RotateCcw className="w-4 h-4 mr-1" />
              {reopenSession.isPending ? 'Membuka...' : 'Buka Ulang'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Create Session Modal ───────────────────────────── */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="✨ Buat Sesi Absensi Baru" size="lg">
        <form onSubmit={e => { e.preventDefault(); createSession.mutate(form); }} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-retro-mono text-xs font-black uppercase tracking-wider mb-1">Kelas *</label>
              <select value={form.class_id} onChange={e => setForm(f => ({ ...f, class_id: e.target.value }))} required
                className="w-full py-2 px-3 border-2 border-base-black rounded-retro font-retro-mono text-sm bg-base-white focus:outline-none focus:border-retro-orange">
                <option value="">-- Pilih Kelas --</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-retro-mono text-xs font-black uppercase tracking-wider mb-1">Mata Pelajaran *</label>
              <select value={form.subject_id} onChange={e => setForm(f => ({ ...f, subject_id: e.target.value }))} required
                className="w-full py-2 px-3 border-2 border-base-black rounded-retro font-retro-mono text-sm bg-base-white focus:outline-none focus:border-retro-orange">
                <option value="">-- Pilih Mapel --</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-retro-mono text-xs font-black uppercase tracking-wider mb-1">Tanggal</label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="w-full py-2 px-3 border-2 border-base-black rounded-retro font-retro-mono text-sm bg-base-white focus:outline-none focus:border-retro-orange" />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block font-retro-mono text-xs font-black uppercase tracking-wider mb-1">Mulai</label>
                <input type="time" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))}
                  className="w-full py-2 px-3 border-2 border-base-black rounded-retro font-retro-mono text-sm focus:outline-none focus:border-retro-orange" />
              </div>
              <div className="flex-1">
                <label className="block font-retro-mono text-xs font-black uppercase tracking-wider mb-1">Selesai</label>
                <input type="time" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))}
                  className="w-full py-2 px-3 border-2 border-base-black rounded-retro font-retro-mono text-sm focus:outline-none focus:border-retro-orange" />
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="block font-retro-mono text-xs font-black uppercase tracking-wider mb-1">Lokasi / Ruang</label>
              <input type="text" placeholder="Contoh: Lab Komputer 1" value={form.location}
                onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                className="w-full py-2 px-3 border-2 border-base-black rounded-retro font-retro-mono text-sm bg-base-white focus:outline-none focus:border-retro-orange" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => setIsCreateOpen(false)}>Batal</Button>
             <Button type="submit" disabled={createSession.isPending}>
              <Sparkles className="w-4 h-4 mr-1" />
              {createSession.isPending ? 'Membuat...' : 'Buat Sesi'}
            </Button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}
