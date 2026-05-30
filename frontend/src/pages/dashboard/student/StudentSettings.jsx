import { useState, useEffect } from 'react';
import { Settings, Sun, Moon, Bell, Monitor, RefreshCw, Save, AlertCircle } from 'lucide-react';
import studentApi from '../../../api/student';
import { motion } from 'framer-motion';
import { PageHeader, RetroCard } from '../../../components/ui/RetroLayouts';

// ── Retro Toggle Row Component ──────────────────────────────
function ToggleRow({ label, desc, value, onChange, borderBottom = true }) {
  return (
    <div className={`flex items-center justify-between gap-4 py-3.5 ${borderBottom ? 'border-b-2 border-base-black/10' : ''}`}>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-retro-display font-black uppercase text-base-black tracking-wide leading-tight">{label}</p>
        <p className="text-[8px] font-retro-mono text-base-black/45 uppercase mt-1 leading-tight">{desc}</p>
      </div>
      {/* Retro brutalist toggle switch */}
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative shrink-0 w-11 h-6 border-2 border-base-black rounded-retro transition-all duration-200 shadow-hard-sm focus:outline-none ${
          value ? 'bg-retro-purple' : 'bg-base-gray'
        }`}
        aria-checked={value}
        role="switch"
      >
        <span
          className={`absolute top-0.5 w-4 h-4 bg-base-white border-2 border-base-black rounded-sm transition-all duration-200 shadow-[1px_1px_0px_0px_#111] ${
            value ? 'left-[calc(100%-1.25rem)]' : 'left-0.5'
          }`}
        />
      </button>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────
export default function StudentSettings() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [saving, setSaving] = useState(false);

  // Settings state
  const [themeMode, setThemeMode] = useState('light');
  const [retroThemeEnabled, setRetroThemeEnabled] = useState(true);
  const [notifyNewSchedule, setNotifyNewSchedule] = useState(true);
  const [notifyNewTask, setNotifyNewTask] = useState(true);
  const [notifyGradeReleased, setNotifyGradeReleased] = useState(true);
  const [notifyAnnouncement, setNotifyAnnouncement] = useState(true);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await studentApi.getSettings();
      if (res.status === 'success') {
        const { theme, notifications } = res.data;
        setThemeMode(theme?.mode || 'light');
        setRetroThemeEnabled(theme?.enabled ?? true);
        setNotifyNewSchedule(notifications?.new_schedule ?? true);
        setNotifyNewTask(notifications?.new_task ?? true);
        setNotifyGradeReleased(notifications?.grade_released ?? true);
        setNotifyAnnouncement(notifications?.announcement ?? true);
      }
    } catch (err) {
      console.error(err);
      // Settings endpoint may not exist — load defaults silently
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const payload = {
        theme: { mode: themeMode, enabled: retroThemeEnabled },
        notifications: {
          new_schedule: notifyNewSchedule,
          new_task: notifyNewTask,
          grade_released: notifyGradeReleased,
          announcement: notifyAnnouncement,
        },
      };

      const res = await studentApi.updateSettings(payload);
      if (res.status === 'success') {
        setSuccess('Pengaturan matriks berhasil disimpan!');
        fetchSettings();
      }
    } catch (err) {
      console.error(err);
      setError('Gagal menyimpan pengaturan.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] retro-card bg-base-white p-8 shadow-hard">
        <div className="w-12 h-12 border-4 border-retro-purple border-t-base-black rounded-full animate-spin mb-4" />
        <p className="font-retro-display font-black text-xs text-base-black uppercase tracking-widest animate-pulse">
          LOADING SETTINGS ENGINE...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* ── Page Header ──────────────────────────────────── */}
      <PageHeader 
        title="Settings"
        icon={Settings}
        description="Sesuaikan setelan preferensi antarmuka sistem, visualisasi tema, dan notifikasi email/portal Anda."
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard/student' },
          { label: 'Settings', path: '/dashboard/student/settings' }
        ]}
        actions={
          <button
            type="button"
            onClick={fetchSettings}
            className="p-2.5 bg-base-white hover:bg-retro-yellow text-base-black border-2 border-base-black rounded-retro shadow-hard-sm active:translate-y-[1px] active:shadow-hard-xs transition-all"
            title="Refresh settings"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        }
      />

      {/* ── Alerts ─────────────────────────────────────────── */}
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

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── Tampilan Matriks ────────────────────────────── */}
        <RetroCard variant="white">
          <h3 className="font-retro-display font-black text-base-black tracking-widest uppercase text-xs border-b-4 border-base-black pb-3 mb-4 flex items-center gap-2">
            <Monitor className="w-4 h-4 text-retro-purple" />
            <span>Kustomisasi Tampilan</span>
          </h3>

          <ToggleRow
            label="Tema Retro Futuristic"
            desc="Aktifkan grid visualizer &amp; Neobrutalist border neon."
            value={retroThemeEnabled}
            onChange={setRetroThemeEnabled}
          />

          {/* Theme mode light/dark selector */}
          <div className="flex items-center justify-between gap-4 pt-3.5">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-retro-display font-black uppercase text-base-black tracking-wide leading-tight">Mode Terang / Gelap</p>
              <p className="text-[8px] font-retro-mono text-base-black/45 uppercase mt-1 leading-tight">Tentukan skema warna terang atau gelap pada sistem.</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setThemeMode('light')}
                className={`px-3 py-1.5 border-2 border-base-black rounded-retro text-[9px] font-retro-display font-black uppercase flex items-center gap-1.5 transition-all shadow-hard-sm active:translate-y-[1px] active:shadow-hard-xs ${
                  themeMode === 'light'
                    ? 'bg-retro-yellow text-base-black'
                    : 'bg-base-white text-base-black/55 hover:bg-retro-yellow/20'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>LIGHT</span>
              </button>
              <button
                type="button"
                onClick={() => setThemeMode('dark')}
                className={`px-3 py-1.5 border-2 border-base-black rounded-retro text-[9px] font-retro-display font-black uppercase flex items-center gap-1.5 transition-all shadow-hard-sm active:translate-y-[1px] active:shadow-hard-xs ${
                  themeMode === 'dark'
                    ? 'bg-base-black text-base-white'
                    : 'bg-base-white text-base-black/55 hover:bg-base-black/5'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>DARK</span>
              </button>
            </div>
          </div>
        </RetroCard>

        {/* ── Notifikasi ──────────────────────────────────── */}
        <RetroCard variant="white">
          <h3 className="font-retro-display font-black text-base-black tracking-widest uppercase text-xs border-b-4 border-base-black pb-3 mb-4 flex items-center gap-2">
            <Bell className="w-4 h-4 text-retro-orange" />
            <span>PENGATURAN NOTIFIKASI PORTAL</span>
          </h3>

          <ToggleRow
            label="Jadwal Pelajaran Baru"
            desc="Kirim notifikasi setiap kali jadwal kelas Anda diperbarui."
            value={notifyNewSchedule}
            onChange={setNotifyNewSchedule}
          />
          <ToggleRow
            label="Tugas Akademik Dirilis"
            desc="Kirim notifikasi saat guru merilis tugas baru di kelas."
            value={notifyNewTask}
            onChange={setNotifyNewTask}
          />
          <ToggleRow
            label="Rilis Nilai / Rapor KHS"
            desc="Kirim notifikasi ketika guru mempublikasikan penilaian KHS baru."
            value={notifyGradeReleased}
            onChange={setNotifyGradeReleased}
          />
          <ToggleRow
            label="Pengumuman & Mading Masuk"
            desc="Kirim notifikasi setiap ada mading info resmi masuk dari sekolah."
            value={notifyAnnouncement}
            onChange={setNotifyAnnouncement}
            borderBottom={false}
          />
        </RetroCard>

        {/* ── Save Button ─────────────────────────────────── */}
        <button
          type="submit"
          disabled={saving}
          className={`w-full retro-btn py-3.5 flex items-center justify-center gap-2 ${
            saving ? 'opacity-40 cursor-not-allowed shadow-none' : 'bg-base-black text-base-white hover:bg-retro-purple shadow-hard'
          }`}
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-base-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>SIMPAN PENGATURAN MATRIKS</span>
        </button>

      </form>
    </div>
  );
}
