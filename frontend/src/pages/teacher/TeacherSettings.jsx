import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Settings, Moon, Sun, Bell, Shield, Globe, Palette, Save, CheckCircle2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import Button from '../../components/ui/Button';
import Toast from '../../components/ui/Toast';

const pageVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const cardVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } } };

function SettingSection({ title, icon: Icon, color, children }) {
  return (
    <motion.div variants={cardVariants} className="retro-card bg-base-white border-4 border-base-black p-6">
      <h2 className="retro-heading retro-heading-sm text-base-black mb-5 flex items-center gap-2">
        <Icon className="w-5 h-5" style={{ color }} /> {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </motion.div>
  );
}

function Toggle({ label, description, value, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 border-b-2 border-dashed border-base-black last:border-0">
      <div>
        <p className="font-retro-mono text-sm font-black text-base-black">{label}</p>
        {description && <p className="font-retro-mono text-[10px] text-base-black/50 mt-0.5">{description}</p>}
      </div>
      <button onClick={() => onChange(!value)}
        className={`relative w-12 h-6 rounded-full border-2 border-base-black transition-colors ${value ? 'bg-retro-orange' : 'bg-base-gray'}`}>
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-base-white border-2 border-base-black transition-transform ${value ? 'translate-x-6' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );
}

export default function TeacherSettings() {
  const { isDark, toggleTheme } = useTheme();
  const [toast, setToast] = useState(null);
  const [notifSettings, setNotifSettings] = useState({
    email_notifications: true,
    permission_alerts: true,
    attendance_reminders: true,
    grade_updates: false,
    message_notifications: true,
  });
  const [privacySettings, setPrivacySettings] = useState({
    show_profile_to_students: true,
    allow_messages: true,
  });
  const [language, setLanguage] = useState('id');

  const showToast = useCallback((msg, type = 'success') => { setToast({ message: msg, type }); setTimeout(() => setToast(null), 3500); }, []);

  const saveSettings = () => showToast('✅ Pengaturan berhasil disimpan!');

  return (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" className="space-y-6 max-w-2xl">
      {toast && <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed top-24 right-6 z-50"><Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} /></motion.div>}

      <motion.div variants={cardVariants} className="retro-card bg-base-white border-4 border-base-black p-6">
        <h1 className="retro-heading retro-heading-xl text-retro-blue flex items-center gap-3"><Settings className="w-8 h-8" /> Pengaturan</h1>
        <p className="font-retro-mono text-sm text-base-black/70 mt-1">Sesuaikan tampilan, notifikasi, dan preferensi akun Anda</p>
      </motion.div>

      {/* Appearance */}
      <SettingSection title="Tampilan" icon={Palette} color="#6C5CE7">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-retro-mono text-sm font-black">Mode Gelap / Terang</p>
            <p className="font-retro-mono text-[10px] text-base-black/50 mt-0.5">Ubah tema tampilan dashboard</p>
          </div>
          <button onClick={toggleTheme}
            className={`flex items-center gap-2 px-4 py-2 border-2 border-base-black rounded-retro font-retro-mono text-xs font-black transition-all hover:bg-retro-yellow/20 shadow-[2px_2px_0px_0px_#111]`}>
            {isDark ? <Sun className="w-4 h-4 text-retro-yellow" /> : <Moon className="w-4 h-4 text-retro-blue" />}
            {isDark ? 'Mode Terang' : 'Mode Gelap'}
          </button>
        </div>
        <div>
          <p className="font-retro-mono text-sm font-black mb-2">Bahasa</p>
          <select value={language} onChange={e => setLanguage(e.target.value)}
            className="py-2 px-3 border-2 border-base-black rounded-retro font-retro-mono text-sm bg-base-white focus:outline-none focus:border-retro-orange">
            <option value="id">🇮🇩 Bahasa Indonesia</option>
            <option value="en">🇺🇸 English</option>
          </select>
        </div>
      </SettingSection>

      {/* Notifications */}
      <SettingSection title="Notifikasi" icon={Bell} color="#E67E22">
        {[
          ['email_notifications', 'Notifikasi Email', 'Terima ringkasan harian via email'],
          ['permission_alerts', 'Alert Izin Masuk', 'Notifikasi saat ada permohonan izin baru'],
          ['attendance_reminders', 'Pengingat Absensi', 'Pengingat membuka sesi absensi sesuai jadwal'],
          ['grade_updates', 'Update Nilai', 'Notifikasi saat nilai siswa diperbarui'],
          ['message_notifications', 'Notifikasi Pesan', 'Pemberitahuan pesan masuk dari siswa'],
        ].map(([key, label, desc]) => (
          <Toggle key={key} label={label} description={desc}
            value={notifSettings[key]}
            onChange={v => setNotifSettings(s => ({ ...s, [key]: v }))} />
        ))}
      </SettingSection>

      {/* Privacy */}
      <SettingSection title="Privasi & Keamanan" icon={Shield} color="#00B894">
        {[
          ['show_profile_to_students', 'Tampilkan Profil ke Siswa', 'Siswa dapat melihat informasi profil Anda'],
          ['allow_messages', 'Izinkan Pesan dari Siswa', 'Siswa dapat mengirim pesan langsung ke Anda'],
        ].map(([key, label, desc]) => (
          <Toggle key={key} label={label} description={desc}
            value={privacySettings[key]}
            onChange={v => setPrivacySettings(s => ({ ...s, [key]: v }))} />
        ))}
        <div className="pt-2">
          <p className="font-retro-mono text-sm font-black mb-1">Sesi Aktif</p>
          <div className="p-3 border-2 border-base-black border-dashed rounded-retro flex items-center justify-between">
            <div>
              <p className="font-retro-mono text-xs font-black">Perangkat Ini</p>
              <p className="font-retro-mono text-[10px] text-base-black/50">Login terakhir: Baru saja</p>
            </div>
            <span className="flex items-center gap-1 font-retro-mono text-[10px] text-success"><CheckCircle2 className="w-3 h-3" /> Aktif</span>
          </div>
        </div>
      </SettingSection>

      <motion.div variants={cardVariants} className="flex justify-end">
        <Button onClick={saveSettings} className="px-8">
          <Save className="w-4 h-4 mr-2" /> Simpan Semua Pengaturan
        </Button>
      </motion.div>
    </motion.div>
  );
}
