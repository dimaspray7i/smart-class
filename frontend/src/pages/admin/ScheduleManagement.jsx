import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, Search, Edit2, Trash2, X, Loader2, Calendar, Clock, Users, BookOpen,
  Download, Upload, Filter, MoreVertical, Check, ChevronDown, ChevronUp,
  MapPin, ArrowRight, School, UserCheck, LayoutGrid, List as ListIcon,
  AlertCircle, CheckCircle2, Eye, RefreshCw, ChevronRight, ChevronLeft,
  Menu, Star, Sparkles, Smile, FileText, Rocket, Settings, CalendarDays, Target, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../api';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Toast from '../../components/ui/Toast';

// ═══════════════════════════════════════════════════════════
// ANIMATION VARIANTS (ORIGINAL PRESERVED)
// ═══════════════════════════════════════════════════════════
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

// ═══════════════════════════════════════════════════════════
// 🎨 RETRO ANIMATION VARIANTS (ADDED)
// ═══════════════════════════════════════════════════════════
const retroCardVariants = {
  hidden: { opacity: 0, y: 30, rotate: -1 },
  visible: { opacity: 1, y: 0, rotate: 0, transition: { type: "spring", stiffness: 100, damping: 15, mass: 0.1 } }
};

const floatVariants = {
  animate: { y: [0, -8, 0], rotate: [0, 2, -2, 0], transition: { duration: 4, repeat: Infinity, ease: "easeInOut" } }
};

// ═══════════════════════════════════════════════════════════
// DEBOUNCE HOOK (ORIGINAL PRESERVED)
// ═══════════════════════════════════════════════════════════
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// ═══════════════════════════════════════════════════════════
// INPUT FIELD COMPONENT (ORIGINAL PRESERVED + RETRO STYLING)
// ═══════════════════════════════════════════════════════════
function InputField({ label, name, type = "text", value, onChange, error, required, disabled, placeholder, icon: Icon, helperText, ...props }) {
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
        <input
          type={type}
          name={name}
          value={value || ''}
          onChange={(e) => onChange(prev => ({ ...prev, [name]: e.target.value }))}
          className="retro-input w-full"
          required={required}
          disabled={disabled}
          placeholder={placeholder}
          {...props}
        />
        {error && <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-danger" />}
      </div>
      {helperText && <p className="text-[10px] font-retro-mono text-base-black/50">{helperText}</p>}
      {error && <p className="text-danger text-[10px] font-retro-mono mt-0.5">{Array.isArray(error) ? error[0] : error}</p>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// SELECT FIELD COMPONENT (ORIGINAL PRESERVED + RETRO STYLING)
// ═══════════════════════════════════════════════════════════
function SelectField({ label, name, value, onChange, options, error, required, disabled, icon: Icon, placeholder }) {
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
        className="retro-input w-full appearance-none cursor-pointer"
        required={required}
        disabled={disabled}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-base-cream text-base-black">{opt.label}</option>
        ))}
      </select>
      {error && <p className="text-danger text-[10px] font-retro-mono mt-0.5">{Array.isArray(error) ? error[0] : error}</p>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// CONFIRMATION MODAL (ORIGINAL PRESERVED + RETRO STYLING)
// ═══════════════════════════════════════════════════════════
function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = "Ya, Lanjutkan", cancelText = "Batal", variant = "danger" }) {
  if (!isOpen) return null;
  const variants = {
    danger: { icon: AlertCircle, color: 'text-danger', bg: 'bg-danger/10', border: 'border-danger/30' },
    warning: { icon: AlertCircle, color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/30' },
    success: { icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10', border: 'border-success/30' },
  };
  const config = variants[variant];
  const Icon = config.icon;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="md">
      <div className="text-center">
        <motion.div animate={{ scale: [1, 1.1, 1], rotate: [0, -5, 5, 0] }} transition={{ duration: 0.5, repeat: Infinity }}
          className={`w-16 h-16 mx-auto mb-4 border-4 border-base-black rounded-retro-lg flex items-center justify-center ${config.bg}`}>
          <Icon className={`w-8 h-8 ${config.color}`} />
        </motion.div>
        <p className="font-retro-mono text-sm text-base-black/70 mb-6">{message}</p>
        <div className="flex gap-3 justify-center">
          <button onClick={onClose} className="retro-btn retro-btn-outline">{cancelText}</button>
          <button onClick={onConfirm} className={`retro-btn ${variant === 'danger' ? 'bg-danger hover:bg-danger/90' : variant === 'warning' ? 'bg-warning hover:bg-warning/90 text-base-black' : 'bg-success hover:bg-success/90'} text-base-white`}>{confirmText}</button>
        </div>
        <div className="absolute -top-3 -right-3 retro-sticker bg-retro-yellow text-base-black text-[10px] px-2 py-0.5">CONFIRM</div>
      </div>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════
// DETAIL ITEM HELPER (ORIGINAL PRESERVED + RETRO STYLING)
// ═══════════════════════════════════════════════════════════
function DetailItem({ icon: Icon, label, value, valueClass = '' }) {
  return (
    <div className="flex items-start gap-3">
      {Icon && <Icon className="w-4 h-4 mt-0.5" />}
      <div>
        <p className="text-[10px] font-black uppercase tracking-wider text-base-black/50">{label}</p>
        <p className={`text-sm font-retro-display font-black text-base-black ${valueClass}`}>{value}</p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// DAY OPTIONS (ORIGINAL PRESERVED)
// ═══════════════════════════════════════════════════════════
const dayOptions = [
  { value: 'senin', label: 'Senin' },
  { value: 'selasa', label: 'Selasa' },
  { value: 'rabu', label: 'Rabu' },
  { value: 'kamis', label: 'Kamis' },
  { value: 'jumat', label: 'Jumat' },
  { value: 'sabtu', label: 'Sabtu' },
];

// ═══════════════════════════════════════════════════════════
// 🆕 QUICK TIME TEMPLATES (ADDED FEATURE)
// ═══════════════════════════════════════════════════════════
const quickTimeTemplates = [
  { label: 'Pagi (07:00-08:30)', start: '07:00', end: '08:30' },
  { label: 'Siang (10:00-11:30)', start: '10:00', end: '11:30' },
  { label: 'Sore (13:00-14:30)', start: '13:00', end: '14:30' },
  { label: 'Ekstra (15:00-16:30)', start: '15:00', end: '16:30' },
];

// ═══════════════════════════════════════════════════════════
// 🎪 DECORATIVE FLOATING ELEMENTS (ADDED)
// ═══════════════════════════════════════════════════════════
function ScheduleDecorations() {
  return (
    <>
      <motion.div variants={floatVariants} animate="animate" className="absolute top-20 right-10 z-0 hidden lg:block"><div className="retro-smiley text-xl animate-wobble">📅</div></motion.div>
      <motion.div variants={floatVariants} animate="animate" className="absolute bottom-32 left-20 z-0 hidden lg:block" style={{animationDelay:'1s'}}><Star className="w-8 h-8 text-retro-yellow fill-retro-yellow drop-shadow-retro animate-sparkle-retro" /></motion.div>
      <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-retro-purple/20 rounded-blob blur-2xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-retro-lime/20 rounded-blob blur-2xl pointer-events-none" />
    </>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT (ORIGINAL PRESERVED 100% + RETRO UPGRADE + NEW FEATURES)
// ═══════════════════════════════════════════════════════════
export default function ScheduleManagement() {
  const queryClient = useQueryClient();
  
  // State Management (ORIGINAL PRESERVED)
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [dayFilter, setDayFilter] = useState('all');
  const [teacherFilter, setTeacherFilter] = useState('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const [sidebarOpen, setSidebarOpen] = useState(false); // 🆕 Mobile sidebar state

  const debouncedSearch = useDebounce(search, 500);

  // Fetch dependencies for forms (ORIGINAL PRESERVED)
  useEffect(() => {
    Promise.all([
      api.get('/admin/classes', { params: { is_active: true, all: true } }),
      api.get('/admin/subjects', { params: { is_active: true, all: true } }),
      api.get('/admin/users', { params: { role: 'guru', is_active: true, all: true } })
    ]).then(([classesRes, subjectsRes, teachersRes]) => {
      setClasses(classesRes.data?.data || []);
      setSubjects(subjectsRes.data?.data || []);
      setTeachers(teachersRes.data?.data || []);
    }).catch(err => console.error('Failed to fetch dependencies:', err));
  }, []);

  // Fetch schedules with filters (ORIGINAL PRESERVED)
  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ['admin-schedules', debouncedSearch, classFilter, dayFilter, teacherFilter],
    queryFn: () => api.get('/admin/schedules', {
      params: {
        page: 1,
        search: debouncedSearch || undefined,
        class_id: classFilter === 'all' ? undefined : classFilter,
        day: dayFilter === 'all' ? undefined : dayFilter,
        teacher_id: teacherFilter === 'all' ? undefined : teacherFilter,
      }
    }),
    placeholderData: (prev) => prev,
    staleTime: 30000,
  });

  const schedules = data?.data?.data || [];
  const meta = data?.data?.meta || {};

  // Show toast notification (ORIGINAL PRESERVED)
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // ═══════════════════════════════════════════════════════════
  // MUTATIONS (ORIGINAL PRESERVED)
  // ═══════════════════════════════════════════════════════════
  const createScheduleMutation = useMutation({
    mutationFn: (newSchedule) => api.post('/admin/schedules', newSchedule),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-schedules'] });
      setIsCreateOpen(false);
      setFormData({});
      setErrors({});
      showToast('✅ Jadwal berhasil dibuat!', 'success');
    },
    onError: (err) => {
      setErrors(err.response?.data?.errors || {});
      const msg = err.response?.data?.message || 'Gagal membuat jadwal';
      if (err.response?.data?.code === 'SCHEDULE_CONFLICT') {
        showToast(`❌ ${msg}`, 'warning');
      } else {
        showToast(`❌ ${msg}`, 'error');
      }
    }
  });

  const updateScheduleMutation = useMutation({
    mutationFn: ({ id, ...updatedData }) => api.put(`/admin/schedules/${id}`, updatedData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-schedules'] });
      setIsEditOpen(false);
      setSelectedSchedule(null);
      setFormData({});
      setErrors({});
      showToast('✅ Jadwal berhasil diupdate!', 'success');
    },
    onError: (err) => {
      setErrors(err.response?.data?.errors || {});
      const msg = err.response?.data?.message || 'Gagal update jadwal';
      if (err.response?.data?.code === 'SCHEDULE_CONFLICT') {
        showToast(`❌ ${msg}`, 'warning');
      } else {
        showToast(`❌ ${msg}`, 'error');
      }
    }
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/schedules/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-schedules'] });
      showToast('✅ Jadwal berhasil dihapus!', 'success');
      setConfirmDelete(null);
    },
    onError: (err) => {
      showToast(`❌ ${err.response?.data?.message || 'Gagal menghapus jadwal'}`, 'error');
    }
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids) => Promise.all(ids.map(id => api.delete(`/admin/schedules/${id}`))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-schedules'] });
      setSelectedIds([]);
      showToast('✅ Jadwal berhasil dihapus!', 'success');
      setConfirmBulkDelete(false);
    },
    onError: (err) => {
      showToast(`❌ ${err.response?.data?.message || 'Gagal menghapus jadwal'}`, 'error');
    }
  });

  const exportSchedulesMutation = useMutation({
    mutationFn: (filters) => api.get('/admin/schedules/export', { params: filters, responseType: 'blob' }),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `schedules-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      showToast('✅ Data berhasil diexport!', 'success');
    },
    onError: () => showToast('❌ Gagal export data', 'error')
  });

  // ═══════════════════════════════════════════════════════════
  // HANDLERS (ORIGINAL PRESERVED)
  // ═══════════════════════════════════════════════════════════
  const handleCreateSubmit = (e) => { e.preventDefault(); createScheduleMutation.mutate(formData); };
  const handleEditSubmit = (e) => { e.preventDefault(); if (!selectedSchedule) return; updateScheduleMutation.mutate({ id: selectedSchedule.id, ...formData }); };
  const openEditModal = (schedule) => { setSelectedSchedule(schedule); setFormData({ class_id: schedule.class_id, subject_id: schedule.subject_id, teacher_id: schedule.teacher_id, day: schedule.day, start_time: schedule.start_time, end_time: schedule.end_time, room: schedule.room || '', is_active: schedule.is_active !== false }); setIsEditOpen(true); setErrors({}); };
  const openViewModal = (schedule) => { setSelectedSchedule(schedule); setIsViewOpen(true); };
  const handleDelete = (id) => setConfirmDelete(id);
  const confirmDeleteAction = () => { if (confirmDelete) deleteScheduleMutation.mutate(confirmDelete); };
  const handleBulkDelete = () => { if (selectedIds.length > 0) setConfirmBulkDelete(true); };
  const confirmBulkDeleteAction = () => { if (selectedIds.length > 0) bulkDeleteMutation.mutate(selectedIds); };
  const toggleSelectAll = () => { setSelectedIds(selectedIds.length === schedules.length ? [] : schedules.map(s => s.id)); };
  const toggleSelect = (id) => { setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]); };
  const handleExport = () => { exportSchedulesMutation.mutate({ search: debouncedSearch || undefined, class_id: classFilter === 'all' ? undefined : classFilter, day: dayFilter === 'all' ? undefined : dayFilter, teacher_id: teacherFilter === 'all' ? undefined : teacherFilter }); };
  const clearSearch = useCallback(() => setSearch(''), []);
  const getClassName = (id) => classes.find(c => c.id === id)?.name || '-';
  const getSubjectName = (id) => subjects.find(s => s.id === id)?.name || '-';
  const getTeacherName = (id) => teachers.find(t => t.id === id)?.name || '-';

  // ═══════════════════════════════════════════════════════════
  // LOADING & ERROR (ORIGINAL PRESERVED + RETRO STYLING)
  // ═══════════════════════════════════════════════════════════
  if (isLoading && !isFetching) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-retro-grid">
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-20 h-20 mx-auto mb-4 border-4 border-base-black rounded-retro-lg flex items-center justify-center bg-retro-orange shadow-hard">
            <Calendar className="w-10 h-10 text-base-white animate-pulse" />
          </motion.div>
          <h2 className="retro-heading retro-heading-orange text-2xl mb-2">LOADING SCHEDULES</h2>
          <p className="font-retro-mono text-sm text-base-black/70 mb-4">Memuat data jadwal...</p>
          <div className="w-48 mx-auto h-4 border-4 border-base-black rounded-sm overflow-hidden bg-base-white">
            <motion.div className="h-full bg-retro-blue" animate={{ x: ['-100%', '100%'] }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} style={{ width: '50%' }} />
          </div>
          <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 0.5, repeat: Infinity }} className="mt-4"><Smile className="w-6 h-6 text-retro-yellow mx-auto animate-wobble" /></motion.div>
        </motion.div>
      </div>
    );
  }
  
  if (isError) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="retro-card p-8 text-center max-w-lg mx-auto bg-base-white">
        <motion.div animate={{ scale: [1, 1.1, 1], rotate: [0, -5, 5, 0] }} transition={{ duration: 0.5, repeat: Infinity }} className="w-16 h-16 mx-auto mb-4 border-4 border-base-black rounded-retro-lg flex items-center justify-center bg-danger shadow-[4px_4px_0px_0px_#111111]">
          <AlertCircle className="w-8 h-8 text-base-white" />
        </motion.div>
        <h3 className="retro-heading text-xl mb-3 text-base-black">Oops! Connection Error</h3>
        <p className="font-retro-mono text-sm text-base-black/70 mb-5">Gagal memuat data</p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => queryClient.invalidateQueries(['admin-schedules'])} className="retro-btn retro-btn-secondary flex items-center gap-2"><RefreshCw className="w-4 h-4" /> Coba Lagi</button>
          <button onClick={() => window.history.back()} className="retro-btn retro-btn-outline">Kembali</button>
        </div>
        <div className="absolute -top-3 -right-3 retro-sticker bg-retro-yellow text-base-black text-xs px-3 py-1">ERROR!</div>
      </motion.div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // RENDER (ORIGINAL PRESERVED 100% + RETRO UPGRADE + NEW FEATURES)
  // ═══════════════════════════════════════════════════════════
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="relative min-h-screen bg-base-cream retro-grid-bg">
      
      {/* 🆕 Decorative floating elements */}
      <ScheduleDecorations />

      {/* Toast Notification (ORIGINAL PRESERVED + RETRO POSITION) */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed top-24 right-6 z-50">
            <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER (ORIGINAL PRESERVED + RETRO STYLING) */}
      <motion.div variants={itemVariants} className="sticky top-4 z-30 px-4 md:px-6">
        <div className="retro-card max-w-5xl mx-auto p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="retro-heading retro-heading-xl text-retro-orange mb-2 flex items-center gap-3">
              <span className="inline-block animate-wobble">🗓️</span>
              MANAJEMEN JADWAL
              <span className="inline-block animate-bounce-retro">✨</span>
            </h1>
            <p className="font-retro-mono text-base-black/70 flex items-center gap-2">
              <span className="retro-badge retro-badge-blue text-[10px]">Admin</span>
              <span className="font-bold">{schedules.length} jadwal</span>
              <span className="text-base-black/40">•</span>
              <span>{meta.total || 0} total</span>
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {selectedIds.length > 0 && (
              <button onClick={handleBulkDelete} className="retro-btn retro-btn-sm bg-danger hover:bg-danger/90 text-base-white flex items-center gap-1.5">
                <Trash2 className="w-4 h-4" /> Hapus ({selectedIds.length})
              </button>
            )}
            <button onClick={handleExport} disabled={exportSchedulesMutation.isLoading} className="retro-btn retro-btn-sm retro-btn-outline flex items-center gap-1.5">
              <Download className="w-4 h-4" /> {exportSchedulesMutation.isLoading ? 'Exporting...' : 'Export'}
            </button>
            
            {/* View Mode Toggle (ORIGINAL PRESERVED + RETRO STYLING) */}
            <div className="flex bg-base-white border-2 border-base-black rounded-retro p-1">
              <button onClick={() => setViewMode('list')} className={`p-2 rounded-sm transition-colors ${viewMode === 'list' ? 'bg-retro-orange text-base-white' : 'hover:bg-retro-yellow'}`} title="List View"><ListIcon className="w-4 h-4" /></button>
              <button onClick={() => setViewMode('grid')} className={`p-2 rounded-sm transition-colors ${viewMode === 'grid' ? 'bg-retro-blue text-base-white' : 'hover:bg-retro-yellow'}`} title="Grid View"><LayoutGrid className="w-4 h-4" /></button>
              {/* 🆕 Weekly View Toggle */}
              <button onClick={() => setViewMode('weekly')} className={`p-2 rounded-sm transition-colors ${viewMode === 'weekly' ? 'bg-retro-purple text-base-white' : 'hover:bg-retro-yellow'}`} title="Weekly View"><CalendarDays className="w-4 h-4" /></button>
            </div>

            <button onClick={() => { setFormData({ day: 'senin', start_time: '07:00', end_time: '08:30', is_active: true }); setErrors({}); setIsCreateOpen(true); }} 
              className="retro-btn retro-btn-sm flex items-center gap-1.5" disabled={createScheduleMutation.isLoading}>
              <Plus className="w-4 h-4" /> {createScheduleMutation.isLoading ? 'Menyimpan...' : 'Tambah Jadwal'}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Main Content Area */}
      <div className="px-4 md:px-6 py-6 max-w-7xl mx-auto">
        
        {/* FILTERS (ORIGINAL PRESERVED + RETRO STYLING) */}
        <motion.div variants={itemVariants} className="retro-card p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-end lg:items-center justify-between">
            <div className="flex-1 w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" />
                <input type="text" placeholder="Cari kelas, mapel, atau guru..." value={search}
                  onChange={(e) => setSearch(e.target.value)} className="retro-input pl-10 pr-10 w-full" />
                {search && (
                  <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 hover:text-danger">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={() => setShowFilters(!showFilters)} className="retro-btn retro-btn-sm retro-btn-outline flex items-center gap-1.5">
                <Filter className="w-4 h-4" /> Filter {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="retro-input w-36 appearance-none">
                <option value="all">Semua Kelas</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select value={dayFilter} onChange={(e) => setDayFilter(e.target.value)} className="retro-input w-32 appearance-none">
                <option value="all">Semua Hari</option>
                {dayOptions.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
              <select value={teacherFilter} onChange={(e) => setTeacherFilter(e.target.value)} className="retro-input w-36 appearance-none">
                <option value="all">Semua Guru</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>
          
          {/* Extended Filters (ORIGINAL PRESERVED + RETRO STYLING) */}
          <AnimatePresence>
            {showFilters && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} 
                exit={{ height: 0, opacity: 0 }} className="mt-4 pt-4 border-t-2 border-base-black/10">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <InputField label="Waktu Mulai" name="time_start_filter" type="time" value="" onChange={() => {}} />
                  <InputField label="Waktu Selesai" name="time_end_filter" type="time" value="" onChange={() => {}} />
                  <SelectField label="Ruang" name="room_filter" value="" onChange={() => {}} options={[{value:'',label:'Semua Ruang'}]} />
                  <button className="retro-btn retro-btn-sm retro-btn-outline w-full mt-5" onClick={() => { setSearch(''); setClassFilter('all'); setDayFilter('all'); setTeacherFilter('all'); }}>Reset Filter</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* BULK ACTIONS BAR (ORIGINAL PRESERVED + RETRO STYLING) */}
        {selectedIds.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} 
            className="retro-card p-3 mb-4 bg-retro-orange/10 border-retro-orange flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wide text-base-black">
              {selectedIds.length} jadwal terpilih
            </span>
            <div className="flex items-center gap-2">
              <button onClick={() => setSelectedIds([])} className="retro-btn retro-btn-sm retro-btn-outline">Batal</button>
              <button onClick={handleBulkDelete} className="retro-btn retro-btn-sm bg-danger hover:bg-danger/90 text-base-white">Hapus Terpilih</button>
            </div>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════
            CONTENT BASED ON VIEW MODE (ORIGINAL PRESERVED + RETRO + 🆕 WEEKLY)
            ═══════════════════════════════════════════════════ */}
        {viewMode === 'list' ? (
          /* LIST VIEW (TABLE) - ORIGINAL PRESERVED + RETRO STYLING */
          <motion.div variants={itemVariants} className="retro-card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full font-retro-mono text-sm">
                <thead className="bg-retro-blue text-base-white border-b-4 border-base-black">
                  <tr>
                    <th className="px-4 py-3 text-left font-black uppercase tracking-wide text-xs">
                      <input type="checkbox" checked={schedules.length > 0 && selectedIds.length === schedules.length} 
                        onChange={toggleSelectAll} className="w-4 h-4 accent-retro-orange border-2 border-base-black" />
                    </th>
                    <th className="px-4 py-3 text-left font-black uppercase tracking-wide text-xs">Kelas</th>
                    <th className="px-4 py-3 text-left font-black uppercase tracking-wide text-xs hidden md:table-cell">Mapel</th>
                    <th className="px-4 py-3 text-left font-black uppercase tracking-wide text-xs hidden lg:table-cell">Guru</th>
                    <th className="px-4 py-3 text-left font-black uppercase tracking-wide text-xs">Hari & Waktu</th>
                    <th className="px-4 py-3 text-left font-black uppercase tracking-wide text-xs hidden xl:table-cell">Ruang</th>
                    <th className="px-4 py-3 text-left font-black uppercase tracking-wide text-xs">Status</th>
                    <th className="px-4 py-3 text-right font-black uppercase tracking-wide text-xs">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-base-black/10">
                  {schedules.map((schedule, index) => (
                    <motion.tr key={schedule.id} variants={itemVariants} style={{transitionDelay:`${index*30}ms`}}
                      whileHover={{ backgroundColor: 'rgba(255,201,40,0.2)' }} className={`transition-colors ${selectedIds.includes(schedule.id) ? 'bg-retro-yellow/20' : ''}`}>
                      <td className="px-4 py-4">
                        <input type="checkbox" checked={selectedIds.includes(schedule.id)} onChange={() => toggleSelect(schedule.id)} 
                          className="w-4 h-4 accent-retro-orange border-2 border-base-black" />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <School className="w-4 h-4 text-retro-orange" />
                          <span className="font-retro-display font-black text-base-black text-sm">{getClassName(schedule.class_id)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-retro-purple" />
                          <span className="text-base-black/80">{getSubjectName(schedule.subject_id)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 hidden lg:table-cell">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-retro-blue" />
                          <span className="text-base-black/80">{getTeacherName(schedule.teacher_id)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col">
                          <span className="font-black text-base-black capitalize">{schedule.day}</span>
                          <span className="text-[10px] text-base-black/60 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {schedule.start_time} - {schedule.end_time}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-base-black/70 hidden xl:table-cell">
                        {schedule.room || '-'}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`retro-badge text-[10px] ${schedule.is_active ? 'retro-badge-green' : 'retro-badge-red'}`}>
                          {schedule.is_active ? 'AKTIF' : 'NON-AKTIF'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openViewModal(schedule)} title="Lihat Detail" 
                            className="p-2 retro-btn retro-btn-sm retro-btn-outline hover:bg-retro-yellow">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => openEditModal(schedule)} title="Edit" 
                            className="p-2 retro-btn retro-btn-sm retro-btn-outline hover:bg-retro-yellow">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(schedule.id)} title="Hapus" 
                            className="p-2 retro-btn retro-btn-sm bg-danger hover:bg-danger/90 text-base-white">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                  {schedules.length === 0 && (
                    <tr><td colSpan="8" className="text-center py-12"><div className="text-base-black/30 mb-2">📭</div>
                      <p className="font-retro-mono text-sm text-base-black/50">{search || classFilter !== 'all' ? 'Tidak ada jadwal yang cocok.' : 'Belum ada data jadwal.'}</p></td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* Pagination (ORIGINAL PRESERVED + RETRO STYLING) */}
            <div className="px-4 py-3 border-t-4 border-base-black bg-retro-yellow/10 flex justify-between items-center text-xs font-retro-mono">
              <span>Menampilkan <strong>{meta.from || 0}</strong> - <strong>{meta.to || 0}</strong> dari <strong>{meta.total || 0}</strong> data</span>
              <div className="flex gap-1">
                <button className="px-3 py-1 retro-btn retro-btn-sm retro-btn-outline" disabled><ChevronLeft className="w-4 h-4" /></button>
                <button className="px-3 py-1 retro-btn retro-btn-sm bg-retro-orange text-base-white border-retro-orange shadow-[2px_2px_0px_0px_#111111]">1</button>
                <button className="px-3 py-1 retro-btn retro-btn-sm retro-btn-outline" disabled><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          </motion.div>
        ) : viewMode === 'grid' ? (
          /* GRID VIEW (CARDS) - ORIGINAL PRESERVED + RETRO STYLING */
          <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {schedules.map((schedule) => (
              <motion.div key={schedule.id} variants={itemVariants} whileHover={{ y: -4, rotate: 1 }}
                className={`retro-card relative group p-4 ${selectedIds.includes(schedule.id) ? 'ring-4 ring-retro-orange' : ''}`}>
                <div className="absolute top-3 right-3">
                  <input type="checkbox" checked={selectedIds.includes(schedule.id)} onChange={() => toggleSelect(schedule.id)} 
                    className="w-4 h-4 accent-retro-orange border-2 border-base-black" />
                </div>
                
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 retro-card bg-retro-orange/20 border-retro-orange flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-retro-orange" />
                  </div>
                  <div>
                    <h4 className="font-retro-display font-black text-base-black text-sm">{getClassName(schedule.class_id)}</h4>
                    <p className="text-[10px] font-retro-mono text-base-black/60 capitalize">{schedule.day}</p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-xs"><BookOpen className="w-4 h-4 text-retro-purple" /><span className="text-base-black/80">{getSubjectName(schedule.subject_id)}</span></div>
                  <div className="flex items-center gap-2 text-xs"><Users className="w-4 h-4 text-retro-blue" /><span className="text-base-black/80">{getTeacherName(schedule.teacher_id)}</span></div>
                  <div className="flex items-center gap-2 text-xs"><Clock className="w-4 h-4 text-retro-lime" /><span className="text-base-black/80">{schedule.start_time} - {schedule.end_time}</span></div>
                  {schedule.room && <div className="flex items-center gap-2 text-xs"><MapPin className="w-4 h-4 text-retro-yellow" /><span className="text-base-black/80">Ruang {schedule.room}</span></div>}
                </div>

                <div className="pt-3 border-t-2 border-base-black/10 flex justify-between items-center">
                  <span className={`retro-badge text-[10px] ${schedule.is_active ? 'retro-badge-green' : 'retro-badge-red'}`}>
                    {schedule.is_active ? 'AKTIF' : 'NON-AKTIF'}
                  </span>
                  <div className="flex gap-1">
                    <button onClick={() => openEditModal(schedule)} className="p-1.5 retro-btn retro-btn-sm retro-btn-outline hover:bg-retro-yellow"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(schedule.id)} className="p-1.5 retro-btn retro-btn-sm bg-danger hover:bg-danger/90 text-base-white"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </motion.div>
            ))}
            {schedules.length === 0 && (
              <div className="col-span-full text-center py-12">
                <div className="text-base-black/30 mb-2">📭</div>
                <p className="font-retro-mono text-sm text-base-black/50">Tidak ada jadwal untuk ditampilkan.</p>
              </div>
            )}
          </motion.div>
        ) : (
          /* 🆕 WEEKLY VIEW (ADDED FEATURE) */
          <motion.div variants={itemVariants} className="retro-card p-6 overflow-x-auto">
            <h3 className="retro-heading retro-heading-sm text-retro-purple mb-4 flex items-center gap-2"><CalendarDays className="w-5 h-5" /> TAMPILAN MINGGUAN</h3>
            <div className="min-w-[800px] grid grid-cols-6 gap-2">
              <div className="font-black text-xs uppercase text-base-black/50 p-2">Waktu</div>
              {dayOptions.map(d => <div key={d.value} className="retro-card bg-retro-blue/10 border-retro-blue p-2 text-center font-black text-xs uppercase text-base-black">{d.label}</div>)}
              {['07:00','08:30','10:00','11:30','13:00','14:30'].map(time => (
                <>
                  <div className="p-2 font-retro-mono text-xs text-base-black/70 border-b-2 border-base-black/10">{time}</div>
                  {dayOptions.map(d => {
                    const slot = schedules.find(s => s.day === d.value && s.start_time === time && s.is_active);
                    return (
                      <div key={`${d.value}-${time}`} className={`p-2 border-b-2 border-base-black/10 min-h-[60px] ${slot ? 'bg-retro-yellow/20 border-retro-yellow' : ''}`}>
                        {slot && <div className="text-[10px] font-black text-base-black leading-tight">{getSubjectName(slot.subject_id)}<br/><span className="font-retro-mono text-base-black/60">{getClassName(slot.class_id)}</span></div>}
                      </div>
                    );
                  })}
                </>
              ))}
            </div>
            <p className="text-[10px] font-retro-mono text-base-black/50 mt-4 text-center">💡 Klik "Tambah Jadwal" untuk mengisi slot kosong. Tampilan mingguan hanya menampilkan jadwal aktif.</p>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            MODAL: CREATE / EDIT SCHEDULE (ORIGINAL PRESERVED + RETRO + 🆕 QUICK TEMPLATES)
            ═══════════════════════════════════════════════════════════ */}
        {(isCreateOpen || isEditOpen) && (
          <Modal isOpen={isCreateOpen || isEditOpen} onClose={() => { setIsCreateOpen(false); setIsEditOpen(false); }} 
            title={isCreateOpen ? "✨ Tambah Jadwal Baru" : "✏️ Edit Jadwal"} size="2xl">
            <form onSubmit={isCreateOpen ? handleCreateSubmit : handleEditSubmit} className="space-y-6 max-h-[75vh] overflow-y-auto pr-2">
              
              {/* Section 1: Basic Info (ORIGINAL PRESERVED + RETRO STYLING) */}
              <div className="space-y-4">
                <h3 className="retro-heading retro-heading-sm text-retro-blue flex items-center gap-2">
                  <Calendar className="w-5 h-5" /> Informasi Jadwal
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SelectField label="Kelas" name="class_id" value={formData.class_id} onChange={setFormData} 
                    options={classes.map(c => ({ value: c.id, label: c.name }))} 
                    error={errors.class_id} required icon={School} placeholder="Pilih Kelas" />
                  
                  <SelectField label="Mata Pelajaran" name="subject_id" value={formData.subject_id} onChange={setFormData} 
                    options={subjects.map(s => ({ value: s.id, label: `${s.code} - ${s.name}` }))} 
                    error={errors.subject_id} required icon={BookOpen} placeholder="Pilih Mapel" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SelectField label="Guru Pengajar" name="teacher_id" value={formData.teacher_id} onChange={setFormData} 
                    options={teachers.map(t => ({ value: t.id, label: t.name }))} 
                    error={errors.teacher_id} required icon={Users} placeholder="Pilih Guru" />
                  
                  <SelectField label="Hari" name="day" value={formData.day} onChange={setFormData} 
                    options={dayOptions} 
                    error={errors.day} required icon={Calendar} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField label="Waktu Mulai" name="start_time" type="time" value={formData.start_time} onChange={setFormData} 
                    error={errors.start_time} required icon={Clock} />
                  
                  <InputField label="Waktu Selesai" name="end_time" type="time" value={formData.end_time} onChange={setFormData} 
                    error={errors.end_time} required icon={Clock} helperText="Harus setelah waktu mulai" />
                </div>

                <InputField label="Ruang Kelas" name="room" value={formData.room} onChange={setFormData} 
                  error={errors.room} placeholder="Contoh: Lab Komputer 1" icon={MapPin} />

                {/* 🆕 Quick Time Templates */}
                <div className="p-3 retro-card bg-retro-yellow/10 border-retro-yellow">
                  <p className="text-[10px] font-black uppercase tracking-wider text-base-black/70 mb-2">⚡ Template Waktu Cepat</p>
                  <div className="flex flex-wrap gap-2">
                    {quickTimeTemplates.map(t => (
                      <button type="button" key={t.label} onClick={() => setFormData({...formData, start_time: t.start, end_time: t.end})} className="retro-btn retro-btn-sm retro-btn-outline text-[10px]">{t.label}</button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input type="checkbox" id="is_active" checked={formData.is_active !== false} 
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})} className="w-4 h-4 accent-retro-orange border-2 border-base-black" />
                  <label htmlFor="is_active" className="text-xs font-retro-mono text-base-black/70 cursor-pointer">Jadwal Aktif</label>
                </div>
              </div>

              {/* Conflict Warning Placeholder (ORIGINAL PRESERVED + RETRO STYLING) */}
              {errors.non_field_errors && (
                <div className="p-4 retro-card bg-danger/10 border-danger flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-black text-danger text-sm uppercase">Konflik Jadwal Terdeteksi!</p>
                    <p className="font-retro-mono text-xs text-base-black/70 mt-1">{Array.isArray(errors.non_field_errors) ? errors.non_field_errors[0] : errors.non_field_errors}</p>
                  </div>
                </div>
              )}

              <div className="pt-6 flex justify-end gap-3 border-t-4 border-base-black sticky bottom-0 bg-base-cream py-4 z-10 mt-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => { setIsCreateOpen(false); setIsEditOpen(false); }}
                >
                  BATAL
                </Button>
                <Button 
                  type="submit" 
                  loading={createScheduleMutation.isPending || updateScheduleMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <Rocket className="w-4 h-4" />
                  {isCreateOpen ? 'SIMPAN JADWAL' : 'UPDATE JADWAL'}
                </Button>
              </div>
            </form>
          </Modal>
        )}

        {/* ═══════════════════════════════════════════════════════════
            MODAL: VIEW SCHEDULE DETAIL (ORIGINAL PRESERVED + RETRO STYLING)
            ═══════════════════════════════════════════════════════════ */}
        {isViewOpen && selectedSchedule && (
          <Modal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} title="📅 Detail Jadwal" size="lg">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center gap-4 pb-4 border-b-4 border-base-black">
                <motion.div whileHover={{ scale: 1.05, rotate: 3 }} className="w-20 h-20 retro-card bg-retro-orange/20 border-retro-orange flex items-center justify-center">
                  <Calendar className="w-10 h-10 text-retro-orange" />
                </motion.div>
                <div>
                  <h3 className="retro-heading retro-heading-lg text-base-black">{getClassName(selectedSchedule.class_id)}</h3>
                  <p className="font-retro-mono text-sm text-base-black/70 capitalize">{selectedSchedule.day} • {selectedSchedule.start_time} - {selectedSchedule.end_time}</p>
                  <div className="flex gap-2 mt-2">
                    <span className={`retro-badge text-[10px] ${selectedSchedule.is_active ? 'retro-badge-green' : 'retro-badge-red'}`}>
                      {selectedSchedule.is_active ? 'AKTIF' : 'NON-AKTIF'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <DetailItem icon={BookOpen} label="Mata Pelajaran" value={getSubjectName(selectedSchedule.subject_id)} valueClass="text-retro-purple" />
                  <DetailItem icon={Users} label="Guru Pengajar" value={getTeacherName(selectedSchedule.teacher_id)} valueClass="text-retro-blue" />
                  <DetailItem icon={Clock} label="Durasi" value={`${selectedSchedule.duration_minutes || 90} Menit`} />
                </div>
                <div className="space-y-4">
                  <DetailItem icon={MapPin} label="Ruang" value={selectedSchedule.room || 'Tidak ditentukan'} />
                  <DetailItem icon={Calendar} label="Dibuat Pada" value={new Date(selectedSchedule.created_at).toLocaleDateString('id-ID')} />
                  <DetailItem icon={RefreshCw} label="Terakhir Update" value={new Date(selectedSchedule.updated_at).toLocaleDateString('id-ID')} />
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t-4 border-base-black flex justify-end gap-2">
                <button onClick={() => { setIsViewOpen(false); openEditModal(selectedSchedule); }} className="retro-btn retro-btn-outline">
                  <Edit2 className="w-4 h-4 mr-1" /> Edit
                </button>
                <button onClick={() => { setIsViewOpen(false); /* Navigate to schedule */ }} className="retro-btn retro-btn-secondary">
                  <Calendar className="w-4 h-4 mr-1" /> Lihat Jadwal
                </button>
                <button onClick={() => { setIsViewOpen(false); handleDelete(selectedSchedule.id); }} className="retro-btn bg-danger hover:bg-danger/90 text-base-white">
                  <Trash2 className="w-4 h-4 mr-1" /> Hapus
                </button>
              </div>
            </div>
          </Modal>
        )}

        {/* Confirmation Modals (ORIGINAL PRESERVED + RETRO STYLING) */}
        <ConfirmModal isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={confirmDeleteAction}
          title="Hapus Jadwal?" message="Apakah Anda yakin ingin menghapus jadwal ini? Slot waktu ini akan menjadi kosong." />
        
        <ConfirmModal isOpen={confirmBulkDelete} onClose={() => setConfirmBulkDelete(false)} onConfirm={confirmBulkDeleteAction}
          title={`Hapus ${selectedIds.length} Jadwal?`} message="Apakah Anda yakin ingin menghapus jadwal yang terpilih? Tindakan ini tidak dapat dibatalkan." />

      </div>

      {/* 🆕 Floating Action Button */}
      <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
        onClick={() => { setFormData({ day: 'senin', start_time: '07:00', end_time: '08:30', is_active: true }); setErrors({}); setIsCreateOpen(true); }}
        className="fixed bottom-6 right-6 z-50 retro-btn retro-btn-lg retro-btn-sticker hidden md:flex items-center gap-2">
        <Plus className="w-5 h-5" /><span className="hidden lg:inline">Tambah Jadwal</span>
      </motion.button>

      {/* 🆕 Decorative Footer Stickers */}
      <div className="fixed bottom-4 left-4 z-0 hidden lg:block pointer-events-none">
        <motion.div animate={{ rotate: [0, -10, 10, -5, 5, 0] }} transition={{ duration: 3, repeat: Infinity }} className="retro-sticker bg-retro-pink text-base-white text-[10px] px-3 py-1">POWERED BY RPL</motion.div>
      </div>
      <div className="fixed bottom-4 right-4 z-0 hidden lg:block pointer-events-none">
        <motion.div animate={{ rotate: [0, 10, -10, 5, -5, 0] }} transition={{ duration: 3, repeat: Infinity, delay: 1 }} className="retro-sticker bg-retro-lime text-base-black text-[10px] px-3 py-1">v2.0 RETRO ✨</motion.div>
      </div>
    </motion.div>
  );
}