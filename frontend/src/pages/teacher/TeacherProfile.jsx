import { useState, useCallback, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Edit2, Save, X, Camera, Mail, Phone, MapPin, 
  BookOpen, Award, Lock, Eye, EyeOff, CheckCircle2, 
  Settings, Bell, Globe, Sun, Moon, Activity, Smartphone, LogOut, 
  UserCheck, ShieldAlert, KeyRound, CalendarDays, Trash2,
  RefreshCw
} from 'lucide-react';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Toast from '../../components/ui/Toast';

const pageVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const cardVariants = { hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120 } } };

export default function TeacherProfile() {
  const { user, setUser } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [editing, setEditing] = useState(false);
  
  // Forms
  const [form, setForm] = useState(null);
  const [pwForm, setPwForm] = useState({ current_password: '', password: '', password_confirmation: '' });
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  
  // Preference states (cached in state, saved on changes)
  const [themeMode, setThemeMode] = useState(user?.theme_preferences?.mode || 'light');
  const [lang, setLang] = useState(user?.theme_preferences?.language || 'id');
  const [tz, setTz] = useState(user?.theme_preferences?.timezone || 'WIB');
  const [notifs, setNotifs] = useState({
    email: user?.notification_preferences?.email !== false,
    push: user?.notification_preferences?.push !== false
  });

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // Fetch full details
  const { data: profileResponse, isLoading: isProfileLoading, refetch: refetchProfile } = useQuery({
    queryKey: ['teacher-profile'],
    queryFn: () => api.get('/auth/me'),
    onSuccess: (res) => {
      const p = res.data;
      if (!form) {
        setForm({
          name: p?.name || '',
          email: p?.email || '',
          phone: p?.phone || '',
          bio: p?.profile?.bio || '',
          address: p?.profile?.address || '',
          gender: p?.profile?.gender || '',
          date_of_birth: p?.profile?.date_of_birth || '',
          github_url: p?.profile?.github_url || '',
          linkedin_url: p?.profile?.linkedin_url || ''
        });
      }
    }
  });

  // Fetch devices lists
  const { data: devicesResponse, isLoading: isDevicesLoading, refetch: refetchDevices } = useQuery({
    queryKey: ['teacher-devices'],
    queryFn: () => api.get('/auth/devices'),
    enabled: activeTab === 'activity'
  });

  // Profile text mutation
  const updateProfile = useMutation({
    mutationFn: (data) => api.put('/auth/profile/retro', data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['teacher-profile'] });
      if (res.data?.data?.user) {
        setUser(res.data.data.user);
      }
      setEditing(false);
      showToast('✅ Profil berhasil diperbarui!');
    },
    onError: (err) => {
      const msg = err.response?.data?.message || 'Gagal memperbarui profil';
      showToast(`❌ ${msg}`, 'error');
    }
  });

  // Password mutation
  const updatePassword = useMutation({
    mutationFn: (data) => api.put('/auth/profile', data), // Uses general put profile which changes pw on backend
    onSuccess: () => {
      setPwForm({ current_password: '', password: '', password_confirmation: '' });
      showToast('✅ Kata sandi berhasil diubah!');
    },
    onError: (err) => {
      const msg = err.response?.data?.message || 'Gagal mengubah kata sandi';
      showToast(`❌ ${msg}`, 'error');
    }
  });

  // Avatar upload mutation
  const uploadAvatarMutation = useMutation({
    mutationFn: (formData) => api.post('/auth/profile/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['teacher-profile'] });
      if (res.data?.data?.user) {
        setUser(res.data.data.user);
      }
      showToast('✅ Foto profil berhasil diunggah!');
    },
    onError: () => showToast('❌ Gagal mengunggah foto profil', 'error'),
  });

  // Remove avatar mutation
  const removeAvatarMutation = useMutation({
    mutationFn: () => api.post('/auth/profile/avatar/remove'),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['teacher-profile'] });
      if (res.data?.data?.user) {
        setUser(res.data.data.user);
      }
      showToast('🗑️ Foto profil berhasil dihapus!');
    },
    onError: () => showToast('❌ Gagal menghapus foto profil', 'error'),
  });

  // Revoke device session
  const revokeDeviceMutation = useMutation({
    mutationFn: (id) => api.delete(`/auth/devices/${id}`),
    onSuccess: () => {
      refetchDevices();
      showToast('✅ Sesi perangkat dicabut!');
    },
    onError: () => showToast('❌ Gagal mencabut sesi perangkat', 'error')
  });

  // Preferences save
  const savePreferences = useMutation({
    mutationFn: (data) => api.put('/auth/profile/retro', data),
    onSuccess: (res) => {
      if (res.data?.data?.user) {
        setUser(res.data.data.user);
      }
      showToast('✅ Preferensi berhasil disimpan!');
    },
    onError: () => showToast('❌ Gagal menyimpan preferensi', 'error')
  });

  // Password strength check
  const pwStrength = useMemo(() => {
    const pw = pwForm.password;
    if (!pw) return { score: 0, text: 'Kosong', color: 'bg-base-gray' };
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(pw)) score++;

    const map = [
      { score: 1, text: 'Sangat Lemah', color: 'bg-danger' },
      { score: 2, text: 'Lemah', color: 'bg-retro-orange' },
      { score: 3, text: 'Sedang', color: 'bg-retro-yellow' },
      { score: 4, text: 'Kuat', color: 'bg-success' }
    ];
    return map.find(item => item.score === score) || map[0];
  }, [pwForm.password]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showToast('❌ Ukuran file maksimal 2MB!', 'error');
      return;
    }
    const formData = new FormData();
    formData.append('avatar', file);
    uploadAvatarMutation.mutate(formData);
  };

  const handlePrefChange = (type, val) => {
    let payload = {};
    if (type === 'theme') {
      setThemeMode(val);
      payload = { theme_preferences: { mode: val, language: lang, timezone: tz } };
    } else if (type === 'lang') {
      setLang(val);
      payload = { theme_preferences: { mode: themeMode, language: val, timezone: tz } };
    } else if (type === 'tz') {
      setTz(val);
      payload = { theme_preferences: { mode: themeMode, language: lang, timezone: val } };
    } else if (type === 'notif') {
      const newNotifs = { ...notifs, ...val };
      setNotifs(newNotifs);
      payload = { notifications: newNotifs };
    }
    savePreferences.mutate(payload);
  };

  const p = profileResponse?.data || user;

  const initForm = () => {
    setForm({
      name: p?.name || '',
      email: p?.email || '',
      phone: p?.phone || '',
      bio: p?.profile?.bio || '',
      address: p?.profile?.address || '',
      gender: p?.profile?.gender || '',
      date_of_birth: p?.profile?.date_of_birth || '',
      github_url: p?.profile?.github_url || '',
      linkedin_url: p?.profile?.linkedin_url || ''
    });
  };

  if (isProfileLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] font-retro-mono gap-3">
        <RefreshCw className="w-8 h-8 text-retro-blue animate-spin" />
        <p className="text-base-black/50 text-sm">Memuat profil retro Anda...</p>
      </div>
    );
  }

  return (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" className="space-y-6 max-w-5xl">
      {toast && (
        <div className="fixed top-24 right-6 z-50">
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        </div>
      )}

      {/* Modern Glassmorphic Top Header */}
      <motion.div variants={cardVariants} className="retro-card bg-base-white/80 border-4 border-base-black p-6 backdrop-blur-md relative overflow-hidden">
        <div className="absolute right-0 top-0 w-32 h-32 bg-retro-blue/10 rounded-full blur-3xl" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="retro-heading retro-heading-xl text-retro-blue flex items-center gap-3">
              <User className="w-9 h-9" /> Akun Profil
            </h1>
            <p className="font-retro-mono text-sm text-base-black/70 mt-1">
              Kelola kredensial keamanan, pengaturan tema, dan data diri Anda
            </p>
          </div>
          <div className="flex gap-2">
            <span className="retro-badge retro-badge-blue">GURU</span>
            <span className="retro-badge retro-badge-lime">VERIFIED</span>
          </div>
        </div>
      </motion.div>

      {/* Responsive Layout Grid with Tab Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Profile Navigation Sidebar */}
        <motion.div variants={cardVariants} className="lg:col-span-1 flex flex-col gap-3">
          {[
            { id: 'profile', label: 'Profil Saya', icon: User },
            { id: 'security', label: 'Keamanan', icon: Lock },
            { id: 'settings', label: 'Preferensi', icon: Settings },
            { id: 'activity', label: 'Aktivitas Log', icon: Activity }
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setEditing(false);
                }}
                className={`flex items-center gap-3 px-4 py-3 rounded-retro border-2 border-base-black font-retro-display font-black text-sm transition-all duration-150 ${
                  active 
                    ? 'bg-retro-blue text-base-white shadow-[3px_3px_0px_0px_rgba(17,17,17,1)]' 
                    : 'bg-base-white text-base-black hover:bg-base-gray/50 hover:translate-x-1'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </motion.div>

        {/* Tab Contents Frame */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            
            {/* Tab: Profile Information */}
            {activeTab === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="retro-card bg-base-white border-4 border-base-black p-6 relative"
              >
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 border-b-2 border-dashed border-base-black/20 pb-6 mb-6">
                  
                  {/* Photo Profile Uploader */}
                  <div className="relative group flex-shrink-0">
                    <div className="w-28 h-28 rounded-retro-lg border-4 border-base-black bg-retro-blue/10 overflow-hidden flex items-center justify-center relative shadow-[4px_4px_0px_0px_rgba(17,17,17,1)]">
                      {p?.avatar_url ? (
                        <img src={p.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-retro-display font-black text-5xl text-retro-blue">
                          {p?.name?.[0]?.toUpperCase() || 'U'}
                        </span>
                      )}
                      
                      {/* Avatar Overlay Controls */}
                      <div className="absolute inset-0 bg-base-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 cursor-pointer">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="p-1.5 bg-retro-orange rounded-full border border-base-white text-base-white hover:scale-105 transition-transform"
                          title="Ganti Foto"
                        >
                          <Camera className="w-3.5 h-3.5" />
                        </button>
                        {p?.avatar_url && (
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm('Hapus foto profil?')) {
                                removeAvatarMutation.mutate();
                              }
                            }}
                            className="p-1.5 bg-danger rounded-full border border-base-white text-base-white hover:scale-105 transition-transform"
                            title="Hapus Foto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </div>

                  {/* Profile Header Title */}
                  <div className="text-center sm:text-left flex-1 min-w-0">
                    <h2 className="font-retro-display font-black text-2xl text-base-black truncate">{p?.name}</h2>
                    <p className="font-retro-mono text-sm text-base-black/60 flex items-center justify-center sm:justify-start gap-1">
                      <Mail className="w-3.5 h-3.5" /> {p?.email}
                    </p>
                    <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-3">
                      <span className="px-2.5 py-0.5 bg-retro-orange/20 border-2 border-retro-orange rounded-full text-[10px] font-black uppercase">
                        NIP: {p?.profile?.nip || '—'}
                      </span>
                      <span className="px-2.5 py-0.5 bg-retro-blue/20 border-2 border-retro-blue rounded-full text-[10px] font-black uppercase">
                        {p?.profile?.gender === 'L' ? 'Laki-Laki' : p?.profile?.gender === 'P' ? 'Perempuan' : 'Belum Ditentukan'}
                      </span>
                    </div>
                  </div>

                  {!editing && (
                    <Button 
                      className="sm:ml-auto" 
                      variant="outline" 
                      onClick={() => {
                        initForm();
                        setEditing(true);
                      }}
                    >
                      <Edit2 className="w-4 h-4 mr-1.5" /> Edit Profil
                    </Button>
                  )}
                </div>

                {editing && form ? (
                  <form onSubmit={e => { e.preventDefault(); updateProfile.mutate(form); }} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-retro-mono text-[10px] font-black uppercase tracking-wider mb-1">Nama Lengkap</label>
                        <input
                          type="text"
                          required
                          value={form.name}
                          onChange={e => setForm({ ...form, name: e.target.value })}
                          className="w-full py-2.5 px-3 border-2 border-base-black rounded-retro font-retro-mono text-sm bg-base-white focus:outline-none focus:border-retro-orange"
                        />
                      </div>
                      <div>
                        <label className="block font-retro-mono text-[10px] font-black uppercase tracking-wider mb-1">Email</label>
                        <input
                          type="email"
                          required
                          value={form.email}
                          onChange={e => setForm({ ...form, email: e.target.value })}
                          className="w-full py-2.5 px-3 border-2 border-base-black rounded-retro font-retro-mono text-sm bg-base-white focus:outline-none focus:border-retro-orange"
                        />
                      </div>
                      <div>
                        <label className="block font-retro-mono text-[10px] font-black uppercase tracking-wider mb-1">No Telepon/HP</label>
                        <input
                          type="text"
                          value={form.phone}
                          onChange={e => setForm({ ...form, phone: e.target.value })}
                          placeholder="Contoh: 0812345678"
                          className="w-full py-2.5 px-3 border-2 border-base-black rounded-retro font-retro-mono text-sm bg-base-white focus:outline-none focus:border-retro-orange"
                        />
                      </div>
                      <div>
                        <label className="block font-retro-mono text-[10px] font-black uppercase tracking-wider mb-1">Gender</label>
                        <select
                          value={form.gender}
                          onChange={e => setForm({ ...form, gender: e.target.value })}
                          className="w-full py-2.5 px-3 border-2 border-base-black rounded-retro font-retro-mono text-sm bg-base-white focus:outline-none focus:border-retro-orange"
                        >
                          <option value="">Pilih Gender</option>
                          <option value="L">Laki-Laki (L)</option>
                          <option value="P">Perempuan (P)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-retro-mono text-[10px] font-black uppercase tracking-wider mb-1">Tanggal Lahir</label>
                        <input
                          type="date"
                          value={form.date_of_birth}
                          onChange={e => setForm({ ...form, date_of_birth: e.target.value })}
                          className="w-full py-2.5 px-3 border-2 border-base-black rounded-retro font-retro-mono text-sm bg-base-white focus:outline-none focus:border-retro-orange"
                        />
                      </div>
                      <div>
                        <label className="block font-retro-mono text-[10px] font-black uppercase tracking-wider mb-1">Link GitHub</label>
                        <input
                          type="text"
                          value={form.github_url}
                          onChange={e => setForm({ ...form, github_url: e.target.value })}
                          placeholder="https://github.com/username"
                          className="w-full py-2.5 px-3 border-2 border-base-black rounded-retro font-retro-mono text-sm bg-base-white focus:outline-none focus:border-retro-orange"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block font-retro-mono text-[10px] font-black uppercase tracking-wider mb-1">Link LinkedIn</label>
                        <input
                          type="text"
                          value={form.linkedin_url}
                          onChange={e => setForm({ ...form, linkedin_url: e.target.value })}
                          placeholder="https://linkedin.com/in/username"
                          className="w-full py-2.5 px-3 border-2 border-base-black rounded-retro font-retro-mono text-sm bg-base-white focus:outline-none focus:border-retro-orange"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block font-retro-mono text-[10px] font-black uppercase tracking-wider mb-1">Alamat Tempat Tinggal</label>
                        <input
                          type="text"
                          value={form.address}
                          onChange={e => setForm({ ...form, address: e.target.value })}
                          className="w-full py-2.5 px-3 border-2 border-base-black rounded-retro font-retro-mono text-sm bg-base-white focus:outline-none focus:border-retro-orange"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block font-retro-mono text-[10px] font-black uppercase tracking-wider mb-1">Bio Singkat</label>
                        <textarea
                          rows={3}
                          value={form.bio}
                          onChange={e => setForm({ ...form, bio: e.target.value })}
                          placeholder="Ceritakan bidang pengajaran Anda..."
                          className="w-full py-2.5 px-3 border-2 border-base-black rounded-retro font-retro-mono text-sm bg-base-white focus:outline-none focus:border-retro-orange resize-none"
                        />
                      </div>
                    </div>
                    
                    <div className="flex gap-3 pt-4">
                      <Button type="submit" disabled={updateProfile.isPending}>
                        <Save className="w-4 h-4 mr-1.5" />
                        {updateProfile.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setEditing(false)}>
                        <X className="w-4 h-4 mr-1.5" /> Batal
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { icon: Mail, label: 'Email', value: p?.email },
                      { icon: Phone, label: 'Nomor Telepon', value: p?.phone || '—' },
                      { icon: MapPin, label: 'Alamat', value: p?.profile?.address || '—' },
                      { icon: CalendarDays, label: 'Tanggal Lahir', value: p?.profile?.date_of_birth ? new Date(p.profile.date_of_birth).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '—' },
                      { icon: Award, label: 'GitHub', value: p?.profile?.github_url ? <a href={p.profile.github_url} target="_blank" rel="noopener noreferrer" className="text-retro-blue hover:underline">{p.profile.github_url}</a> : '—' },
                      { icon: BookOpen, label: 'Bio', value: p?.profile?.bio || '—', fullWidth: true }
                    ].map((item, idx) => {
                      const Icon = item.icon;
                      return (
                        <div 
                          key={idx} 
                          className={`flex items-start gap-3 p-4 border-2 border-dashed border-base-black/30 rounded-retro bg-base-gray/5 ${item.fullWidth ? 'md:col-span-2' : ''}`}
                        >
                          <div className="p-2 bg-base-gray border-2 border-base-black rounded-retro flex-shrink-0">
                            <Icon className="w-4 h-4 text-base-black/60" />
                          </div>
                          <div>
                            <p className="font-retro-mono text-[9px] text-base-black/50 uppercase tracking-wider">{item.label}</p>
                            <div className="font-retro-mono text-sm text-base-black mt-1 break-all">{item.value}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {/* Tab: Security */}
            {activeTab === 'security' && (
              <motion.div
                key="security"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="retro-card bg-base-white border-4 border-base-black p-6 space-y-6"
              >
                <div>
                  <h3 className="font-retro-display font-black text-xl text-base-black flex items-center gap-2">
                    <KeyRound className="w-5 h-5 text-retro-orange" /> Ubah Kata Sandi
                  </h3>
                  <p className="font-retro-mono text-xs text-base-black/60 mt-1">
                    Jaga keamanan akun dengan mengubah kata sandi secara berkala.
                  </p>
                </div>

                <form onSubmit={e => { e.preventDefault(); updatePassword.mutate(pwForm); }} className="space-y-4 max-w-xl">
                  
                  {/* Current Password */}
                  <div>
                    <label className="block font-retro-mono text-[10px] font-black uppercase tracking-wider mb-1">Password Saat Ini</label>
                    <div className="relative">
                      <input
                        type={showCurrentPw ? 'text' : 'password'}
                        required
                        value={pwForm.current_password}
                        onChange={e => setPwForm({ ...pwForm, current_password: e.target.value })}
                        className="w-full py-2.5 pl-3 pr-10 border-2 border-base-black rounded-retro font-retro-mono text-sm bg-base-white focus:outline-none focus:border-retro-orange"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPw(!showCurrentPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-base-black/50 hover:text-base-black"
                      >
                        {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block font-retro-mono text-[10px] font-black uppercase tracking-wider mb-1">Password Baru</label>
                    <div className="relative">
                      <input
                        type={showNewPw ? 'text' : 'password'}
                        required
                        value={pwForm.password}
                        onChange={e => setPwForm({ ...pwForm, password: e.target.value })}
                        className="w-full py-2.5 pl-3 pr-10 border-2 border-base-black rounded-retro font-retro-mono text-sm bg-base-white focus:outline-none focus:border-retro-orange"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPw(!showNewPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-base-black/50 hover:text-base-black"
                      >
                        {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    
                    {/* Password Strength Indicator */}
                    {pwForm.password && (
                      <div className="mt-2.5 p-3 bg-base-gray/30 border-2 border-base-black rounded-retro space-y-1.5">
                        <div className="flex justify-between items-center text-[10px] font-retro-mono">
                          <span className="text-base-black/60">Kekuatan Sandi:</span>
                          <span className="font-black" style={{ color: pwStrength.color }}>{pwStrength.text}</span>
                        </div>
                        <div className="w-full h-2.5 bg-base-gray border border-base-black rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${pwStrength.color} transition-all duration-300`} 
                            style={{ width: `${(pwStrength.score / 4) * 100}%` }}
                          />
                        </div>
                        <ul className="text-[9px] font-retro-mono text-base-black/60 space-y-0.5 list-disc list-inside">
                          <li className={pwForm.password.length >= 8 ? 'text-success font-black' : ''}>Minimal 8 karakter</li>
                          <li className={/[A-Z]/.test(pwForm.password) ? 'text-success font-black' : ''}>Mengandung huruf kapital (A-Z)</li>
                          <li className={/[0-9]/.test(pwForm.password) ? 'text-success font-black' : ''}>Mengandung angka (0-9)</li>
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block font-retro-mono text-[10px] font-black uppercase tracking-wider mb-1">Konfirmasi Password Baru</label>
                    <input
                      type="password"
                      required
                      value={pwForm.password_confirmation}
                      onChange={e => setPwForm({ ...pwForm, password_confirmation: e.target.value })}
                      className="w-full py-2.5 px-3 border-2 border-base-black rounded-retro font-retro-mono text-sm bg-base-white focus:outline-none focus:border-retro-orange"
                    />
                    {pwForm.password_confirmation && pwForm.password !== pwForm.password_confirmation && (
                      <p className="text-[10px] font-retro-mono text-danger font-black mt-1">❌ Konfirmasi password tidak cocok!</p>
                    )}
                  </div>

                  <Button 
                    type="submit" 
                    disabled={updatePassword.isPending || (pwForm.password && pwForm.password !== pwForm.password_confirmation)}
                  >
                    <Save className="w-4 h-4 mr-1.5" />
                    {updatePassword.isPending ? 'Memproses...' : 'Ubah Password'}
                  </Button>
                </form>
              </motion.div>
            )}

            {/* Tab: Settings */}
            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="retro-card bg-base-white border-4 border-base-black p-6 space-y-6"
              >
                <div>
                  <h3 className="font-retro-display font-black text-xl text-base-black flex items-center gap-2">
                    <Settings className="w-5 h-5 text-retro-blue" /> Preferensi Akun
                  </h3>
                  <p className="font-retro-mono text-xs text-base-black/60 mt-1">
                    Sesuaikan tema antarmuka, bahasa regional, dan preferensi notifikasi Anda.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Visual Theme Selection */}
                  <div className="retro-card bg-base-gray/25 border-2 border-base-black p-4 space-y-3">
                    <p className="font-retro-display font-black text-sm text-base-black flex items-center gap-1.5">
                      <Globe className="w-4 h-4 text-retro-orange" /> Tampilan Tema
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { id: 'light', label: 'Terang', desc: 'Klasik RPL', icon: Sun },
                        { id: 'dark', label: 'Gelap', desc: 'Cyber Neon', icon: Moon }
                      ].map(theme => {
                        const Icon = theme.icon;
                        const active = themeMode === theme.id;
                        return (
                          <button
                            key={theme.id}
                            onClick={() => handlePrefChange('theme', theme.id)}
                            className={`p-3 rounded-retro border-2 border-base-black flex flex-col items-center text-center gap-1.5 transition-all ${
                              active 
                                ? 'bg-retro-orange/10 border-retro-orange shadow-[2px_2px_0px_0px_rgba(255,92,0,1)]' 
                                : 'bg-base-white hover:bg-base-gray'
                            }`}
                          >
                            <Icon className={`w-6 h-6 ${active ? 'text-retro-orange' : 'text-base-black/60'}`} />
                            <span className="font-retro-display font-black text-xs">{theme.label}</span>
                            <span className="font-retro-mono text-[9px] text-base-black/50">{theme.desc}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Language & Timezone */}
                  <div className="retro-card bg-base-gray/25 border-2 border-base-black p-4 space-y-4">
                    <p className="font-retro-display font-black text-sm text-base-black flex items-center gap-1.5">
                      <Globe className="w-4 h-4 text-retro-blue" /> Regional & Waktu
                    </p>
                    <div className="space-y-3">
                      <div>
                        <label className="block font-retro-mono text-[9px] font-black uppercase text-base-black/60 mb-1">Bahasa</label>
                        <select
                          value={lang}
                          onChange={e => handlePrefChange('lang', e.target.value)}
                          className="w-full py-2 px-3 border-2 border-base-black rounded-retro font-retro-mono text-xs bg-base-white focus:outline-none"
                        >
                          <option value="id">Bahasa Indonesia (ID)</option>
                          <option value="en">English (EN)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-retro-mono text-[9px] font-black uppercase text-base-black/60 mb-1">Zona Waktu</label>
                        <select
                          value={tz}
                          onChange={e => handlePrefChange('tz', e.target.value)}
                          className="w-full py-2 px-3 border-2 border-base-black rounded-retro font-retro-mono text-xs bg-base-white focus:outline-none"
                        >
                          <option value="WIB">WIB (Jakarta - UTC+7)</option>
                          <option value="WITA">WITA (Bali/Makassar - UTC+8)</option>
                          <option value="WIT">WIT (Papua - UTC+9)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Notification Toggles */}
                  <div className="retro-card bg-base-gray/25 border-2 border-base-black p-4 md:col-span-2 space-y-3">
                    <p className="font-retro-display font-black text-sm text-base-black flex items-center gap-1.5">
                      <Bell className="w-4 h-4 text-retro-lime" /> Pusat Notifikasi
                    </p>
                    <div className="space-y-2">
                      {[
                        { id: 'email', label: 'Notifikasi Email', desc: 'Terima laporan kelas harian dan info izin siswa via email' },
                        { id: 'push', label: 'Push Notification', desc: 'Aktifkan notifikasi realtime di browser Anda' }
                      ].map(notif => {
                        const enabled = notifs[notif.id];
                        return (
                          <div 
                            key={notif.id}
                            className="flex items-center justify-between p-3 bg-base-white border-2 border-base-black rounded-retro"
                          >
                            <div>
                              <p className="font-retro-display font-black text-xs text-base-black">{notif.label}</p>
                              <p className="font-retro-mono text-[9px] text-base-black/50 mt-0.5">{notif.desc}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handlePrefChange('notif', { [notif.id]: !enabled })}
                              className={`w-12 h-6 rounded-full border-2 border-base-black relative transition-colors ${
                                enabled ? 'bg-retro-lime' : 'bg-base-gray'
                              }`}
                            >
                              <div 
                                className={`w-4 h-4 bg-base-white border border-base-black rounded-full absolute top-1/2 -translate-y-1/2 transition-all ${
                                  enabled ? 'right-1' : 'left-1'
                                }`}
                              />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              </motion.div>
            )}

            {/* Tab: Activity Log */}
            {activeTab === 'activity' && (
              <motion.div
                key="activity"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="retro-card bg-base-white border-4 border-base-black p-6 space-y-6"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-retro-display font-black text-xl text-base-black flex items-center gap-2">
                      <Smartphone className="w-5 h-5 text-retro-orange" /> Sesi Perangkat
                    </h3>
                    <p className="font-retro-mono text-xs text-base-black/60 mt-1">
                      Daftar perangkat yang memiliki akses aktif ke akun Anda saat ini.
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => refetchDevices()}>
                    <RefreshCw className="w-3.5 h-3.5 mr-1" /> Segarkan
                  </Button>
                </div>

                {isDevicesLoading ? (
                  <div className="text-center font-retro-mono text-xs text-base-black/50 py-10">
                    Memuat daftar perangkat...
                  </div>
                ) : (
                  <div className="space-y-3">
                    {devicesResponse?.data?.data?.devices?.map((device) => (
                      <div 
                        key={device.id} 
                        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border-2 border-base-black rounded-retro bg-base-white ${
                          device.is_current ? 'bg-retro-orange/5 border-retro-orange shadow-[2px_2px_0px_0px_rgba(255,92,0,1)]' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 border-2 border-base-black rounded-retro ${device.is_current ? 'bg-retro-orange text-base-white' : 'bg-base-gray text-base-black/60'}`}>
                            <Smartphone className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-retro-display font-black text-sm">{device.name}</p>
                              {device.is_current && (
                                <span className="retro-badge retro-badge-orange text-[8px] px-1.5 py-0">SEKARANG</span>
                              )}
                            </div>
                            <p className="font-retro-mono text-[10px] text-base-black/60 mt-1">
                              IP: {device.ip_address} • Lokasi: {device.location || 'Unknown'}
                            </p>
                            <p className="font-retro-mono text-[9px] text-base-black/40 mt-0.5">
                              Aktif terakhir: {new Date(device.last_used_at || device.created_at).toLocaleString('id-ID')}
                            </p>
                          </div>
                        </div>

                        {!device.is_current && (
                          <button
                            onClick={() => {
                              if (window.confirm(`Cabut akses untuk ${device.name}?`)) {
                                revokeDeviceMutation.mutate(device.id);
                              }
                            }}
                            className="retro-btn retro-btn-sm bg-danger text-base-white hover:bg-danger/90 self-start sm:self-center flex items-center gap-1.5"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            <span className="font-retro-mono text-[9px]">PUTUSKAN</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
