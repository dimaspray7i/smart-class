import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  TrendingUp, Download, CalendarCheck, Users, BarChart3,
  FileText, Award, Filter, School, ArrowUp, ArrowDown
} from 'lucide-react';
import { api } from '../../api';
import Button from '../../components/ui/Button';

const pageVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const cardVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } } };

function BigStat({ label, value, sub, color, icon: Icon, trend }) {
  return (
    <div className="retro-card bg-base-white border-4 border-base-black p-5 relative overflow-hidden">
      <div className="flex items-start justify-between mb-3">
        <div className="p-2.5 rounded-retro border-2 border-base-black" style={{ background: `${color}20` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        {trend !== undefined && (
          <span className={`flex items-center gap-0.5 font-retro-mono text-[10px] font-black ${trend >= 0 ? 'text-success' : 'text-danger'}`}>
            {trend >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="retro-heading text-3xl" style={{ color }}>{value}</p>
      <p className="font-retro-mono text-[10px] text-base-black/70 uppercase tracking-wide mt-1">{label}</p>
      {sub && <p className="font-retro-mono text-[10px] text-base-black/40 mt-0.5">{sub}</p>}
      <div className="absolute top-2 right-2 w-2 h-2 bg-retro-yellow border border-base-black rounded-sm rotate-45" />
    </div>
  );
}

function AttendanceBarChart({ data }) {
  if (!data || data.length === 0) return (
    <div className="h-40 flex items-center justify-center">
      <p className="font-retro-mono text-base-black/40 text-sm">Tidak ada data grafik</p>
    </div>
  );
  const max = Math.max(...data.map(d => d.total || 0)) || 1;

  return (
    <div className="flex items-end gap-2 h-40 px-2">
      {data.map((d, i) => {
        const h = Math.max(4, ((d.hadir || 0) / max) * 100);
        const totalH = Math.max(4, ((d.total || 0) / max) * 100);
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-base-black text-base-white px-2 py-0.5 rounded text-[9px] font-retro-mono opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
              Hadir: {d.hadir || 0} / {d.total || 0}
            </div>
            <div className="w-full flex flex-col items-center justify-end gap-px" style={{ height: '120px' }}>
              <motion.div initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ delay: i * 0.05, duration: 0.5 }}
                className="w-full rounded-t-sm border-2 border-base-black bg-retro-blue" style={{ minHeight: '4px' }} />
            </div>
            <span className="font-retro-mono text-[9px] text-base-black/50 truncate w-full text-center">{d.label || d.day || `D${i + 1}`}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function AdminReports() {
  const [period, setPeriod] = useState('month');
  const [classFilter, setClassFilter] = useState('all');

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['admin-analytics-report', period, classFilter],
    queryFn: () => api.get('/admin/analytics/attendance', {
      params: { period, class_id: classFilter !== 'all' ? classFilter : undefined }
    }),
  });
  const { data: classes } = useQuery({ queryKey: ['admin-classes-list'], queryFn: () => api.get('/admin/classes') });

  const data = analytics?.data || {};
  const byClass = data.by_class || [];
  const weeklyData = data.weekly || data.daily || [];

  return (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" className="space-y-6">

      {/* Header */}
      <motion.div variants={cardVariants} className="retro-card bg-base-white border-4 border-base-black p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="retro-heading retro-heading-xl text-retro-blue flex items-center gap-3">
              <TrendingUp className="w-8 h-8" /> Laporan & Analitik
            </h1>
            <p className="font-retro-mono text-sm text-base-black/70 mt-1">Monitoring performa kehadiran dan statistik sistem secara menyeluruh</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => {}}><Download className="w-4 h-4 mr-1" /> PDF</Button>
            <Button variant="outline" onClick={() => {}}><FileText className="w-4 h-4 mr-1" /> Excel</Button>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div variants={cardVariants} className="retro-card bg-base-white border-4 border-base-black p-4 flex flex-wrap gap-3 items-center">
        <Filter className="w-4 h-4 text-base-black/40" />
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
          {(classes?.data || []).map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
        </select>
      </motion.div>

      {/* Big stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <BigStat label="Rata Kehadiran" value={`${data.avg_attendance || 0}%`} sub="Semua kelas" color="#00B894" icon={CalendarCheck} trend={data.attendance_trend} />
        <BigStat label="Total Siswa" value={data.total_students || 0} sub="Aktif terdaftar" color="#6C5CE7" icon={Users} />
        <BigStat label="Sesi Absensi" value={data.total_sessions || 0} sub={`Periode ini`} color="#2E2BBF" icon={BarChart3} />
        <BigStat label="Izin Diproses" value={data.processed_permissions || 0} sub="Approve + Reject" color="#E67E22" icon={Award} />
      </div>

      {/* Chart + by class */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly chart */}
        <motion.div variants={cardVariants} className="retro-card bg-base-white border-4 border-base-black p-6">
          <h2 className="retro-heading retro-heading-sm text-base-black mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-retro-blue" /> Grafik Kehadiran
          </h2>
          {isLoading ? (
            <div className="h-40 flex items-center justify-center font-retro-mono text-base-black/40">Memuat...</div>
          ) : <AttendanceBarChart data={weeklyData} />}
        </motion.div>

        {/* By class */}
        <motion.div variants={cardVariants} className="retro-card bg-base-white border-4 border-base-black p-6">
          <h2 className="retro-heading retro-heading-sm text-base-black mb-4 flex items-center gap-2">
            <School className="w-5 h-5 text-retro-orange" /> Kehadiran per Kelas
          </h2>
          {isLoading ? (
            <p className="font-retro-mono text-base-black/40 text-center py-6">Memuat...</p>
          ) : byClass.length > 0 ? (
            <div className="space-y-3">
              {byClass.map(cls => {
                const pct = cls.total > 0 ? Math.round((cls.hadir / cls.total) * 100) : 0;
                return (
                  <div key={cls.class_name} className="space-y-1">
                    <div className="flex justify-between">
                      <span className="font-retro-mono text-xs font-black">{cls.class_name}</span>
                      <span className="font-retro-mono text-xs" style={{ color: pct >= 80 ? '#00B894' : pct >= 65 ? '#E67E22' : '#E74C3C' }}>{pct}%</span>
                    </div>
                    <div className="h-3 bg-base-gray border border-base-black rounded-sm overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.7 }}
                        className="h-full rounded-sm" style={{ background: pct >= 80 ? '#00B894' : pct >= 65 ? '#E67E22' : '#E74C3C' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6">
              <School className="w-10 h-10 text-base-black/20 mx-auto mb-2" />
              <p className="font-retro-mono text-base-black/40 text-sm">Data belum tersedia</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Top students */}
      <motion.div variants={cardVariants} className="retro-card bg-base-white border-4 border-base-black p-6">
        <h2 className="retro-heading retro-heading-sm text-base-black mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-retro-yellow" /> Siswa Kehadiran Terbaik (Top 10)
        </h2>
        {(data.top_students || []).length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(data.top_students || []).slice(0, 10).map((s, i) => (
              <div key={s.id || i} className="flex items-center gap-3 p-3 border-2 border-dashed border-base-black rounded-retro hover:bg-retro-yellow/10 transition-colors">
                <span className={`w-7 h-7 rounded-full border-2 border-base-black flex items-center justify-center font-retro-display font-black text-sm flex-shrink-0 ${i === 0 ? 'bg-retro-yellow' : i === 1 ? 'bg-base-gray' : i === 2 ? 'bg-retro-orange/30' : 'bg-base-white'}`}>{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-retro-display font-black text-sm truncate">{s.name}</p>
                  <p className="font-retro-mono text-[10px] text-base-black/50">{s.class?.name || '—'}</p>
                </div>
                <span className="font-retro-display font-black text-success text-sm flex-shrink-0">{s.attendance_rate || 0}%</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="font-retro-mono text-base-black/40 text-center py-4">Data belum tersedia</p>
        )}
      </motion.div>
    </motion.div>
  );
}
