import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { User, Edit2, Save, X, Camera, Mail, Phone, MapPin, BookOpen, Award } from 'lucide-react';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Toast from '../../components/ui/Toast';

const pageVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const cardVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } } };

export default function TeacherProfile() {
  const { user, setUser } = useAuth();
  const queryClient = useQueryClient();
  const [toast, setToast] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);
  const [pwForm, setPwForm] = useState({ current_password: '', password: '', password_confirmation: '' });
  const [showPwForm, setShowPwForm] = useState(false);

  const showToast = useCallback((msg, type = 'success') => { setToast({ message: msg, type }); setTimeout(() => setToast(null), 3500); }, []);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['teacher-profile'],
    queryFn: () => api.get('/auth/me'),
    onSuccess: (res) => { if (!form) setForm({ name: res.data?.name || '', email: res.data?.email || '', phone: res.data?.profile?.phone || '', bio: res.data?.profile?.bio || '', address: res.data?.profile?.address || '' }); },
  });

  const updateProfile = useMutation({
    mutationFn: (data) => api.put('/auth/profile', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['teacher-profile'] }); setEditing(false); showToast('✅ Profil berhasil diperbarui!'); },
    onError: () => showToast('❌ Gagal memperbarui profil', 'error'),
  });

  const updatePassword = useMutation({
    mutationFn: (data) => api.put('/auth/profile', data),
    onSuccess: () => { setShowPwForm(false); setPwForm({ current_password: '', password: '', password_confirmation: '' }); showToast('✅ Kata sandi berhasil diubah!'); },
    onError: () => showToast('❌ Gagal mengubah kata sandi', 'error'),
  });

  const p = profile?.data || user;
  const initForm = () => setForm({ name: p?.name || '', email: p?.email || '', phone: p?.profile?.phone || '', bio: p?.profile?.bio || '', address: p?.profile?.address || '' });

  if (isLoading) return <div className="flex items-center justify-center min-h-[300px] font-retro-mono text-base-black/50">Memuat profil...</div>;

  return (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" className="space-y-6 max-w-3xl">
      {toast && <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed top-24 right-6 z-50"><Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} /></motion.div>}

      <motion.div variants={cardVariants} className="retro-card bg-base-white border-4 border-base-black p-6">
        <h1 className="retro-heading retro-heading-xl text-retro-blue flex items-center gap-3"><User className="w-8 h-8" /> Profil Saya</h1>
        <p className="font-retro-mono text-sm text-base-black/70 mt-1">Kelola informasi akun dan biodata Anda</p>
      </motion.div>

      {/* Avatar + info */}
      <motion.div variants={cardVariants} className="retro-card bg-base-white border-4 border-base-black p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full border-4 border-base-black bg-retro-blue/20 flex items-center justify-center font-retro-display font-black text-4xl text-retro-blue">
              {p?.name?.[0]?.toUpperCase()}
            </div>
            <button className="absolute -bottom-1 -right-1 p-1.5 bg-retro-orange border-2 border-base-black rounded-full shadow-[2px_2px_0px_0px_#111] hover:bg-retro-orange/80">
              <Camera className="w-3 h-3 text-base-white" />
            </button>
          </div>
          <div>
            <p className="font-retro-display font-black text-2xl text-base-black">{p?.name}</p>
            <p className="font-retro-mono text-sm text-base-black/60">{p?.email}</p>
            <div className="flex gap-2 mt-2">
              <span className="px-3 py-1 bg-retro-lime/20 border-2 border-retro-lime rounded-full text-xs font-black uppercase">Guru</span>
              <span className="px-3 py-1 bg-retro-blue/20 border-2 border-retro-blue rounded-full text-xs font-black uppercase">Aktif</span>
            </div>
          </div>
          {!editing && (
            <Button className="sm:ml-auto" variant="outline" onClick={() => { initForm(); setEditing(true); }}>
              <Edit2 className="w-4 h-4 mr-1" /> Edit Profil
            </Button>
          )}
        </div>

        {editing && form ? (
          <form onSubmit={e => { e.preventDefault(); updateProfile.mutate(form); }} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                ['Nama Lengkap', 'name', 'text', 'Nama lengkap Anda'],
                ['Email', 'email', 'email', 'email@contoh.com'],
                ['Telepon', 'phone', 'tel', '08xxxxxxxxxx'],
                ['Alamat', 'address', 'text', 'Alamat tempat tinggal'],
              ].map(([label, key, type, placeholder]) => (
                <div key={key} className={key === 'address' ? 'sm:col-span-2' : ''}>
                  <label className="block font-retro-mono text-xs font-black uppercase tracking-wider mb-1">{label}</label>
                  <input type={type} placeholder={placeholder} value={form[key] || ''} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full py-2 px-3 border-2 border-base-black rounded-retro font-retro-mono text-sm bg-base-white focus:outline-none focus:border-retro-orange" />
                </div>
              ))}
              <div className="sm:col-span-2">
                <label className="block font-retro-mono text-xs font-black uppercase tracking-wider mb-1">Bio Singkat</label>
                <textarea rows={3} placeholder="Ceritakan sedikit tentang diri Anda..." value={form.bio || ''} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                  className="w-full py-2 px-3 border-2 border-base-black rounded-retro font-retro-mono text-sm bg-base-white focus:outline-none focus:border-retro-orange resize-none" />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={updateProfile.isLoading}><Save className="w-4 h-4 mr-1" />{updateProfile.isLoading ? 'Menyimpan...' : 'Simpan'}</Button>
              <Button type="button" variant="outline" onClick={() => setEditing(false)}><X className="w-4 h-4 mr-1" /> Batal</Button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              [Mail, 'Email', p?.email],
              [Phone, 'Telepon', p?.profile?.phone || '—'],
              [MapPin, 'Alamat', p?.profile?.address || '—'],
              [BookOpen, 'Bio', p?.profile?.bio || '—'],
            ].map(([Icon, label, value]) => (
              <div key={label} className="flex items-start gap-3 p-3 border-2 border-dashed border-base-black rounded-retro">
                <Icon className="w-4 h-4 text-base-black/50 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-retro-mono text-[10px] text-base-black/50 uppercase">{label}</p>
                  <p className="font-retro-mono text-sm mt-0.5">{value}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Change password */}
      <motion.div variants={cardVariants} className="retro-card bg-base-white border-4 border-base-black p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="retro-heading retro-heading-sm text-base-black flex items-center gap-2"><Award className="w-5 h-5 text-retro-orange" /> Keamanan Akun</h2>
          <Button variant="outline" onClick={() => setShowPwForm(v => !v)}>
            {showPwForm ? 'Batal' : 'Ubah Password'}
          </Button>
        </div>
        {showPwForm && (
          <form onSubmit={e => { e.preventDefault(); updatePassword.mutate(pwForm); }} className="space-y-4">
            {[['Password Saat Ini', 'current_password'], ['Password Baru', 'password'], ['Konfirmasi Password', 'password_confirmation']].map(([label, key]) => (
              <div key={key}>
                <label className="block font-retro-mono text-xs font-black uppercase tracking-wider mb-1">{label}</label>
                <input type="password" required value={pwForm[key]} onChange={e => setPwForm(f => ({ ...f, [key]: e.target.value }))}
                  className="w-full py-2 px-3 border-2 border-base-black rounded-retro font-retro-mono text-sm bg-base-white focus:outline-none focus:border-retro-orange" />
              </div>
            ))}
            <Button type="submit" disabled={updatePassword.isLoading}><Save className="w-4 h-4 mr-1" />{updatePassword.isLoading ? 'Mengubah...' : 'Simpan Password'}</Button>
          </form>
        )}
        {!showPwForm && <p className="font-retro-mono text-sm text-base-black/50">Password terakhir diubah: —</p>}
      </motion.div>
    </motion.div>
  );
}
