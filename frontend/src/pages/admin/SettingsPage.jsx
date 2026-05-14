import { useState, useEffect, useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Globe, Clock, Briefcase, Shield, ToggleRight, Save, RefreshCw,
  MapPin, Camera, QrCode, Smartphone, Wifi, Bluetooth, Fingerprint,
  Mail, Bell, Download, Upload, Trash2, Eye, EyeOff, Search,
  ChevronDown, ChevronRight, ChevronLeft, Settings2, Building2,
  School, Users, Calendar, Cloud, Database, Lock, Key, BarChart3,
  Zap, Brain, BookOpen, GraduationCap, Award, AlertTriangle,
  CheckCircle2, XCircle, Info, Moon, Sun, Palette, Layout,
  HardDrive, Cpu, Activity, Radio, Satellite, LockOpen, KeyRound,
  MonitorSmartphone, ShieldCheck, ShieldAlert, FileText, Image,
  Video, Music, Archive, Clock3, Timer, CalendarDays, Map,
  Navigation, Target, Compass, Crosshair, EyeOff as EyeSlash,
  MessageCircle, Monitor, Coffee, History, UserCheck, Plus
} from 'lucide-react';
import { api } from '../../api';
import Button from '../../components/ui/Button';
import Toast from '../../components/ui/Toast';
import Modal from '../../components/ui/Modal';

// ═══════════════════════════════════════════════════════════
// ANIMATION VARIANTS (Reusable)
// ═══════════════════════════════════════════════════════════
const pageVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } }
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } }
};

// ═══════════════════════════════════════════════════════════
// HELPER COMPONENTS (Inline - No Separate Folder Needed)
// ═══════════════════════════════════════════════════════════

// Glassmorphism Card Wrapper
function SettingsCard({ children, className = '', icon: Icon, title, description, actions }) {
  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -2, scale: 1.005 }}
      className={`relative group rounded-2xl overflow-hidden ${className}`}
    >
      {/* Glow border effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary-500/20 via-accent-cyan/20 to-primary-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
      
      {/* Card content */}
      <div className="relative bg-white/5 dark:bg-[#1a1a2e]/80 backdrop-blur-xl border border-white/10 dark:border-[#2d2d44]/50 rounded-2xl p-6 transition-all duration-300 group-hover:border-primary-500/30">
        {(Icon || title) && (
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-3">
              {Icon && (
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary-500/20 to-accent-cyan/20 border border-primary-500/30">
                  <Icon className="w-5 h-5 text-primary-400" />
                </div>
              )}
              <div>
                {title && <h3 className="text-lg font-semibold text-white">{title}</h3>}
                {description && <p className="text-sm text-gray-400 mt-0.5">{description}</p>}
              </div>
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
        )}
        {children}
      </div>
    </motion.div>
  );
}

// Animated Toggle Switch
function SettingsToggle({ label, checked, onChange, description, icon: Icon, disabled = false }) {
  return (
    <motion.div 
      whileHover={{ scale: disabled ? 1 : 1.01 }}
      className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${
        checked 
          ? 'bg-primary-500/10 border-primary-500/30' 
          : 'bg-white/5 dark:bg-[#1a1a2e]/50 border-white/10 dark:border-[#2d2d44]/50'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary-500/30 cursor-pointer'}`}
      onClick={() => !disabled && onChange(!checked)}
    >
      <div className="flex items-start gap-3">
        {Icon && <Icon className={`w-5 h-5 mt-0.5 ${checked ? 'text-primary-400' : 'text-gray-500'}`} />}
        <div>
          <p className={`font-medium ${checked ? 'text-white' : 'text-gray-300'}`}>{label}</p>
          {description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>}
        </div>
      </div>
      <motion.div
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-primary-600' : 'bg-gray-600'
        }`}
        whileTap={{ scale: 0.95 }}
      >
        <motion.span
          className="inline-block h-4 w-4 transform rounded-full bg-white shadow-lg"
          animate={{ x: checked ? 20 : 4 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </motion.div>
    </motion.div>
  );
}

// Modern Input with Glow Effect
function SettingsInput({ label, name, type = "text", value, onChange, error, required, disabled, placeholder, icon: Icon, helperText, suffix, prefix }) {
  const [focused, setFocused] = useState(false);
  
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-300">
        <span className="flex items-center gap-1.5">
          {Icon && <Icon className="w-4 h-4 text-gray-500" />}
          {label}
          {required && <span className="text-primary-400">*</span>}
        </span>
      </label>
      <div className="relative">
        {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">{prefix}</span>}
        <input
          type={type}
          name={name}
          value={value || ''}
          onChange={(e) => onChange(prev => ({ ...prev, [name]: e.target.value }))}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={`w-full px-4 py-3 rounded-xl bg-white/5 border transition-all duration-300 text-white placeholder-gray-500 focus:outline-none ${
            focused 
              ? 'border-primary-500/50 shadow-[0_0_20px_rgba(168,85,247,0.2)]' 
              : 'border-white/10 hover:border-white/20'
          } ${error ? 'border-danger/50' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${prefix ? 'pl-10' : ''} ${suffix ? 'pr-10' : ''}`}
          required={required}
          disabled={disabled}
          placeholder={placeholder}
        />
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">{suffix}</span>}
      </div>
      {helperText && <p className="text-xs text-gray-500">{helperText}</p>}
      {error && <p className="text-danger text-xs">{Array.isArray(error) ? error[0] : error}</p>}
    </div>
  );
}

// Modern Select Dropdown
function SettingsSelect({ label, name, value, onChange, options, error, required, disabled, icon: Icon, placeholder }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-300">
        <span className="flex items-center gap-1.5">
          {Icon && <Icon className="w-4 h-4 text-gray-500" />}
          {label}
          {required && <span className="text-primary-400">*</span>}
        </span>
      </label>
      <select
        name={name}
        value={value || ''}
        onChange={(e) => onChange(prev => ({ ...prev, [name]: e.target.value }))}
        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 focus:border-primary-500/50 focus:shadow-[0_0_20px_rgba(168,85,247,0.2)] transition-all duration-300 text-white focus:outline-none appearance-none cursor-pointer"
        required={required}
        disabled={disabled}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-[#1a1a2e] text-white">{opt.label}</option>
        ))}
      </select>
      {error && <p className="text-danger text-xs">{Array.isArray(error) ? error[0] : error}</p>}
    </div>
  );
}

// Stats Badge Component
function StatsBadge({ label, value, icon: Icon, color = "primary" }) {
  const colorClasses = {
    primary: "bg-primary-500/10 text-primary-400 border-primary-500/30",
    success: "bg-success/10 text-success border-success/30",
    warning: "bg-warning/10 text-warning border-warning/30",
    danger: "bg-danger/10 text-danger border-danger/30",
    info: "bg-accent-cyan/10 text-accent-cyan border-accent-cyan/30",
  };
  
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${colorClasses[color]}`}>
      {Icon && <Icon className="w-4 h-4" />}
      <span className="text-xs font-medium">{label}</span>
      {value !== undefined && <span className="font-bold">{value}</span>}
    </div>
  );
}

// Map Preview Component
function MapPreview({ lat, lng }) {
  if (!lat || !lng) return (
    <div className="flex flex-col items-center justify-center h-48 rounded-xl bg-white/5 border border-dashed border-white/10 text-gray-500">
      <MapPin className="w-8 h-8 mb-2 opacity-50" />
      <p className="text-sm">Masukkan Latitude & Longitude</p>
    </div>
  );

  const embedUrl = `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`;

  return (
    <div className="relative rounded-xl overflow-hidden border border-white/10 h-64 group">
      <iframe
        title="Location Preview"
        width="100%"
        height="100%"
        style={{ border: 0 }}
        src={embedUrl}
        allowFullScreen
      />
      <div className="absolute top-3 left-3 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-[10px] text-white flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
        LIVE PREVIEW: {lat}, {lng}
      </div>
    </div>
  );
}

// Modal for adding PKL Location
function PklLocationModal({ isOpen, onClose, onSave, isSaving }) {
  const [formData, setFormData] = useState({
    company_name: '', address: '', latitude: '', longitude: '',
    radius_meters: 100, supervisor_name: '', supervisor_phone: '',
    supervisor_email: '', is_approved: true
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        company_name: '', address: '', latitude: '', longitude: '',
        radius_meters: 100, supervisor_name: '', supervisor_phone: '',
        supervisor_email: '', is_approved: true,
        student_ids: []
      });
    }
  }, [isOpen]);

  const [eligibleStudents, setEligibleStudents] = useState([]);
  useEffect(() => {
    if (isOpen) {
      api.get('/admin/pkl/students', { params: { per_page: 100 } }).then(res => {
        setEligibleStudents(res.data?.data?.data || []);
      });
    }
  }, [isOpen]);

  const toggleStudent = (id) => {
    setFormData(prev => {
      const ids = prev.student_ids.includes(id) 
        ? prev.student_ids.filter(sid => sid !== id)
        : [...prev.student_ids, id];
      return { ...prev, student_ids: ids };
    });
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tambah Lokasi PKL" size="lg">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SettingsInput label="Nama Perusahaan" name="company_name" value={formData.company_name} onChange={setFormData} required icon={Building2} />
          <SettingsInput label="Nama Pembimbing" name="supervisor_name" value={formData.supervisor_name} onChange={setFormData} icon={UserCheck} />
          <SettingsInput label="Email" name="supervisor_email" value={formData.supervisor_email} onChange={setFormData} icon={Mail} />
          <SettingsInput label="Telepon" name="supervisor_phone" value={formData.supervisor_phone} onChange={setFormData} icon={Smartphone} />
        </div>
        <SettingsInput label="Alamat Lengkap" name="address" value={formData.address} onChange={setFormData} required icon={MapPin} />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SettingsInput label="Latitude" name="latitude" value={formData.latitude} onChange={setFormData} required />
          <SettingsInput label="Longitude" name="longitude" value={formData.longitude} onChange={setFormData} required />
          <SettingsInput label="Radius (m)" name="radius_meters" type="number" value={formData.radius_meters} onChange={setFormData} required />
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
            <Users className="w-4 h-4 text-primary-400" /> Pilih Siswa Penempatan (Opsional)
          </label>
          <div className="max-h-48 overflow-y-auto rounded-xl border border-white/10 bg-white/5 p-2 space-y-1 scrollbar-thin">
            {eligibleStudents.length > 0 ? eligibleStudents.map(student => (
              <label key={student.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors group">
                <input 
                  type="checkbox" 
                  checked={formData.student_ids.includes(student.id)}
                  onChange={() => toggleStudent(student.id)}
                  className="w-4 h-4 rounded border-white/10 bg-white/5 text-primary-500 focus:ring-primary-500/30"
                />
                <div className="flex-1">
                  <p className="text-sm text-white group-hover:text-primary-400 transition-colors">{student.name}</p>
                  <p className="text-[10px] text-gray-500">NIS: {student.profile?.nis || '-'} {student.pkl_location_id ? `(Saat ini: ${student.pkl_location?.company_name})` : '(Belum ada penempatan)'}</p>
                </div>
              </label>
            )) : (
              <p className="text-xs text-gray-500 text-center py-4">Tidak ada siswa RPL XII ditemukan</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={() => onSave(formData)} loading={isSaving}>Simpan Lokasi</Button>
        </div>
      </div>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════
export default function SettingsPage() {
  const queryClient = useQueryClient();
  
  // State Management
  const [activeTab, setActiveTab] = useState('general');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [toast, setToast] = useState(null);
  const [showSaveIndicator, setShowSaveIndicator] = useState(false);

  // PKL Management State
  const [pklLocations, setPklLocations] = useState([]);
  const [isPklModalOpen, setIsPklModalOpen] = useState(false);
  const [isAddingPkl, setIsAddingPkl] = useState(false);
  const [pklStudents, setPklStudents] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');

  // Fetch Settings
  const { data: settingsData, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => api.get('/admin/settings').then(res => res.data?.data),
  });

  // Tab Definitions
  const tabs = useMemo(() => [
    { id: 'general', label: 'Umum', icon: Settings2, description: 'Identitas, branding, notifikasi' },
    { id: 'attendance', label: 'Absensi', icon: Clock, description: 'GPS, validasi, QR, smart attendance' },
    { id: 'pkl', label: 'PKL / Magang', icon: Briefcase, description: 'Lokasi, siswa, monitoring' },
    { id: 'security', label: 'Keamanan', icon: Shield, description: 'Auth, password, API, monitoring' },
    { id: 'features', label: 'Fitur', icon: ToggleRight, description: 'Modul, AI, public website' },
    { id: 'backup', label: 'Backup', icon: Database, description: 'Backup, restore, system info' },
  ], []);

  // Settings State
  const [general, setGeneral] = useState({
    app_name: 'RPL Smart Ecosystem', school_name: '', npsn: '', school_slogan: '',
    school_description: '', address: '', province: '', city: '', district: '',
    postal_code: '', website: '', support_email: '', support_phone: '',
    academic_year: '2024/2025', semester: '1', primary_color: '#a855f7',
    secondary_color: '#3b82f6', default_theme: 'dark', login_background: '',
    dashboard_banner: '', default_page: 'dashboard', show_realtime_stats: true,
    show_weather: true, show_daily_motivation: true, show_academic_calendar: true,
    timezone: 'Asia/Jakarta', date_format: 'DD/MM/YYYY', time_format: '24h',
    auto_logout_minutes: 120, sync_server_time: true, email_notifications: true,
    push_notifications: true, attendance_notification: true, login_notification: true,
    pkl_notification: true, violation_notification: true,
  });

  const [attendance, setAttendance] = useState({
    school_latitude: '', school_longitude: '', multiple_locations: false,
    radius_meters: 100, max_late_minutes: 15, check_in_time: '06:00',
    check_out_time: '16:00', break_start: '12:00', break_end: '12:30',
    overtime_start: '16:00', late_tolerance: 5, auto_alpha: true,
    face_verification: false, selfie_verification: true, anti_fake_gps: true,
    anti_screenshot: true, device_verification: true, mock_location_detection: true,
    wifi_validation: false, wifi_ssid: '', bluetooth_validation: false,
    qr_enabled: true, qr_expired_seconds: 30, qr_random: true, qr_animated: true,
    multiple_shifts: false, flexible_schedule: false, online_permission: true,
    teacher_approval: true, parent_notification: false, whatsapp_integration: false,
  });

  const [pkl, setPkl] = useState({
    enable_pkl_attendance: true, require_supervisor_approval: true,
    max_distance_km: 5, locations: [], show_progress_tracking: true,
    require_weekly_report: true, auto_reminder: true, reminder_day: 5,
  });

  const [security, setSecurity] = useState({
    two_factor_auth: false, otp_email: true, otp_whatsapp: false,
    biometric_login: false, trusted_devices: true, session_limit: 3,
    login_history_enabled: true, device_history_enabled: true, ip_tracking: true,
    suspicious_login_detection: true, failed_login_lockout: true,
    failed_attempts_max: 5, lockout_duration_minutes: 30, min_password_length: 8,
    password_expire_days: 90, require_uppercase: true, require_number: true,
    require_special_char: true, password_strength_meter: true, password_history_count: 5,
    api_token_enabled: true, rate_limit_per_minute: 60, audit_log_enabled: true,
    security_score_enabled: true, threat_monitoring: true,
  });

  const [features, setFeatures] = useState({
    public_gallery: true, career_simulator: true, achievement_showcase: true,
    landing_page_editor: false, news_management: true, ai_student_recommendation: false,
    ai_analytics: false, ai_chatbot: false, ai_monitoring: false,
    ai_attendance_prediction: false, e_learning: false, cbt_exam: false,
    e_raport: true, digital_library: false, smart_classroom: false,
    school_inventory: false, dynamic_config: true, realtime_update: true,
    cache_refresh_auto: true,
  });

  const [backup, setBackup] = useState({
    auto_backup: true, backup_schedule: 'daily', backup_time: '02:00',
    backup_retention_days: 30, cloud_backup: false, compress_backup: true,
    encrypt_backup: true,
  });
  
  // Sync state with fetched data
  useEffect(() => {
    if (settingsData) {
      if (settingsData.general) setGeneral(prev => ({ ...prev, ...settingsData.general }));
      if (settingsData.attendance) setAttendance(prev => ({ ...prev, ...settingsData.attendance }));
      if (settingsData.pkl) setPkl(prev => ({ ...prev, ...settingsData.pkl }));
      if (settingsData.security) setSecurity(prev => ({ ...prev, ...settingsData.security }));
      if (settingsData.features) setFeatures(prev => ({ ...prev, ...settingsData.features }));
      if (settingsData.backup) setBackup(prev => ({ ...prev, ...settingsData.backup }));
      
      // Prevent immediate unsaved changes trigger
      setTimeout(() => setHasUnsavedChanges(false), 200);
    }
  }, [settingsData]);

  // API Mutation
  const saveSettingsMutation = useMutation({
    mutationFn: (payload) => api.put('/admin/settings', payload),
    onSuccess: (res) => {
      setIsSaving(false);
      setHasUnsavedChanges(false);
      showToast(res.data?.message || '✅ Pengaturan berhasil disimpan!', 'success');
      queryClient.invalidateQueries(['admin-settings']);
    },
    onError: (err) => {
      setIsSaving(false);
      showToast(`❌ ${err.response?.data?.message || 'Gagal menyimpan pengaturan'}`, 'error');
    }
  });

  // Fetch PKL Locations & Students
  useEffect(() => {
    if (activeTab === 'pkl') {
      api.get('/admin/pkl-locations').then(res => {
        setPklLocations(res.data?.data?.data || []);
      });
      api.get('/admin/pkl/students', { params: { search: studentSearch } }).then(res => {
        setPklStudents(res.data?.data?.data || []);
      });
    }
  }, [activeTab, studentSearch]);

  // Handlers
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleSave = (section = 'all') => {
    setIsSaving(true);
    setShowSaveIndicator(true);
    
    let payload;
    if (section === 'all') {
      payload = { general, attendance, pkl, security, features, backup };
    } else {
      const dataMap = { general, attendance, pkl, security, features, backup };
      payload = { section, data: dataMap[section] };
    }
    
    saveSettingsMutation.mutate(payload);
    setTimeout(() => setShowSaveIndicator(false), 2000);
  };

  const handleAddPklLocation = async (formData) => {
    setIsAddingPkl(true);
    try {
      await api.post('/admin/pkl-locations', formData);
      showToast('🏢 Lokasi PKL berhasil ditambahkan', 'success');
      setIsPklModalOpen(false);
      // Refresh list
      const res = await api.get('/admin/pkl-locations');
      setPklLocations(res.data?.data?.data || []);
    } catch (err) {
      showToast('❌ Gagal menambahkan lokasi PKL', 'error');
    } finally {
      setIsAddingPkl(false);
    }
  };

  const handleAssignStudent = async (studentId, locationId) => {
    try {
      await api.post('/admin/pkl/assign', {
        student_ids: [studentId],
        pkl_location_id: locationId
      });
      showToast('✅ Siswa berhasil ditugaskan', 'success');
      // Refresh students
      const res = await api.get('/admin/pkl/students', { params: { search: studentSearch } });
      setPklStudents(res.data?.data?.data || []);
    } catch (err) {
      showToast('❌ Gagal menugaskan siswa', 'error');
    }
  };

  const handleReset = (section) => {
    // Simple reset logic - extend as needed
    if (section === 'general') setGeneral({ ...general });
    showToast('🔄 Pengaturan direset ke default', 'info');
  };

  // Track unsaved changes
  useEffect(() => {
    const handler = (e) => {
      if (hasUnsavedChanges) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasUnsavedChanges]);

  // Mark as unsaved when any setting changes
  useEffect(() => {
    // Only mark as unsaved if data is already loaded and we're not currently fetching
    if (settingsData && !isLoadingSettings) {
      setHasUnsavedChanges(true);
    }
  }, [general, attendance, pkl, security, features, backup, settingsData, isLoadingSettings]);

  // ═══════════════════════════════════════════════════════════
  // RENDER FUNCTIONS (Simplified)
  // ═══════════════════════════════════════════════════════════

  const renderGeneralTab = () => (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" className="space-y-8">
      <div className="flex flex-wrap gap-3">
        <StatsBadge icon={School} label="Status Sistem" value="Online" color="success" />
        <StatsBadge icon={Database} label="Storage" value="65%" color="warning" />
        <StatsBadge icon={Cpu} label="Cache" value="Clear" color="info" />
        <StatsBadge icon={Clock3} label="Uptime" value="99.9%" color="primary" />
      </div>

      <SettingsCard icon={Building2} title="Identitas Sekolah" description="Informasi dasar tentang sekolah">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SettingsInput label="Nama Aplikasi" name="app_name" value={general.app_name} onChange={setGeneral} required icon={Settings2} />
          <SettingsInput label="Nama Sekolah" name="school_name" value={general.school_name} onChange={setGeneral} required icon={School} />
          <SettingsInput label="NPSN" name="npsn" value={general.npsn} onChange={setGeneral} icon={Building2} helperText="Nomor Pokok Sekolah Nasional" />
          <SettingsInput label="Slogan Sekolah" name="school_slogan" value={general.school_slogan} onChange={setGeneral} icon={Award} />
          <SettingsInput label="Tahun Ajaran" name="academic_year" value={general.academic_year} onChange={setGeneral} icon={CalendarDays} />
          <SettingsSelect label="Semester" name="semester" value={general.semester} onChange={setGeneral} icon={Calendar} options={[{value:'1',label:'Semester 1'},{value:'2',label:'Semester 2'}]} />
          <SettingsInput label="Website" name="website" value={general.website} onChange={setGeneral} icon={Globe} placeholder="https://sekolah.sch.id" />
          <SettingsInput label="Email Support" name="support_email" value={general.support_email} onChange={setGeneral} icon={Mail} />
          <SettingsInput label="Telepon" name="support_phone" value={general.support_phone} onChange={setGeneral} icon={Bell} />
          <SettingsInput label="Alamat" name="address" value={general.address} onChange={setGeneral} icon={MapPin} />
          <SettingsInput label="Provinsi" name="province" value={general.province} onChange={setGeneral} />
          <SettingsInput label="Kota" name="city" value={general.city} onChange={setGeneral} />
          <SettingsInput label="Kecamatan" name="district" value={general.district} onChange={setGeneral} />
          <SettingsInput label="Kode Pos" name="postal_code" value={general.postal_code} onChange={setGeneral} />
        </div>
        <SettingsInput label="Deskripsi" name="school_description" value={general.school_description} onChange={setGeneral} icon={Info} />
      </SettingsCard>

      <SettingsCard icon={Palette} title="Branding" description="Kustomisasi tampilan">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Warna Primary</label>
            <div className="flex items-center gap-3">
              <input type="color" value={general.primary_color} onChange={(e) => setGeneral({...general, primary_color: e.target.value})} className="w-12 h-10 rounded-lg cursor-pointer border-0 bg-transparent" />
              <input type="text" value={general.primary_color} onChange={(e) => setGeneral({...general, primary_color: e.target.value})} className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm font-mono" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Warna Secondary</label>
            <div className="flex items-center gap-3">
              <input type="color" value={general.secondary_color} onChange={(e) => setGeneral({...general, secondary_color: e.target.value})} className="w-12 h-10 rounded-lg cursor-pointer border-0 bg-transparent" />
              <input type="text" value={general.secondary_color} onChange={(e) => setGeneral({...general, secondary_color: e.target.value})} className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm font-mono" />
            </div>
          </div>
          <SettingsSelect label="Default Theme" name="default_theme" value={general.default_theme} onChange={setGeneral} icon={Moon} options={[{value:'dark',label:'🌙 Dark'},{value:'light',label:'☀️ Light'},{value:'system',label:'💻 System'}]} />
          <SettingsInput label="URL Logo" name="logo_url" value={general.logo_url} onChange={setGeneral} icon={Image} />
        </div>
      </SettingsCard>

      <SettingsCard icon={Layout} title="Dashboard" description="Kustomisasi dashboard">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <SettingsSelect label="Default Page" name="default_page" value={general.default_page} onChange={setGeneral} icon={Globe} options={[{value:'dashboard',label:'Dashboard'},{value:'attendance',label:'Absensi'},{value:'projects',label:'Projects'}]} />
          <SettingsToggle label="Realtime Stats" checked={general.show_realtime_stats} onChange={(v) => setGeneral({...general, show_realtime_stats: v})} icon={Activity} />
          <SettingsToggle label="Cuaca" checked={general.show_weather} onChange={(v) => setGeneral({...general, show_weather: v})} icon={Sun} />
          <SettingsToggle label="Motivasi" checked={general.show_daily_motivation} onChange={(v) => setGeneral({...general, show_daily_motivation: v})} icon={Award} />
          <SettingsToggle label="Kalender" checked={general.show_academic_calendar} onChange={(v) => setGeneral({...general, show_academic_calendar: v})} icon={CalendarDays} />
        </div>
      </SettingsCard>

      <SettingsCard icon={Clock3} title="Waktu" description="Timezone & format">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SettingsSelect label="Timezone" name="timezone" value={general.timezone} onChange={setGeneral} icon={Clock3} options={[{value:'Asia/Jakarta',label:'WIB'},{value:'Asia/Makassar',label:'WITA'},{value:'Asia/Jayapura',label:'WIT'}]} />
          <SettingsSelect label="Format Tanggal" name="date_format" value={general.date_format} onChange={setGeneral} icon={Calendar} options={[{value:'DD/MM/YYYY',label:'DD/MM/YYYY'},{value:'MM/DD/YYYY',label:'MM/DD/YYYY'}]} />
          <SettingsSelect label="Format Jam" name="time_format" value={general.time_format} onChange={setGeneral} icon={Clock} options={[{value:'24h',label:'24 Jam'},{value:'12h',label:'12 Jam'}]} />
          <SettingsInput label="Auto Logout" name="auto_logout_minutes" type="number" value={general.auto_logout_minutes} onChange={setGeneral} icon={Lock} suffix="menit" />
          <SettingsToggle label="Sync Server Time" checked={general.sync_server_time} onChange={(v) => setGeneral({...general, sync_server_time: v})} icon={RefreshCw} />
        </div>
      </SettingsCard>

      <SettingsCard icon={Bell} title="Notifikasi" description="Kelola notifikasi">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <SettingsToggle label="Email" checked={general.email_notifications} onChange={(v) => setGeneral({...general, email_notifications: v})} icon={Mail} />
          <SettingsToggle label="Push" checked={general.push_notifications} onChange={(v) => setGeneral({...general, push_notifications: v})} icon={Bell} />
          <SettingsToggle label="Absensi" checked={general.attendance_notification} onChange={(v) => setGeneral({...general, attendance_notification: v})} icon={Clock} />
          <SettingsToggle label="Login" checked={general.login_notification} onChange={(v) => setGeneral({...general, login_notification: v})} icon={Lock} />
          <SettingsToggle label="PKL" checked={general.pkl_notification} onChange={(v) => setGeneral({...general, pkl_notification: v})} icon={Briefcase} />
          <SettingsToggle label="Pelanggaran" checked={general.violation_notification} onChange={(v) => setGeneral({...general, violation_notification: v})} icon={AlertTriangle} />
        </div>
      </SettingsCard>

      <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
        <Button variant="outline" onClick={() => handleReset('general')}>Reset</Button>
        <Button onClick={() => handleSave('general')} loading={isSaving} className="flex items-center gap-2"><Save className="w-4 h-4" /> Simpan</Button>
      </div>
    </motion.div>
  );

  const renderAttendanceTab = () => (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" className="space-y-8">
      <SettingsCard icon={MapPin} title="GPS & Lokasi" description="Konfigurasi lokasi sekolah">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SettingsInput label="Latitude" name="school_latitude" value={attendance.school_latitude} onChange={setAttendance} icon={MapPin} placeholder="-6.200000" />
          <SettingsInput label="Longitude" name="school_longitude" value={attendance.school_longitude} onChange={setAttendance} icon={MapPin} placeholder="106.816666" />
        </div>
        <div className="mt-4">
          <MapPreview lat={attendance.school_latitude} lng={attendance.school_longitude} />
          <Button size="sm" variant="outline" className="mt-3 w-full">Pilih dari Peta</Button>
        </div>
        <div className="mt-4 flex items-center justify-between p-3 rounded-lg bg-white/5">
          <span className="text-sm text-gray-300">Multiple Lokasi</span>
          <SettingsToggle label="" checked={attendance.multiple_locations} onChange={(v) => setAttendance({...attendance, multiple_locations: v})} />
        </div>
      </SettingsCard>

      <SettingsCard icon={Target} title="Validasi" description="Parameter absensi">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SettingsInput label="Radius" name="radius_meters" type="number" value={attendance.radius_meters} onChange={setAttendance} icon={Crosshair} suffix="meter" />
          <SettingsInput label="Max Terlambat" name="max_late_minutes" type="number" value={attendance.max_late_minutes} onChange={setAttendance} icon={Clock} suffix="menit" />
          <SettingsInput label="Jam Masuk" name="check_in_time" type="time" value={attendance.check_in_time} onChange={setAttendance} icon={Clock3} />
          <SettingsInput label="Jam Pulang" name="check_out_time" type="time" value={attendance.check_out_time} onChange={setAttendance} icon={Clock3} />
          <SettingsInput label="Istirahat Mulai" name="break_start" type="time" value={attendance.break_start} onChange={setAttendance} icon={Coffee} />
          <SettingsInput label="Istirahat Selesai" name="break_end" type="time" value={attendance.break_end} onChange={setAttendance} icon={Coffee} />
          <SettingsInput label="Toleransi" name="late_tolerance" type="number" value={attendance.late_tolerance} onChange={setAttendance} icon={Timer} suffix="menit" />
          <SettingsToggle label="Auto Alpha" checked={attendance.auto_alpha} onChange={(v) => setAttendance({...attendance, auto_alpha: v})} icon={AlertTriangle} />
        </div>
      </SettingsCard>

      <SettingsCard icon={Zap} title="Smart Attendance" description="Fitur keamanan">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <SettingsToggle label="Face Verification" checked={attendance.face_verification} onChange={(v) => setAttendance({...attendance, face_verification: v})} icon={Camera} />
          <SettingsToggle label="Selfie" checked={attendance.selfie_verification} onChange={(v) => setAttendance({...attendance, selfie_verification: v})} icon={Camera} />
          <SettingsToggle label="Anti Fake GPS" checked={attendance.anti_fake_gps} onChange={(v) => setAttendance({...attendance, anti_fake_gps: v})} icon={MapPin} />
          <SettingsToggle label="Anti Screenshot" checked={attendance.anti_screenshot} onChange={(v) => setAttendance({...attendance, anti_screenshot: v})} icon={EyeSlash} />
          <SettingsToggle label="Device Verification" checked={attendance.device_verification} onChange={(v) => setAttendance({...attendance, device_verification: v})} icon={Smartphone} />
          <SettingsToggle label="Mock Location Detection" checked={attendance.mock_location_detection} onChange={(v) => setAttendance({...attendance, mock_location_detection: v})} icon={Navigation} />
          <SettingsToggle label="WiFi Validation" checked={attendance.wifi_validation} onChange={(v) => setAttendance({...attendance, wifi_validation: v})} icon={Wifi} />
          {attendance.wifi_validation && <SettingsInput label="WiFi SSID" name="wifi_ssid" value={attendance.wifi_ssid} onChange={setAttendance} icon={Wifi} />}
          <SettingsToggle label="Bluetooth Validation" checked={attendance.bluetooth_validation} onChange={(v) => setAttendance({...attendance, bluetooth_validation: v})} icon={Bluetooth} />
        </div>
      </SettingsCard>

      <SettingsCard icon={QrCode} title="QR Absensi" description="Pengaturan QR">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SettingsToggle label="Aktifkan QR" checked={attendance.qr_enabled} onChange={(v) => setAttendance({...attendance, qr_enabled: v})} icon={QrCode} />
          <SettingsInput label="Expired QR" name="qr_expired_seconds" type="number" value={attendance.qr_expired_seconds} onChange={setAttendance} icon={Timer} suffix="detik" />
          <SettingsToggle label="Random QR" checked={attendance.qr_random} onChange={(v) => setAttendance({...attendance, qr_random: v})} icon={RefreshCw} />
          <SettingsToggle label="Animated QR" checked={attendance.qr_animated} onChange={(v) => setAttendance({...attendance, qr_animated: v})} icon={Zap} />
        </div>
        <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
          <div className="text-center">
            <div className="w-32 h-32 mx-auto mb-2 bg-white rounded-lg p-2">
              <div className="w-full h-full bg-gray-900 rounded flex items-center justify-center"><QrCode className="w-16 h-16 text-white" /></div>
            </div>
            <p className="text-xs text-gray-400">Preview QR</p>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard icon={Activity} title="Fitur Lanjutan">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <SettingsToggle label="Multiple Shift" checked={attendance.multiple_shifts} onChange={(v) => setAttendance({...attendance, multiple_shifts: v})} icon={Clock3} />
          <SettingsToggle label="Jadwal Fleksibel" checked={attendance.flexible_schedule} onChange={(v) => setAttendance({...attendance, flexible_schedule: v})} icon={CalendarDays} />
          <SettingsToggle label="Izin Online" checked={attendance.online_permission} onChange={(v) => setAttendance({...attendance, online_permission: v})} icon={FileText} />
          <SettingsToggle label="Approval Guru" checked={attendance.teacher_approval} onChange={(v) => setAttendance({...attendance, teacher_approval: v})} icon={UserCheck} />
          <SettingsToggle label="Notif Orang Tua" checked={attendance.parent_notification} onChange={(v) => setAttendance({...attendance, parent_notification: v})} icon={Bell} />
          <SettingsToggle label="WhatsApp Integration" checked={attendance.whatsapp_integration} onChange={(v) => setAttendance({...attendance, whatsapp_integration: v})} icon={Radio} />
        </div>
      </SettingsCard>

      <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
        <Button variant="outline" onClick={() => handleReset('attendance')}>Reset</Button>
        <Button onClick={() => handleSave('attendance')} loading={isSaving} className="flex items-center gap-2"><Save className="w-4 h-4" /> Simpan</Button>
      </div>
    </motion.div>
  );

  // PKL Tab (Simplified)
  const renderPklTab = () => (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" className="space-y-8">
      <SettingsCard icon={Briefcase} title="PKL / Magang" description="Konfigurasi PKL kelas 12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <SettingsToggle label="Aktifkan Absensi PKL" checked={pkl.enable_pkl_attendance} onChange={(v) => setPkl({...pkl, enable_pkl_attendance: v})} icon={Briefcase} />
          <SettingsToggle label="Butuh Approval" checked={pkl.require_supervisor_approval} onChange={(v) => setPkl({...pkl, require_supervisor_approval: v})} icon={CheckCircle2} />
          <SettingsInput label="Maks Jarak" name="max_distance_km" type="number" value={pkl.max_distance_km} onChange={setPkl} icon={MapPin} suffix="km" />
          <SettingsToggle label="Progress Tracking" checked={pkl.show_progress_tracking} onChange={(v) => setPkl({...pkl, show_progress_tracking: v})} icon={BarChart3} />
          <SettingsToggle label="Laporan Mingguan" checked={pkl.require_weekly_report} onChange={(v) => setPkl({...pkl, require_weekly_report: v})} icon={FileText} />
          <SettingsToggle label="Auto Reminder" checked={pkl.auto_reminder} onChange={(v) => setPkl({...pkl, auto_reminder: v})} icon={Bell} />
          {pkl.auto_reminder && <SettingsInput label="Reminder Setiap" name="reminder_day" type="number" value={pkl.reminder_day} onChange={setPkl} icon={CalendarDays} suffix="hari" />}
        </div>
      </SettingsCard>

      <SettingsCard 
        icon={Map} 
        title="Lokasi PKL" 
        description="Kelola perusahaan PKL" 
        actions={<Button size="sm" onClick={() => setIsPklModalOpen(true)}><Plus className="w-4 h-4 mr-1" /> Tambah</Button>}
      >
        {pklLocations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pklLocations.map(loc => (
              <div key={loc.id} className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-white">{loc.company_name}</h4>
                  <p className="text-xs text-gray-400 mt-1 line-clamp-1">{loc.address}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[10px] text-primary-400 font-mono">{loc.latitude}, {loc.longitude}</span>
                    <span className="text-[10px] text-gray-500">Radius: {loc.radius_meters}m</span>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="p-2 h-auto"><ChevronRight className="w-4 h-4" /></Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Briefcase className="w-12 h-12 text-gray-500 mx-auto mb-3" />
            <p className="text-gray-400">Belum ada lokasi PKL</p>
            <Button size="sm" variant="outline" className="mt-3" onClick={() => setIsPklModalOpen(true)}>Tambah Lokasi</Button>
          </div>
        )}
      </SettingsCard>

      <SettingsCard icon={Users} title="Siswa PKL" description="Penempatan siswa RPL Kelas XII">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Cari nama siswa..." 
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-primary-500/50" 
            />
          </div>
          
          <div className="space-y-3">
            {pklStudents.length > 0 ? pklStudents.map(student => (
              <div key={student.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 font-bold">
                    {student.name.charAt(0)}
                  </div>
                  <div>
                    <h5 className="text-sm font-medium text-white">{student.name}</h5>
                    <p className="text-[10px] text-gray-500">NIS: {student.profile?.nis || '-'} • Jurusan: {student.profile?.major || 'RPL'}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <select 
                    value={student.pkl_location_id || ''} 
                    onChange={(e) => handleAssignStudent(student.id, e.target.value)}
                    className="flex-1 sm:w-48 px-3 py-1.5 rounded-lg bg-dark-card border border-white/10 text-xs text-white focus:outline-none focus:border-primary-500/50"
                  >
                    <option value="">Belum Ditempatkan</option>
                    {pklLocations.map(loc => (
                      <option key={loc.id} value={loc.id}>{loc.company_name}</option>
                    ))}
                  </select>
                </div>
              </div>
            )) : (
              <div className="text-center py-4 text-gray-500 text-sm italic">
                Tidak ada siswa RPL XII ditemukan
              </div>
            )}
          </div>
        </div>
      </SettingsCard>

      <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
        <Button variant="outline" onClick={() => handleReset('pkl')}>Reset</Button>
        <Button onClick={() => handleSave('pkl')} loading={isSaving} className="flex items-center gap-2"><Save className="w-4 h-4" /> Simpan</Button>
      </div>
    </motion.div>
  );

  // Security Tab (Simplified)
  const renderSecurityTab = () => (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" className="space-y-8">
      <div className="p-6 rounded-2xl bg-gradient-to-r from-primary-500/20 via-accent-cyan/20 to-primary-500/20 border border-white/10">
        <div className="flex items-center justify-between">
          <div><p className="text-sm text-gray-400">Security Score</p><p className="text-3xl font-bold text-white">85<span className="text-lg text-gray-400">/100</span></p></div>
          <div className="flex items-center gap-2"><ShieldCheck className="w-8 h-8 text-success" /><span className="text-success font-medium">Good</span></div>
        </div>
        <div className="mt-3 w-full bg-white/10 rounded-full h-2"><div className="bg-gradient-to-r from-primary-500 to-accent-cyan h-2 rounded-full" style={{width: '85%'}} /></div>
      </div>

      <SettingsCard icon={Lock} title="Authentication">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <SettingsToggle label="2FA" checked={security.two_factor_auth} onChange={(v) => setSecurity({...security, two_factor_auth: v})} icon={Shield} />
          <SettingsToggle label="OTP Email" checked={security.otp_email} onChange={(v) => setSecurity({...security, otp_email: v})} icon={Mail} />
          <SettingsToggle label="OTP WhatsApp" checked={security.otp_whatsapp} onChange={(v) => setSecurity({...security, otp_whatsapp: v})} icon={Radio} />
          <SettingsToggle label="Biometric" checked={security.biometric_login} onChange={(v) => setSecurity({...security, biometric_login: v})} icon={Fingerprint} />
          <SettingsToggle label="Trusted Devices" checked={security.trusted_devices} onChange={(v) => setSecurity({...security, trusted_devices: v})} icon={MonitorSmartphone} />
          <SettingsInput label="Max Session" name="session_limit" type="number" value={security.session_limit} onChange={setSecurity} icon={LockOpen} />
        </div>
      </SettingsCard>

      <SettingsCard icon={ShieldAlert} title="Login Security">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <SettingsToggle label="Login History" checked={security.login_history_enabled} onChange={(v) => setSecurity({...security, login_history_enabled: v})} icon={History} />
          <SettingsToggle label="Device History" checked={security.device_history_enabled} onChange={(v) => setSecurity({...security, device_history_enabled: v})} icon={Smartphone} />
          <SettingsToggle label="IP Tracking" checked={security.ip_tracking} onChange={(v) => setSecurity({...security, ip_tracking: v})} icon={Globe} />
          <SettingsToggle label="Suspicious Detection" checked={security.suspicious_login_detection} onChange={(v) => setSecurity({...security, suspicious_login_detection: v})} icon={AlertTriangle} />
          <SettingsToggle label="Failed Login Lockout" checked={security.failed_login_lockout} onChange={(v) => setSecurity({...security, failed_login_lockout: v})} icon={Lock} />
          <SettingsInput label="Max Failed Attempts" name="failed_attempts_max" type="number" value={security.failed_attempts_max} onChange={setSecurity} icon={XCircle} />
          <SettingsInput label="Lockout Duration" name="lockout_duration_minutes" type="number" value={security.lockout_duration_minutes} onChange={setSecurity} icon={Clock3} suffix="menit" />
        </div>
      </SettingsCard>

      <SettingsCard icon={Key} title="Password Policy">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SettingsInput label="Min Length" name="min_password_length" type="number" value={security.min_password_length} onChange={setSecurity} icon={Key} />
          <SettingsInput label="Expire Days" name="password_expire_days" type="number" value={security.password_expire_days} onChange={setSecurity} icon={Clock3} />
          <SettingsInput label="Password History" name="password_history_count" type="number" value={security.password_history_count} onChange={setSecurity} icon={History} />
          <SettingsToggle label="Uppercase" checked={security.require_uppercase} onChange={(v) => setSecurity({...security, require_uppercase: v})} icon={Key} />
          <SettingsToggle label="Number" checked={security.require_number} onChange={(v) => setSecurity({...security, require_number: v})} icon={Key} />
          <SettingsToggle label="Special Char" checked={security.require_special_char} onChange={(v) => setSecurity({...security, require_special_char: v})} icon={Key} />
          <SettingsToggle label="Strength Meter" checked={security.password_strength_meter} onChange={(v) => setSecurity({...security, password_strength_meter: v})} icon={Activity} />
        </div>
      </SettingsCard>

      <SettingsCard icon={Radio} title="API & Access">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <SettingsToggle label="API Token" checked={security.api_token_enabled} onChange={(v) => setSecurity({...security, api_token_enabled: v})} icon={KeyRound} />
          <SettingsInput label="Rate Limit" name="rate_limit_per_minute" type="number" value={security.rate_limit_per_minute} onChange={setSecurity} icon={Zap} suffix="/menit" />
          <SettingsToggle label="Audit Log" checked={security.audit_log_enabled} onChange={(v) => setSecurity({...security, audit_log_enabled: v})} icon={FileText} />
        </div>
      </SettingsCard>

      <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
        <Button variant="outline" onClick={() => handleReset('security')}>Reset</Button>
        <Button onClick={() => handleSave('security')} loading={isSaving} className="flex items-center gap-2"><Save className="w-4 h-4" /> Simpan</Button>
      </div>
    </motion.div>
  );

  // Features Tab (Simplified)
  const renderFeaturesTab = () => (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input type="text" placeholder="Cari fitur..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-primary-500/50" />
        </div>
        <Button variant="outline" size="sm">Semua</Button>
        <Button variant="outline" size="sm">Aktif</Button>
        <Button variant="outline" size="sm">Non-Aktif</Button>
      </div>

      <SettingsCard icon={Globe} title="Public Website">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <SettingsToggle label="Galeri Siswa" checked={features.public_gallery} onChange={(v) => setFeatures({...features, public_gallery: v})} icon={Image} />
          <SettingsToggle label="Career Simulator" checked={features.career_simulator} onChange={(v) => setFeatures({...features, career_simulator: v})} icon={Briefcase} />
          <SettingsToggle label="Achievement" checked={features.achievement_showcase} onChange={(v) => setFeatures({...features, achievement_showcase: v})} icon={Award} />
          <SettingsToggle label="Landing Editor" checked={features.landing_page_editor} onChange={(v) => setFeatures({...features, landing_page_editor: v})} icon={Layout} />
          <SettingsToggle label="News" checked={features.news_management} onChange={(v) => setFeatures({...features, news_management: v})} icon={FileText} />
        </div>
      </SettingsCard>

      <SettingsCard icon={Brain} title="AI Features">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <SettingsToggle label="AI Rekomendasi" checked={features.ai_student_recommendation} onChange={(v) => setFeatures({...features, ai_student_recommendation: v})} icon={Brain} />
          <SettingsToggle label="AI Analytics" checked={features.ai_analytics} onChange={(v) => setFeatures({...features, ai_analytics: v})} icon={BarChart3} />
          <SettingsToggle label="AI Chatbot" checked={features.ai_chatbot} onChange={(v) => setFeatures({...features, ai_chatbot: v})} icon={MessageCircle} />
          <SettingsToggle label="AI Monitoring" checked={features.ai_monitoring} onChange={(v) => setFeatures({...features, ai_monitoring: v})} icon={Eye} />
          <SettingsToggle label="AI Prediction" checked={features.ai_attendance_prediction} onChange={(v) => setFeatures({...features, ai_attendance_prediction: v})} icon={Clock} />
        </div>
      </SettingsCard>

      <SettingsCard icon={Cpu} title="System Modules">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <SettingsToggle label="E-Learning" checked={features.e_learning} onChange={(v) => setFeatures({...features, e_learning: v})} icon={BookOpen} />
          <SettingsToggle label="CBT Exam" checked={features.cbt_exam} onChange={(v) => setFeatures({...features, cbt_exam: v})} icon={FileText} />
          <SettingsToggle label="E-Raport" checked={features.e_raport} onChange={(v) => setFeatures({...features, e_raport: v})} icon={GraduationCap} />
          <SettingsToggle label="Digital Library" checked={features.digital_library} onChange={(v) => setFeatures({...features, digital_library: v})} icon={BookOpen} />
          <SettingsToggle label="Smart Classroom" checked={features.smart_classroom} onChange={(v) => setFeatures({...features, smart_classroom: v})} icon={Monitor} />
          <SettingsToggle label="Inventory" checked={features.school_inventory} onChange={(v) => setFeatures({...features, school_inventory: v})} icon={Archive} />
        </div>
      </SettingsCard>

      <SettingsCard icon={Settings2} title="Advanced">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <SettingsToggle label="Dynamic Config" checked={features.dynamic_config} onChange={(v) => setFeatures({...features, dynamic_config: v})} icon={Settings2} />
          <SettingsToggle label="Realtime Update" checked={features.realtime_update} onChange={(v) => setFeatures({...features, realtime_update: v})} icon={Activity} />
          <SettingsToggle label="Auto Cache Refresh" checked={features.cache_refresh_auto} onChange={(v) => setFeatures({...features, cache_refresh_auto: v})} icon={RefreshCw} />
        </div>
      </SettingsCard>

      <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
        <Button variant="outline" onClick={() => handleReset('features')}>Reset</Button>
        <Button onClick={() => handleSave('features')} loading={isSaving} className="flex items-center gap-2"><Save className="w-4 h-4" /> Simpan</Button>
      </div>
    </motion.div>
  );

  // Backup Tab (Simplified)
  const renderBackupTab = () => (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" className="space-y-8">
      <SettingsCard icon={Database} title="Backup Database">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <SettingsToggle label="Auto Backup" checked={backup.auto_backup} onChange={(v) => setBackup({...backup, auto_backup: v})} icon={Database} />
          <SettingsSelect label="Jadwal" name="backup_schedule" value={backup.backup_schedule} onChange={setBackup} icon={CalendarDays} options={[{value:'daily',label:'Harian'},{value:'weekly',label:'Mingguan'},{value:'monthly',label:'Bulanan'}]} />
          <SettingsInput label="Waktu" name="backup_time" type="time" value={backup.backup_time} onChange={setBackup} icon={Clock3} />
          <SettingsInput label="Retensi" name="backup_retention_days" type="number" value={backup.backup_retention_days} onChange={setBackup} icon={Clock3} suffix="hari" />
          <SettingsToggle label="Cloud Backup" checked={backup.cloud_backup} onChange={(v) => setBackup({...backup, cloud_backup: v})} icon={Cloud} />
          <SettingsToggle label="Compress" checked={backup.compress_backup} onChange={(v) => setBackup({...backup, compress_backup: v})} icon={Archive} />
          <SettingsToggle label="Encrypt" checked={backup.encrypt_backup} onChange={(v) => setBackup({...backup, encrypt_backup: v})} icon={Lock} />
        </div>
      </SettingsCard>

      <SettingsCard icon={HardDrive} title="Aksi Backup">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-primary-500/30 transition-all group text-center">
            <Download className="w-6 h-6 text-primary-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-white group-hover:text-primary-400">Download</p>
            <p className="text-xs text-gray-500 mt-1">Backup terbaru</p>
          </button>
          <button className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-primary-500/30 transition-all group text-center">
            <Upload className="w-6 h-6 text-primary-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-white group-hover:text-primary-400">Upload</p>
            <p className="text-xs text-gray-500 mt-1">Restore dari file</p>
          </button>
          <button className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-primary-500/30 transition-all group text-center">
            <Trash2 className="w-6 h-6 text-primary-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-white group-hover:text-primary-400">Hapus Lama</p>
            <p className="text-xs text-gray-500 mt-1">Bersihkan storage</p>
          </button>
        </div>
      </SettingsCard>

      <SettingsCard icon={Cpu} title="System Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex justify-between text-sm"><span className="text-gray-400">Laravel</span><span className="text-white font-mono">11.x</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-400">PHP</span><span className="text-white font-mono">8.2.x</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-400">Database</span><span className="text-white font-mono">MySQL 8.0</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-400">Storage</span><span className="text-white font-mono">2.4 GB / 10 GB</span></div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm"><span className="text-gray-400">Cache</span><span className="text-white font-mono">Redis</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-400">Queue</span><span className="text-white font-mono">Redis</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-400">Environment</span><span className="text-white font-mono">Production</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-400">Debug</span><span className="text-danger font-mono">False</span></div>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard icon={Settings2} title="Maintenance">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-primary-500/30 transition-all group text-center">
            <RefreshCw className="w-6 h-6 text-primary-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-white group-hover:text-primary-400">Clear Cache</p>
          </button>
          <button className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-primary-500/30 transition-all group text-center">
            <Activity className="w-6 h-6 text-primary-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-white group-hover:text-primary-400">Optimize</p>
          </button>
          <button className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-primary-500/30 transition-all group text-center">
            <ShieldCheck className="w-6 h-6 text-primary-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-white group-hover:text-primary-400">Health Check</p>
          </button>
        </div>
      </SettingsCard>

      <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
        <Button variant="outline" onClick={() => handleReset('backup')}>Reset</Button>
        <Button onClick={() => handleSave('backup')} loading={isSaving} className="flex items-center gap-2"><Save className="w-4 h-4" /> Simpan</Button>
      </div>
    </motion.div>
  );

  // ═══════════════════════════════════════════════════════════
  // MAIN RENDER
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-[#0f0f1a] relative">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent-cyan/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}} />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}} />
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed top-24 right-6 z-50">
            <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Save Indicator */}
      <AnimatePresence>
        {showSaveIndicator && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/20 border border-primary-500/30 backdrop-blur-xl">
            <RefreshCw className="w-4 h-4 text-primary-400 animate-spin" />
            <span className="text-sm text-primary-400">Menyimpan...</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Unsaved Warning */}
      {hasUnsavedChanges && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="sticky top-0 z-40 px-4 py-2 bg-warning/20 border-b border-warning/30 backdrop-blur-xl">
          <p className="text-sm text-warning text-center flex items-center justify-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Ada perubahan yang belum disimpan
          </p>
        </motion.div>
      )}

      {/* Header */}
      <div className="relative z-10 pt-8 pb-6 px-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Settings2 className="w-8 h-8 text-primary-400" /> Pengaturan Sistem
            </h1>
            <p className="text-gray-400 mt-1">Kelola konfigurasi RPL Smart Ecosystem</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => handleReset('all')}><RefreshCw className="w-4 h-4 mr-1" /> Reset</Button>
            <Button onClick={handleSave} loading={isSaving} size="sm" className="flex items-center gap-2"><Save className="w-4 h-4" /> Simpan Semua</Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="relative z-10 px-6 max-w-7xl mx-auto">
        <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-thin">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${isActive ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30 shadow-[0_0_20px_rgba(168,85,247,0.2)]' : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'}`}>
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 px-6 py-6 max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
            {activeTab === 'general' && renderGeneralTab()}
            {activeTab === 'attendance' && renderAttendanceTab()}
            {activeTab === 'pkl' && renderPklTab()}
            {activeTab === 'security' && renderSecurityTab()}
            {activeTab === 'features' && renderFeaturesTab()}
            {activeTab === 'backup' && renderBackupTab()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Modals */}
      <PklLocationModal 
        isOpen={isPklModalOpen} 
        onClose={() => setIsPklModalOpen(false)} 
        onSave={handleAddPklLocation} 
        isSaving={isAddingPkl}
      />
    </div>
  );
}