import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, Search, Edit2, Trash2, X, Loader2, School, Users, Calendar,
  Download, Upload, Filter, MoreVertical, Check, ChevronDown, ChevronUp,
  MapPin, Clock, BookOpen, UserPlus, UserMinus, AlertCircle, CheckCircle2,
  Eye, Settings, BarChart3, RefreshCw, ChevronRight, ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../api';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Toast from '../../components/ui/Toast';

// ═══════════════════════════════════════════════════════════
// ANIMATION VARIANTS
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
// DEBOUNCE HOOK
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
// INPUT FIELD COMPONENT
// ═══════════════════════════════════════════════════════════
function InputField({ label, name, type = "text", value, onChange, error, required, disabled, placeholder, icon: Icon, helperText, ...props }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700 dark:text-dark-muted">
        <span className="flex items-center gap-1.5">
          {Icon && <Icon className="w-4 h-4 text-gray-400" />}
          {label}
          {required && <span className="text-danger">*</span>}
        </span>
      </label>
      <div className="relative">
        <input
          type={type}
          name={name}
          value={value || ''}
          onChange={(e) => onChange(prev => ({ ...prev, [name]: e.target.value }))}
          className="input w-full"
          required={required}
          disabled={disabled}
          placeholder={placeholder}
          {...props}
        />
        {error && <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-danger" />}
      </div>
      {helperText && <p className="text-xs text-gray-500 dark:text-gray-600">{helperText}</p>}
      {error && <p className="text-danger text-xs mt-0.5">{Array.isArray(error) ? error[0] : error}</p>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// SELECT FIELD COMPONENT
// ═══════════════════════════════════════════════════════════
function SelectField({ label, name, value, onChange, options, error, required, disabled, icon: Icon, placeholder }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700 dark:text-dark-muted">
        <span className="flex items-center gap-1.5">
          {Icon && <Icon className="w-4 h-4 text-gray-400" />}
          {label}
          {required && <span className="text-danger">*</span>}
        </span>
      </label>
      <select
        name={name}
        value={value || ''}
        onChange={(e) => onChange(prev => ({ ...prev, [name]: e.target.value }))}
        className="input w-full"
        required={required}
        disabled={disabled}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="text-danger text-xs mt-0.5">{Array.isArray(error) ? error[0] : error}</p>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// TEACHER MULTI-SELECT COMPONENT
// ═══════════════════════════════════════════════════════════
function TeacherMultiSelect({ label, value, onChange, teachers, error, required }) {
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
      <label className="block text-sm font-medium text-gray-700 dark:text-dark-muted">
        {label} {required && <span className="text-danger">*</span>}
      </label>
      
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Cari guru..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input pl-9 text-sm py-2"
        />
      </div>
      
      {selectedTeachers.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedTeachers.map((teacher) => (
            <span key={teacher.id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/30">
              {teacher.name.split(' ')[0]}
              <button type="button" onClick={() => onChange((value || []).filter(id => id !== teacher.id))} className="hover:text-danger transition-colors">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      
      <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-dark-border rounded-xl">
        {filteredTeachers.length > 0 ? (
          filteredTeachers.map((teacher) => {
            const isSelected = (value || []).includes(teacher.id);
            return (
              <label key={teacher.id} className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${isSelected ? 'bg-primary-500/10 border-l-2 border-primary-500' : 'hover:bg-gray-50 dark:hover:bg-dark-card/50'}`}>
                <input type="checkbox" checked={isSelected} onChange={(e) => {
                  if (e.target.checked) onChange([...(value || []), teacher.id]);
                  else onChange((value || []).filter(id => id !== teacher.id));
                }} className="w-4 h-4 text-primary-600 rounded border-gray-300 dark:border-dark-border" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{teacher.name}</p>
                  <p className="text-xs text-gray-500 dark:text-dark-muted truncate">{teacher.email}</p>
                </div>
                {isSelected && <Check className="w-4 h-4 text-primary-600" />}
              </label>
            );
          })
        ) : (
          <p className="p-4 text-sm text-gray-500 text-center">{searchTerm ? 'Tidak ada hasil pencarian.' : 'Tidak ada data guru.'}</p>
        )}
      </div>
      {error && <p className="text-danger text-xs">{Array.isArray(error) ? error[0] : error}</p>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// CONFIRMATION MODAL
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
        <div className={`w-14 h-14 mx-auto mb-4 rounded-2xl ${config.bg} ${config.border} border flex items-center justify-center`}>
          <Icon className={`w-7 h-7 ${config.color}`} />
        </div>
        <p className="text-gray-600 dark:text-dark-muted mb-6">{message}</p>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={onClose}>{cancelText}</Button>
          <Button variant={variant} onClick={onConfirm}>{confirmText}</Button>
        </div>
      </div>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════
// DETAIL ITEM HELPER
// ═══════════════════════════════════════════════════════════
function DetailItem({ icon: Icon, label, value, valueClass = '', multiline = false }) {
  return (
    <div className="flex items-start gap-3">
      {Icon && <Icon className="w-4 h-4 text-gray-400 mt-0.5" />}
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-600">{label}</p>
        <p className={`text-sm font-medium text-gray-900 dark:text-white ${valueClass} ${multiline ? 'whitespace-pre-wrap' : ''}`}>{value}</p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════
export default function ClassManagement() {
  const queryClient = useQueryClient();
  
  // State Management
  const [search, setSearch] = useState('');
  const [levelFilter] = useState('all');
  const [statusFilter] = useState('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);

  const [toast, setToast] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const debouncedSearch = useDebounce(search, 500);

  // Fetch teachers & subjects for form
  useEffect(() => {
    if (isCreateOpen || isEditOpen) {
      Promise.all([
        api.get('/admin/users', { params: { role: 'guru', is_active: true } })
      ]).then(([teachersRes]) => {
        setTeachers(teachersRes.data?.data || []);
      }).catch(err => console.error('Failed to fetch data:', err));
    }
  }, [isCreateOpen, isEditOpen]);

  // Fetch classes with filters
  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ['admin-classes', debouncedSearch],
    queryFn: () => api.get('/admin/classes', {
      params: {
        page: 1,
        search: debouncedSearch || undefined,
      }
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
  // MUTATIONS
  // ═══════════════════════════════════════════════════════════
  const createClassMutation = useMutation({
    mutationFn: (newClass) => api.post('/admin/classes', newClass),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-classes'] });
      setIsCreateOpen(false);
      setFormData({});
      setErrors({});
      showToast('✅ Kelas berhasil dibuat!', 'success');
    },
    onError: (err) => {
      setErrors(err.errors || err.response?.data?.errors || {});
      showToast(`❌ ${err.message || err.response?.data?.message || 'Gagal membuat kelas'}`, 'error');
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
      showToast('✅ Kelas berhasil diupdate!', 'success');
    },
    onError: (err) => {
      setErrors(err.errors || err.response?.data?.errors || {});
      showToast(`❌ ${err.message || err.response?.data?.message || 'Gagal update kelas'}`, 'error');
    }
  });

  const deleteClassMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/classes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-classes'] });
      showToast('✅ Kelas berhasil dihapus!', 'success');
      setConfirmDelete(null);
    },
    onError: (err) => {
      showToast(`❌ ${err.message || err.response?.data?.message || 'Gagal menghapus kelas'}`, 'error');
    }
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids) => Promise.all(ids.map(id => api.delete(`/admin/classes/${id}`))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-classes'] });
      setSelectedIds([]);
      showToast('✅ Kelas berhasil dihapus!', 'success');
      setConfirmBulkDelete(false);
    },
    onError: (err) => {
      showToast(`❌ ${err.message || err.response?.data?.message || 'Gagal menghapus kelas'}`, 'error');
    }
  });



  // ═══════════════════════════════════════════════════════════
  // HANDLERS
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
  // LOADING & ERROR
  // ═══════════════════════════════════════════════════════════
  if (isLoading && !isFetching) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="w-14 h-14 border-3 border-primary-500/30 border-t-primary-400 rounded-full mx-auto mb-4" />
          <p className="text-gray-600 dark:text-dark-muted">Memuat data kelas...</p>
        </motion.div>
      </div>
    );
  }
  
  if (isError) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="w-12 h-12 text-danger mx-auto mb-3" />
        <p className="text-danger font-medium mb-2">Gagal memuat data</p>
        <Button variant="outline" onClick={() => queryClient.invalidateQueries(['admin-classes'])}>Coba Lagi</Button>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6 relative min-h-screen">
      
      {/* ═══════════════════════════════════════════════════
          ANIMATED BACKGROUND ORBS (Space Effect)
          ═══════════════════════════════════════════════════ */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <motion.div 
          animate={{ x: [0, 40, 0], y: [0, -30, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-10 left-10 w-80 h-80 bg-primary-500/10 rounded-full blur-3xl"
        />
        <motion.div 
          animate={{ x: [0, -35, 0], y: [0, 35, 0], scale: [1, 0.9, 1] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-10 right-10 w-80 h-80 bg-accent-cyan/10 rounded-full blur-3xl"
        />
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="fixed top-24 right-6 z-50">
            <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2.5">
            <School className="w-6 h-6 text-primary-400" />
            <span className="text-gradient">Manajemen Kelas</span>
          </h1>
          <p className="text-gray-600 dark:text-dark-muted mt-1.5 ml-9">Kelola kelas, penjadwalan, dan penugasan guru.</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <Button variant="danger" size="sm" onClick={handleBulkDelete} className="flex items-center gap-1.5">
              <Trash2 className="w-4 h-4" /> Hapus ({selectedIds.length})
            </Button>
          )}
          <Button onClick={() => { setFormData({ level: 'X', capacity: 36, is_active: true }); setErrors({}); setIsCreateOpen(true); }} 
            className="flex items-center gap-1.5" disabled={createClassMutation.isLoading}>
            <Plus className="w-4 h-4" /> {createClassMutation.isLoading ? 'Menyimpan...' : 'Tambah Kelas'}
          </Button>
        </div>
      </motion.div>

      {/* FILTERS */}
      <motion.div variants={itemVariants} className="card">
        <div className="flex flex-col lg:flex-row gap-4 items-end lg:items-center justify-between">
          <div className="flex-1 w-full">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Cari nama kelas atau deskripsi..." value={search}
                onChange={(e) => setSearch(e.target.value)} className="input pl-10 pr-10 w-full" />
              {search && (
                <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* BULK ACTIONS BAR */}
      {selectedIds.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} 
          className="flex items-center justify-between p-3 bg-primary-500/10 border border-primary-500/30 rounded-xl">
          <span className="text-sm text-primary-600 dark:text-primary-400 font-medium">
            {selectedIds.length} kelas terpilih
          </span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setSelectedIds([])}>Batal</Button>
            <Button size="sm" variant="danger" onClick={handleBulkDelete}>Hapus Terpilih</Button>
          </div>
        </motion.div>
      )}

      {/* TABS */}
      <motion.div variants={itemVariants} className="flex gap-2 border-b border-gray-200 dark:border-dark-border pb-1">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'schedule', label: 'Jadwal', icon: Calendar },
          { id: 'students', label: 'Siswa', icon: Users },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400 border-b-2 border-primary-500'
                  : 'text-gray-600 dark:text-dark-muted hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </motion.div>

      {/* TABLE */}
      <motion.div variants={itemVariants} className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-dark-card border-b border-gray-200 dark:border-dark-border">
              <tr>
                <th className="px-4 py-3">
                  <input type="checkbox" checked={classes.length > 0 && selectedIds.length === classes.length} 
                    onChange={toggleSelectAll} className="w-4 h-4 rounded border-gray-300 dark:border-dark-border" />
                </th>
                <th className="px-4 py-3 font-medium text-gray-600 dark:text-dark-muted">Kelas</th>
                <th className="px-4 py-3 font-medium text-gray-600 dark:text-dark-muted hidden md:table-cell">Level</th>
                <th className="px-4 py-3 font-medium text-gray-600 dark:text-dark-muted hidden lg:table-cell">Kapasitas</th>
                <th className="px-4 py-3 font-medium text-gray-600 dark:text-dark-muted hidden xl:table-cell">Wali Kelas</th>
                <th className="px-4 py-3 font-medium text-gray-600 dark:text-dark-muted">Status</th>
                <th className="px-4 py-3 font-medium text-gray-600 dark:text-dark-muted text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-dark-border">
              {classes.map((cls) => (
                <motion.tr key={cls.id} variants={itemVariants} 
                  className={`hover:bg-gray-50 dark:hover:bg-dark-card/50 transition-colors ${selectedIds.includes(cls.id) ? 'bg-primary-500/5' : ''}`}>
                  <td className="px-4 py-4">
                    <input type="checkbox" checked={selectedIds.includes(cls.id)} onChange={() => toggleSelect(cls.id)} 
                      className="w-4 h-4 rounded border-gray-300 dark:border-dark-border" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500/20 to-primary-600/20 
                        border border-primary-500/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold">
                        <School className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{cls.name}</p>
                        {cls.description && <p className="text-xs text-gray-500 dark:text-dark-muted truncate max-w-[200px]">{cls.description}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 hidden md:table-cell">
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/30">
                      Kelas {cls.level}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-gray-600 dark:text-dark-muted hidden lg:table-cell">
                    <span className="font-medium">{cls.student_count || 0}</span> / {cls.capacity}
                  </td>
                  <td className="px-4 py-4 text-gray-600 dark:text-dark-muted hidden xl:table-cell">
                    {cls.wali_kelas?.name || '-'}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${cls.is_active ? 'text-success' : 'text-danger'}`}>
                      <span className={`w-2 h-2 rounded-full ${cls.is_active ? 'bg-success animate-pulse' : 'bg-danger'}`} />
                      {cls.is_active ? 'Aktif' : 'Non-Aktif'}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openViewModal(cls)} title="Lihat Detail" 
                        className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => openEditModal(cls)} title="Edit" 
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(cls.id)} title="Hapus" 
                        className="p-2 text-gray-500 hover:text-danger hover:bg-danger/10 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
              {classes.length === 0 && (
                <tr><td colSpan="7" className="text-center py-12"><div className="text-gray-400 mb-2">📭</div>
                  <p className="text-gray-500">{search || levelFilter !== 'all' ? 'Tidak ada kelas yang cocok.' : 'Belum ada data kelas.'}</p></td></tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-dark-border text-sm text-gray-600 dark:text-dark-muted flex justify-between items-center">
          <span>Menampilkan <strong>{meta.from || 0}</strong> - <strong>{meta.to || 0}</strong> dari <strong>{meta.total || 0}</strong> data</span>
          <div className="flex gap-1">
            <button className="px-3 py-1.5 rounded border border-gray-300 dark:border-dark-border text-gray-600 dark:text-dark-muted disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-dark-card transition-colors" disabled>
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="px-3 py-1.5 rounded border border-primary-500 bg-primary-500 text-white font-medium">1</button>
            <button className="px-3 py-1.5 rounded border border-gray-300 dark:border-dark-border text-gray-600 dark:text-dark-muted disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-dark-card transition-colors" disabled>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════
          MODAL: CREATE / EDIT CLASS
          ═══════════════════════════════════════════════════════════ */}
      {(isCreateOpen || isEditOpen) && (
        <Modal isOpen={isCreateOpen || isEditOpen} onClose={() => { setIsCreateOpen(false); setIsEditOpen(false); }} 
          title={isCreateOpen ? "✨ Tambah Kelas Baru" : "✏️ Edit Kelas"} size="2xl">
          <form onSubmit={isCreateOpen ? handleCreateSubmit : handleEditSubmit} className="space-y-6 max-h-[75vh] overflow-y-auto pr-2">
            
            {/* Section 1: Basic Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white pb-2 border-b dark:border-dark-border flex items-center gap-2">
                <School className="w-5 h-5 text-primary-600" /> Informasi Kelas
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField label="Nama Kelas" name="name" value={formData.name} onChange={setFormData} error={errors.name} required placeholder="Contoh: RPL X-1" icon={School} />
                <SelectField label="Tingkat" name="level" value={formData.level || 'X'} onChange={setFormData} 
                  options={[{value:'X',label:'Kelas X'}, {value:'XI',label:'Kelas XI'}, {value:'XII',label:'Kelas XII'}]} 
                  error={errors.level} required icon={BarChart3} />
              </div>
              <InputField label="Deskripsi" name="description" value={formData.description} onChange={setFormData} error={errors.description} placeholder="Deskripsi singkat tentang kelas..." />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField label="Kapasitas Maksimal" name="capacity" type="number" value={formData.capacity} onChange={setFormData} error={errors.capacity} placeholder="36" helperText="Jumlah maksimal siswa dalam kelas" />
                <div className="flex items-center pt-6">
                  <input type="checkbox" id="is_active" checked={formData.is_active !== false} 
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})} className="w-4 h-4 text-primary-600 rounded" />
                  <label htmlFor="is_active" className="ml-2 text-sm text-gray-700 dark:text-dark-muted cursor-pointer">Kelas Aktif</label>
                </div>
              </div>
            </div>

            {/* Section 2: Teachers */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white pb-2 border-b dark:border-dark-border flex items-center gap-2">
                <Users className="w-5 h-5 text-primary-600" /> Penugasan Guru
              </h3>
              <TeacherMultiSelect label="Guru Pengampu (Wali Kelas & Pengajar)" value={formData.teacher_ids} onChange={(v) => setFormData({...formData, teacher_ids: v})} teachers={teachers} error={errors.teacher_ids} />
              <p className="text-xs text-gray-500 dark:text-gray-600">💡 Guru pertama yang dipilih akan menjadi Wali Kelas secara default.</p>
            </div>



            {/* Action Buttons */}
            <div className="pt-4 flex justify-end gap-3 border-t border-gray-200 dark:border-dark-border sticky bottom-0 bg-white dark:bg-dark-card py-4">
              <Button type="button" variant="outline" onClick={() => { setIsCreateOpen(false); setIsEditOpen(false); }}>Batal</Button>
              <Button type="submit" loading={createClassMutation.isLoading || updateClassMutation.isLoading}>
                {isCreateOpen ? '💾 Simpan Kelas' : '✏️ Update Kelas'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ═══════════════════════════════════════════════════════════
          MODAL: VIEW CLASS DETAIL
          ═══════════════════════════════════════════════════════════ */}
      {isViewOpen && selectedClass && (
        <Modal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} title="📚 Detail Kelas" size="lg">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4 pb-4 border-b dark:border-dark-border">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500/20 to-primary-600/20 border-2 border-primary-500/30 flex items-center justify-center">
                <School className="w-8 h-8 text-primary-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{selectedClass.name}</h3>
                <p className="text-gray-600 dark:text-dark-muted">{selectedClass.description || 'Tidak ada deskripsi'}</p>
                <div className="flex gap-2 mt-2">
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/30">Kelas {selectedClass.level}</span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${selectedClass.is_active ? 'bg-success/10 text-success border border-success/30' : 'bg-danger/10 text-danger border border-danger/30'}`}>
                    {selectedClass.is_active ? 'Aktif' : 'Non-Aktif'}
                  </span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatBox label="Total Siswa" value={selectedClass.student_count || 0} icon={Users} color="text-blue-400" />
              <StatBox label="Kapasitas" value={selectedClass.capacity || 36} icon={MapPin} color="text-purple-400" />
              <StatBox label="Tersedia" value={(selectedClass.capacity || 36) - (selectedClass.student_count || 0)} icon={CheckCircle2} color="text-success" />
              <StatBox label="Mapel" value={selectedClass.subject_count || 0} icon={BookOpen} color="text-accent-cyan" />
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <DetailItem icon={Calendar} label="Dibuat Pada" value={new Date(selectedClass.created_at).toLocaleDateString('id-ID')} />
                <DetailItem icon={Clock} label="Terakhir Update" value={new Date(selectedClass.updated_at).toLocaleDateString('id-ID')} />
                {selectedClass.slug && <DetailItem label="Slug URL" value={selectedClass.slug} />}
              </div>
              <div className="space-y-3">
                {selectedClass.teachers?.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-600 mb-1">Guru Pengampu</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedClass.teachers.map((t) => (
                        <span key={t.id} className="px-2.5 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                          {t.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {selectedClass.subjects?.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-600 mb-1">Mata Pelajaran</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedClass.subjects.map((s) => (
                        <span key={s.id} className="px-2.5 py-1 rounded-full text-xs font-medium bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/30">
                          {s.code}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t dark:border-dark-border flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setIsViewOpen(false); openEditModal(selectedClass); }}>
                <Edit2 className="w-4 h-4 mr-1" /> Edit
              </Button>
              <Button variant="primary" onClick={() => { setIsViewOpen(false); /* Navigate to schedule */ }}>
                <Calendar className="w-4 h-4 mr-1" /> Lihat Jadwal
              </Button>
              <Button variant="danger" onClick={() => { setIsViewOpen(false); handleDelete(selectedClass.id); }}>
                <Trash2 className="w-4 h-4 mr-1" /> Hapus
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirmation Modals */}
      <ConfirmModal isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={confirmDeleteAction}
        title="Hapus Kelas?" message="Apakah Anda yakin ingin menghapus kelas ini? Semua data terkait akan terpengaruh." />
      
      <ConfirmModal isOpen={confirmBulkDelete} onClose={() => setConfirmBulkDelete(false)} onConfirm={confirmBulkDeleteAction}
        title={`Hapus ${selectedIds.length} Kelas?`} message="Apakah Anda yakin ingin menghapus kelas yang terpilih? Tindakan ini tidak dapat dibatalkan." />

    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════
// HELPER: Stat Box Component
// ═══════════════════════════════════════════════════════════
function StatBox({ label, value, icon: Icon, color }) {
  return (
    <div className="p-4 rounded-xl bg-gray-50 dark:bg-dark-card/50 border border-gray-200 dark:border-dark-border">
      <div className="flex items-center gap-2 mb-2">
        {Icon && <Icon className={`w-4 h-4 ${color}`} />}
        <span className="text-xs text-gray-500 dark:text-dark-muted">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}