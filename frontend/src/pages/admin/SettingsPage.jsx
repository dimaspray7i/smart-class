import { useState, useEffect, useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Globe2 as Globe, Clock, Briefcase, Shield, ToggleRight, Save, RefreshCw,
  MapPin, Camera, QrCode, Smartphone, Wifi, Bluetooth, Fingerprint,
  Mail, Bell, Download, Upload, Trash2, Eye, EyeOff, Search,
  ChevronDown, ChevronRight, ChevronLeft, Settings2, Building2,
  School, Users, Calendar, Cloud, Database, Lock, Key, ChartBar as BarChart3,
  Zap, Brain, BookOpen, GraduationCap, Award, AlertTriangle,
  CheckCircle2, XCircle, Info, Moon, Sun, Palette, Layout,
  HardDrive, Cpu, Activity, Radio, Satellite, LockOpen, KeyRound,
  TabletSmartphone as MonitorSmartphone, ShieldCheck, ShieldAlert, FileText, Image,
  Video, Music, Archive, Clock as Clock3, Timer, CalendarDays, Map,
  Navigation, Target, Compass, Crosshair, EyeOff as EyeSlash,
  MessageCircle, Monitor, Coffee, RefreshCw as History, UserCheck, Plus,
  Menu, X, Star, Sparkles, Smile, Rocket, Tag, Layers, GitBranch,
  Terminal, Server, HardHat, Wrench, Package, Box, Folder, File
} from 'lucide-react';
import { api } from '../../api';
import Button from '../../components/ui/Button';
import Toast from '../../components/ui/Toast';
import Modal from '../../components/ui/Modal';

// ═══════════════════════════════════════════════════════════
// 🎨 RETRO ANIMATION VARIANTS
// ═══════════════════════════════════════════════════════════
const pageVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } }
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, rotate: -1 },
  visible: { 
    opacity: 1, y: 0, rotate: 0,
    transition: { type: "spring", stiffness: 100, damping: 15, mass: 0.1 } 
  }
};

const stickerVariants = {
  hidden: { scale: 0, rotate: -180 },
  visible: { scale: 1, rotate: 0, transition: { type: "spring", stiffness: 200, damping: 10 } },
  hover: { scale: 1.1, rotate: [0, -5, 5, -3, 3, 0], transition: { duration: 0.3 } }
};

const floatVariants = {
  animate: {
    y: [0, -8, 0], rotate: [0, 2, -2, 0],
    transition: { duration: 4, repeat: Infinity, ease: "easeInOut" }
  }
};

// ═══════════════════════════════════════════════════════════
// 🎭 RETRO HELPER COMPONENTS (Inline - No Separate Folder)
// ═══════════════════════════════════════════════════════════

// Retro Card Wrapper with Brutalist Borders
function RetroSettingsCard({ children, className = '', icon: Icon, title, description, actions }) {
  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -2, rotate: 1 }}
      className={`relative group rounded-retro-lg overflow-hidden ${className}`}
    >
      {/* Decorative corner accents */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-retro-orange" />
      <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-retro-blue" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-retro-purple" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-retro-lime" />
      
      {/* Card content with brutalist styling */}
      <div className="relative bg-base-white border-4 border-base-black rounded-retro-lg p-6 transition-all duration-300 group-hover:shadow-hard-hover group-hover:-translate-x-0.5 group-hover:-translate-y-0.5">
        {(Icon || title) && (
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-3">
              {Icon && (
                <div className="p-2.5 rounded-retro bg-retro-orange/20 border-2 border-retro-orange">
                  <Icon className="w-5 h-5 text-retro-orange" />
                </div>
              )}
              <div>
                {title && <h3 className="retro-heading retro-heading-sm text-base-black">{title}</h3>}
                {description && <p className="font-retro-mono text-[10px] text-base-black/60 mt-0.5">{description}</p>}
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

// Retro Toggle Switch with Animated Slider
function RetroSettingsToggle({ label, checked, onChange, description, icon: Icon, disabled = false }) {
  return (
    <motion.div 
      whileHover={{ scale: disabled ? 1 : 1.01 }}
      className={`flex items-center justify-between p-4 rounded-retro border-2 border-base-black transition-all duration-300 ${
        checked 
          ? 'bg-retro-orange/10 border-retro-orange' 
          : 'bg-base-gray border-base-black/30'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-retro-yellow/10 cursor-pointer'}`}
      onClick={() => !disabled && onChange(!checked)}
    >
      <div className="flex items-start gap-3">
        {Icon && <Icon className={`w-5 h-5 mt-0.5 ${checked ? 'text-retro-orange' : 'text-base-black/40'}`} />}
        <div>
          <p className={`font-retro-display font-black text-sm ${checked ? 'text-base-black' : 'text-base-black/70'}`}>{label}</p>
          {description && <p className="font-retro-mono text-[9px] text-base-black/50 mt-0.5">{description}</p>}
        </div>
      </div>
      <motion.div
        className={`relative inline-flex h-6 w-12 items-center rounded-retro border-2 border-base-black transition-colors ${
          checked ? 'bg-retro-orange' : 'bg-base-gray'
        }`}
        whileTap={{ scale: 0.95 }}
      >
        <motion.span
          className="inline-block h-4 w-4 transform rounded-sm bg-base-white border-2 border-base-black shadow-[2px_2px_0px_0px_#111111]"
          animate={{ x: checked ? 24 : 4 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </motion.div>
    </motion.div>
  );
}

// Retro Input with Thick Borders & Glow
function RetroSettingsInput({ label, name, type = "text", value, onChange, error, required, disabled, placeholder, icon: Icon, helperText, suffix, prefix }) {
  const [focused, setFocused] = useState(false);
  
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-black uppercase tracking-wider text-base-black">
        <span className="flex items-center gap-1.5">
          {Icon && <Icon className="w-4 h-4" />}
          {label}
          {required && <span className="text-retro-orange">*</span>}
        </span>
      </label>
      <div className="relative">
        {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base-black/50 text-xs font-retro-mono">{prefix}</span>}
        <input
          type={type}
          name={name}
          value={value || ''}
          onChange={(e) => onChange(prev => ({ ...prev, [name]: e.target.value }))}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={`w-full px-4 py-3 rounded-retro bg-base-white border-2 border-base-black transition-all duration-300 text-base-black placeholder-base-black/40 focus:outline-none font-retro-mono text-sm ${
            focused 
              ? 'border-retro-orange shadow-[4px_4px_0px_0px_#FF5C00]' 
              : 'hover:border-retro-blue'
          } ${error ? 'border-danger shadow-[4px_4px_0px_0px_#FF1744]' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${prefix ? 'pl-10' : ''} ${suffix ? 'pr-10' : ''}`}
          required={required}
          disabled={disabled}
          placeholder={placeholder}
        />
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-base-black/50 text-xs font-retro-mono">{suffix}</span>}
      </div>
      {helperText && <p className="text-[9px] font-retro-mono text-base-black/50">{helperText}</p>}
      {error && <p className="text-danger text-[9px] font-retro-mono mt-0.5">{Array.isArray(error) ? error[0] : error}</p>}
    </div>
  );
}

// Retro Select with Custom Styling
function RetroSettingsSelect({ label, name, value, onChange, options, error, required, disabled, icon: Icon, placeholder }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-black uppercase tracking-wider text-base-black">
        <span className="flex items-center gap-1.5">
          {Icon && <Icon className="w-4 h-4" />}
          {label}
          {required && <span className="text-retro-orange">*</span>}
        </span>
      </label>
      <select
        name={name}
        value={value || ''}
        onChange={(e) => onChange(prev => ({ ...prev, [name]: e.target.value }))}
        className="w-full px-4 py-3 rounded-retro bg-base-white border-2 border-base-black hover:border-retro-blue focus:border-retro-orange focus:shadow-[4px_4px_0px_0px_#FF5C00] transition-all duration-300 text-base-black focus:outline-none appearance-none cursor-pointer font-retro-mono text-sm"
        required={required}
        disabled={disabled}
      >
        {placeholder && <option value="" className="bg-base-cream text-base-black">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-base-cream text-base-black">{opt.label}</option>
        ))}
      </select>
      {error && <p className="text-danger text-[9px] font-retro-mono mt-0.5">{Array.isArray(error) ? error[0] : error}</p>}
    </div>
  );
}

// Retro Stats Badge
function RetroStatsBadge({ label, value, icon: Icon, color = "orange" }) {
  const colorClasses = {
    orange: "bg-retro-orange/10 text-retro-orange border-retro-orange",
    blue: "bg-retro-blue/10 text-retro-blue border-retro-blue",
    yellow: "bg-retro-yellow/20 text-retro-yellow border-retro-yellow",
    purple: "bg-retro-purple/10 text-retro-purple border-retro-purple",
    lime: "bg-retro-lime/10 text-retro-lime border-retro-lime",
    green: "bg-success/10 text-success border-success",
    red: "bg-danger/10 text-danger border-danger",
  };
  
  return (
    <motion.div whileHover={{ scale: 1.05, rotate: 2 }} className={`retro-badge text-[10px] px-3 py-1.5 ${colorClasses[color]}`}>
      {Icon && <Icon className="w-4 h-4 mr-1 inline" />}
      <span className="font-black uppercase tracking-wide">{label}</span>
      {value !== undefined && <span className="font-retro-display font-black ml-1">{value}</span>}
    </motion.div>
  );
}

// Retro Map Preview Component
function RetroMapPreview({ lat, lng }) {
  if (!lat || !lng) return (
    <div className="flex flex-col items-center justify-center h-48 rounded-retro bg-base-gray border-2 border-dashed border-base-black/30 text-base-black/50">
      <MapPin className="w-8 h-8 mb-2 opacity-50" />
      <p className="font-retro-mono text-xs">Enter Latitude & Longitude</p>
    </div>
  );

  const embedUrl = `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`;

  return (
    <div className="relative rounded-retro overflow-hidden border-4 border-base-black h-64 group">
      <iframe
        title="Location Preview"
        width="100%"
        height="100%"
        style={{ border: 0 }}
        src={embedUrl}
        allowFullScreen
      />
      <div className="absolute top-3 left-3 px-3 py-1.5 rounded-retro bg-retro-orange border-2 border-base-black text-[10px] text-base-white font-retro-mono flex items-center gap-2">
        <div className="w-2 h-2 rounded-sm bg-base-white animate-pulse" />
        LIVE: {lat}, {lng}
      </div>
    </div>
  );
}

// Retro PKL Location Modal
function RetroPklLocationModal({ isOpen, onClose, onSave, isSaving }) {
  const [formData, setFormData] = useState({
    company_name: '', address: '', latitude: '', longitude: '',
    radius_meters: 100, supervisor_name: '', supervisor_phone: '',
    supervisor_email: '', is_approved: true, student_ids: []
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        company_name: '', address: '', latitude: '', longitude: '',
        radius_meters: 100, supervisor_name: '', supervisor_phone: '',
        supervisor_email: '', is_approved: true, student_ids: []
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
    <Modal isOpen={isOpen} onClose={onClose} title="🏢 ADD PKL LOCATION" size="lg">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <RetroSettingsInput label="Company Name" name="company_name" value={formData.company_name} onChange={setFormData} required icon={Building2} placeholder="PT. Example Indonesia" />
          <RetroSettingsInput label="Supervisor Name" name="supervisor_name" value={formData.supervisor_name} onChange={setFormData} icon={UserCheck} placeholder="Budi Santoso" />
          <RetroSettingsInput label="Email" name="supervisor_email" value={formData.supervisor_email} onChange={setFormData} icon={Mail} placeholder="supervisor@example.com" />
          <RetroSettingsInput label="Phone" name="supervisor_phone" value={formData.supervisor_phone} onChange={setFormData} icon={Smartphone} placeholder="08123456789" />
        </div>
        <RetroSettingsInput label="Full Address" name="address" value={formData.address} onChange={setFormData} required icon={MapPin} placeholder="Jl. Mawar No. 123, Jakarta" />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <RetroSettingsInput label="Latitude" name="latitude" value={formData.latitude} onChange={setFormData} required placeholder="-6.200000" />
          <RetroSettingsInput label="Longitude" name="longitude" value={formData.longitude} onChange={setFormData} required placeholder="106.816666" />
          <RetroSettingsInput label="Radius (m)" name="radius_meters" type="number" value={formData.radius_meters} onChange={setFormData} required placeholder="100" />
        </div>

        <div className="p-3 retro-card bg-retro-yellow/10 border-retro-yellow">
          <p className="text-[10px] font-black uppercase tracking-wider text-base-black/70 mb-2">⚡ Quick Location Templates</p>
          <div className="flex flex-wrap gap-2">
            {[{name:'Tech Hub Jakarta',lat:'-6.2088',lng:'106.8456'},{name:'Digital Valley',lat:'-6.2297',lng:'106.8200'}].map(t => (
              <button type="button" key={t.name} onClick={() => setFormData({...formData, latitude: t.lat, longitude: t.lng, company_name: t.name})} className="retro-btn retro-btn-sm retro-btn-outline text-[10px]">{t.name}</button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-xs font-black uppercase tracking-wider text-base-black flex items-center gap-2">
            <Users className="w-4 h-4 text-retro-orange" /> Assign Students (Optional)
          </label>
          <div className="max-h-48 overflow-y-auto rounded-retro border-2 border-base-black bg-base-gray p-2 space-y-1 scrollbar-thin">
            {eligibleStudents.length > 0 ? eligibleStudents.map(student => (
              <label key={student.id} className="flex items-center gap-3 p-2 rounded-sm hover:bg-retro-yellow/20 cursor-pointer transition-colors group">
                <input 
                  type="checkbox" 
                  checked={formData.student_ids.includes(student.id)}
                  onChange={() => toggleStudent(student.id)}
                  className="w-4 h-4 rounded-sm border-2 border-base-black bg-base-white text-retro-orange focus:ring-retro-orange/30 accent-retro-orange"
                />
                <div className="flex-1">
                  <p className="text-sm font-retro-display font-black text-base-black group-hover:text-retro-orange transition-colors">{student.name}</p>
                  <p className="text-[9px] font-retro-mono text-base-black/50">NIS: {student.profile?.nis || '-'} {student.pkl_location_id ? `(Placed: ${student.pkl_location?.company_name})` : '(Unplaced)'}</p>
                </div>
              </label>
            )) : (
              <p className="text-[10px] font-retro-mono text-base-black/50 text-center py-4">No RPL XII students found</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-8 pt-4 border-t-4 border-base-black">
          <button onClick={onClose} className="retro-btn retro-btn-outline">Cancel</button>
          <button onClick={() => onSave(formData)} className="retro-btn" disabled={isSaving}>{isSaving ? 'Saving...' : '💾 Save Location'}</button>
        </div>
      </div>
    </Modal>
  );
}

// Retro Decorative Elements
function SettingsDecorations() {
  return (
    <>
      <motion.div variants={floatVariants} animate="animate" className="absolute top-20 right-10 z-0 hidden lg:block"><div className="retro-smiley text-xl animate-wobble">⚙️</div></motion.div>
      <motion.div variants={floatVariants} animate="animate" className="absolute bottom-32 left-20 z-0 hidden lg:block" style={{animationDelay:'1s'}}><Star className="w-8 h-8 text-retro-yellow fill-retro-yellow drop-shadow-retro animate-sparkle-retro" /></motion.div>
      <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-retro-purple/20 rounded-blob blur-2xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-retro-lime/20 rounded-blob blur-2xl pointer-events-none" />
    </>
  );
}

// ═══════════════════════════════════════════════════════════
// 🎯 MAIN RETRO SETTINGS COMPONENT
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // PKL Management State
  const [pklLocations, setPklLocations] = useState([]);
  const [isPklModalOpen, setIsPklModalOpen] = useState(false);
  const [isAddingPkl, setIsAddingPkl] = useState(false);
  const [pklStudents, setPklStudents] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');

  // Fetch Settings
  const { data: settingsData, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => api.get('/admin/settings').then(res => res.data?.data ?? null),
  });

  // Tab Definitions
  const tabs = useMemo(() => [
    { id: 'general', label: 'General', icon: Settings2, description: 'Identity, branding, notifications' },
    { id: 'attendance', label: 'Attendance', icon: Clock, description: 'GPS, validation, QR, smart features' },
    { id: 'pkl', label: 'PKL / Internship', icon: Briefcase, description: 'Locations, students, monitoring' },
    { id: 'security', label: 'Security', icon: Shield, description: 'Auth, password, API, monitoring' },
    { id: 'features', label: 'Features', icon: ToggleRight, description: 'Modules, AI, public website' },
    { id: 'backup', label: 'Backup', icon: Database, description: 'Backup, restore, system info' },
  ], []);

  // Settings State (Retro-compatible structure)
  const [general, setGeneral] = useState({
    app_name: 'RPL Smart Ecosystem', school_name: '', npsn: '', school_slogan: '',
    school_description: '', address: '', province: '', city: '', district: '',
    postal_code: '', website: '', support_email: '', support_phone: '',
    academic_year: '2024/2025', semester: '1', primary_color: '#FF5C00',
    secondary_color: '#2E2BBF', default_theme: 'light', login_background: '',
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
      setTimeout(() => setHasUnsavedChanges(false), 200);
    }
  }, [settingsData]);

  // API Mutation
  const saveSettingsMutation = useMutation({
    mutationFn: (payload) => api.put('/admin/settings', payload),
    onSuccess: (res) => {
      setIsSaving(false);
      setHasUnsavedChanges(false);
      showToast(res.data?.message || '✅ Settings saved!', 'success');
      queryClient.invalidateQueries(['admin-settings']);
    },
    onError: (err) => {
      setIsSaving(false);
      showToast(`❌ ${err.response?.data?.message || 'Failed to save settings'}`, 'error');
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
      showToast('🏢 PKL location added!', 'success');
      setIsPklModalOpen(false);
      const res = await api.get('/admin/pkl-locations');
      setPklLocations(res.data?.data?.data || []);
    } catch (err) {
      showToast('❌ Failed to add PKL location', 'error');
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
      showToast('✅ Student assigned!', 'success');
      const res = await api.get('/admin/pkl/students', { params: { search: studentSearch } });
      setPklStudents(res.data?.data?.data || []);
    } catch (err) {
      showToast('❌ Failed to assign student', 'error');
    }
  };

  const handleReset = (section) => {
    if (section === 'general') setGeneral({ ...general });
    showToast('🔄 Settings reset to default', 'info');
  };

  // Track unsaved changes
  useEffect(() => {
    const handler = (e) => {
      if (hasUnsavedChanges) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    if (settingsData && !isLoadingSettings) {
      setHasUnsavedChanges(true);
    }
  }, [general, attendance, pkl, security, features, backup, settingsData, isLoadingSettings]);

  // ═══════════════════════════════════════════════════════════
  // 🎨 RENDER FUNCTIONS (RETRO STYLE)
  // ═══════════════════════════════════════════════════════════

  const renderGeneralTab = () => (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" className="space-y-8">
      <div className="flex flex-wrap gap-3">
        <RetroStatsBadge icon={School} label="Status" value="Online" color="green" />
        <RetroStatsBadge icon={Database} label="Storage" value="65%" color="yellow" />
        <RetroStatsBadge icon={Cpu} label="Cache" value="Clear" color="blue" />
        <RetroStatsBadge icon={Clock3} label="Uptime" value="99.9%" color="orange" />
      </div>

      <RetroSettingsCard icon={Building2} title="SCHOOL IDENTITY" description="Basic school information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <RetroSettingsInput label="App Name" name="app_name" value={general.app_name} onChange={setGeneral} required icon={Settings2} placeholder="RPL Smart Ecosystem" />
          <RetroSettingsInput label="School Name" name="school_name" value={general.school_name} onChange={setGeneral} required icon={School} placeholder="SMK Negeri 1" />
          <RetroSettingsInput label="NPSN" name="npsn" value={general.npsn} onChange={setGeneral} icon={Building2} helperText="National School ID" />
          <RetroSettingsInput label="Slogan" name="school_slogan" value={general.school_slogan} onChange={setGeneral} icon={Award} placeholder="Excellence in Tech" />
          <RetroSettingsInput label="Academic Year" name="academic_year" value={general.academic_year} onChange={setGeneral} icon={CalendarDays} placeholder="2024/2025" />
          <RetroSettingsSelect label="Semester" name="semester" value={general.semester} onChange={setGeneral} icon={Calendar} options={[{value:'1',label:'Semester 1'},{value:'2',label:'Semester 2'}]} />
          <RetroSettingsInput label="Website" name="website" value={general.website} onChange={setGeneral} icon={Globe} placeholder="https://sekolah.sch.id" />
          <RetroSettingsInput label="Support Email" name="support_email" value={general.support_email} onChange={setGeneral} icon={Mail} placeholder="support@sekolah.sch.id" />
          <RetroSettingsInput label="Phone" name="support_phone" value={general.support_phone} onChange={setGeneral} icon={Bell} placeholder="(021) 1234567" />
          <RetroSettingsInput label="Address" name="address" value={general.address} onChange={setGeneral} icon={MapPin} placeholder="Jl. Pendidikan No. 1" />
          <RetroSettingsInput label="Province" name="province" value={general.province} onChange={setGeneral} />
          <RetroSettingsInput label="City" name="city" value={general.city} onChange={setGeneral} />
          <RetroSettingsInput label="District" name="district" value={general.district} onChange={setGeneral} />
          <RetroSettingsInput label="Postal Code" name="postal_code" value={general.postal_code} onChange={setGeneral} />
        </div>
        <RetroSettingsInput label="Description" name="school_description" value={general.school_description} onChange={setGeneral} icon={Info} placeholder="Brief school description..." />
      </RetroSettingsCard>

      <RetroSettingsCard icon={Palette} title="BRANDING" description="Customize appearance">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-base-black mb-1.5">Primary Color</label>
            <div className="flex items-center gap-3">
              <input type="color" value={general.primary_color} onChange={(e) => setGeneral({...general, primary_color: e.target.value})} className="w-12 h-10 rounded-retro cursor-pointer border-2 border-base-black bg-transparent" />
              <input type="text" value={general.primary_color} onChange={(e) => setGeneral({...general, primary_color: e.target.value})} className="flex-1 px-3 py-2 rounded-retro bg-base-white border-2 border-base-black text-base-black text-xs font-retro-mono" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-base-black mb-1.5">Secondary Color</label>
            <div className="flex items-center gap-3">
              <input type="color" value={general.secondary_color} onChange={(e) => setGeneral({...general, secondary_color: e.target.value})} className="w-12 h-10 rounded-retro cursor-pointer border-2 border-base-black bg-transparent" />
              <input type="text" value={general.secondary_color} onChange={(e) => setGeneral({...general, secondary_color: e.target.value})} className="flex-1 px-3 py-2 rounded-retro bg-base-white border-2 border-base-black text-base-black text-xs font-retro-mono" />
            </div>
          </div>
          <RetroSettingsSelect label="Default Theme" name="default_theme" value={general.default_theme} onChange={setGeneral} icon={Moon} options={[{value:'light',label:'☀️ Light'},{value:'dark',label:'🌙 Dark'},{value:'system',label:'💻 System'}]} />
          <RetroSettingsInput label="Logo URL" name="logo_url" value={general.logo_url} onChange={setGeneral} icon={Image} placeholder="https://..." />
        </div>
      </RetroSettingsCard>

      <RetroSettingsCard icon={Layout} title="DASHBOARD" description="Customize dashboard">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <RetroSettingsSelect label="Default Page" name="default_page" value={general.default_page} onChange={setGeneral} icon={Globe} options={[{value:'dashboard',label:'Dashboard'},{value:'attendance',label:'Attendance'},{value:'projects',label:'Projects'}]} />
          <RetroSettingsToggle label="Realtime Stats" checked={general.show_realtime_stats} onChange={(v) => setGeneral({...general, show_realtime_stats: v})} icon={Activity} />
          <RetroSettingsToggle label="Weather Widget" checked={general.show_weather} onChange={(v) => setGeneral({...general, show_weather: v})} icon={Sun} />
          <RetroSettingsToggle label="Daily Motivation" checked={general.show_daily_motivation} onChange={(v) => setGeneral({...general, show_daily_motivation: v})} icon={Award} />
          <RetroSettingsToggle label="Academic Calendar" checked={general.show_academic_calendar} onChange={(v) => setGeneral({...general, show_academic_calendar: v})} icon={CalendarDays} />
        </div>
      </RetroSettingsCard>

      <RetroSettingsCard icon={Clock3} title="TIME SETTINGS" description="Timezone & formats">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <RetroSettingsSelect label="Timezone" name="timezone" value={general.timezone} onChange={setGeneral} icon={Clock3} options={[{value:'Asia/Jakarta',label:'WIB (UTC+7)'},{value:'Asia/Makassar',label:'WITA (UTC+8)'},{value:'Asia/Jayapura',label:'WIT (UTC+9)'}]} />
          <RetroSettingsSelect label="Date Format" name="date_format" value={general.date_format} onChange={setGeneral} icon={Calendar} options={[{value:'DD/MM/YYYY',label:'DD/MM/YYYY'},{value:'MM/DD/YYYY',label:'MM/DD/YYYY'},{value:'YYYY-MM-DD',label:'YYYY-MM-DD'}]} />
          <RetroSettingsSelect label="Time Format" name="time_format" value={general.time_format} onChange={setGeneral} icon={Clock} options={[{value:'24h',label:'24 Hour'},{value:'12h',label:'12 Hour (AM/PM)'}]} />
          <RetroSettingsInput label="Auto Logout" name="auto_logout_minutes" type="number" value={general.auto_logout_minutes} onChange={setGeneral} icon={Lock} suffix="min" helperText="Logout after inactivity" />
          <RetroSettingsToggle label="Sync Server Time" checked={general.sync_server_time} onChange={(v) => setGeneral({...general, sync_server_time: v})} icon={RefreshCw} />
        </div>
      </RetroSettingsCard>

      <RetroSettingsCard icon={Bell} title="NOTIFICATIONS" description="Manage notifications">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <RetroSettingsToggle label="Email Notifications" checked={general.email_notifications} onChange={(v) => setGeneral({...general, email_notifications: v})} icon={Mail} />
          <RetroSettingsToggle label="Push Notifications" checked={general.push_notifications} onChange={(v) => setGeneral({...general, push_notifications: v})} icon={Bell} />
          <RetroSettingsToggle label="Attendance Alerts" checked={general.attendance_notification} onChange={(v) => setGeneral({...general, attendance_notification: v})} icon={Clock} />
          <RetroSettingsToggle label="Login Alerts" checked={general.login_notification} onChange={(v) => setGeneral({...general, login_notification: v})} icon={Lock} />
          <RetroSettingsToggle label="PKL Notifications" checked={general.pkl_notification} onChange={(v) => setGeneral({...general, pkl_notification: v})} icon={Briefcase} />
          <RetroSettingsToggle label="Violation Alerts" checked={general.violation_notification} onChange={(v) => setGeneral({...general, violation_notification: v})} icon={AlertTriangle} />
        </div>
      </RetroSettingsCard>

      <div className="flex justify-end gap-3 pt-4 border-t-4 border-base-black">
        <button onClick={() => handleReset('general')} className="retro-btn retro-btn-outline">Reset</button>
        <button onClick={() => handleSave('general')} className="retro-btn" disabled={isSaving}><Save className="w-4 h-4 mr-1 inline" /> Save Settings</button>
      </div>
    </motion.div>
  );

  const renderAttendanceTab = () => (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" className="space-y-8">
      <RetroSettingsCard icon={MapPin} title="GPS & LOCATION" description="Configure school location">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <RetroSettingsInput label="Latitude" name="school_latitude" value={attendance.school_latitude} onChange={setAttendance} icon={MapPin} placeholder="-6.200000" />
          <RetroSettingsInput label="Longitude" name="school_longitude" value={attendance.school_longitude} onChange={setAttendance} icon={MapPin} placeholder="106.816666" />
        </div>
        <div className="mt-4">
          <RetroMapPreview lat={attendance.school_latitude} lng={attendance.school_longitude} />
          <button className="retro-btn retro-btn-sm retro-btn-outline w-full mt-3">🗺️ Pick from Map</button>
        </div>
        <div className="mt-4 flex items-center justify-between p-3 rounded-retro bg-base-gray border-2 border-base-black">
          <span className="text-xs font-retro-mono text-base-black/70">Multiple Locations</span>
          <RetroSettingsToggle label="" checked={attendance.multiple_locations} onChange={(v) => setAttendance({...attendance, multiple_locations: v})} />
        </div>
      </RetroSettingsCard>

      <RetroSettingsCard icon={Target} title="VALIDATION" description="Attendance parameters">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <RetroSettingsInput label="Radius" name="radius_meters" type="number" value={attendance.radius_meters} onChange={setAttendance} icon={Crosshair} suffix="m" helperText="Max distance from school" />
          <RetroSettingsInput label="Max Late" name="max_late_minutes" type="number" value={attendance.max_late_minutes} onChange={setAttendance} icon={Clock} suffix="min" />
          <RetroSettingsInput label="Check-in Time" name="check_in_time" type="time" value={attendance.check_in_time} onChange={setAttendance} icon={Clock3} />
          <RetroSettingsInput label="Check-out Time" name="check_out_time" type="time" value={attendance.check_out_time} onChange={setAttendance} icon={Clock3} />
          <RetroSettingsInput label="Break Start" name="break_start" type="time" value={attendance.break_start} onChange={setAttendance} icon={Coffee} />
          <RetroSettingsInput label="Break End" name="break_end" type="time" value={attendance.break_end} onChange={setAttendance} icon={Coffee} />
          <RetroSettingsInput label="Late Tolerance" name="late_tolerance" type="number" value={attendance.late_tolerance} onChange={setAttendance} icon={Timer} suffix="min" />
          <RetroSettingsToggle label="Auto Alpha" checked={attendance.auto_alpha} onChange={(v) => setAttendance({...attendance, auto_alpha: v})} icon={AlertTriangle} />
        </div>
      </RetroSettingsCard>

      <RetroSettingsCard icon={Zap} title="SMART ATTENDANCE" description="Security features">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <RetroSettingsToggle label="Face Verification" checked={attendance.face_verification} onChange={(v) => setAttendance({...attendance, face_verification: v})} icon={Camera} />
          <RetroSettingsToggle label="Selfie Required" checked={attendance.selfie_verification} onChange={(v) => setAttendance({...attendance, selfie_verification: v})} icon={Camera} />
          <RetroSettingsToggle label="Anti Fake GPS" checked={attendance.anti_fake_gps} onChange={(v) => setAttendance({...attendance, anti_fake_gps: v})} icon={MapPin} />
          <RetroSettingsToggle label="Anti Screenshot" checked={attendance.anti_screenshot} onChange={(v) => setAttendance({...attendance, anti_screenshot: v})} icon={EyeSlash} />
          <RetroSettingsToggle label="Device Verification" checked={attendance.device_verification} onChange={(v) => setAttendance({...attendance, device_verification: v})} icon={Smartphone} />
          <RetroSettingsToggle label="Mock Location Detection" checked={attendance.mock_location_detection} onChange={(v) => setAttendance({...attendance, mock_location_detection: v})} icon={Navigation} />
          <RetroSettingsToggle label="WiFi Validation" checked={attendance.wifi_validation} onChange={(v) => setAttendance({...attendance, wifi_validation: v})} icon={Wifi} />
          {attendance.wifi_validation && <RetroSettingsInput label="WiFi SSID" name="wifi_ssid" value={attendance.wifi_ssid} onChange={setAttendance} icon={Wifi} placeholder="School_WiFi" />}
          <RetroSettingsToggle label="Bluetooth Validation" checked={attendance.bluetooth_validation} onChange={(v) => setAttendance({...attendance, bluetooth_validation: v})} icon={Bluetooth} />
        </div>
      </RetroSettingsCard>

      <RetroSettingsCard icon={QrCode} title="QR ATTENDANCE" description="QR code settings">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <RetroSettingsToggle label="Enable QR" checked={attendance.qr_enabled} onChange={(v) => setAttendance({...attendance, qr_enabled: v})} icon={QrCode} />
          <RetroSettingsInput label="QR Expire" name="qr_expired_seconds" type="number" value={attendance.qr_expired_seconds} onChange={setAttendance} icon={Timer} suffix="sec" />
          <RetroSettingsToggle label="Random QR" checked={attendance.qr_random} onChange={(v) => setAttendance({...attendance, qr_random: v})} icon={RefreshCw} />
          <RetroSettingsToggle label="Animated QR" checked={attendance.qr_animated} onChange={(v) => setAttendance({...attendance, qr_animated: v})} icon={Zap} />
        </div>
        <div className="mt-4 p-4 rounded-retro bg-base-gray border-2 border-base-black flex items-center justify-center">
          <div className="text-center">
            <div className="w-32 h-32 mx-auto mb-2 bg-base-white rounded-retro p-2 border-2 border-base-black">
              <div className="w-full h-full bg-base-black rounded flex items-center justify-center"><QrCode className="w-16 h-16 text-base-white" /></div>
            </div>
            <p className="font-retro-mono text-[10px] text-base-black/60">QR Preview</p>
          </div>
        </div>
      </RetroSettingsCard>

      <RetroSettingsCard icon={Activity} title="ADVANCED FEATURES">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <RetroSettingsToggle label="Multiple Shifts" checked={attendance.multiple_shifts} onChange={(v) => setAttendance({...attendance, multiple_shifts: v})} icon={Clock3} />
          <RetroSettingsToggle label="Flexible Schedule" checked={attendance.flexible_schedule} onChange={(v) => setAttendance({...attendance, flexible_schedule: v})} icon={CalendarDays} />
          <RetroSettingsToggle label="Online Permission" checked={attendance.online_permission} onChange={(v) => setAttendance({...attendance, online_permission: v})} icon={FileText} />
          <RetroSettingsToggle label="Teacher Approval" checked={attendance.teacher_approval} onChange={(v) => setAttendance({...attendance, teacher_approval: v})} icon={UserCheck} />
          <RetroSettingsToggle label="Parent Notification" checked={attendance.parent_notification} onChange={(v) => setAttendance({...attendance, parent_notification: v})} icon={Bell} />
          <RetroSettingsToggle label="WhatsApp Integration" checked={attendance.whatsapp_integration} onChange={(v) => setAttendance({...attendance, whatsapp_integration: v})} icon={Radio} />
        </div>
      </RetroSettingsCard>

      <div className="flex justify-end gap-3 pt-4 border-t-4 border-base-black">
        <button onClick={() => handleReset('attendance')} className="retro-btn retro-btn-outline">Reset</button>
        <button onClick={() => handleSave('attendance')} className="retro-btn" disabled={isSaving}><Save className="w-4 h-4 mr-1 inline" /> Save Settings</button>
      </div>
    </motion.div>
  );

  const renderPklTab = () => (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" className="space-y-8">
      <RetroSettingsCard icon={Briefcase} title="PKL / INTERNSHIP" description="Configure PKL for Grade 12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <RetroSettingsToggle label="Enable PKL Attendance" checked={pkl.enable_pkl_attendance} onChange={(v) => setPkl({...pkl, enable_pkl_attendance: v})} icon={Briefcase} />
          <RetroSettingsToggle label="Require Approval" checked={pkl.require_supervisor_approval} onChange={(v) => setPkl({...pkl, require_supervisor_approval: v})} icon={CheckCircle2} />
          <RetroSettingsInput label="Max Distance" name="max_distance_km" type="number" value={pkl.max_distance_km} onChange={setPkl} icon={MapPin} suffix="km" helperText="From school location" />
          <RetroSettingsToggle label="Progress Tracking" checked={pkl.show_progress_tracking} onChange={(v) => setPkl({...pkl, show_progress_tracking: v})} icon={BarChart3} />
          <RetroSettingsToggle label="Weekly Reports" checked={pkl.require_weekly_report} onChange={(v) => setPkl({...pkl, require_weekly_report: v})} icon={FileText} />
          <RetroSettingsToggle label="Auto Reminder" checked={pkl.auto_reminder} onChange={(v) => setPkl({...pkl, auto_reminder: v})} icon={Bell} />
          {pkl.auto_reminder && <RetroSettingsInput label="Reminder Every" name="reminder_day" type="number" value={pkl.reminder_day} onChange={setPkl} icon={CalendarDays} suffix="days" />}
        </div>
      </RetroSettingsCard>

      <RetroSettingsCard 
        icon={Map} 
        title="PKL LOCATIONS" 
        description="Manage internship companies" 
        actions={<button onClick={() => setIsPklModalOpen(true)} className="retro-btn retro-btn-sm"><Plus className="w-4 h-4 mr-1 inline" /> Add</button>}
      >
        {pklLocations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pklLocations.map(loc => (
              <motion.div key={loc.id} whileHover={{ y: -2 }} className="p-4 rounded-retro bg-base-white border-2 border-base-black flex items-start justify-between">
                <div>
                  <h4 className="font-retro-display font-black text-base-black text-sm">{loc.company_name}</h4>
                  <p className="font-retro-mono text-[9px] text-base-black/60 mt-1 line-clamp-1">{loc.address}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[9px] font-retro-mono text-retro-orange">{loc.latitude}, {loc.longitude}</span>
                    <span className="text-[9px] font-retro-mono text-base-black/50">Radius: {loc.radius_meters}m</span>
                  </div>
                </div>
                <button className="p-2 retro-btn retro-btn-sm retro-btn-outline"><ChevronRight className="w-4 h-4" /></button>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Briefcase className="w-12 h-12 text-base-black/30 mx-auto mb-3" />
            <p className="font-retro-mono text-sm text-base-black/50">No PKL locations yet</p>
            <button className="retro-btn retro-btn-sm retro-btn-outline mt-3" onClick={() => setIsPklModalOpen(true)}>Add First Location →</button>
          </div>
        )}
      </RetroSettingsCard>

      <RetroSettingsCard icon={Users} title="PKL STUDENTS" description="Assign Grade 12 RPL students">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-base-black/40" />
            <input 
              type="text" 
              placeholder="Search student name..." 
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              className="flex-1 px-3 py-2 rounded-retro bg-base-white border-2 border-base-black text-base-black text-xs font-retro-mono focus:outline-none focus:border-retro-orange" 
            />
          </div>
          
          <div className="space-y-3">
            {pklStudents.length > 0 ? pklStudents.map(student => (
              <motion.div key={student.id} whileHover={{ x: 4 }} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-retro bg-base-white border-2 border-base-black gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-retro bg-retro-orange/20 border-2 border-retro-orange flex items-center justify-center text-retro-orange font-retro-display font-black">
                    {student.name.charAt(0)}
                  </div>
                  <div>
                    <h5 className="font-retro-display font-black text-base-black text-sm">{student.name}</h5>
                    <p className="font-retro-mono text-[9px] text-base-black/50">NIS: {student.profile?.nis || '-'} • RPL</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <select 
                    value={student.pkl_location_id || ''} 
                    onChange={(e) => handleAssignStudent(student.id, e.target.value)}
                    className="flex-1 sm:w-48 px-3 py-1.5 rounded-retro bg-base-white border-2 border-base-black text-xs text-base-black font-retro-mono focus:outline-none focus:border-retro-orange"
                  >
                    <option value="">Not Assigned</option>
                    {pklLocations.map(loc => (
                      <option key={loc.id} value={loc.id}>{loc.company_name}</option>
                    ))}
                  </select>
                </div>
              </motion.div>
            )) : (
              <div className="text-center py-4 font-retro-mono text-base-black/50 text-sm italic">
                No RPL Grade 12 students found
              </div>
            )}
          </div>
        </div>
      </RetroSettingsCard>

      <div className="flex justify-end gap-3 pt-4 border-t-4 border-base-black">
        <button onClick={() => handleReset('pkl')} className="retro-btn retro-btn-outline">Reset</button>
        <button onClick={() => handleSave('pkl')} className="retro-btn" disabled={isSaving}><Save className="w-4 h-4 mr-1 inline" /> Save Settings</button>
      </div>
    </motion.div>
  );

  const renderSecurityTab = () => (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" className="space-y-8">
      <motion.div variants={cardVariants} className="p-6 rounded-retro bg-retro-orange/10 border-4 border-retro-orange">
        <div className="flex items-center justify-between">
          <div><p className="font-retro-mono text-xs text-base-black/70">Security Score</p><p className="retro-heading retro-heading-lg text-base-black">85<span className="font-retro-mono text-base-black/50">/100</span></p></div>
          <div className="flex items-center gap-2"><ShieldCheck className="w-8 h-8 text-success" /><span className="font-retro-display font-black text-success">GOOD</span></div>
        </div>
        <div className="mt-3 w-full bg-base-gray border-2 border-base-black rounded-sm h-3"><div className="bg-gradient-to-r from-retro-orange to-retro-blue h-3 rounded-sm" style={{width: '85%'}} /></div>
      </motion.div>

      <RetroSettingsCard icon={Lock} title="AUTHENTICATION">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <RetroSettingsToggle label="Two-Factor Auth" checked={security.two_factor_auth} onChange={(v) => setSecurity({...security, two_factor_auth: v})} icon={Shield} />
          <RetroSettingsToggle label="OTP via Email" checked={security.otp_email} onChange={(v) => setSecurity({...security, otp_email: v})} icon={Mail} />
          <RetroSettingsToggle label="OTP via WhatsApp" checked={security.otp_whatsapp} onChange={(v) => setSecurity({...security, otp_whatsapp: v})} icon={Radio} />
          <RetroSettingsToggle label="Biometric Login" checked={security.biometric_login} onChange={(v) => setSecurity({...security, biometric_login: v})} icon={Fingerprint} />
          <RetroSettingsToggle label="Trusted Devices" checked={security.trusted_devices} onChange={(v) => setSecurity({...security, trusted_devices: v})} icon={MonitorSmartphone} />
          <RetroSettingsInput label="Max Sessions" name="session_limit" type="number" value={security.session_limit} onChange={setSecurity} icon={LockOpen} />
        </div>
      </RetroSettingsCard>

      <RetroSettingsCard icon={ShieldAlert} title="LOGIN SECURITY">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <RetroSettingsToggle label="Login History" checked={security.login_history_enabled} onChange={(v) => setSecurity({...security, login_history_enabled: v})} icon={History} />
          <RetroSettingsToggle label="Device History" checked={security.device_history_enabled} onChange={(v) => setSecurity({...security, device_history_enabled: v})} icon={Smartphone} />
          <RetroSettingsToggle label="IP Tracking" checked={security.ip_tracking} onChange={(v) => setSecurity({...security, ip_tracking: v})} icon={Globe} />
          <RetroSettingsToggle label="Suspicious Detection" checked={security.suspicious_login_detection} onChange={(v) => setSecurity({...security, suspicious_login_detection: v})} icon={AlertTriangle} />
          <RetroSettingsToggle label="Failed Login Lockout" checked={security.failed_login_lockout} onChange={(v) => setSecurity({...security, failed_login_lockout: v})} icon={Lock} />
          <RetroSettingsInput label="Max Failed Attempts" name="failed_attempts_max" type="number" value={security.failed_attempts_max} onChange={setSecurity} icon={XCircle} />
          <RetroSettingsInput label="Lockout Duration" name="lockout_duration_minutes" type="number" value={security.lockout_duration_minutes} onChange={setSecurity} icon={Clock3} suffix="min" />
        </div>
      </RetroSettingsCard>

      <RetroSettingsCard icon={Key} title="PASSWORD POLICY">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <RetroSettingsInput label="Min Length" name="min_password_length" type="number" value={security.min_password_length} onChange={setSecurity} icon={Key} />
          <RetroSettingsInput label="Expire Days" name="password_expire_days" type="number" value={security.password_expire_days} onChange={setSecurity} icon={Clock3} />
          <RetroSettingsInput label="Password History" name="password_history_count" type="number" value={security.password_history_count} onChange={setSecurity} icon={History} />
          <RetroSettingsToggle label="Require Uppercase" checked={security.require_uppercase} onChange={(v) => setSecurity({...security, require_uppercase: v})} icon={Key} />
          <RetroSettingsToggle label="Require Number" checked={security.require_number} onChange={(v) => setSecurity({...security, require_number: v})} icon={Key} />
          <RetroSettingsToggle label="Require Special Char" checked={security.require_special_char} onChange={(v) => setSecurity({...security, require_special_char: v})} icon={Key} />
          <RetroSettingsToggle label="Strength Meter" checked={security.password_strength_meter} onChange={(v) => setSecurity({...security, password_strength_meter: v})} icon={Activity} />
        </div>
      </RetroSettingsCard>

      <RetroSettingsCard icon={Radio} title="API & ACCESS">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <RetroSettingsToggle label="API Token Enabled" checked={security.api_token_enabled} onChange={(v) => setSecurity({...security, api_token_enabled: v})} icon={KeyRound} />
          <RetroSettingsInput label="Rate Limit" name="rate_limit_per_minute" type="number" value={security.rate_limit_per_minute} onChange={setSecurity} icon={Zap} suffix="/min" />
          <RetroSettingsToggle label="Audit Log" checked={security.audit_log_enabled} onChange={(v) => setSecurity({...security, audit_log_enabled: v})} icon={FileText} />
        </div>
      </RetroSettingsCard>

      <div className="flex justify-end gap-3 pt-4 border-t-4 border-base-black">
        <button onClick={() => handleReset('security')} className="retro-btn retro-btn-outline">Reset</button>
        <button onClick={() => handleSave('security')} className="retro-btn" disabled={isSaving}><Save className="w-4 h-4 mr-1 inline" /> Save Settings</button>
      </div>
    </motion.div>
  );

  const renderFeaturesTab = () => (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" />
          <input type="text" placeholder="Search features..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-retro bg-base-white border-2 border-base-black text-base-black placeholder-base-black/40 focus:outline-none focus:border-retro-orange font-retro-mono text-sm" />
        </div>
        <button className="retro-btn retro-btn-sm retro-btn-outline">All</button>
        <button className="retro-btn retro-btn-sm retro-btn-outline">Active</button>
        <button className="retro-btn retro-btn-sm retro-btn-outline">Inactive</button>
      </div>

      <RetroSettingsCard icon={Globe} title="PUBLIC WEBSITE">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <RetroSettingsToggle label="Student Gallery" checked={features.public_gallery} onChange={(v) => setFeatures({...features, public_gallery: v})} icon={Image} />
          <RetroSettingsToggle label="Career Simulator" checked={features.career_simulator} onChange={(v) => setFeatures({...features, career_simulator: v})} icon={Briefcase} />
          <RetroSettingsToggle label="Achievement Showcase" checked={features.achievement_showcase} onChange={(v) => setFeatures({...features, achievement_showcase: v})} icon={Award} />
          <RetroSettingsToggle label="Landing Page Editor" checked={features.landing_page_editor} onChange={(v) => setFeatures({...features, landing_page_editor: v})} icon={Layout} />
          <RetroSettingsToggle label="News Management" checked={features.news_management} onChange={(v) => setFeatures({...features, news_management: v})} icon={FileText} />
        </div>
      </RetroSettingsCard>

      <RetroSettingsCard icon={Brain} title="AI FEATURES">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <RetroSettingsToggle label="AI Student Recommendation" checked={features.ai_student_recommendation} onChange={(v) => setFeatures({...features, ai_student_recommendation: v})} icon={Brain} />
          <RetroSettingsToggle label="AI Analytics" checked={features.ai_analytics} onChange={(v) => setFeatures({...features, ai_analytics: v})} icon={BarChart3} />
          <RetroSettingsToggle label="AI Chatbot" checked={features.ai_chatbot} onChange={(v) => setFeatures({...features, ai_chatbot: v})} icon={MessageCircle} />
          <RetroSettingsToggle label="AI Monitoring" checked={features.ai_monitoring} onChange={(v) => setFeatures({...features, ai_monitoring: v})} icon={Eye} />
          <RetroSettingsToggle label="AI Attendance Prediction" checked={features.ai_attendance_prediction} onChange={(v) => setFeatures({...features, ai_attendance_prediction: v})} icon={Clock} />
        </div>
      </RetroSettingsCard>

      <RetroSettingsCard icon={Cpu} title="SYSTEM MODULES">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <RetroSettingsToggle label="E-Learning" checked={features.e_learning} onChange={(v) => setFeatures({...features, e_learning: v})} icon={BookOpen} />
          <RetroSettingsToggle label="CBT Exam" checked={features.cbt_exam} onChange={(v) => setFeatures({...features, cbt_exam: v})} icon={FileText} />
          <RetroSettingsToggle label="E-Raport" checked={features.e_raport} onChange={(v) => setFeatures({...features, e_raport: v})} icon={GraduationCap} />
          <RetroSettingsToggle label="Digital Library" checked={features.digital_library} onChange={(v) => setFeatures({...features, digital_library: v})} icon={BookOpen} />
          <RetroSettingsToggle label="Smart Classroom" checked={features.smart_classroom} onChange={(v) => setFeatures({...features, smart_classroom: v})} icon={Monitor} />
          <RetroSettingsToggle label="School Inventory" checked={features.school_inventory} onChange={(v) => setFeatures({...features, school_inventory: v})} icon={Archive} />
        </div>
      </RetroSettingsCard>

      <RetroSettingsCard icon={Settings2} title="ADVANCED">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <RetroSettingsToggle label="Dynamic Config" checked={features.dynamic_config} onChange={(v) => setFeatures({...features, dynamic_config: v})} icon={Settings2} />
          <RetroSettingsToggle label="Realtime Update" checked={features.realtime_update} onChange={(v) => setFeatures({...features, realtime_update: v})} icon={Activity} />
          <RetroSettingsToggle label="Auto Cache Refresh" checked={features.cache_refresh_auto} onChange={(v) => setFeatures({...features, cache_refresh_auto: v})} icon={RefreshCw} />
        </div>
      </RetroSettingsCard>

      <div className="flex justify-end gap-3 pt-4 border-t-4 border-base-black">
        <button onClick={() => handleReset('features')} className="retro-btn retro-btn-outline">Reset</button>
        <button onClick={() => handleSave('features')} className="retro-btn" disabled={isSaving}><Save className="w-4 h-4 mr-1 inline" /> Save Settings</button>
      </div>
    </motion.div>
  );

  const renderBackupTab = () => (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" className="space-y-8">
      <RetroSettingsCard icon={Database} title="BACKUP DATABASE">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <RetroSettingsToggle label="Auto Backup" checked={backup.auto_backup} onChange={(v) => setBackup({...backup, auto_backup: v})} icon={Database} />
          <RetroSettingsSelect label="Schedule" name="backup_schedule" value={backup.backup_schedule} onChange={setBackup} icon={CalendarDays} options={[{value:'daily',label:'Daily'},{value:'weekly',label:'Weekly'},{value:'monthly',label:'Monthly'}]} />
          <RetroSettingsInput label="Time" name="backup_time" type="time" value={backup.backup_time} onChange={setBackup} icon={Clock3} />
          <RetroSettingsInput label="Retention" name="backup_retention_days" type="number" value={backup.backup_retention_days} onChange={setBackup} icon={Clock3} suffix="days" />
          <RetroSettingsToggle label="Cloud Backup" checked={backup.cloud_backup} onChange={(v) => setBackup({...backup, cloud_backup: v})} icon={Cloud} />
          <RetroSettingsToggle label="Compress" checked={backup.compress_backup} onChange={(v) => setBackup({...backup, compress_backup: v})} icon={Archive} />
          <RetroSettingsToggle label="Encrypt" checked={backup.encrypt_backup} onChange={(v) => setBackup({...backup, encrypt_backup: v})} icon={Lock} />
        </div>
      </RetroSettingsCard>

      <RetroSettingsCard icon={HardDrive} title="BACKUP ACTIONS">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 rounded-retro bg-base-white border-2 border-base-black hover:border-retro-orange transition-all group text-center">
            <Download className="w-6 h-6 text-retro-orange mx-auto mb-2" />
            <p className="font-retro-display font-black text-base-black text-sm group-hover:text-retro-orange">Download</p>
            <p className="font-retro-mono text-[9px] text-base-black/50 mt-1">Latest backup</p>
          </button>
          <button className="p-4 rounded-retro bg-base-white border-2 border-base-black hover:border-retro-orange transition-all group text-center">
            <Upload className="w-6 h-6 text-retro-orange mx-auto mb-2" />
            <p className="font-retro-display font-black text-base-black text-sm group-hover:text-retro-orange">Upload</p>
            <p className="font-retro-mono text-[9px] text-base-black/50 mt-1">Restore from file</p>
          </button>
          <button className="p-4 rounded-retro bg-base-white border-2 border-base-black hover:border-retro-orange transition-all group text-center">
            <Trash2 className="w-6 h-6 text-retro-orange mx-auto mb-2" />
            <p className="font-retro-display font-black text-base-black text-sm group-hover:text-retro-orange">Delete Old</p>
            <p className="font-retro-mono text-[9px] text-base-black/50 mt-1">Clean storage</p>
          </button>
        </div>
      </RetroSettingsCard>

      <RetroSettingsCard icon={Cpu} title="SYSTEM INFORMATION">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex justify-between text-sm"><span className="font-retro-mono text-base-black/50">Laravel</span><span className="font-retro-mono text-base-black">11.x</span></div>
            <div className="flex justify-between text-sm"><span className="font-retro-mono text-base-black/50">PHP</span><span className="font-retro-mono text-base-black">8.2.x</span></div>
            <div className="flex justify-between text-sm"><span className="font-retro-mono text-base-black/50">Database</span><span className="font-retro-mono text-base-black">MySQL 8.0</span></div>
            <div className="flex justify-between text-sm"><span className="font-retro-mono text-base-black/50">Storage</span><span className="font-retro-mono text-base-black">2.4 GB / 10 GB</span></div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm"><span className="font-retro-mono text-base-black/50">Cache</span><span className="font-retro-mono text-base-black">Redis</span></div>
            <div className="flex justify-between text-sm"><span className="font-retro-mono text-base-black/50">Queue</span><span className="font-retro-mono text-base-black">Redis</span></div>
            <div className="flex justify-between text-sm"><span className="font-retro-mono text-base-black/50">Environment</span><span className="font-retro-mono text-base-black">Production</span></div>
            <div className="flex justify-between text-sm"><span className="font-retro-mono text-base-black/50">Debug</span><span className="font-retro-mono text-danger">False</span></div>
          </div>
        </div>
      </RetroSettingsCard>

      <RetroSettingsCard icon={Settings2} title="MAINTENANCE">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 rounded-retro bg-base-white border-2 border-base-black hover:border-retro-orange transition-all group text-center">
            <RefreshCw className="w-6 h-6 text-retro-orange mx-auto mb-2" />
            <p className="font-retro-display font-black text-base-black text-sm group-hover:text-retro-orange">Clear Cache</p>
          </button>
          <button className="p-4 rounded-retro bg-base-white border-2 border-base-black hover:border-retro-orange transition-all group text-center">
            <Activity className="w-6 h-6 text-retro-orange mx-auto mb-2" />
            <p className="font-retro-display font-black text-base-black text-sm group-hover:text-retro-orange">Optimize</p>
          </button>
          <button className="p-4 rounded-retro bg-base-white border-2 border-base-black hover:border-retro-orange transition-all group text-center">
            <ShieldCheck className="w-6 h-6 text-retro-orange mx-auto mb-2" />
            <p className="font-retro-display font-black text-base-black text-sm group-hover:text-retro-orange">Health Check</p>
          </button>
        </div>
      </RetroSettingsCard>

      <div className="flex justify-end gap-3 pt-4 border-t-4 border-base-black">
        <button onClick={() => handleReset('backup')} className="retro-btn retro-btn-outline">Reset</button>
        <button onClick={() => handleSave('backup')} className="retro-btn" disabled={isSaving}><Save className="w-4 h-4 mr-1 inline" /> Save Settings</button>
      </div>
    </motion.div>
  );

  // ═══════════════════════════════════════════════════════════
  // 🎨 MAIN RENDER
  // ═══════════════════════════════════════════════════════════
  return (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" className="relative min-h-screen bg-base-cream retro-grid-bg">
      
      <SettingsDecorations />

      {/* Toast */}
      <AnimatePresence>{toast && <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed top-24 right-6 z-50"><Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} /></motion.div>}</AnimatePresence>

      {/* Save Indicator */}
      <AnimatePresence>
        {showSaveIndicator && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2 rounded-retro bg-retro-orange/20 border-2 border-retro-orange backdrop-blur-sm">
            <RefreshCw className="w-4 h-4 text-retro-orange animate-spin" />
            <span className="font-retro-mono text-xs text-retro-orange">Saving...</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Unsaved Warning */}
      {hasUnsavedChanges && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="sticky top-0 z-40 px-4 py-2 bg-warning/20 border-b-2 border-warning/30 backdrop-blur-sm">
          <p className="font-retro-mono text-xs text-warning text-center flex items-center justify-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Unsaved changes detected
          </p>
        </motion.div>
      )}

      {/* Header */}
      <div className="relative z-10 pt-8 pb-6 px-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="retro-heading retro-heading-xl text-retro-orange flex items-center gap-3">
              <Settings2 className="w-8 h-8 text-retro-orange" /> SETTINGS
            </h1>
            <p className="font-retro-mono text-base-black/70 mt-1">Configure RPL Smart Ecosystem</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => handleReset('all')} className="retro-btn retro-btn-sm retro-btn-outline"><RefreshCw className="w-4 h-4 mr-1 inline" /> Reset</button>
            <button onClick={() => handleSave()} className="retro-btn" disabled={isSaving}><Save className="w-4 h-4 mr-1 inline" /> Save All</button>
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
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-3 rounded-retro text-xs font-black uppercase tracking-wide transition-all whitespace-nowrap border-2 border-base-black ${isActive ? 'bg-retro-orange text-base-white shadow-[4px_4px_0px_0px_#111111]' : 'bg-base-white text-base-black hover:bg-retro-yellow'}`}>
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
      <RetroPklLocationModal 
        isOpen={isPklModalOpen} 
        onClose={() => setIsPklModalOpen(false)} 
        onSave={handleAddPklLocation} 
        isSaving={isAddingPkl}
      />

      {/* FAB */}
      <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
        onClick={() => handleSave()}
        className="fixed bottom-6 right-6 z-50 retro-btn retro-btn-lg retro-btn-sticker hidden md:flex items-center gap-2">
        <Save className="w-5 h-5" /><span className="hidden lg:inline">Save All</span>
      </motion.button>

      {/* Footer Stickers */}
      <div className="fixed bottom-4 left-4 z-0 hidden lg:block pointer-events-none">
        <motion.div animate={{ rotate: [0, -10, 10, -5, 5, 0] }} transition={{ duration: 3, repeat: Infinity }} className="retro-sticker bg-retro-pink text-base-white text-[10px] px-3 py-1">POWERED BY RPL</motion.div>
      </div>
      <div className="fixed bottom-4 right-4 z-0 hidden lg:block pointer-events-none">
        <motion.div animate={{ rotate: [0, 10, -10, 5, -5, 0] }} transition={{ duration: 3, repeat: Infinity, delay: 1 }} className="retro-sticker bg-retro-lime text-base-black text-[10px] px-3 py-1">v2.0 RETRO ✨</motion.div>
      </div>
    </motion.div>
  );
}