import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ShieldAlert, LogIn, Monitor, AlertTriangle, Clock,
  Search, RefreshCw, Smartphone, Globe, CheckCircle2, X
} from 'lucide-react';
import { api } from '../../api';
import Button from '../../components/ui/Button';

const pageVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const cardVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } } };

const RISK_CFG = {
  low:    { color: '#00B894', bg: '#00B89420', label: 'Rendah' },
  medium: { color: '#E67E22', bg: '#E67E2220', label: 'Sedang' },
  high:   { color: '#E74C3C', bg: '#E74C3C20', label: 'Tinggi' },
};

function LogRow({ log, i }) {
  const risk = RISK_CFG[log.risk_level?.toLowerCase()] || RISK_CFG.low;
  return (
    <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
      className="border-b-2 border-dashed border-base-black hover:bg-base-gray/10 transition-colors">
      <td className="p-3">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-retro border border-base-black`} style={{ background: risk.bg }}>
            {log.status === 'success' ? <CheckCircle2 className="w-3 h-3" style={{ color: risk.color }} /> : <X className="w-3 h-3 text-danger" />}
          </div>
          <div>
            <p className="font-retro-display font-black text-sm">{log.user?.name || log.email || 'Unknown'}</p>
            <p className="font-retro-mono text-[10px] text-base-black/50">{log.user?.email || '—'}</p>
          </div>
        </div>
      </td>
      <td className="p-3 font-retro-mono text-xs text-base-black/60">{log.ip_address || '—'}</td>
      <td className="p-3">
        <span className="font-retro-mono text-xs flex items-center gap-1">
          <Globe className="w-3 h-3 text-base-black/40" />
          {log.browser || 'Unknown'}
        </span>
      </td>
      <td className="p-3">
        <span className="px-2 py-0.5 rounded-full text-[10px] font-black border-2 border-base-black" style={{ background: risk.bg, color: risk.color }}>
          {risk.label}
        </span>
      </td>
      <td className="p-3">
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border-2 ${log.status === 'success' ? 'border-success bg-success/10 text-success' : 'border-danger bg-danger/10 text-danger'}`}>
          {log.status === 'success' ? 'Berhasil' : 'Gagal'}
        </span>
      </td>
      <td className="p-3 font-retro-mono text-[10px] text-base-black/50">
        {log.created_at ? new Date(log.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
      </td>
    </motion.tr>
  );
}

export default function AdminSecurity() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: loginLogs, isLoading, refetch } = useQuery({
    queryKey: ['admin-security-logs', statusFilter],
    queryFn: () => api.get('/admin/security/logs', { params: { status: statusFilter !== 'all' ? statusFilter : undefined } }),
    refetchInterval: 30000,
  });
  const { data: sessions } = useQuery({
    queryKey: ['admin-active-sessions'],
    queryFn: () => api.get('/admin/security/sessions'),
    refetchInterval: 30000,
  });
  const { data: stats } = useQuery({
    queryKey: ['admin-security-stats'],
    queryFn: () => api.get('/admin/security/stats'),
  });

  const logs = loginLogs?.data || [];
  const sessionList = sessions?.data || [];
  const secStats = stats?.data || {};

  const filtered = search ? logs.filter(l => (l.user?.name || l.email || '').toLowerCase().includes(search.toLowerCase()) || (l.ip_address || '').includes(search)) : logs;

  return (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" className="space-y-6">

      {/* Header */}
      <motion.div variants={cardVariants} className="retro-card bg-base-white border-4 border-base-black p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="retro-heading retro-heading-xl text-retro-blue flex items-center gap-3">
              <ShieldAlert className="w-8 h-8" /> Keamanan Sistem
            </h1>
            <p className="font-retro-mono text-sm text-base-black/70 mt-1">Monitor aktivitas login, sesi aktif, dan keamanan sistem secara realtime</p>
          </div>
          <Button variant="outline" onClick={() => refetch()}><RefreshCw className="w-4 h-4 mr-1" /> Refresh</Button>
        </div>
      </motion.div>

      {/* Security stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          ['Login Hari Ini', secStats.logins_today || logs.filter(l => new Date(l.created_at).toDateString() === new Date().toDateString()).length, '#2E2BBF', LogIn],
          ['Login Gagal', secStats.failed_logins || logs.filter(l => l.status === 'failed').length, '#E74C3C', AlertTriangle],
          ['Sesi Aktif', sessionList.length, '#00B894', Monitor],
          ['Device Unik', secStats.unique_devices || 0, '#E67E22', Smartphone],
        ].map(([label, value, color, Icon]) => (
          <div key={label} className="retro-card bg-base-white border-2 border-base-black p-4 flex items-center gap-3">
            <div className="p-2 rounded-retro border-2 border-base-black" style={{ background: `${color}20` }}>
              <Icon className="w-4 h-4" style={{ color }} />
            </div>
            <div>
              <p className="retro-heading text-xl" style={{ color }}>{value}</p>
              <p className="font-retro-mono text-[10px] text-base-black/60 uppercase">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Active sessions */}
      <motion.div variants={cardVariants} className="retro-card bg-base-white border-4 border-base-black p-6">
        <h2 className="retro-heading retro-heading-sm text-base-black mb-4 flex items-center gap-2">
          <Monitor className="w-5 h-5 text-success" /> Sesi Aktif ({sessionList.length})
        </h2>
        {sessionList.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {sessionList.slice(0, 9).map((s, i) => (
              <div key={i} className="p-3 border-2 border-base-black border-dashed rounded-retro flex items-center gap-2 hover:bg-success/5 transition-colors">
                <div className="relative flex-shrink-0">
                  <div className="w-8 h-8 rounded-full border-2 border-base-black bg-success/20 flex items-center justify-center font-retro-display font-black text-sm text-success">
                    {s.user?.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-success border border-base-black rounded-full" />
                </div>
                <div className="min-w-0">
                  <p className="font-retro-display font-black text-xs truncate">{s.user?.name || 'Unknown'}</p>
                  <p className="font-retro-mono text-[9px] text-base-black/50">{s.ip_address || '—'}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="font-retro-mono text-base-black/40 text-center py-4 text-sm">
            {isLoading ? 'Memuat sesi...' : 'Tidak ada sesi aktif atau endpoint belum tersedia'}
          </p>
        )}
      </motion.div>

      {/* Login history table */}
      <motion.div variants={cardVariants} className="retro-card bg-base-white border-4 border-base-black overflow-hidden">
        <div className="p-4 border-b-2 border-base-black flex flex-wrap gap-3">
          <h2 className="retro-heading retro-heading-sm text-base-black flex items-center gap-2 flex-1">
            <Clock className="w-4 h-4 text-retro-orange" /> Histori Login
          </h2>
          <div className="flex gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-base-black/40" />
              <input type="text" placeholder="Cari user / IP..." value={search} onChange={e => setSearch(e.target.value)}
                className="pl-7 py-1.5 pr-3 border-2 border-base-black rounded-retro font-retro-mono text-xs bg-base-gray/20 focus:outline-none focus:border-retro-orange" />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="py-1.5 px-2 border-2 border-base-black rounded-retro font-retro-mono text-xs bg-base-white focus:outline-none">
              <option value="all">Semua</option>
              <option value="success">Berhasil</option>
              <option value="failed">Gagal</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[650px]">
            <thead>
              <tr className="bg-base-gray/30 border-b-2 border-base-black">
                {['Pengguna', 'IP Address', 'Browser', 'Risk', 'Status', 'Waktu'].map(h => (
                  <th key={h} className="p-3 font-retro-display tracking-wider text-xs text-base-black/70">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="6" className="p-10 text-center font-retro-mono text-base-black/50">Memuat histori login...</td></tr>
              ) : filtered.length > 0 ? filtered.slice(0, 50).map((log, i) => <LogRow key={log.id || i} log={log} i={i} />) : (
                <tr><td colSpan="6" className="p-10 text-center">
                  <ShieldAlert className="w-10 h-10 text-base-black/20 mx-auto mb-2" />
                  <p className="font-retro-mono text-base-black/50 text-sm">
                    {logs.length === 0 ? 'Endpoint /admin/security/logs belum tersedia atau tidak ada data' : 'Tidak ada data yang cocok'}
                  </p>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}
