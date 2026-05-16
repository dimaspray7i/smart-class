import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { adminAPI } from '../../api';

// 🏛️ CENTRALIZED UI COMPONENTS
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Toast from '../../components/ui/Toast';
import { PageHeader, RetroSection, StatGrid, RetroCard, RetroStatWidget } from '../../components/ui/RetroLayouts';
import { twMerge } from 'tailwind-merge';

// 🎨 ANIMATION VARIANTS
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

const floatVariants = {
  animate: {
    y: [0, -8, 0], rotate: [0, 2, -2, 0],
    transition: { duration: 4, repeat: Infinity, ease: "easeInOut" }
  }
};

// 🎭 CUSTOM SETTINGS HELPERS (Brutalist style preserved)
function SettingsToggle({ label, checked, onChange, description, icon: Icon, disabled = false }) {
  return (
    <motion.div 
      whileHover={{ scale: disabled ? 1 : 1.01 }}
      className={twMerge(
        "flex items-center justify-between p-4 rounded-retro border-2 transition-all duration-300",
        checked ? 'bg-retro-orange/10 border-retro-orange shadow-hard-sm' : 'bg-base-gray/50 border-base-black/20',
        disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-retro-yellow/10 cursor-pointer'
      )}
      onClick={() => !disabled && onChange(!checked)}
    >
      <div className="flex items-start gap-3">
        {Icon && <Icon className={twMerge("w-5 h-5 mt-0.5", checked ? 'text-retro-orange' : 'text-base-black/40')} />}
        <div>
          <p className={twMerge("font-retro-display font-black text-sm uppercase tracking-tight", checked ? 'text-base-black' : 'text-base-black/70')}>{label}</p>
          {description && <p className="font-retro-mono text-[9px] text-base-black/50 mt-0.5">{description}</p>}
        </div>
      </div>
      <div className={twMerge(
        "relative inline-flex h-6 w-12 items-center rounded-retro border-2 border-base-black transition-colors",
        checked ? 'bg-retro-orange' : 'bg-base-gray'
      )}>
        <motion.span
          className="inline-block h-4 w-4 transform rounded-sm bg-base-white border-2 border-base-black shadow-[2px_2px_0px_0px_#111111]"
          animate={{ x: checked ? 24 : 4 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </div>
    </motion.div>
  );
}

function SettingsSection({ title, icon: Icon, children, description }) {
  return (
    <RetroCard className="p-6 relative group border-4 border-base-black">
      <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
        {Icon && <Icon className="w-12 h-12 rotate-12" />}
      </div>
      <div className="mb-6">
        <h3 className="retro-heading retro-heading-sm text-base-black flex items-center gap-2">
          {Icon && <Icon className="w-5 h-5 text-retro-orange" />}
          {title}
        </h3>
        {description && <p className="font-retro-mono text-[10px] text-base-black/60 mt-1 uppercase tracking-wider">{description}</p>}
      </div>
      {children}
    </RetroCard>
  );
}

export default function SettingsPage() {
  const queryClient = useQueryClient();
  
  // State Management
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [showSaveIndicator, setShowSaveIndicator] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Fetch Settings
  const { data: settingsData, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => adminAPI.getSettings().then(res => res.data ?? null),
  });

  // Tab Definitions
  const tabs = [
    { id: 'general', label: 'General', icon: Settings2 },
    { id: 'attendance', label: 'Attendance', icon: Clock },
    { id: 'pkl', label: 'PKL', icon: Briefcase },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'features', label: 'Features', icon: ToggleRight },
    { id: 'backup', label: 'Backup', icon: Database },
  ];

  // Settings State
  const [general, setGeneral] = useState({});
  const [attendance, setAttendance] = useState({});
  const [pkl, setPkl] = useState({});
  const [security, setSecurity] = useState({});
  const [features, setFeatures] = useState({});
  const [backup, setBackup] = useState({});

  useEffect(() => {
    if (settingsData) {
      setGeneral(settingsData.general || {});
      setAttendance(settingsData.attendance || {});
      setPkl(settingsData.pkl || {});
      setSecurity(settingsData.security || {});
      setFeatures(settingsData.features || {});
      setBackup(settingsData.backup || {});
      setHasUnsavedChanges(false);
    }
  }, [settingsData]);

  const saveMutation = useMutation({
    mutationFn: (payload) => adminAPI.updateSettings(payload),
    onSuccess: () => {
      setIsSaving(false);
      setShowSaveIndicator(false);
      setHasUnsavedChanges(false);
      setToast({ message: 'Settings saved successfully! 🚀', type: 'success' });
      queryClient.invalidateQueries(['admin-settings']);
    },
    onError: () => {
      setIsSaving(false);
      setShowSaveIndicator(false);
      setToast({ message: 'Failed to save settings. ❌', type: 'error' });
    }
  });

  const handleSave = () => {
    setIsSaving(true);
    setShowSaveIndicator(true);
    saveMutation.mutate({ general, attendance, pkl, security, features, backup });
  };

  const updateState = (setter, key, value) => {
    setter(prev => ({ ...prev, [key]: value }));
    setHasUnsavedChanges(true);
  };

  // 🎨 RENDER TABS
  const renderGeneral = () => (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" className="space-y-6">
      <SettingsSection title="App Identity" icon={School} description="Branding and basic school info">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="App Name" value={general.app_name} onChange={e => updateState(setGeneral, 'app_name', e.target.value)} icon={Settings2} />
          <Input label="School Name" value={general.school_name} onChange={e => updateState(setGeneral, 'school_name', e.target.value)} icon={School} />
          <Input label="NPSN" value={general.npsn} onChange={e => updateState(setGeneral, 'npsn', e.target.value)} icon={Building2} />
          <Input label="Slogan" value={general.school_slogan} onChange={e => updateState(setGeneral, 'school_slogan', e.target.value)} icon={Award} />
          <Input label="Academic Year" value={general.academic_year} onChange={e => updateState(setGeneral, 'academic_year', e.target.value)} icon={Calendar} />
          <Select label="Semester" value={general.semester} onChange={e => updateState(setGeneral, 'semester', e.target.value)} options={[{value:'1',label:'Semester 1'},{value:'2',label:'Semester 2'}]} />
        </div>
      </SettingsSection>
      <SettingsSection title="Contact & Address" icon={MapPin}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Email" value={general.support_email} onChange={e => updateState(setGeneral, 'support_email', e.target.value)} icon={Mail} />
          <Input label="Phone" value={general.support_phone} onChange={e => updateState(setGeneral, 'support_phone', e.target.value)} icon={Smartphone} />
          <div className="md:col-span-2">
            <Input label="Address" value={general.address} onChange={e => updateState(setGeneral, 'address', e.target.value)} icon={MapPin} />
          </div>
        </div>
      </SettingsSection>
    </motion.div>
  );

  const renderAttendance = () => (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" className="space-y-6">
      <SettingsSection title="Timing Rules" icon={Clock} description="Global attendance hours">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="Check-in Start" type="time" value={attendance.check_in_time} onChange={e => updateState(setAttendance, 'check_in_time', e.target.value)} />
          <Input label="Check-out Start" type="time" value={attendance.check_out_time} onChange={e => updateState(setAttendance, 'check_out_time', e.target.value)} />
          <Input label="Late Tolerance" type="number" suffix="min" value={attendance.late_tolerance} onChange={e => updateState(setAttendance, 'late_tolerance', e.target.value)} />
        </div>
      </SettingsSection>
      <SettingsSection title="Validation Features" icon={ShieldCheck}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <SettingsToggle label="Face Verification" checked={attendance.face_verification} onChange={v => updateState(setAttendance, 'face_verification', v)} icon={Camera} />
          <SettingsToggle label="Selfie Verification" checked={attendance.selfie_verification} onChange={v => updateState(setAttendance, 'selfie_verification', v)} icon={Smartphone} />
          <SettingsToggle label="Anti Fake GPS" checked={attendance.anti_fake_gps} onChange={v => updateState(setAttendance, 'anti_fake_gps', v)} icon={Target} />
          <SettingsToggle label="QR Code Support" checked={attendance.qr_enabled} onChange={v => updateState(setAttendance, 'qr_enabled', v)} icon={QrCode} />
        </div>
      </SettingsSection>
    </motion.div>
  );

  const renderPkl = () => (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" className="space-y-6">
      <div className="p-4 rounded-retro bg-retro-purple/5 border-2 border-retro-purple border-dashed flex items-center justify-between">
        <div className="flex items-center gap-3">
           <Briefcase className="w-8 h-8 text-retro-purple" />
           <div>
              <p className="font-retro-display font-black text-base-black uppercase">PKL Management Hub</p>
              <p className="font-retro-mono text-[10px] text-base-black/50 uppercase">Configure global internship behaviors</p>
           </div>
        </div>
        <Button variant="outline" onClick={() => window.location.href='/dashboard/admin/pkl'}>Go to Management</Button>
      </div>
      <SettingsSection title="Global PKL Rules" icon={Globe}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <SettingsToggle label="Enable PKL Attendance" checked={pkl.enable_pkl_attendance} onChange={v => updateState(setPkl, 'enable_pkl_attendance', v)} icon={Clock} />
          <SettingsToggle label="Supervisor Approval" checked={pkl.require_supervisor_approval} onChange={v => updateState(setPkl, 'require_supervisor_approval', v)} icon={ShieldCheck} />
          <SettingsToggle label="Weekly Reports" checked={pkl.require_weekly_report} onChange={v => updateState(setPkl, 'require_weekly_report', v)} icon={FileText} />
          <SettingsToggle label="Auto Reminders" checked={pkl.auto_reminder} onChange={v => updateState(setPkl, 'auto_reminder', v)} icon={Bell} />
        </div>
      </SettingsSection>
    </motion.div>
  );

  const renderSecurity = () => (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" className="space-y-6">
      <SettingsSection title="Authentication" icon={Lock}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <SettingsToggle label="Two-Factor Auth" checked={security.two_factor_auth} onChange={v => updateState(setSecurity, 'two_factor_auth', v)} icon={Shield} />
          <SettingsToggle label="Biometric Login" checked={security.biometric_login} onChange={v => updateState(setSecurity, 'biometric_login', v)} icon={Fingerprint} />
          <Input label="Min Password Length" type="number" value={security.min_password_length} onChange={e => updateState(setSecurity, 'min_password_length', e.target.value)} icon={Key} />
          <Input label="Session Limit" type="number" value={security.session_limit} onChange={e => updateState(setSecurity, 'session_limit', e.target.value)} icon={Monitor} />
        </div>
      </SettingsSection>
    </motion.div>
  );

  const renderFeatures = () => (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" className="space-y-6">
      <SettingsSection title="Active Modules" icon={ToggleRight}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <SettingsToggle label="Career Simulator" checked={features.career_simulator} onChange={v => updateState(setFeatures, 'career_simulator', v)} icon={Briefcase} />
          <SettingsToggle label="Student Gallery" checked={features.public_gallery} onChange={v => updateState(setFeatures, 'public_gallery', v)} icon={Image} />
          <SettingsToggle label="AI Recommendation" checked={features.ai_student_recommendation} onChange={v => updateState(setFeatures, 'ai_student_recommendation', v)} icon={Brain} />
          <SettingsToggle label="E-Raport" checked={features.e_raport} onChange={v => updateState(setFeatures, 'e_raport', v)} icon={GraduationCap} />
        </div>
      </SettingsSection>
    </motion.div>
  );

  const renderBackup = () => (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" className="space-y-6">
      <SettingsSection title="Data Preservation" icon={Database}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <SettingsToggle label="Auto Backup" checked={backup.auto_backup} onChange={v => updateState(setBackup, 'auto_backup', v)} icon={Cloud} />
          <SettingsToggle label="Encrypt Backups" checked={backup.encrypt_backup} onChange={v => updateState(setBackup, 'encrypt_backup', v)} icon={Lock} />
          <Select label="Frequency" value={backup.backup_schedule} onChange={e => updateState(setBackup, 'backup_schedule', e.target.value)} options={[{value:'daily',label:'Daily'},{value:'weekly',label:'Weekly'}]} />
          <Input label="Backup Time" type="time" value={backup.backup_time} onChange={e => updateState(setBackup, 'backup_time', e.target.value)} />
        </div>
      </SettingsSection>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Button variant="outline" className="h-24 flex-col gap-2"><Download className="w-6 h-6" /> Download Latest</Button>
        <Button variant="outline" className="h-24 flex-col gap-2"><RefreshCw className="w-6 h-6" /> Clear Cache</Button>
        <Button variant="danger" className="h-24 flex-col gap-2"><Trash2 className="w-6 h-6" /> Clean Storage</Button>
      </div>
    </motion.div>
  );

  return (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" className="space-y-8 relative">
      {/* Decorative Stickers */}
      <div className="absolute top-20 right-10 opacity-10 pointer-events-none">
        <Settings2 className="w-32 h-32 rotate-12" />
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <div className="fixed top-24 right-6 z-50">
            <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
          </div>
        )}
      </AnimatePresence>

      {/* Header */}
      <PageHeader 
        title="System Settings"
        icon={Settings2}
        description="Konfigurasi parameter sistem, keamanan, dan fitur aktif."
        breadcrumbs={[{ label: 'Settings', path: '/admin/settings' }]}
        actions={
          <div className="flex gap-2">
            {hasUnsavedChanges && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-2 px-3 py-1 bg-warning/10 border-2 border-warning rounded-retro-sm text-[10px] font-black text-warning">
                <AlertTriangle className="w-3 h-3" /> UNSAVED CHANGES
              </motion.div>
            )}
            <Button variant="primary" onClick={handleSave} loading={isSaving} disabled={!hasUnsavedChanges}>
              <Save className="w-4 h-4 mr-2" />
              Save All
            </Button>
          </div>
        }
      />

      {/* Stats Bar */}
      <div className="flex flex-wrap gap-4 mb-8">
        <div className="flex items-center gap-3 px-4 py-2 bg-base-white border-2 border-base-black rounded-retro-sm shadow-hard-sm">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-wider">System Online</span>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 bg-base-white border-2 border-base-black rounded-retro-sm shadow-hard-sm">
          <Activity className="w-4 h-4 text-retro-blue" />
          <span className="text-[10px] font-black uppercase tracking-wider">Perf: Optimal</span>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 bg-base-white border-2 border-base-black rounded-retro-sm shadow-hard-sm">
          <Database className="w-4 h-4 text-retro-purple" />
          <span className="text-[10px] font-black uppercase tracking-wider">Storage: 45%</span>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Navigation Sidebar */}
        <aside className="lg:w-64 space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-base-black/40 px-4 mb-4">Configuration Tabs</p>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={twMerge(
                "w-full flex items-center gap-3 px-4 py-3 rounded-retro-sm border-2 transition-all group",
                activeTab === tab.id 
                  ? "bg-base-black text-base-white border-base-black shadow-hard-sm -translate-y-1" 
                  : "bg-base-white text-base-black border-base-black/10 hover:border-base-black hover:bg-base-gray/30"
              )}
            >
              <tab.icon className={twMerge("w-4 h-4 transition-colors", activeTab === tab.id ? "text-retro-orange" : "text-base-black/40 group-hover:text-base-black")} />
              <span className="text-xs font-black uppercase tracking-tight">{tab.label}</span>
              {activeTab === tab.id && <ChevronRight className="w-4 h-4 ml-auto" />}
            </button>
          ))}
        </aside>

        {/* Tab Content Area */}
        <main className="flex-1 min-h-[600px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'general' && renderGeneral()}
              {activeTab === 'attendance' && renderAttendance()}
              {activeTab === 'pkl' && renderPkl()}
              {activeTab === 'security' && renderSecurity()}
              {activeTab === 'features' && renderFeatures()}
              {activeTab === 'backup' && renderBackup()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Save Floating Indicator */}
      <AnimatePresence>
        {showSaveIndicator && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="fixed bottom-10 right-10 z-50 flex items-center gap-3 px-6 py-3 bg-retro-orange border-4 border-base-black rounded-retro text-base-white font-black uppercase tracking-widest shadow-hard-lg"
          >
            <RefreshCw className="w-5 h-5 animate-spin" />
            Saving Configuration...
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}