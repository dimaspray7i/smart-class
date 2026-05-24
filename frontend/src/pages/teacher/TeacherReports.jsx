import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { BarChart3, Download, TrendingUp, Users, CalendarCheck, Award, FileText, Filter } from 'lucide-react';
import { api } from '../../api';
import Button from '../../components/ui/Button';

const pageVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const cardVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } } };

function StatBig({ label, value, sub, color, icon: Icon }) {
  return (
    <div className="retro-card bg-base-white border-4 border-base-black p-5 relative overflow-hidden">
      <div className="flex items-start justify-between mb-3">
        <div className="p-2.5 rounded-retro border-2 border-base-black" style={{ background: `${color}20` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </div>
      <p className="retro-heading text-3xl" style={{ color }}>{value}</p>
      <p className="font-retro-mono text-[10px] text-base-black/70 uppercase tracking-wide mt-1">{label}</p>
      {sub && <p className="font-retro-mono text-[10px] text-base-black/40 mt-0.5">{sub}</p>}
      <div className="absolute top-2 right-2 w-2 h-2 bg-retro-yellow border border-base-black rounded-sm rotate-45" />
    </div>
  );
}

function AttendanceBar({ label, hadir, alpa, izin, total }) {
  const hadirPct = total > 0 ? (hadir / total) * 100 : 0;
  const alpaPct = total > 0 ? (alpa / total) * 100 : 0;
  const izinPct = total > 0 ? (izin / total) * 100 : 0;

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="font-retro-mono text-xs font-black text-base-black">{label}</span>
        <span className="font-retro-mono text-xs text-base-black/50">{hadir}/{total} hadir</span>
      </div>
      <div className="flex h-4 rounded-sm overflow-hidden border-2 border-base-black gap-px">
        <div className="bg-success transition-all" style={{ width: `${hadirPct}%` }} title={`Hadir: ${hadir}`} />
        <div className="bg-warning transition-all" style={{ width: `${izinPct}%` }} title={`Izin: ${izin}`} />
        <div className="bg-danger transition-all" style={{ width: `${alpaPct}%` }} title={`Alpa: ${alpa}`} />
        {hadirPct + izinPct + alpaPct < 100 && <div className="bg-base-gray flex-1" />}
      </div>
      <div className="flex gap-4">
        {[['Hadir', hadirPct, '#00B894'], ['Izin', izinPct, '#E67E22'], ['Alpa', alpaPct, '#E74C3C']].map(([l, p, c]) => (
          <span key={l} className="font-retro-mono text-[9px] flex items-center gap-1">
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: c }} />
            {l} {p.toFixed(0)}%
          </span>
        ))}
      </div>
    </div>
  );
}

export default function TeacherReports() {
  const [period, setPeriod] = useState('month');
  const [classFilter, setClassFilter] = useState('all');

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['teacher-analytics', period, classFilter],
    queryFn: () => api.get('/teacher/analytics/attendance', { params: { period, class_id: classFilter !== 'all' ? classFilter : undefined } }),
  });
  const { data: classes } = useQuery({ queryKey: ['teacher-classes'], queryFn: () => api.get('/teacher/classes') });

  // Handle nested API response (axios -> response.data -> { status, data, meta })
  const rawData = analytics?.data?.data ?? analytics?.data ?? analytics ?? {};
  const data = rawData;
  const byClass = data.by_class || [];

  return (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" className="space-y-6">

      <motion.div variants={cardVariants} className="retro-card bg-base-white border-4 border-base-black p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="retro-heading retro-heading-xl text-retro-blue flex items-center gap-3"><BarChart3 className="w-8 h-8" /> Laporan & Analitik</h1>
            <p className="font-retro-mono text-sm text-base-black/70 mt-1">Ringkasan performa kehadiran dan perkembangan kelas</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={() => {}}><Download className="w-4 h-4 mr-1" /> PDF</Button>
            <Button variant="outline" onClick={() => {}}><FileText className="w-4 h-4 mr-1" /> Excel</Button>
          </div>
        </div>
      </motion.div>

      {/* Filter bar */}
      <motion.div variants={cardVariants} className="retro-card bg-base-white border-4 border-base-black p-4 flex flex-wrap gap-3 items-center">
        <Filter className="w-4 h-4 text-base-black/50" />
        <div className="flex gap-1">
          {[['week', 'Minggu Ini'], ['month', 'Bulan Ini'], ['semester', 'Semester']].map(([v, l]) => (
            <button key={v} onClick={() => setPeriod(v)}
              className={`px-3 py-1.5 rounded-retro font-retro-mono text-xs font-black border-2 border-base-black transition-all ${period === v ? 'bg-retro-blue text-base-white shadow-[2px_2px_0px_0px_#111]' : 'bg-base-white hover:bg-retro-yellow/20'}`}>
              {l}
            </button>
          ))}
        </div>
        <select value={classFilter} onChange={e => setClassFilter(e.target.value)}
          className="py-1.5 px-3 border-2 border-base-black rounded-retro font-retro-mono text-sm bg-base-white focus:outline-none focus:border-retro-orange">
          <option value="all">Semua Kelas</option>
          {(Array.isArray(classes?.data?.data) ? classes.data.data : Array.isArray(classes?.data) ? classes.data : []).map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
        </select>
      </motion.div>

      {/* Big stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatBig label="Rata Kehadiran" value={`${data.avg_attendance || 0}%`} sub="Semua kelas" color="#00B894" icon={CalendarCheck} />
        <StatBig label="Total Siswa" value={data.total_students || 0} sub="Terdaftar aktif" color="#6C5CE7" icon={Users} />
        <StatBig label="Sesi Absensi" value={data.total_sessions || 0} sub={`Periode ${period === 'week' ? 'minggu' : period === 'month' ? 'bulan' : 'semester'} ini`} color="#2E2BBF" icon={TrendingUp} />
        <StatBig label="Izin Diproses" value={data.processed_permissions || 0} sub="Approve + Reject" color="#E67E22" icon={Award} />
      </div>

      {/* Attendance by class */}
      <motion.div variants={cardVariants} className="retro-card bg-base-white border-4 border-base-black p-6">
        <h2 className="retro-heading retro-heading-sm text-base-black mb-5 flex items-center gap-2">
          <CalendarCheck className="w-5 h-5 text-retro-orange" /> Kehadiran per Kelas
        </h2>
        {isLoading ? (
          <p className="font-retro-mono text-base-black/50 text-center py-6">Memuat data...</p>
        ) : byClass.length > 0 ? (
          <div className="space-y-5">
            {byClass.map(cls => (
              <AttendanceBar key={cls.class_name} label={cls.class_name}
                hadir={cls.hadir || 0} alpa={cls.alpa || 0} izin={cls.izin || 0} total={cls.total || 0} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <BarChart3 className="w-12 h-12 text-base-black/20 mx-auto mb-2" />
            <p className="font-retro-mono text-base-black/50">Data belum tersedia untuk periode ini</p>
          </div>
        )}
      </motion.div>

      {/* Top students */}
      <motion.div variants={cardVariants} className="retro-card bg-base-white border-4 border-base-black p-6">
        <h2 className="retro-heading retro-heading-sm text-base-black mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-retro-yellow" /> Siswa Kehadiran Terbaik
        </h2>
        {(data.top_students || []).slice(0, 5).length > 0 ? (
          <div className="space-y-2">
            {(data.top_students || []).slice(0, 5).map((s, i) => (
              <div key={s.id || i} className="flex items-center justify-between p-3 border-2 border-base-black border-dashed rounded-retro hover:bg-retro-yellow/10">
                <div className="flex items-center gap-3">
                  <span className={`w-7 h-7 rounded-full border-2 border-base-black flex items-center justify-center font-retro-display font-black text-sm ${i === 0 ? 'bg-retro-yellow' : i === 1 ? 'bg-base-gray' : 'bg-base-white'}`}>{i + 1}</span>
                  <span className="font-retro-display font-black text-sm">{s.name}</span>
                </div>
                <span className="font-retro-display font-black text-success">{s.attendance_rate || 0}%</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="font-retro-mono text-base-black/50 text-center py-4">Data belum tersedia</p>
        )}
      </motion.div>
    </motion.div>
  );
}
