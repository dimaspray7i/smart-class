import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Search, Edit2, Trash2, X, Loader2, BookOpen, Download, Upload, Filter, 
  AlertCircle, CheckCircle2, Eye, BarChart3, ChevronRight, ChevronLeft, 
  LayoutGrid, List as ListIcon, Tag, Clock, Users, Calendar, Zap, Sparkles,
  Star, Rocket, Smile, Settings, Menu
} from 'lucide-react';
import { api } from '../../api';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Toast from '../../components/ui/Toast';

// ═══════════════════════════════════════════════════════════
// 🎨 RETRO ANIMATION VARIANTS
// ═══════════════════════════════════════════════════════════
const pageVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.1 } }
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

const pulseVariants = {
  animate: {
    scale: [1, 1.05, 1],
    boxShadow: [
      '0 0 0px rgba(255,92,0,0)',
      '0 0 20px rgba(255,92,0,0.4)',
      '0 0 0px rgba(255,92,0,0)'
    ],
    transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
  }
};

// ═══════════════════════════════════════════════════════════
// 🎭 RETRO HELPER COMPONENTS
// ═══════════════════════════════════════════════════════════

// Retro Input Field
function RetroInput({ label, name, type = "text", value, onChange, error, required, disabled, placeholder, icon: Icon, helperText, ...props }) {
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
          } ${error ? 'border-danger shadow-[4px_4px_0px_0px_#FF1744]' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
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

// Retro Select Field
function RetroSelect({ label, name, value, onChange, options, error, required, disabled, icon: Icon, placeholder }) {
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
      {error && <p className="text-danger text-[10px] font-retro-mono mt-0.5">{Array.isArray(error) ? error[0] : error}</p>}
    </div>
  );
}

// Retro Text Area
function RetroTextArea({ label, name, value, onChange, error, required, disabled, placeholder, icon: Icon, rows = 3 }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-black uppercase tracking-wider text-base-black">
        <span className="flex items-center gap-1.5">
          {Icon && <Icon className="w-4 h-4" />}
          {label}
          {required && <span className="text-retro-orange">*</span>}
        </span>
      </label>
      <textarea
        name={name}
        value={value || ''}
        onChange={(e) => onChange(prev => ({ ...prev, [name]: e.target.value }))}
        className="w-full px-4 py-3 rounded-retro bg-base-white border-2 border-base-black hover:border-retro-blue focus:border-retro-orange focus:shadow-[4px_4px_0px_0px_#FF5C00] transition-all duration-300 text-base-black placeholder-base-black/40 focus:outline-none font-retro-mono text-sm resize-none"
        rows={rows}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
      />
      {error && <p className="text-danger text-[10px] font-retro-mono mt-0.5">{Array.isArray(error) ? error[0] : error}</p>}
    </div>
  );
}

// Retro Stat Box
function RetroStatBox({ label, value, icon: Icon, color, trend, delay = 0 }) {
  return (
    <motion.div 
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -4, scale: 1.02 }}
      className="retro-card bg-base-white border-4 border-base-black p-4 relative overflow-hidden"
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between mb-2">
        {Icon && (
          <motion.div 
            className={`p-2 rounded-retro bg-${color}/20 border-2 border-${color}`}
            whileHover={{ scale: 1.1, rotate: 5 }}
          >
            <Icon className={`w-4 h-4 text-${color}`} />
          </motion.div>
        )}
        {trend && (
          <span className={`text-xs font-black ${trend > 0 ? 'text-success' : 'text-danger'}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <motion.p 
        className={`retro-heading retro-heading-lg text-${color}`}
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ delay: delay * 0.1 + 0.2 }}
      >
        {value}
      </motion.p>
      <p className="font-retro-mono text-[10px] text-base-black/70 uppercase tracking-wide mt-1">{label}</p>
      
      {/* Decorative corner */}
      <div className="absolute top-2 right-2 w-2 h-2 bg-retro-yellow border border-base-black rounded-sm rotate-45" />
    </motion.div>
  );
}

// Floating Decorations for Subject Page
function SubjectDecorations() {
  return (
    <>
      {/* Floating Stars */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={`star-${i}`}
          variants={floatVariants}
          animate="animate"
          className="absolute hidden lg:block pointer-events-none"
          style={{
            top: `${10 + i * 15}%`,
            left: `${5 + i * 14}%`,
            animationDelay: `${i * 0.5}s`
          }}
        >
          <Star className={`w-${3 + (i % 3)} h-${3 + (i % 3)} text-retro-yellow fill-retro-yellow drop-shadow-retro animate-sparkle-retro`} />
        </motion.div>
      ))}
      
      {/* Floating Icons */}
      <motion.div variants={floatVariants} animate="animate" className="absolute top-20 right-10 hidden lg:block pointer-events-none">
        <div className="retro-smiley text-2xl animate-wobble">📚</div>
      </motion.div>
      <motion.div variants={floatVariants} animate="animate" className="absolute bottom-32 left-20 hidden lg:block pointer-events-none" style={{animationDelay: '1.5s'}}>
        <BookOpen className="w-8 h-8 text-retro-purple drop-shadow-retro animate-pulse" />
      </motion.div>
      
      {/* Decorative Blobs */}
      <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-retro-purple/20 rounded-blob blur-2xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-retro-lime/20 rounded-blob blur-2xl pointer-events-none" />
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-retro-grid opacity-20 pointer-events-none" />
    </>
  );
}

// Retro Category Badge
function RetroCategoryBadge({ category }) {
  const configs = {
    productive: { 
      label: 'Produktif', 
      icon: '📊', 
      bg: 'bg-retro-purple/20', 
      border: 'border-retro-purple', 
      text: 'text-retro-purple' 
    },
    normative: { 
      label: 'Normatif', 
      icon: '📚', 
      bg: 'bg-retro-blue/20', 
      border: 'border-retro-blue', 
      text: 'text-retro-blue' 
    },
    adaptive: { 
      label: 'Adaptif', 
      icon: '🔧', 
      bg: 'bg-retro-lime/20', 
      border: 'border-retro-lime', 
      text: 'text-retro-lime' 
    },
  };
  
  const config = configs[category] || configs.normative;
  
  return (
    <motion.span 
      whileHover={{ scale: 1.05 }}
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wide border-2 ${config.bg} ${config.border} ${config.text}`}
    >
      <span>{config.icon}</span>
      {config.label}
    </motion.span>
  );
}

// Retro Confirm Modal
function RetroConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = "Ya, Lanjutkan", cancelText = "Batal", variant = "danger" }) {
  if (!isOpen) return null;
  
  const variants = {
    danger: { icon: AlertCircle, color: 'text-danger', bg: 'bg-danger/10', border: 'border-danger' },
    warning: { icon: AlertCircle, color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning' },
    success: { icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10', border: 'border-success' },
  };
  
  const config = variants[variant];
  const Icon = config.icon;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="md">
      <div className="text-center">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], rotate: [0, -5, 5, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className={`w-16 h-16 mx-auto mb-4 retro-card ${config.bg} ${config.border} flex items-center justify-center`}
        >
          <Icon className={`w-7 h-7 ${config.color}`} />
        </motion.div>
        <p className="font-retro-mono text-sm text-base-black/70 mb-6">{message}</p>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={onClose}>{cancelText}</Button>
          <Button variant={variant} onClick={onConfirm} className={`${variant === 'danger' ? 'bg-danger hover:bg-danger/90' : variant === 'warning' ? 'bg-warning hover:bg-warning/90 text-base-black' : 'bg-success hover:bg-success/90'} text-base-white`}>
            {confirmText}
          </Button>
        </div>
        <motion.div variants={stickerVariants} initial="hidden" animate="visible" className="absolute -top-3 -right-3">
          <div className="retro-sticker bg-retro-yellow text-base-black text-[10px] px-2 py-0.5">CONFIRM</div>
        </motion.div>
      </div>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════
// 📊 CATEGORY OPTIONS & QUICK TEMPLATES
// ═══════════════════════════════════════════════════════════
const categoryOptions = [
  { value: 'productive', label: '📊 Produktif', color: 'retro-purple' },
  { value: 'normative', label: '📚 Normatif', color: 'retro-blue' },
  { value: 'adaptive', label: '🔧 Adaptif', color: 'retro-lime' },
];

const quickTemplates = [
  { label: 'RPL Dasar', code: 'RPL-101', category: 'productive', credits: 4 },
  { label: 'Pemrograman Web', code: 'RPL-201', category: 'productive', credits: 6 },
  { label: 'Bahasa Indonesia', code: 'NOR-101', category: 'normative', credits: 3 },
  { label: 'Matematika', code: 'ADA-101', category: 'adaptive', credits: 4 },
];

// ═══════════════════════════════════════════════════════════
// 🎯 MAIN COMPONENT - RETRO FUTURISTIC SUBJECT MANAGEMENT
// ═══════════════════════════════════════════════════════════
export default function SubjectManagement() {
  const queryClient = useQueryClient();
  
  // State Management
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [selectedIds, setSelectedIds] = useState([]);
  const [toast, setToast] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [activeView, setActiveView] = useState('list');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch subjects
  const { data, isLoading: isPending, isError, isFetching } = useQuery({
    queryKey: ['admin-subjects', debouncedSearch, categoryFilter],
    queryFn: () => api.get('/admin/subjects', {
      params: {
        search: debouncedSearch || undefined,
        category: categoryFilter === 'all' ? undefined : categoryFilter,
      }
    }),
    placeholderData: (prev) => prev,
    staleTime: 30000,
  });

  const subjects = data?.data?.data || [];
  const meta = data?.data?.meta || {};

  // Toast notification
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // ═══════════════════════════════════════════════════════════
  // 🔌 MUTATIONS
  // ═══════════════════════════════════════════════════════════
  const createSubjectMutation = useMutation({
    mutationFn: (newSubject) => api.post('/admin/subjects', newSubject),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subjects'] });
      setIsCreateOpen(false);
      setFormData({});
      setErrors({});
      showToast('✅ Mata pelajaran berhasil dibuat!', 'success');
    },
    onError: (err) => {
      setErrors(err.errors || err.response?.data?.errors || {});
      showToast(`❌ ${err.message || err.response?.data?.message || 'Gagal membuat mata pelajaran'}`, 'error');
    }
  });

  const updateSubjectMutation = useMutation({
    mutationFn: ({ id, ...updatedData }) => api.put(`/admin/subjects/${id}`, updatedData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subjects'] });
      setIsEditOpen(false);
      setSelectedSubject(null);
      setFormData({});
      setErrors({});
      showToast('✅ Mata pelajaran berhasil diupdate!', 'success');
    },
    onError: (err) => {
      setErrors(err.errors || err.response?.data?.errors || {});
      showToast(`❌ ${err.message || err.response?.data?.message || 'Gagal update mata pelajaran'}`, 'error');
    }
  });

  const deleteSubjectMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/subjects/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subjects'] });
      showToast('✅ Mata pelajaran berhasil dihapus!', 'success');
      setConfirmDelete(null);
    },
    onError: (err) => {
      showToast(`❌ ${err.message || err.response?.data?.message || 'Gagal menghapus mata pelajaran'}`, 'error');
    }
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids) => Promise.all(ids.map(id => api.delete(`/admin/subjects/${id}`))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subjects'] });
      setSelectedIds([]);
      showToast('✅ Mata pelajaran berhasil dihapus!', 'success');
      setConfirmBulkDelete(false);
    },
    onError: (err) => {
      showToast(`❌ ${err.message || err.response?.data?.message || 'Gagal menghapus mata pelajaran'}`, 'error');
    }
  });

  const exportSubjectsMutation = useMutation({
    mutationFn: (filters) => api.get('/admin/subjects/export', { params: filters, responseType: 'blob' }),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `subjects-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      showToast('✅ Data berhasil diexport!', 'success');
    },
    onError: () => showToast('❌ Gagal export data', 'error')
  });

  // ═══════════════════════════════════════════════════════════
  // 🎮 HANDLERS
  // ═══════════════════════════════════════════════════════════
  const handleCreateSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      credits: formData.credits ? parseInt(formData.credits) : 4
    };
    createSubjectMutation.mutate(payload);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!selectedSubject) return;
    const payload = {
      ...formData,
      credits: formData.credits ? parseInt(formData.credits) : 4
    };
    updateSubjectMutation.mutate({ id: selectedSubject.id, ...payload });
  };

  const openEditModal = (subject) => {
    setSelectedSubject(subject);
    setFormData({
      code: subject.code || '',
      name: subject.name || '',
      category: subject.category || 'productive',
      credits: subject.credits || 4,
      description: subject.description || '',
      is_active: subject.is_active !== false,
    });
    setIsEditOpen(true);
    setErrors({});
  };

  const openViewModal = (subject) => {
    setSelectedSubject(subject);
    setIsViewOpen(true);
  };

  const handleDelete = (id) => setConfirmDelete(id);
  const confirmDeleteAction = () => { if (confirmDelete) deleteSubjectMutation.mutate(confirmDelete); };
  
  const handleBulkDelete = () => { if (selectedIds.length > 0) setConfirmBulkDelete(true); };
  const confirmBulkDeleteAction = () => { if (selectedIds.length > 0) bulkDeleteMutation.mutate(selectedIds); };

  const toggleSelectAll = () => {
    setSelectedIds(selectedIds.length === subjects.length ? [] : subjects.map(s => s.id));
  };
  
  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const clearSearch = useCallback(() => setSearch(''), []);

  const handleExport = () => {
    exportSubjectsMutation.mutate({
      search: search || undefined,
      category: categoryFilter === 'all' ? undefined : categoryFilter,
    });
  };

  // Calculate stats
  const stats = useMemo(() => {
    const total = subjects.length;
    const productive = subjects.filter(s => s.category === 'productive').length;
    const normative = subjects.filter(s => s.category === 'normative').length;
    const adaptive = subjects.filter(s => s.category === 'adaptive').length;
    const active = subjects.filter(s => s.is_active).length;
    
    return { total, productive, normative, adaptive, active };
  }, [subjects]);

  // ═══════════════════════════════════════════════════════════
  // ⏳ LOADING & ERROR STATES
  // ═══════════════════════════════════════════════════════════
  if (isPending && !isFetching) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-base-cream retro-grid-bg">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }} 
          animate={{ opacity: 1, scale: 1 }} 
          className="text-center"
        >
          <motion.div 
            animate={{ rotate: 360 }} 
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 retro-card bg-retro-orange border-4 border-base-black flex items-center justify-center mx-auto mb-4"
          >
            <BookOpen className="w-8 h-8 text-base-white" />
          </motion.div>
          <p className="font-retro-mono text-base-black/70">Memuat data mata pelajaran...</p>
        </motion.div>
      </div>
    );
  }
  
  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-base-cream retro-grid-bg">
        <div className="retro-card bg-base-white border-4 border-danger p-8 text-center">
          <AlertCircle className="w-12 h-12 text-danger mx-auto mb-3" />
          <p className="retro-heading text-base-black mb-4">Gagal memuat data</p>
          <Button variant="outline" onClick={() => queryClient.invalidateQueries(['admin-subjects'])}>
            Coba Lagi
          </Button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // 🎨 MAIN RENDER - RETRO FUTURISTIC UI
  // ═══════════════════════════════════════════════════════════
  return (
    <motion.div 
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="relative min-h-screen bg-base-cream retro-grid-bg"
    >
      {/* Decorative Elements */}
      <SubjectDecorations />

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0 }}
            className="fixed top-24 right-6 z-50"
          >
            <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER */}
      <motion.div variants={cardVariants} className="retro-card bg-base-white border-4 border-base-black p-6 mb-6 relative">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="retro-heading retro-heading-xl text-retro-orange flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-retro-orange" />
              Manajemen Mata Pelajaran
            </h1>
            <p className="font-retro-mono text-sm text-base-black/70 mt-2">
              Kelola mata pelajaran produktif, normatif, dan adaptif.
            </p>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            {selectedIds.length > 0 && (
              <Button variant="danger" size="sm" onClick={handleBulkDelete} className="flex items-center gap-1.5">
                <Trash2 className="w-4 h-4" /> Hapus ({selectedIds.length})
              </Button>
            )}
            
            <Button variant="outline" size="sm" onClick={handleExport} disabled={exportSubjectsMutation.isLoading} className="flex items-center gap-1.5">
              <Download className="w-4 h-4" /> {exportSubjectsMutation.isLoading ? 'Exporting...' : 'Export'}
            </Button>
            
            {/* View Mode Toggle */}
            <div className="flex bg-base-gray border-2 border-base-black rounded-retro p-1">
              <button
                onClick={() => setActiveView('list')}
                className={`p-2 rounded-retro transition-colors ${activeView === 'list' ? 'bg-retro-orange text-base-white' : 'text-base-black hover:bg-retro-yellow/20'}`}
                title="List View"
              >
                <ListIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setActiveView('grid')}
                className={`p-2 rounded-retro transition-colors ${activeView === 'grid' ? 'bg-retro-orange text-base-white' : 'text-base-black hover:bg-retro-yellow/20'}`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

            <Button 
              onClick={() => { 
                setFormData({ category: 'productive', credits: 4, is_active: true }); 
                setErrors({}); 
                setIsCreateOpen(true); 
              }} 
              className="flex items-center gap-1.5" 
              disabled={createSubjectMutation.isPending}
            >
              <Plus className="w-4 h-4" /> {createSubjectMutation.isPending ? 'Menyimpan...' : 'Tambah Mapel'}
            </Button>
          </div>
        </div>
        
        {/* Decorative Sticker */}
        <motion.div variants={stickerVariants} initial="hidden" animate="visible" className="absolute -top-3 -right-3">
          <div className="retro-sticker bg-retro-lime text-base-black text-[10px] px-3 py-1">
            ADMIN ✨
          </div>
        </motion.div>
      </motion.div>

      {/* STATS OVERVIEW */}
      <motion.div variants={pageVariants} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <RetroStatBox label="Total Mapel" value={stats.total} icon={BookOpen} color="retro-orange" trend={12} delay={0} />
        <RetroStatBox label="Produktif" value={stats.productive} icon={BarChart3} color="retro-purple" delay={100} />
        <RetroStatBox label="Normatif" value={stats.normative} icon={BookOpen} color="retro-blue" delay={200} />
        <RetroStatBox label="Adaptif" value={stats.adaptive} icon={BookOpen} color="retro-lime" delay={300} />
        <RetroStatBox label="Aktif" value={stats.active} icon={CheckCircle2} color="success" delay={400} />
        <RetroStatBox label="Non-Aktif" value={stats.total - stats.active} icon={AlertCircle} color="danger" delay={500} />
      </motion.div>

      {/* FILTERS */}
      <motion.div variants={cardVariants} className="retro-card bg-base-white border-4 border-base-black p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-end lg:items-center justify-between">
          <div className="flex-1 w-full">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-black/40" />
              <input 
                type="text" 
                placeholder="Cari kode atau nama mata pelajaran..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)} 
                className="retro-input w-full pl-10 pr-10" 
              />
              {search && (
                <button 
                  onClick={clearSearch} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-base-black/40 hover:text-retro-orange"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          
          {/* Category Filter Tabs */}
          <div className="flex items-center gap-2 flex-wrap">
            <button 
              onClick={() => setCategoryFilter('all')} 
              className={`retro-btn retro-btn-sm ${categoryFilter === 'all' ? 'bg-retro-orange text-base-white' : 'bg-base-white text-base-black'}`}
            >
              <Filter className="w-4 h-4 mr-1 inline" /> Semua
            </button>
            {categoryOptions.map(cat => (
              <button 
                key={cat.value} 
                onClick={() => setCategoryFilter(cat.value)}
                className={`px-3 py-1.5 rounded-retro text-xs font-black uppercase tracking-wide border-2 border-base-black transition-all ${
                  categoryFilter === cat.value 
                    ? `bg-${cat.color} text-base-white shadow-[2px_2px_0px_0px_#111111]` 
                    : 'bg-base-white text-base-black hover:bg-retro-yellow/20'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* BULK ACTIONS BAR */}
      {selectedIds.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }}
          className="retro-card bg-retro-orange/10 border-4 border-retro-orange p-3 mb-6 flex items-center justify-between"
        >
          <span className="font-retro-mono text-sm text-base-black font-black">
            {selectedIds.length} mata pelajaran terpilih
          </span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setSelectedIds([])}>Batal</Button>
            <Button size="sm" variant="danger" onClick={handleBulkDelete}>Hapus Terpilih</Button>
          </div>
        </motion.div>
      )}

      {/* TABLE / GRID VIEW */}
      {activeView === 'list' ? (
        /* LIST VIEW - TABLE */
        <motion.div variants={cardVariants} className="retro-card bg-base-white border-4 border-base-black overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-retro-orange/10 border-b-4 border-base-black">
                <tr>
                  <th className="px-4 py-3">
                    <input 
                      type="checkbox" 
                      checked={subjects.length > 0 && selectedIds.length === subjects.length} 
                      onChange={toggleSelectAll} 
                      className="w-4 h-4 rounded-sm border-2 border-base-black accent-retro-orange" 
                    />
                  </th>
                  <th className="px-4 py-3 font-retro-display font-black text-base-black uppercase tracking-wide">Mapel</th>
                  <th className="px-4 py-3 font-retro-display font-black text-base-black uppercase tracking-wide hidden md:table-cell">Kode</th>
                  <th className="px-4 py-3 font-retro-display font-black text-base-black uppercase tracking-wide hidden lg:table-cell">Kategori</th>
                  <th className="px-4 py-3 font-retro-display font-black text-base-black uppercase tracking-wide hidden xl:table-cell">Kredit</th>
                  <th className="px-4 py-3 font-retro-display font-black text-base-black uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 font-retro-display font-black text-base-black uppercase tracking-wide text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-base-black/20">
                {subjects.map((subject) => (
                  <motion.tr 
                    key={subject.id} 
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    whileHover={{ x: 4 }}
                    className={`transition-colors ${selectedIds.includes(subject.id) ? 'bg-retro-orange/10' : 'hover:bg-retro-yellow/10'}`}
                  >
                    <td className="px-4 py-4">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(subject.id)} 
                        onChange={() => toggleSelect(subject.id)} 
                        className="w-4 h-4 rounded-sm border-2 border-base-black accent-retro-orange" 
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-retro bg-retro-orange/20 border-2 border-retro-orange flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-retro-orange" />
                        </div>
                        <div>
                          <p className="font-retro-display font-black text-base-black">{subject.name}</p>
                          {subject.description && (
                            <p className="font-retro-mono text-[10px] text-base-black/50 truncate max-w-[250px]">
                              {subject.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <span className="font-retro-mono text-xs text-base-black bg-base-gray border-2 border-base-black px-2 py-1 rounded-sm">
                        {subject.code}
                      </span>
                    </td>
                    <td className="px-4 py-4 hidden lg:table-cell">
                      <RetroCategoryBadge category={subject.category} />
                    </td>
                    <td className="px-4 py-4 font-retro-mono text-base-black hidden xl:table-cell">
                      <span className="font-black">{subject.credits}</span> SKS
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-black ${subject.is_active ? 'text-success' : 'text-danger'}`}>
                        <span className={`w-2 h-2 rounded-sm ${subject.is_active ? 'bg-success animate-pulse' : 'bg-danger'}`} />
                        {subject.is_active ? 'Aktif' : 'Non-Aktif'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => openViewModal(subject)} 
                          title="Lihat Detail"
                          className="p-2 retro-btn retro-btn-sm"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => openEditModal(subject)} 
                          title="Edit"
                          className="p-2 retro-btn retro-btn-sm"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(subject.id)} 
                          title="Hapus"
                          className="p-2 retro-btn retro-btn-sm bg-danger hover:bg-danger/90 text-base-white"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
                {subjects.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center py-12">
                      <div className="text-4xl mb-2">📭</div>
                      <p className="font-retro-mono text-base-black/50">
                        {search || categoryFilter !== 'all' ? 'Tidak ada mata pelajaran yang cocok.' : 'Belum ada data mata pelajaran.'}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="px-6 py-4 border-t-2 border-base-black/20 text-sm font-retro-mono text-base-black flex justify-between items-center bg-base-gray/30">
            <span>
              Menampilkan <strong>{meta.from || 0}</strong> - <strong>{meta.to || 0}</strong> dari <strong>{meta.total || 0}</strong> data
            </span>
            <div className="flex gap-1">
              {[...Array(Math.min(5, (meta.last_page || 1)))].map((_, i) => {
                const currentPage = meta.current_page || 1;
                const lastPage = meta.last_page || 1;
                const pageNum = currentPage <= 3 ? i+1 : currentPage >= lastPage-2 ? lastPage-4+i : currentPage-2+i;
                if (pageNum < 1 || pageNum > lastPage) return null;
                return <button key={pageNum} className={`px-3 py-1.5 retro-btn retro-btn-sm ${pageNum === currentPage ? 'bg-retro-orange text-base-white border-retro-orange shadow-[2px_2px_0px_0px_#111111]' : 'retro-btn-outline'}`}>{pageNum}</button>;
              })}
            </div>
          </div>
        </motion.div>
      ) : (
        /* GRID VIEW */
        <motion.div variants={pageVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
          {subjects.map((subject) => (
            <motion.div 
              key={subject.id} 
              variants={cardVariants}
              whileHover={{ y: -4, scale: 1.02 }}
              className={`retro-card bg-base-white border-4 border-base-black p-4 relative group ${selectedIds.includes(subject.id) ? 'ring-4 ring-retro-orange' : ''}`}
            >
              <div className="absolute top-3 right-3">
                <input 
                  type="checkbox" 
                  checked={selectedIds.includes(subject.id)} 
                  onChange={() => toggleSelect(subject.id)} 
                  className="w-4 h-4 rounded-sm border-2 border-base-black accent-retro-orange" 
                />
              </div>
              
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-retro bg-retro-orange/20 border-2 border-retro-orange flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-retro-orange" />
                </div>
                <div>
                  <h4 className="font-retro-display font-black text-base-black">{subject.name}</h4>
                  <p className="font-retro-mono text-[10px] text-base-black/50">{subject.code}</p>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <RetroCategoryBadge category={subject.category} />
                <div className="flex items-center gap-2 text-sm font-retro-mono">
                  <Clock className="w-4 h-4 text-retro-blue" />
                  <span className="text-base-black font-black">{subject.credits} SKS</span>
                </div>
                {subject.description && (
                  <p className="font-retro-mono text-[10px] text-base-black/50 line-clamp-2">
                    {subject.description}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t-2 border-base-black/20 flex justify-between items-center">
                <span className={`inline-flex items-center gap-1.5 text-xs font-black ${subject.is_active ? 'text-success' : 'text-danger'}`}>
                  <span className={`w-2 h-2 rounded-sm ${subject.is_active ? 'bg-success animate-pulse' : 'bg-danger'}`} />
                  {subject.is_active ? 'Aktif' : 'Non-Aktif'}
                </span>
                <div className="flex gap-1">
                  <button 
                    onClick={() => openEditModal(subject)} 
                    className="p-1.5 retro-btn retro-btn-sm"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(subject.id)} 
                    className="p-1.5 retro-btn retro-btn-sm bg-danger hover:bg-danger/90 text-base-white"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {/* Hover sticker */}
              <motion.div 
                variants={stickerVariants}
                initial="hidden"
                whileHover="visible"
                className="absolute -top-2 -right-2"
              >
                <div className="retro-sticker bg-retro-yellow text-base-black text-[8px] px-2 py-0.5">
                  EDIT
                </div>
              </motion.div>
            </motion.div>
          ))}
          {subjects.length === 0 && (
            <div className="col-span-full text-center py-12">
              <div className="text-4xl mb-2">📭</div>
              <p className="font-retro-mono text-base-black/50">Tidak ada mata pelajaran untuk ditampilkan.</p>
            </div>
          )}
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          MODAL: CREATE / EDIT SUBJECT
          ═══════════════════════════════════════════════════════════ */}
      {(isCreateOpen || isEditOpen) && (
        <Modal 
          isOpen={isCreateOpen || isEditOpen} 
          onClose={() => { setIsCreateOpen(false); setIsEditOpen(false); }} 
          title={isCreateOpen ? "✨ Tambah Mata Pelajaran Baru" : "✏️ Edit Mata Pelajaran"} 
          size="xl"
        >
          <form onSubmit={isCreateOpen ? handleCreateSubmit : handleEditSubmit} className="space-y-6">
            
            {/* Basic Info Section */}
            <div className="space-y-4">
              <h3 className="retro-heading retro-heading-sm text-base-black pb-2 border-b-2 border-base-black/20 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-retro-orange" /> 
                Informasi Mata Pelajaran
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <RetroInput 
                  label="Kode Mapel" 
                  name="code" 
                  value={formData.code} 
                  onChange={setFormData} 
                  error={errors.code} 
                  required 
                  placeholder="Contoh: RPL-101" 
                  icon={Tag} 
                  helperText="Kode unik untuk mata pelajaran" 
                />
                <RetroInput 
                  label="Nama Mapel" 
                  name="name" 
                  value={formData.name} 
                  onChange={setFormData} 
                  error={errors.name} 
                  required 
                  placeholder="Contoh: Pemrograman Web" 
                  icon={BookOpen} 
                />
              </div>
              <RetroTextArea 
                label="Deskripsi" 
                name="description" 
                value={formData.description} 
                onChange={setFormData} 
                error={errors.description} 
                placeholder="Deskripsi singkat tentang mata pelajaran ini..." 
                icon={BookOpen} 
                rows={3} 
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <RetroSelect 
                  label="Kategori" 
                  name="category" 
                  value={formData.category || 'productive'} 
                  onChange={setFormData} 
                  options={categoryOptions} 
                  error={errors.category} 
                  required 
                  icon={BarChart3} 
                />
                <RetroInput 
                  label="Kredit (SKS)" 
                  name="credits" 
                  type="number" 
                  min="1" 
                  max="10" 
                  value={formData.credits} 
                  onChange={setFormData} 
                  error={errors.credits} 
                  required 
                  placeholder="4" 
                  helperText="Jumlah kredit per minggu" 
                />
              </div>
              <div className="flex items-center gap-3 p-3 retro-card bg-base-gray border-2 border-base-black">
                <input 
                  type="checkbox" 
                  id="is_active" 
                  checked={formData.is_active !== false} 
                  onChange={(e) => setFormData({...formData, is_active: e.target.checked})} 
                  className="w-5 h-5 rounded-sm border-2 border-base-black accent-retro-orange" 
                />
                <label htmlFor="is_active" className="font-retro-mono text-sm text-base-black cursor-pointer font-black">
                  Mata Pelajaran Aktif
                </label>
              </div>
            </div>

            {/* Quick Templates */}
            <div className="p-4 retro-card bg-retro-yellow/10 border-2 border-retro-yellow">
              <h4 className="font-retro-display font-black text-base-black text-sm mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-retro-orange" /> 
                Template Cepat
              </h4>
              <div className="flex flex-wrap gap-2">
                {quickTemplates.map((template, idx) => (
                  <button 
                    key={idx}
                    type="button"
                    onClick={() => setFormData({
                      code: template.code,
                      name: template.label,
                      category: template.category,
                      credits: template.credits,
                    })}
                    className="px-3 py-1.5 text-xs font-black uppercase tracking-wide rounded-retro bg-base-white border-2 border-base-black hover:border-retro-orange hover:bg-retro-yellow/20 transition-colors"
                  >
                    {template.label}
                  </button>
                ))}
              </div>
            </div>

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
                loading={createSubjectMutation.isPending || updateSubjectMutation.isPending}
                className="flex items-center gap-2"
              >
                <Rocket className="w-4 h-4" />
                {isCreateOpen ? 'SIMPAN MAPEL' : 'UPDATE MAPEL'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ═══════════════════════════════════════════════════════════
          MODAL: VIEW SUBJECT DETAIL
          ═══════════════════════════════════════════════════════════ */}
      {isViewOpen && selectedSubject && (
        <Modal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} title="📚 Detail Mata Pelajaran" size="lg">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4 pb-4 border-b-2 border-base-black/20">
              <div className="w-16 h-16 rounded-retro bg-retro-orange/20 border-2 border-retro-orange flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-retro-orange" />
              </div>
              <div className="flex-1">
                <h3 className="retro-heading retro-heading-md text-base-black">{selectedSubject.name}</h3>
                <p className="font-retro-mono text-sm text-base-black/50">{selectedSubject.code}</p>
                <div className="flex gap-2 mt-2">
                  <RetroCategoryBadge category={selectedSubject.category} />
                  <span className={`px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wide border-2 ${selectedSubject.is_active ? 'bg-success/10 text-success border-success' : 'bg-danger/10 text-danger border-danger'}`}>
                    {selectedSubject.is_active ? 'Aktif' : 'Non-Aktif'}
                  </span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <RetroStatBox label="Kredit" value={`${selectedSubject.credits} SKS`} icon={Clock} color="retro-orange" />
              <RetroStatBox label="Total Kelas" value={selectedSubject.class_count || 0} icon={Users} color="retro-purple" />
              <RetroStatBox label="Total Siswa" value={selectedSubject.student_count || 0} icon={Users} color="retro-blue" />
              <RetroStatBox label="Jadwal" value={selectedSubject.schedule_count || 0} icon={Calendar} color="retro-lime" />
            </div>

            {/* Details */}
            <div className="space-y-4">
              <h4 className="font-retro-display font-black text-base-black text-sm">Deskripsi</h4>
              <p className="font-retro-mono text-sm text-base-black/70 p-4 rounded-retro bg-base-gray border-2 border-base-black">
                {selectedSubject.description || 'Tidak ada deskripsi'}
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t-2 border-base-black/20">
                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-base-black/40 mt-0.5" />
                  <div>
                    <p className="font-retro-mono text-[10px] text-base-black/50">Dibuat Pada</p>
                    <p className="font-retro-mono text-sm text-base-black font-black">
                      {new Date(selectedSubject.created_at).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-base-black/40 mt-0.5" />
                  <div>
                    <p className="font-retro-mono text-[10px] text-base-black/50">Terakhir Update</p>
                    <p className="font-retro-mono text-sm text-base-black font-black">
                      {new Date(selectedSubject.updated_at).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t-2 border-base-black/20 flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setIsViewOpen(false); openEditModal(selectedSubject); }}>
                <Edit2 className="w-4 h-4 mr-1 inline" /> Edit
              </Button>
              <Button variant="danger" onClick={() => { setIsViewOpen(false); handleDelete(selectedSubject.id); }}>
                <Trash2 className="w-4 h-4 mr-1 inline" /> Hapus
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirmation Modals */}
      <RetroConfirmModal 
        isOpen={!!confirmDelete} 
        onClose={() => setConfirmDelete(null)} 
        onConfirm={confirmDeleteAction}
        title="Hapus Mata Pelajaran?" 
        message="Apakah Anda yakin ingin menghapus mata pelajaran ini? Pastikan tidak ada jadwal yang menggunakan mapel ini." 
      />
      
      <RetroConfirmModal 
        isOpen={confirmBulkDelete} 
        onClose={() => setConfirmBulkDelete(false)} 
        onConfirm={confirmBulkDeleteAction}
        title={`Hapus ${selectedIds.length} Mata Pelajaran?`} 
        message="Apakah Anda yakin ingin menghapus mata pelajaran yang terpilih? Tindakan ini tidak dapat dibatalkan." 
      />

      {/* Decorative Footer Stickers */}
      <div className="fixed bottom-4 left-4 z-0 hidden lg:block pointer-events-none">
        <motion.div 
          animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="retro-sticker bg-retro-pink text-base-white text-[10px] px-3 py-1"
        >
          POWERED BY RPL
        </motion.div>
      </div>
      <div className="fixed bottom-4 right-4 z-0 hidden lg:block pointer-events-none">
        <motion.div 
          animate={{ rotate: [0, 10, -10, 5, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity, delay: 1 }}
          className="retro-sticker bg-retro-lime text-base-black text-[10px] px-3 py-1"
        >
          v2.0 RETRO ✨
        </motion.div>
      </div>
    </motion.div>
  );
}