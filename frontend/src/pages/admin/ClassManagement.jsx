import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, Search, Edit2, Trash2, X, Loader2, School, Users, Calendar,
  Download, Upload, Filter, MoreVertical, Check, ChevronDown, ChevronUp,
  MapPin, Clock, BookOpen, UserPlus, UserMinus, AlertCircle, CheckCircle2,
  Eye, Settings, BarChart3, RefreshCw, ChevronRight, ChevronLeft,
  Menu, Star, Sparkles, Smile, ArrowRight, Target, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../api';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Toast from '../../components/ui/Toast';

// ═══════════════════════════════════════════════════════════
// 🎨 RETRO ANIMATION VARIANTS
// ═══════════════════════════════════════════════════════════
const pageVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1, 
    transition: { staggerChildren: 0.06, delayChildren: 0.1 } 
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, rotate: -1 },
  visible: { 
    opacity: 1, 
    y: 0, 
    rotate: 0,
    transition: { 
      type: "spring", 
      stiffness: 100, 
      damping: 15,
      mass: 0.1 
    } 
  }
};

const stickerVariants = {
  hidden: { scale: 0, rotate: -180 },
  visible: { 
    scale: 1, 
    rotate: 0,
    transition: { type: "spring", stiffness: 200, damping: 10 } 
  },
  hover: { 
    scale: 1.1, 
    rotate: [0, -5, 5, -3, 3, 0],
    transition: { duration: 0.3 }
  }
};

const floatVariants = {
  animate: {
    y: [0, -8, 0],
    rotate: [0, 2, -2, 0],
    transition: { duration: 4, repeat: Infinity, ease: "easeInOut" }
  }
};

// ═══════════════════════════════════════════════════════════
// 🎭 RETRO INPUT COMPONENT
// ═══════════════════════════════════════════════════════════
function RetroInput({ label, name, type = "text", value, onChange, error, required, disabled, placeholder, icon: Icon, helperText }) {
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
        />
        {error && <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-danger" />}
      </div>
      {helperText && <p className="text-[10px] font-retro-mono text-base-black/50">{helperText}</p>}
      {error && <p className="text-danger text-[10px] font-retro-mono mt-0.5">{Array.isArray(error) ? error[0] : error}</p>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// 🎭 RETRO SELECT COMPONENT
// ═══════════════════════════════════════════════════════════
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
// 🎭 RETRO TEACHER MULTI-SELECT
// ═══════════════════════════════════════════════════════════
function RetroTeacherMultiSelect({ label, value, onChange, teachers, error, required }) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredTeachers = useMemo(() => {
    return teachers.filter(t => 
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [teachers, searchTerm]);

  const selectedTeachers = useMemo(() => {
    return teachers.filter(t => (value || []).includes(t.id));
  }, [teachers, value]);

  return (
    <div className="space-y-2">
      <label className="block text-xs font-black uppercase tracking-wider text-base-black">
        {label} {required && <span className="text-retro-orange">*</span>}
      </label>
      
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" />
        <input
          type="text"
          placeholder="Search teachers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="retro-input pl-10 text-sm py-2"
        />
      </div>
      
      {selectedTeachers.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedTeachers.map((teacher) => (
            <motion.span 
              key={teacher.id}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="retro-badge retro-badge-blue text-[10px] px-2 py-0.5 flex items-center gap-1"
            >
              {teacher.name.split(' ')[0]}
              <button type="button" onClick={() => onChange((value || []).filter(id => id !== teacher.id))} className="hover:text-danger">
                <X className="w-3 h-3" />
              </button>
            </motion.span>
          ))}
        </div>
      )}
      
      <div className="max-h-40 overflow-y-auto retro-card bg-base-white p-2">
        {filteredTeachers.length > 0 ? (
          filteredTeachers.map((teacher) => {
            const isSelected = (value || []).includes(teacher.id);
            return (
              <motion.label 
                key={teacher.id}
                whileHover={{ x: 4, backgroundColor: 'rgba(255,201,40,0.1)' }}
                className={`flex items-center gap-3 p-2 cursor-pointer rounded-sm transition-colors ${
                  isSelected ? 'bg-retro-blue/10 border-l-2 border-retro-blue' : ''
                }`}
              >
                <input 
                  type="checkbox" 
                  checked={isSelected} 
                  onChange={(e) => {
                    if (e.target.checked) onChange([...(value || []), teacher.id]);
                    else onChange((value || []).filter(id => id !== teacher.id));
                  }} 
                  className="w-4 h-4 accent-retro-orange border-2 border-base-black" 
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-retro-display font-black text-base-black truncate">{teacher.name}</p>
                  <p className="text-[9px] font-retro-mono text-base-black/50 truncate">{teacher.email}</p>
                </div>
                {isSelected && <Check className="w-4 h-4 text-retro-blue" />}
              </motion.label>
            );
          })
        ) : (
          <p className="p-3 text-[10px] font-retro-mono text-base-black/50 text-center">
            {searchTerm ? 'No results found.' : 'No teachers available.'}
          </p>
        )}
      </div>
      {error && <p className="text-danger text-[10px] font-retro-mono">{Array.isArray(error) ? error[0] : error}</p>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// 🎭 RETRO CONFIRMATION MODAL
// ═══════════════════════════════════════════════════════════
function RetroConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = "Yes, Proceed", cancelText = "Cancel", variant = "danger" }) {
  if (!isOpen) return null;
  
  const variants = {
    danger: { icon: AlertCircle, color: 'text-danger', bg: 'bg-danger/10', border: 'border-danger', btn: 'bg-danger hover:bg-danger/90' },
    warning: { icon: AlertCircle, color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning', btn: 'bg-warning hover:bg-warning/90 text-base-black' },
    success: { icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10', border: 'border-success', btn: 'bg-success hover:bg-success/90' },
  };
  
  const config = variants[variant];
  const Icon = config.icon;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="md">
      <div className="text-center">
        <motion.div
          animate={{ scale: [1, 1.1, 1], rotate: [0, -5, 5, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className={`w-16 h-16 mx-auto mb-4 border-4 border-base-black rounded-retro-lg flex items-center justify-center ${config.bg}`}
        >
          <Icon className={`w-8 h-8 ${config.color}`} />
        </motion.div>
        <p className="font-retro-mono text-sm text-base-black/70 mb-6">{message}</p>
        <div className="flex gap-3 justify-center">
          <button onClick={onClose} className="retro-btn retro-btn-outline">{cancelText}</button>
          <button onClick={onConfirm} className={`retro-btn ${config.btn} text-base-white`}>{confirmText}</button>
        </div>
        <div className="absolute -top-3 -right-3 retro-sticker bg-retro-yellow text-base-black text-[10px] px-2 py-0.5">
          CONFIRM
        </div>
      </div>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════
// 🎭 RETRO DETAIL ITEM
// ═══════════════════════════════════════════════════════════
function RetroDetailItem({ icon: Icon, label, value, valueClass = '', multiline = false }) {
  return (
    <div className="flex items-start gap-3">
      {Icon && <Icon className="w-4 h-4 mt-0.5" />}
      <div>
        <p className="text-[10px] font-black uppercase tracking-wider text-base-black/50">{label}</p>
        <p className={`text-sm font-retro-display font-black text-base-black ${valueClass} ${multiline ? 'whitespace-pre-wrap' : ''}`}>{value}</p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// 🎭 RETRO STAT BOX
// ═══════════════════════════════════════════════════════════
function RetroStatBox({ label, value, icon: Icon, color }) {
  return (
    <motion.div 
      variants={cardVariants}
      whileHover={{ scale: 1.03, rotate: 1 }}
      className="retro-card p-4 text-center bg-base-white"
    >
      {Icon && <Icon className={`w-6 h-6 ${color} mx-auto mb-2`} />}
      <div className={`text-2xl font-retro-display font-black ${color}`}>{value}</div>
      <div className="font-retro-mono text-[10px] uppercase tracking-wide text-base-black/70 mt-1">{label}</div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════
// 🎪 DECORATIVE FLOATING ELEMENTS
// ═══════════════════════════════════════════════════════════
function ClassDecorations() {
  return (
    <>
      <motion.div variants={floatVariants} animate="animate" className="absolute top-20 right-10 z-0 hidden lg:block">
        <div className="retro-smiley text-xl animate-wobble">🏫</div>
      </motion.div>
      <motion.div variants={floatVariants} animate="animate" className="absolute bottom-32 left-20 z-0 hidden lg:block" style={{animationDelay:'1s'}}>
        <Star className="w-8 h-8 text-retro-yellow fill-retro-yellow drop-shadow-retro animate-sparkle-retro" />
      </motion.div>
      <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-retro-purple/20 rounded-blob blur-2xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-retro-lime/20 rounded-blob blur-2xl pointer-events-none" />
    </>
  );
}

// ═══════════════════════════════════════════════════════════
// 🎯 MAIN RETRO CLASS MANAGEMENT COMPONENT
// ═══════════════════════════════════════════════════════════
export default function ClassManagement() {
  const queryClient = useQueryClient();
  
  // State Management
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [teachers, setTeachers] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [toast, setToast] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const debouncedSearch = useDebounce(search, 500);

  // Fetch teachers for form
  useEffect(() => {
    if (isCreateOpen || isEditOpen) {
      api.get('/admin/users', { params: { role: 'guru', is_active: true } })
        .then(res => setTeachers(res.data?.data || []))
        .catch(err => console.error('Failed to fetch teachers:', err));
    }
  }, [isCreateOpen, isEditOpen]);

  // Fetch classes with filters
  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ['admin-classes', debouncedSearch],
    queryFn: () => api.get('/admin/classes', {
      params: { page: 1, search: debouncedSearch || undefined }
    }),
    placeholderData: (prev) => prev,
    staleTime: 30000,
  });

  const classes = data?.data?.data || [];
  const meta = data?.data?.meta || {};

  // Show toast notification
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // ═══════════════════════════════════════════════════════════
  // 🔌 MUTATIONS
  // ═══════════════════════════════════════════════════════════
  const createClassMutation = useMutation({
    mutationFn: (newClass) => api.post('/admin/classes', newClass),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-classes'] });
      setIsCreateOpen(false);
      setFormData({});
      setErrors({});
      showToast('✅ Class created successfully!', 'success');
    },
    onError: (err) => {
      setErrors(err.errors || err.response?.data?.errors || {});
      showToast(`❌ ${err.message || err.response?.data?.message || 'Failed to create class'}`, 'error');
    }
  });

  const updateClassMutation = useMutation({
    mutationFn: ({ id, ...updatedData }) => api.put(`/admin/classes/${id}`, updatedData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-classes'] });
      setIsEditOpen(false);
      setSelectedClass(null);
      setFormData({});
      setErrors({});
      showToast('✅ Class updated successfully!', 'success');
    },
    onError: (err) => {
      setErrors(err.errors || err.response?.data?.errors || {});
      showToast(`❌ ${err.message || err.response?.data?.message || 'Failed to update class'}`, 'error');
    }
  });

  const deleteClassMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/classes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-classes'] });
      showToast('✅ Class deleted successfully!', 'success');
      setConfirmDelete(null);
    },
    onError: (err) => {
      showToast(`❌ ${err.message || err.response?.data?.message || 'Failed to delete class'}`, 'error');
    }
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids) => Promise.all(ids.map(id => api.delete(`/admin/classes/${id}`))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-classes'] });
      setSelectedIds([]);
      showToast('✅ Classes deleted successfully!', 'success');
      setConfirmBulkDelete(false);
    },
    onError: (err) => {
      showToast(`❌ ${err.message || err.response?.data?.message || 'Failed to delete classes'}`, 'error');
    }
  });

  // ═══════════════════════════════════════════════════════════
  // 🎮 HANDLERS
  // ═══════════════════════════════════════════════════════════
  const handleCreateSubmit = (e) => {
    e.preventDefault();
    const payload = { 
      ...formData,
      capacity: formData.capacity ? parseInt(formData.capacity) : 36,
      teacher_ids: (formData.teacher_ids && formData.teacher_ids.length > 0) ? formData.teacher_ids : undefined
    };
    createClassMutation.mutate(payload);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!selectedClass) return;
    const payload = { 
      ...formData,
      capacity: formData.capacity ? parseInt(formData.capacity) : 36,
      teacher_ids: (formData.teacher_ids && formData.teacher_ids.length > 0) ? formData.teacher_ids : undefined
    };
    updateClassMutation.mutate({ id: selectedClass.id, ...payload });
  };

  const openEditModal = (cls) => {
    setSelectedClass(cls);
    setFormData({
      name: cls.name || '',
      level: cls.level || 'X',
      description: cls.description || '',
      capacity: cls.capacity || 36,
      is_active: cls.is_active !== false,
      teacher_ids: cls.teachers?.map(t => t.id) || [],
    });
    setIsEditOpen(true);
    setErrors({});
  };

  const openViewModal = (cls) => {
    setSelectedClass(cls);
    setIsViewOpen(true);
  };

  const handleDelete = (id) => setConfirmDelete(id);
  const confirmDeleteAction = () => { if (confirmDelete) deleteClassMutation.mutate(confirmDelete); };
  const handleBulkDelete = () => { if (selectedIds.length > 0) setConfirmBulkDelete(true); };
  const confirmBulkDeleteAction = () => { if (selectedIds.length > 0) bulkDeleteMutation.mutate(selectedIds); };

  const toggleSelectAll = () => {
    setSelectedIds(selectedIds.length === classes.length ? [] : classes.map(c => c.id));
  };
  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };
  const clearSearch = useCallback(() => setSearch(''), []);

  // ═══════════════════════════════════════════════════════════
  // ⏳ LOADING STATE (RETRO STYLE)
  // ═══════════════════════════════════════════════════════════
  if (isLoading && !isFetching) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-retro-grid">
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-20 h-20 mx-auto mb-4 border-4 border-base-black rounded-retro-lg flex items-center justify-center bg-retro-orange shadow-hard">
            <School className="w-10 h-10 text-base-white animate-pulse" />
          </motion.div>
          <h2 className="retro-heading retro-heading-orange text-2xl mb-2">LOADING CLASSES</h2>
          <p className="font-retro-mono text-sm text-base-black/70 mb-4">Fetching awesome classrooms...</p>
          <div className="w-48 mx-auto h-4 border-4 border-base-black rounded-sm overflow-hidden bg-base-white">
            <motion.div className="h-full bg-retro-blue" animate={{ x: ['-100%', '100%'] }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} style={{ width: '50%' }} />
          </div>
          <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 0.5, repeat: Infinity }} className="mt-4">
            <Smile className="w-6 h-6 text-retro-yellow mx-auto animate-wobble" />
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // ❌ ERROR STATE (RETRO STYLE)
  // ═══════════════════════════════════════════════════════════
  if (isError) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="retro-card p-8 text-center max-w-lg mx-auto bg-base-white">
        <motion.div animate={{ scale: [1, 1.1, 1], rotate: [0, -5, 5, 0] }} transition={{ duration: 0.5, repeat: Infinity }}
          className="w-16 h-16 mx-auto mb-4 border-4 border-base-black rounded-retro-lg flex items-center justify-center bg-danger shadow-[4px_4px_0px_0px_#111111]">
          <AlertCircle className="w-8 h-8 text-base-white" />
        </motion.div>
        <h3 className="retro-heading text-xl mb-3 text-base-black">Oops! Connection Error</h3>
        <p className="font-retro-mono text-sm text-base-black/70 mb-5">Failed to load class data.</p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => queryClient.invalidateQueries(['admin-classes'])} className="retro-btn retro-btn-secondary flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
          <button onClick={() => window.history.back()} className="retro-btn retro-btn-outline">Go Back</button>
        </div>
        <div className="absolute -top-3 -right-3 retro-sticker bg-retro-yellow text-base-black text-xs px-3 py-1">ERROR!</div>
      </motion.div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // 🎨 MAIN RENDER - RETRO FUTURISTIC CLASS MANAGEMENT
  // ═══════════════════════════════════════════════════════════
  return (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" className="relative min-h-screen bg-base-cream retro-grid-bg">
      
      {/* Decorative floating elements */}
      <ClassDecorations />

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed top-24 right-6 z-50">
            <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div variants={cardVariants} className="sticky top-4 z-30 px-4 md:px-6">
        <div className="retro-card max-w-4xl mx-auto p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <School className="w-6 h-6 text-retro-orange" />
            <span className="font-retro-display font-black text-base-black text-lg">CLASS MANAGEMENT</span>
          </div>
          <div className="flex items-center gap-2">
            {selectedIds.length > 0 && (
              <button onClick={handleBulkDelete} className="retro-btn retro-btn-sm bg-danger hover:bg-danger/90 text-base-white flex items-center gap-1">
                <Trash2 className="w-4 h-4" /> Delete ({selectedIds.length})
              </button>
            )}
            <button onClick={() => { setFormData({level:'X',capacity:36,is_active:true}); setErrors({}); setIsCreateOpen(true); }} 
              className="retro-btn retro-btn-sm" disabled={createClassMutation.isLoading}>
              <Plus className="w-4 h-4" /> {createClassMutation.isLoading ? 'Saving...' : 'Add Class'}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="px-4 md:px-6 py-6 max-w-7xl mx-auto">
        
        {/* Page Header */}
        <motion.div variants={cardVariants} className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="retro-heading retro-heading-xl text-retro-orange mb-2 flex items-center gap-3">
                <span className="inline-block animate-wobble">🏫</span>
                MANAGE CLASSES
                <span className="inline-block animate-bounce-retro">✨</span>
              </h1>
              <p className="font-retro-mono text-base-black/70 flex items-center gap-2">
                <span className="retro-badge retro-badge-blue text-[10px]">Admin</span>
                <span className="font-bold">{classes.length} classes</span>
                <span className="text-base-black/40">•</span>
                <span>{meta.total || 0} total</span>
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="retro-badge retro-badge-green"><CheckCircle2 className="w-3 h-3 mr-1" /> Active: {classes.filter(c=>c.is_active).length}</div>
              <div className="retro-badge retro-badge-purple"><Clock className="w-3 h-3 mr-1" /> {new Date().toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})}</div>
            </div>
          </div>
        </motion.div>

        {/* Search */}
        <motion.div variants={cardVariants} className="retro-card p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" />
                <input type="text" placeholder="Search class name or description..." value={search} onChange={(e) => setSearch(e.target.value)} className="retro-input pl-10 pr-10 w-full" />
                {search && <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 hover:text-danger"><X className="w-4 h-4" /></button>}
              </div>
            </div>
            <div className="flex gap-2">
              <button className="retro-btn retro-btn-sm retro-btn-outline flex items-center gap-1">
                <Filter className="w-4 h-4" /> Filter
              </button>
              <button className="retro-btn retro-btn-sm retro-btn-outline flex items-center gap-1">
                <Download className="w-4 h-4" /> Export
              </button>
            </div>
          </div>
        </motion.div>

        {/* Bulk Actions Bar */}
        {selectedIds.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="retro-card p-3 mb-4 bg-retro-orange/10 border-retro-orange flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wide text-base-black">{selectedIds.length} class(es) selected</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setSelectedIds([])} className="retro-btn retro-btn-sm retro-btn-outline">Cancel</button>
              <button onClick={handleBulkDelete} className="retro-btn retro-btn-sm bg-danger hover:bg-danger/90 text-base-white">Delete Selected</button>
            </div>
          </motion.div>
        )}

        {/* Tabs */}
        <motion.div variants={cardVariants} className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'schedule', label: 'Schedule', icon: Calendar },
            { id: 'students', label: 'Students', icon: Users },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 font-black text-xs uppercase tracking-wide rounded-retro border-2 border-base-black transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-retro-orange text-base-white shadow-[2px_2px_0px_0px_#111111]'
                    : 'bg-base-white text-base-black hover:bg-retro-yellow'
                }`}
              >
                <Icon className="w-4 h-4 inline mr-1" />
                {tab.label}
              </button>
            );
          })}
        </motion.div>

        {/* Classes Table */}
        {activeTab === 'overview' && (
          <motion.div variants={cardVariants} className="retro-card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full font-retro-mono text-sm">
                <thead>
                  <tr className="bg-retro-blue text-base-white border-b-4 border-base-black">
                    <th className="text-left py-3 px-4 font-black uppercase tracking-wide text-xs"><input type="checkbox" checked={classes.length > 0 && selectedIds.length === classes.length} onChange={toggleSelectAll} className="w-4 h-4 accent-retro-orange border-2 border-base-black" /></th>
                    <th className="text-left py-3 px-4 font-black uppercase tracking-wide text-xs">Class</th>
                    <th className="text-left py-3 px-4 font-black uppercase tracking-wide text-xs hidden md:table-cell">Level</th>
                    <th className="text-left py-3 px-4 font-black uppercase tracking-wide text-xs hidden lg:table-cell">Capacity</th>
                    <th className="text-left py-3 px-4 font-black uppercase tracking-wide text-xs hidden xl:table-cell">Homeroom</th>
                    <th className="text-left py-3 px-4 font-black uppercase tracking-wide text-xs">Status</th>
                    <th className="text-right py-3 px-4 font-black uppercase tracking-wide text-xs">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-base-black/10">
                  {classes.map((cls, index) => (
                    <motion.tr key={cls.id} variants={cardVariants} initial="hidden" animate="visible" style={{transitionDelay:`${index*30}ms`}}
                      whileHover={{ backgroundColor: 'rgba(255,201,40,0.2)' }} className={`transition-colors ${selectedIds.includes(cls.id) ? 'bg-retro-yellow/20' : ''}`}>
                      <td className="py-4 px-4"><input type="checkbox" checked={selectedIds.includes(cls.id)} onChange={() => toggleSelect(cls.id)} className="w-4 h-4 accent-retro-orange border-2 border-base-black" /></td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <motion.div whileHover={{ scale: 1.1, rotate: 5 }} className="w-10 h-10 retro-card bg-retro-orange/20 border-retro-orange flex items-center justify-center">
                            <School className="w-5 h-5 text-retro-orange" />
                          </motion.div>
                          <div>
                            <p className="font-retro-display font-black text-base-black text-sm leading-none">{cls.name}</p>
                            {cls.description && <p className="font-retro-mono text-[10px] text-base-black/50 truncate max-w-[150px]">{cls.description}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 hidden md:table-cell">
                        <span className="retro-badge retro-badge-blue text-[10px]">Grade {cls.level}</span>
                      </td>
                      <td className="py-4 px-4 hidden lg:table-cell">
                        <span className="font-bold">{cls.student_count || 0}</span> / {cls.capacity}
                      </td>
                      <td className="py-4 px-4 hidden xl:table-cell">
                        <span className="font-retro-mono text-xs">{cls.wali_kelas?.name || '-'}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`retro-badge text-[10px] ${cls.is_active ? 'retro-badge-green' : 'retro-badge-red'}`}>
                          {cls.is_active ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openViewModal(cls)} title="View" className="p-2 retro-btn retro-btn-sm retro-btn-outline hover:bg-retro-yellow"><Eye className="w-4 h-4" /></button>
                          <button onClick={() => openEditModal(cls)} title="Edit" className="p-2 retro-btn retro-btn-sm retro-btn-outline hover:bg-retro-yellow"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(cls.id)} title="Delete" className="p-2 retro-btn retro-btn-sm bg-danger hover:bg-danger/90 text-base-white"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                  {classes.length === 0 && (
                    <tr><td colSpan="7" className="text-center py-12">
                      <FileText className="w-12 h-12 text-base-black/20 mx-auto mb-3" />
                      <p className="font-retro-mono text-sm text-base-black/50">{search ? 'No classes found.' : 'No classes yet.'}</p>
                      <button onClick={() => { setFormData({level:'X',capacity:36}); setIsCreateOpen(true); }} className="retro-btn retro-btn-sm mt-3">Add First Class →</button>
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            <div className="px-4 py-3 border-t-4 border-base-black bg-retro-yellow/10 flex justify-between items-center text-xs font-retro-mono">
              <span>Showing <strong>{meta.from || 0}</strong>-<strong>{meta.to || 0}</strong> of <strong>{meta.total || 0}</strong></span>
              <div className="flex gap-1">
                <button className="px-3 py-1 retro-btn retro-btn-sm retro-btn-outline" disabled>← Prev</button>
                <button className="px-3 py-1 retro-btn retro-btn-sm bg-retro-orange text-base-white border-retro-orange shadow-[2px_2px_0px_0px_#111111]">1</button>
                <button className="px-3 py-1 retro-btn retro-btn-sm retro-btn-outline" disabled>Next →</button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Schedule Tab Placeholder */}
        {activeTab === 'schedule' && (
          <motion.div variants={cardVariants} className="retro-card p-8 text-center">
            <Calendar className="w-16 h-16 text-retro-orange mx-auto mb-4" />
            <h3 className="retro-heading text-lg mb-2">Schedule Management</h3>
            <p className="font-retro-mono text-sm text-base-black/50 mb-4">Manage class schedules and timetables.</p>
            <button className="retro-btn retro-btn-outline">Coming Soon →</button>
          </motion.div>
        )}

        {/* Students Tab Placeholder */}
        {activeTab === 'students' && (
          <motion.div variants={cardVariants} className="retro-card p-8 text-center">
            <Users className="w-16 h-16 text-retro-blue mx-auto mb-4" />
            <h3 className="retro-heading text-lg mb-2">Student Management</h3>
            <p className="font-retro-mono text-sm text-base-black/50 mb-4">View and manage students in this class.</p>
            <button className="retro-btn retro-btn-outline">Coming Soon →</button>
          </motion.div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════
          🎭 MODAL: CREATE / EDIT CLASS (RETRO STYLE)
          ═══════════════════════════════════════════════════════════ */}
      {(isCreateOpen || isEditOpen) && (
        <Modal isOpen={isCreateOpen || isEditOpen} onClose={() => { setIsCreateOpen(false); setIsEditOpen(false); }} 
          title={isCreateOpen ? "✨ ADD NEW CLASS" : "✏️ EDIT CLASS"} size="2xl">
          <form onSubmit={isCreateOpen ? handleCreateSubmit : handleEditSubmit} className="space-y-5">
            
            {/* Section 1: Basic Info */}
            <div className="space-y-4">
              <h3 className="retro-heading retro-heading-sm text-retro-blue flex items-center gap-2">
                <School className="w-5 h-5" /> CLASS INFO
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <RetroInput label="Class Name" name="name" value={formData.name} onChange={setFormData} error={errors.name} required placeholder="RPL X-1" icon={School} />
                <RetroSelect label="Grade Level" name="level" value={formData.level || 'X'} onChange={setFormData} 
                  options={[{value:'X',label:'Grade X'},{value:'XI',label:'Grade XI'},{value:'XII',label:'Grade XII'}]} 
                  error={errors.level} required icon={BarChart3} />
              </div>
              <RetroInput label="Description" name="description" value={formData.description} onChange={setFormData} error={errors.description} placeholder="Brief description about this class..." />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <RetroInput label="Max Capacity" name="capacity" type="number" value={formData.capacity} onChange={setFormData} error={errors.capacity} placeholder="36" helperText="Maximum students in class" />
                <div className="flex items-center pt-6">
                  <input type="checkbox" id="is_active" checked={formData.is_active !== false} onChange={(e) => setFormData({...formData, is_active: e.target.checked})} className="w-4 h-4 accent-retro-orange border-2 border-base-black" />
                  <label htmlFor="is_active" className="ml-2 text-xs font-retro-mono text-base-black/70 cursor-pointer">Active Class</label>
                </div>
              </div>
            </div>

            {/* Section 2: Teachers */}
            <div className="space-y-4">
              <h3 className="retro-heading retro-heading-sm text-retro-purple flex items-center gap-2">
                <Users className="w-5 h-5" /> ASSIGN TEACHERS
              </h3>
              <RetroTeacherMultiSelect label="Homeroom & Subject Teachers" value={formData.teacher_ids} onChange={(v) => setFormData({...formData, teacher_ids: v})} teachers={teachers} error={errors.teacher_ids} />
              <p className="text-[10px] font-retro-mono text-base-black/50">💡 First teacher selected will be the homeroom teacher.</p>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 flex justify-end gap-3 border-t-4 border-base-black sticky bottom-0 bg-base-cream py-4">
              <button type="button" onClick={() => { setIsCreateOpen(false); setIsEditOpen(false); }} className="retro-btn retro-btn-outline">Cancel</button>
              <button type="submit" className="retro-btn" disabled={createClassMutation.isLoading || updateClassMutation.isLoading}>
                {isCreateOpen ? '💾 Create Class' : '✏️ Update Class'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ═══════════════════════════════════════════════════════════
          👁️ MODAL: VIEW CLASS DETAIL (RETRO STYLE)
          ═══════════════════════════════════════════════════════════ */}
      {isViewOpen && selectedClass && (
        <Modal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} title="📚 CLASS PROFILE" size="lg">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4 pb-4 border-b-4 border-base-black">
              <motion.div whileHover={{ scale: 1.05, rotate: 3 }} className="w-20 h-20 retro-card bg-retro-orange/20 border-retro-orange flex items-center justify-center">
                <School className="w-10 h-10 text-retro-orange" />
              </motion.div>
              <div>
                <h3 className="retro-heading retro-heading-lg text-base-black">{selectedClass.name}</h3>
                <p className="font-retro-mono text-sm text-base-black/70">{selectedClass.description || 'No description'}</p>
                <div className="flex gap-2 mt-2">
                  <span className="retro-badge retro-badge-blue text-[10px]">Grade {selectedClass.level}</span>
                  <span className={`retro-badge text-[10px] ${selectedClass.is_active ? 'retro-badge-green' : 'retro-badge-red'}`}>
                    {selectedClass.is_active ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <RetroStatBox label="Students" value={selectedClass.student_count || 0} icon={Users} color="text-retro-blue" />
              <RetroStatBox label="Capacity" value={selectedClass.capacity || 36} icon={MapPin} color="text-retro-purple" />
              <RetroStatBox label="Available" value={(selectedClass.capacity || 36) - (selectedClass.student_count || 0)} icon={CheckCircle2} color="text-success" />
              <RetroStatBox label="Subjects" value={selectedClass.subject_count || 0} icon={BookOpen} color="text-retro-orange" />
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <RetroDetailItem icon={Calendar} label="Created" value={new Date(selectedClass.created_at).toLocaleDateString('id-ID')} />
                <RetroDetailItem icon={Clock} label="Updated" value={new Date(selectedClass.updated_at).toLocaleDateString('id-ID')} />
                {selectedClass.slug && <RetroDetailItem label="Slug" value={selectedClass.slug} />}
              </div>
              <div className="space-y-3">
                {selectedClass.teachers?.length > 0 && (
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-base-black/50 mb-1">Teachers</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedClass.teachers.map((t) => (
                        <span key={t.id} className="retro-badge retro-badge-purple text-[9px]">{t.name}</span>
                      ))}
                    </div>
                  </div>
                )}
                {selectedClass.subjects?.length > 0 && (
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-base-black/50 mb-1">Subjects</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedClass.subjects.map((s) => (
                        <span key={s.id} className="retro-badge retro-badge-orange text-[9px]">{s.code}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t-4 border-base-black flex justify-end gap-2">
              <button onClick={() => { setIsViewOpen(false); openEditModal(selectedClass); }} className="retro-btn retro-btn-outline"><Edit2 className="w-4 h-4 mr-1" /> Edit</button>
              <button onClick={() => { setIsViewOpen(false); /* Navigate to schedule */ }} className="retro-btn retro-btn-secondary"><Calendar className="w-4 h-4 mr-1" /> Schedule</button>
              <button onClick={() => { setIsViewOpen(false); handleDelete(selectedClass.id); }} className="retro-btn bg-danger hover:bg-danger/90 text-base-white"><Trash2 className="w-4 h-4 mr-1" /> Delete</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirmation Modals */}
      <RetroConfirmModal isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={confirmDeleteAction}
        title="Delete Class?" message="Are you sure you want to delete this class? All related data will be affected." />
      <RetroConfirmModal isOpen={confirmBulkDelete} onClose={() => setConfirmBulkDelete(false)} onConfirm={confirmBulkDeleteAction}
        title={`Delete ${selectedIds.length} Class(es)?`} message="Are you sure you want to delete the selected classes? This action cannot be undone." />

      {/* Floating Action Button */}
      <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
        onClick={() => { setFormData({level:'X',capacity:36}); setIsCreateOpen(true); }}
        className="fixed bottom-6 right-6 z-50 retro-btn retro-btn-lg retro-btn-sticker hidden md:flex items-center gap-2">
        <Plus className="w-5 h-5" /><span className="hidden lg:inline">Add Class</span>
      </motion.button>

      {/* Decorative Footer Stickers */}
      <div className="fixed bottom-4 left-4 z-0 hidden lg:block pointer-events-none">
        <motion.div animate={{ rotate: [0, -10, 10, -5, 5, 0] }} transition={{ duration: 3, repeat: Infinity }} className="retro-sticker bg-retro-pink text-base-white text-[10px] px-3 py-1">POWERED BY RPL</motion.div>
      </div>
      <div className="fixed bottom-4 right-4 z-0 hidden lg:block pointer-events-none">
        <motion.div animate={{ rotate: [0, 10, -10, 5, -5, 0] }} transition={{ duration: 3, repeat: Infinity, delay: 1 }} className="retro-sticker bg-retro-lime text-base-black text-[10px] px-3 py-1">v2.0 RETRO ✨</motion.div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════
// 🔧 DEBOUNCE HOOK (Kept from original)
// ═══════════════════════════════════════════════════════════
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}