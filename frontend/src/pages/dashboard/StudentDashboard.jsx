import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  CalendarCheck, TrendingUp, Award, Clock, ArrowRight,
  AlertCircle, QrCode, BookOpen, Briefcase, BarChart2,
  Zap, Star, Rocket, RefreshCw, CheckSquare
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api';
import { PageHeader, StatGrid, RetroCard, RetroStatWidget, RetroSection } from '../../components/ui/RetroLayouts';

// ═══════════════════════════════════════════════════════════
// 🎨 RETRO ANIMATION VARIANTS
// ═══════════════════════════════════════════════════════════
const cardVariants = {
  hidden: { opacity: 0, y: 20, rotate: -0.5 },
  visible: { 
    opacity: 1, 
    y: 0, 
    rotate: 0,
    transition: { 
      type: "spring", 
      stiffness: 100, 
      damping: 15,
      mass: 0.1 
    } 
  }
};

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch dashboard data from API
  const {
    data: dashboard,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['student-dashboard', user?.id],
    queryFn: () => api.get('/student/dashboard'),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  // ── Loading State ─────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] retro-card bg-base-white p-8 shadow-hard">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 retro-card bg-retro-purple border-4 border-base-black flex items-center justify-center mb-4"
        >
          <Rocket className="w-8 h-8 text-base-white animate-pulse" />
        </motion.div>
        <p className="font-retro-display font-black text-xs text-base-black uppercase tracking-widest animate-pulse">
          BOOTING STUDENT MATRIX...
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

  // ── Error State ───────────────────────────────────────────
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] border-4 border-base-black bg-danger/10 p-8 rounded-retro shadow-hard text-center">
        <AlertCircle className="w-12 h-12 text-danger mb-3 animate-bounce" />
        <h3 className="retro-heading text-lg mb-2">Oops! Gagal Memuat Data</h3>
        <p className="font-retro-mono text-xs font-black text-base-black/70 uppercase tracking-widest mb-4">
          {error?.message || 'Gagal memuat data dashboard'}
        </p>
        <button
          onClick={() => refetch()}
          className="retro-btn flex items-center gap-2 bg-base-black text-base-white hover:bg-retro-orange py-2 px-4"
        >
          <RefreshCw className="w-4 h-4" />
          Coba Lagi
        </button>
      </div>
    );
  }

  // ── Extract Data ──────────────────────────────────────────
  const stats = dashboard?.data?.stats || {};
  const attendanceStats = stats.attendance || {};
  const projectStats = stats.projects || {};
  const skillStats = stats.skills || {};
  const recentAttendance = dashboard?.data?.recent_attendance || [];
  const quickActions = dashboard?.data?.quick_actions || {};
  const todaySchedule = dashboard?.data?.detailed_today_schedule || [];

  const firstName = user?.name?.split(' ')[0] || 'Siswa';
  const attendancePercent = attendanceStats.percentage || 0;

  return (
    <div className="space-y-6">

      {/* ── Page Header ──────────────────────────────────── */}
      <PageHeader 
        title={`Halo, ${firstName}! 👋`}
        icon={Rocket}
        description="Selamat datang kembali di Cyber Academy. Monitor kegiatan belajar dan progres akademik Anda."
        breadcrumbs={[]}
        actions={
          <div className="flex items-center gap-2 px-4 py-2.5 bg-base-white border-2 border-base-black rounded-retro shadow-hard-sm">
            <Star className="w-4 h-4 text-retro-yellow fill-retro-yellow" />
            <div>
              <p className="text-[8px] font-retro-mono font-black uppercase text-base-black/50 leading-none">Streak Kehadiran</p>
              <p className="text-xs font-retro-display font-black text-base-black mt-0.5 leading-none">
                {attendanceStats.streak || 0} <span className="text-[8px] font-retro-mono text-base-black/60">hari</span>
              </p>
            </div>
          </div>
        }
      />

      {/* ── Stats Grid ───────────────────────────────────── */}
      <StatGrid cols={4}>
        <RetroStatWidget
          title="Total Absensi"
          value={attendanceStats.total || 0}
          icon={TrendingUp}
          color="purple"
          onClick={() => navigate('/dashboard/student/attendance')}
        />
        <RetroStatWidget
          title="Hadir"
          value={attendanceStats.hadir || 0}
          icon={CheckSquare}
          color="lime"
          onClick={() => navigate('/dashboard/student/attendance')}
        />
        <RetroStatWidget
          title="Izin / Sakit"
          value={(attendanceStats.izin || 0) + (attendanceStats.sakit || 0)}
          icon={Clock}
          color="orange"
          onClick={() => navigate('/dashboard/student/attendance')}
        />
        <RetroStatWidget
          title="Proyek Aktif"
          value={projectStats.in_progress || 0}
          icon={Award}
          color="blue"
        />
      </StatGrid>

      {/* ── Attendance Call To Action ────────────────────── */}
      {quickActions?.can_attend !== false && (
        <motion.div 
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className={`retro-card p-5 flex flex-col sm:flex-row items-center justify-between gap-4 border-4 border-base-black shadow-hard ${
            quickActions?.has_attended_today ? 'bg-retro-lime/10' : 'bg-retro-pink/10'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 border-2 border-base-black flex items-center justify-center rounded-retro bg-base-white shadow-hard-sm`}>
              <CalendarCheck className="w-6 h-6 text-base-black" />
            </div>
            <div>
              <p className="text-[9px] font-retro-mono font-black uppercase tracking-wider text-base-black/50">
                Status Absensi Hari Ini
              </p>
              <p className="text-xs font-retro-display font-black text-base-black uppercase mt-0.5">
                {quickActions?.has_attended_today
                  ? '✅ Sudah Absen — Mantap!'
                  : '❌ Belum Melakukan Absensi'}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/dashboard/student/attendance')}
            disabled={quickActions?.has_attended_today}
            className={`retro-btn text-xs py-2.5 px-5 flex items-center gap-2 ${
              quickActions?.has_attended_today
                ? 'opacity-40 cursor-not-allowed shadow-none border-base-black/35 bg-base-white/50 text-base-black/40'
                : 'bg-base-black text-base-white hover:bg-retro-purple'
            }`}
          >
            {quickActions?.has_attended_today ? (
              <>Sudah Absen ✓</>
            ) : (
              <>
                <QrCode className="w-4 h-4" />
                Absen Sekarang
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </motion.div>
      )}

      {/* ── Quick Actions ────────────────────────────────── */}
      <RetroSection title="Akses Cepat ⚡">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickActionCard
            label="Scan QR"
            desc="Absen via kode QR"
            icon={QrCode}
            color="purple"
            onClick={() => navigate('/dashboard/student/qrscan')}
            badge="LIVE"
          />
          <QuickActionCard
            label="Nilai KHS"
            desc="Lihat rapor akademik"
            icon={BarChart2}
            color="lime"
            onClick={() => navigate('/dashboard/student/grades')}
          />
          <QuickActionCard
            label="Tugas"
            desc="Upload tugas Anda"
            icon={BookOpen}
            color="orange"
            onClick={() => navigate('/dashboard/student/tasks')}
          />
          <QuickActionCard
            label="PKL"
            desc="Monitor jurnal PKL"
            icon={Briefcase}
            color="blue"
            onClick={() => navigate('/dashboard/student/pkl')}
          />
        </div>
      </RetroSection>

      {/* ── Main Content Columns ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Column 1: Attendance History */}
        <RetroCard className="h-full flex flex-col justify-between" variant="white">
          <div>
            <div className="flex items-center justify-between border-b-4 border-base-black pb-3 mb-4">
              <h3 className="font-retro-display font-black text-base-black uppercase tracking-tight text-xs flex items-center gap-1.5">
                <span>📅</span> Riwayat Absensi
              </h3>
              <button
                onClick={() => navigate('/dashboard/student/attendance')}
                className="text-[9px] font-retro-mono font-black uppercase text-retro-purple hover:underline flex items-center gap-1"
              >
                Semua <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {recentAttendance.length === 0 ? (
              <div className="text-center py-8 border-4 border-dashed border-base-black/20 rounded-retro bg-base-cream/20">
                <CalendarCheck className="w-10 h-10 mx-auto text-base-black/20 mb-2" />
                <p className="text-[10px] font-retro-mono font-bold uppercase text-base-black/40">
                  Belum ada riwayat absensi
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentAttendance.slice(0, 5).map((item, index) => (
                  <div
                    key={item.date || index}
                    className="flex items-center justify-between p-3 border-2 border-base-black rounded-retro hover:shadow-hard-sm hover:-translate-x-0.5 hover:-translate-y-0.5 bg-base-cream/10 hover:bg-base-white transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full border-2 border-base-black ${
                        item.status === 'Hadir' ? 'bg-retro-lime' :
                        item.status === 'Terlambat' ? 'bg-retro-yellow' :
                        item.status === 'Izin' ? 'bg-retro-purple' :
                        item.status === 'Sakit' ? 'bg-retro-blue' :
                        'bg-retro-pink'
                      }`} />
                      <div>
                        <p className="font-retro-display font-black text-xs text-base-black uppercase leading-tight">{item.date}</p>
                        <p className="text-[9px] font-retro-mono text-base-black/50 uppercase mt-0.5 leading-none">{item.time || '—'}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 border-2 border-base-black rounded text-[8px] font-retro-mono font-black uppercase shadow-hard-sm ${
                      item.status === 'Hadir' ? 'bg-retro-lime text-base-black' :
                      item.status === 'Terlambat' ? 'bg-retro-yellow text-base-black' :
                      item.status === 'Izin' ? 'bg-retro-purple text-base-white' :
                      item.status === 'Sakit' ? 'bg-retro-blue text-base-white' :
                      'bg-retro-pink text-base-white'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </RetroCard>

        {/* Column 2: Progress & Skills */}
        <RetroCard className="h-full flex flex-col justify-between" variant="white">
          <div>
            <div className="flex items-center justify-between border-b-4 border-base-black pb-3 mb-4">
              <h3 className="font-retro-display font-black text-base-black uppercase tracking-tight text-xs flex items-center gap-1.5">
                <span>🧠</span> Perkembangan Skill
              </h3>
              <div className="flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-retro-yellow fill-retro-yellow" />
                <span className="text-[8px] font-retro-mono font-black text-retro-yellow uppercase bg-base-black px-1.5 py-0.5 rounded border border-base-black">LIVE</span>
              </div>
            </div>

            {/* Circular Attendance Chart */}
            <div className="flex items-center gap-6 mb-5 p-4 bg-base-black rounded-retro border-4 border-base-black relative overflow-hidden shadow-hard">
              <div className="absolute inset-0 bg-retro-grid opacity-15 pointer-events-none" />
              <svg viewBox="0 0 100 100" className="w-16 h-16 flex-shrink-0 relative z-10">
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#222" strokeWidth="10" />
                <circle
                  cx="50" cy="50" r="38"
                  fill="transparent"
                  stroke="#B8F64E"
                  strokeWidth="10"
                  strokeDasharray={`${Math.min(attendancePercent, 100) * 2.39} 239`}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                />
                <text x="50" y="55" textAnchor="middle" fill="#fff" fontSize="16" fontWeight="bold" fontFamily="monospace">
                  {attendancePercent}%
                </text>
              </svg>
              <div className="text-base-white relative z-10">
                <p className="text-[8px] font-retro-mono uppercase tracking-widest text-base-white/50 leading-none">Tingkat Kehadiran</p>
                <p className="text-xl font-retro-display font-black text-retro-lime mt-1 leading-none">{attendancePercent}%</p>
                <p className="text-[8px] font-retro-mono text-retro-purple mt-2 uppercase font-bold tracking-wider">⚡ DISIPLIN MATRIX</p>
              </div>
            </div>

            {/* Skill bars */}
            <div className="space-y-3">
              {[
                { name: 'Laravel', level: skillStats.laravel || 65, color: 'bg-retro-orange' },
                { name: 'Vue.js', level: skillStats.vue || 45, color: 'bg-retro-lime' },
                { name: 'MySQL', level: skillStats.mysql || 80, color: 'bg-retro-blue' },
              ].map((skill) => (
                <div key={skill.name}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-retro-display font-black text-base-black uppercase">{skill.name}</span>
                    <span className="text-[9px] font-retro-mono font-bold text-base-black/60">{skill.level}%</span>
                  </div>
                  <div className="w-full bg-base-gray rounded-sm h-3.5 border-2 border-base-black overflow-hidden shadow-hard-sm">
                    <div
                      className={`h-full transition-all duration-700 ${skill.color} border-r-2 border-base-black`}
                      style={{ width: `${skill.level}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </RetroCard>
      </div>

      {/* ── Today's Schedule Table ───────────────────────── */}
      {todaySchedule.length > 0 && (
        <RetroCard className="overflow-hidden" variant="white">
          <div className="flex items-center justify-between border-b-4 border-base-black pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-base-black" />
              <h3 className="font-retro-display font-black text-base-black uppercase tracking-tight text-xs">
                Jadwal Hari Ini
              </h3>
            </div>
            <span className="text-[8px] font-retro-mono font-black text-base-black bg-retro-yellow border-2 border-base-black px-2 py-0.5 rounded uppercase">
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}
            </span>
          </div>

          <div className="overflow-x-auto border-2 border-base-black rounded-retro">
            <table className="w-full text-left border-collapse overflow-hidden">
              <thead>
                <tr className="bg-base-gray border-b-2 border-base-black text-[9px] font-retro-display font-black uppercase tracking-wider text-base-black">
                  <th className="py-3 px-4 w-28 border-r-2 border-base-black">Waktu</th>
                  <th className="py-3 px-4 border-r-2 border-base-black">Mata Pelajaran</th>
                  <th className="py-3 px-4 hidden md:table-cell border-r-2 border-base-black">Guru & Ruang</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-base-black/15 font-retro-mono text-[11px] font-bold">
                {todaySchedule.map((slot, index) => (
                  <tr
                    key={index}
                    className={`transition-colors ${
                      slot.is_now
                        ? 'bg-retro-purple/5 border-l-4 border-l-retro-purple'
                        : slot.type === 'break'
                          ? 'bg-retro-yellow/5'
                          : 'hover:bg-retro-yellow/5'
                    }`}
                  >
                    <td className="py-3.5 px-4 border-r-2 border-base-black/15">
                      <p className={`font-retro-display font-black text-xs ${slot.is_now ? 'text-retro-purple animate-pulse' : 'text-base-black'}`}>
                        {slot.time}
                      </p>
                      <p className="text-[8px] text-base-black/40 uppercase tracking-tight mt-0.5">{slot.label}</p>
                    </td>
                    <td className="py-3.5 px-4 border-r-2 border-base-black/15">
                      {slot.type === 'subject' ? (
                        <div>
                          <p className="font-retro-display font-black text-base-black uppercase text-xs">{slot.subject}</p>
                          <span className="retro-sticker text-[7px] px-1.5 py-0 bg-retro-purple text-base-white mt-1 border border-base-black inline-block">
                            {slot.subject_code}
                          </span>
                        </div>
                      ) : slot.type === 'break' ? (
                        <span className="text-retro-orange font-retro-display font-black uppercase italic flex items-center gap-1 text-[10px]">
                          <span>☕</span> {slot.label}
                        </span>
                      ) : (
                        <span className="text-base-black/45 italic">Jam Kosong</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 hidden md:table-cell border-r-2 border-base-black/15">
                      {slot.type === 'subject' ? (
                        <div>
                          <p className="text-base-black text-xs font-bold font-retro-display leading-tight">{slot.teacher}</p>
                          <p className="text-[8px] text-base-black/40 uppercase font-retro-mono mt-0.5">{slot.room || 'Ruang Kelas'}</p>
                        </div>
                      ) : (
                        <span className="text-base-black/30">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {slot.is_now && (
                        <span className="inline-flex items-center px-2 py-0.5 border border-base-black bg-retro-purple text-base-white text-[8px] font-retro-mono font-black uppercase animate-pulse shadow-hard-sm">
                          <span className="w-1 h-1 rounded-full bg-base-white mr-1 animate-ping" />
                          NOW
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 p-3 bg-retro-yellow/15 border-2 border-retro-yellow rounded-retro flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-retro-orange" />
            <p className="text-[9px] font-retro-mono font-black text-base-black uppercase leading-tight">
              Jadwal di atas adalah pembagian per jam pelajaran (SKS). Hadir tepat waktu!
            </p>
          </div>
        </RetroCard>
      )}

    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 🧩 Sub-Components (Polished QuickActionCard)
// ─────────────────────────────────────────────────────────────

function QuickActionCard({ label, desc, icon: Icon, color = 'orange', onClick, badge }) {
  const colorMap = {
    purple: {
      border: 'border-retro-purple hover:shadow-[4px_4px_0px_0px_rgba(155,81,224,1)] bg-retro-purple/5',
      icon: 'bg-retro-purple/20 text-retro-purple border-retro-purple'
    },
    lime: {
      border: 'border-retro-lime hover:shadow-[4px_4px_0px_0px_rgba(186,230,126,1)] bg-retro-lime/5',
      icon: 'bg-retro-lime/20 text-retro-lime border-retro-lime'
    },
    orange: {
      border: 'border-retro-orange hover:shadow-[4px_4px_0px_0px_rgba(255,107,0,1)] bg-retro-orange/5',
      icon: 'bg-retro-orange/20 text-retro-orange border-retro-orange'
    },
    blue: {
      border: 'border-retro-blue hover:shadow-[4px_4px_0px_0px_rgba(45,156,219,1)] bg-retro-blue/5',
      icon: 'bg-retro-blue/20 text-retro-blue border-retro-blue'
    }
  };

  const scheme = colorMap[color] || colorMap.orange;

  return (
    <motion.button
      whileHover={{ y: -4, scale: 1.02 }}
      onClick={onClick}
      className={`w-full text-left retro-card p-4 border-4 transition-all relative cursor-pointer ${scheme.border}`}
    >
      {badge && (
        <span className="absolute top-3 right-3 text-[7px] font-retro-mono font-black bg-danger text-base-white px-1.5 py-0.5 border border-base-black uppercase animate-pulse shadow-hard-sm">
          {badge}
        </span>
      )}
      <div className={`p-2.5 border-2 border-base-black rounded-retro inline-block mb-3 shadow-hard-sm ${scheme.icon}`}>
        {Icon && <Icon className="w-5 h-5" />}
      </div>
      <p className="font-retro-display font-black text-base-black uppercase tracking-wider text-xs">{label}</p>
      <p className="text-[8px] font-retro-mono text-base-black/60 mt-1 leading-normal">{desc}</p>
    </motion.button>
  );
}