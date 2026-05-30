import { useState, useEffect } from 'react';
import { User, Shield, Key, GitBranch, Link, Upload, CheckSquare, Save, AlertCircle, Sparkles } from 'lucide-react';
import studentApi from '../../../api/student';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHeader, RetroCard } from '../../../components/ui/RetroLayouts';

// 🎨 ANIMATION VARIANTS
const cardVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 15 } 
  }
};

export default function StudentProfile() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState('info'); // 'info', 'security'

  // Profile Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [bio, setBio] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [gender, setGender] = useState('L');
  const [dob, setDob] = useState('');

  // Password Form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');

  const [saving, setSaving] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await studentApi.getProfile();
      if (res.status === 'success') {
        const p = res.data;
        setProfile(p);
        setName(p.name || '');
        setPhone(p.phone || '');
        setAddress(p.address || '');
        setBio(p.bio || '');
        setGithubUrl(p.github_url || '');
        setLinkedinUrl(p.linkedin_url || '');
        setGender(p.gender || 'L');
        setDob(p.date_of_birth || '');
      }
    } catch (err) {
      console.error(err);
      setError('Gagal memuat profil siswa dari server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const payload = {
        name,
        phone,
        address,
        bio,
        github_url: githubUrl,
        linkedin_url: linkedinUrl,
        gender,
        date_of_birth: dob,
      };

      const res = await studentApi.updateProfile(payload);
      if (res.status === 'success') {
        setSuccess('Profil Cyber Anda berhasil diperbarui!');
        fetchProfile();
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Gagal memperbarui profil.');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarSubmit = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const formData = new FormData();
      formData.append('avatar', file);

      const res = await studentApi.uploadAvatar(formData);
      if (res.status === 'success') {
        setSuccess('Foto profil cyber berhasil diperbarui!');
        fetchProfile();
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Gagal mengunggah foto profil.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (password !== passwordConfirmation) {
      setError('Konfirmasi password baru tidak cocok.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const payload = {
        current_password: currentPassword,
        password,
        password_confirmation: passwordConfirmation,
      };

      const res = await studentApi.changePassword(payload);
      if (res.status === 'success') {
        setSuccess('Password berhasil diubah!');
        setCurrentPassword('');
        setPassword('');
        setPasswordConfirmation('');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Gagal mengubah password.');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] retro-card bg-base-white p-8 shadow-hard">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 retro-card bg-retro-purple border-4 border-base-black flex items-center justify-center mb-4"
        >
          <User className="w-8 h-8 text-base-white animate-pulse" />
        </motion.div>
        <p className="font-retro-display font-black text-xs text-base-black uppercase tracking-widest animate-pulse">
          Mengambil Data Profil...
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

  return (
    <div className="space-y-6">
      
      {/* ── Page Header ──────────────────────────────────── */}
      <PageHeader 
        title="Profil Cyber"
        icon={User}
        description="Atur informasi identitas diri, biografi, tautan portofolio, serta pengaturan keamanan akun Anda."
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard/student' },
          { label: 'Profile', path: '/dashboard/student/profile' }
        ]}
      />

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

      {/* ── Split Layout Grid ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Summary Card */}
        <div className="lg:col-span-1">
          <motion.div 
            variants={cardVariants}
            initial="hidden"
            animate="visible"
          >
            <RetroCard variant="white" className="text-center relative overflow-hidden">
              <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-retro-yellow border border-base-black rounded-sm rotate-45" />
              
              {/* Avatar hover overlay */}
              <div className="relative w-32 h-32 mx-auto mb-4 group cursor-pointer border-4 border-base-black rounded-retro overflow-hidden shadow-hard-sm">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-retro-purple to-retro-blue flex items-center justify-center text-base-white text-4xl font-retro-display font-black uppercase">
                    {profile.name?.charAt(0)}
                  </div>
                )}
                <label className="absolute inset-0 bg-base-black/85 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-base-white text-[9px] font-retro-display font-black uppercase tracking-widest cursor-pointer transition-opacity z-10">
                  <Upload className="w-5 h-5 mb-1.5 text-retro-yellow animate-bounce" />
                  <span>Upload Foto</span>
                  <input type="file" onChange={handleAvatarSubmit} className="hidden" accept="image/*" />
                </label>
              </div>

              <h3 className="text-sm md:text-base font-retro-display font-black text-base-black uppercase tracking-wide leading-tight">{profile.name}</h3>
              <p className="text-[9px] font-retro-mono font-bold text-base-black/50 uppercase mt-1 leading-none">
                NIS: {profile.nis || '—'} | Kelas: {profile.class ? profile.class.name : '—'}
              </p>

              <div className="border-t-2 border-base-black/10 pt-4 mt-4 text-left text-[10px] font-retro-mono font-bold uppercase space-y-1.5 leading-tight">
                <p className="text-base-black"><span className="text-base-black/45">Email:</span> {profile.email}</p>
                <p className="text-base-black"><span className="text-base-black/45">Role:</span> SISWA</p>
                <p className="text-base-black"><span className="text-base-black/45">Tingkat:</span> {profile.class_level || '—'}</p>
              </div>
            </RetroCard>
          </motion.div>
        </div>

        {/* Right Column: Editing Form */}
        <div className="lg:col-span-2">
          <RetroCard variant="white">
            {/* Tab header */}
            <div className="flex gap-2 border-b-4 border-base-black pb-3 mb-5">
              <button
                onClick={() => { setActiveTab('info'); setSuccess(null); setError(null); }}
                className={`px-3 py-1.5 border-2 border-base-black rounded-retro text-[9px] font-retro-display font-black uppercase tracking-wider transition-all shadow-hard-sm hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 ${
                  activeTab === 'info'
                    ? 'bg-base-black text-base-white border-base-black shadow-hard-sm'
                    : 'bg-base-white text-base-black hover:bg-base-black/5'
                }`}
              >
                Informasi Diri
              </button>
              <button
                onClick={() => { setActiveTab('security'); setSuccess(null); setError(null); }}
                className={`px-3 py-1.5 border-2 border-base-black rounded-retro text-[9px] font-retro-display font-black uppercase tracking-wider transition-all shadow-hard-sm hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 ${
                  activeTab === 'security'
                    ? 'bg-base-black text-base-white border-base-black shadow-hard-sm'
                    : 'bg-base-white text-base-black hover:bg-base-black/5'
                }`}
              >
                Keamanan & Password
              </button>
            </div>

            {/* TAB CONTENT: Personal Info */}
            <AnimatePresence mode="wait">
              {activeTab === 'info' ? (
                <motion.form 
                  key="info"
                  initial={{ opacity: 0, x: -10 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  exit={{ opacity: 0, x: 10 }}
                  onSubmit={handleProfileSubmit} 
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-[9px] font-black uppercase tracking-wider text-base-black">Nama Lengkap</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="w-full px-3 py-2 border-2 border-base-black rounded-retro text-xs font-retro-mono focus:outline-none bg-base-white shadow-hard-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[9px] font-black uppercase tracking-wider text-base-black">No. Telepon / WhatsApp</label>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-3 py-2 border-2 border-base-black rounded-retro text-xs font-retro-mono focus:outline-none bg-base-white shadow-hard-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-[9px] font-black uppercase tracking-wider text-base-black">Jenis Kelamin</label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="w-full px-3 py-2 border-2 border-base-black rounded-retro text-xs font-retro-mono font-bold focus:outline-none bg-base-white shadow-hard-sm"
                      >
                        <option value="L">Laki-Laki (L)</option>
                        <option value="P">Perempuan (P)</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[9px] font-black uppercase tracking-wider text-base-black">Tanggal Lahir</label>
                      <input
                        type="date"
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        className="w-full px-3 py-2 border-2 border-base-black rounded-retro text-xs font-retro-mono focus:outline-none bg-base-white shadow-hard-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-[9px] font-black uppercase tracking-wider text-base-black flex items-center gap-1.5">
                        <GitBranch className="w-4 h-4 text-retro-purple" />
                        <span>Username GitHub</span>
                      </label>
                      <input
                        type="text"
                        value={githubUrl}
                        onChange={(e) => setGithubUrl(e.target.value)}
                        placeholder="e.g. janesmith"
                        className="w-full px-3 py-2 border-2 border-base-black rounded-retro text-xs font-retro-mono focus:outline-none bg-base-white shadow-hard-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[9px] font-black uppercase tracking-wider text-base-black flex items-center gap-1.5">
                        <Link className="w-4 h-4 text-retro-blue" />
                        <span>Username LinkedIn</span>
                      </label>
                      <input
                        type="text"
                        value={linkedinUrl}
                        onChange={(e) => setLinkedinUrl(e.target.value)}
                        placeholder="e.g. janesmith"
                        className="w-full px-3 py-2 border-2 border-base-black rounded-retro text-xs font-retro-mono focus:outline-none bg-base-white shadow-hard-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-black uppercase tracking-wider text-base-black">Biografi Singkat</label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Uraikan biografi singkat atau keahlian Anda..."
                      rows="2"
                      className="w-full px-3 py-2 border-2 border-base-black rounded-retro text-xs font-retro-mono focus:outline-none bg-base-white shadow-hard-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-black uppercase tracking-wider text-base-black">Alamat Rumah</label>
                    <textarea
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Masukkan alamat domisili lengkap saat ini..."
                      rows="2"
                      className="w-full px-3 py-2 border-2 border-base-black rounded-retro text-xs font-retro-mono focus:outline-none bg-base-white shadow-hard-sm"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className={`retro-btn text-xs py-2.5 px-5 flex items-center gap-2 ${
                      saving ? 'opacity-40 cursor-not-allowed shadow-none' : 'bg-base-black text-base-white hover:bg-retro-purple'
                    }`}
                  >
                    <Save className="w-4 h-4" />
                    <span>SIMPAN PERUBAHAN PROFIL</span>
                  </button>
                </motion.form>
              ) : (
                <motion.form 
                  key="security"
                  initial={{ opacity: 0, x: -10 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  exit={{ opacity: 0, x: 10 }}
                  onSubmit={handlePasswordSubmit} 
                  className="space-y-4"
                >
                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-black uppercase tracking-wider text-base-black">Password Saat Ini</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      className="w-full px-3 py-2 border-2 border-base-black rounded-retro text-xs font-retro-mono focus:outline-none bg-base-white shadow-hard-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-[9px] font-black uppercase tracking-wider text-base-black">Password Baru</label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full px-3 py-2 border-2 border-base-black rounded-retro text-xs font-retro-mono focus:outline-none bg-base-white shadow-hard-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[9px] font-black uppercase tracking-wider text-base-black">Konfirmasi Password Baru</label>
                      <input
                        type="password"
                        value={passwordConfirmation}
                        onChange={(e) => setPasswordConfirmation(e.target.value)}
                        required
                        className="w-full px-3 py-2 border-2 border-base-black rounded-retro text-xs font-retro-mono focus:outline-none bg-base-white shadow-hard-sm"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className={`retro-btn text-xs py-2.5 px-5 flex items-center gap-2 ${
                      saving ? 'opacity-40 cursor-not-allowed shadow-none' : 'bg-base-black text-base-white hover:bg-retro-purple'
                    }`}
                  >
                    <Key className="w-4 h-4" />
                    <span>UBAH PASSWORD AKUN</span>
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </RetroCard>
        </div>

      </div>
    </div>
  );
}
