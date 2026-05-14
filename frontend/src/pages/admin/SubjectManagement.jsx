import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, Search, Edit2, Trash2, X, Loader2, BookOpen,
  AlertCircle, CheckCircle2,
  Eye, BarChart3, RefreshCw, ChevronRight, ChevronLeft,
  Calendar, Clock, Users, TrendingUp, Tag
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
// TEXTAREA FIELD COMPONENT
// ═══════════════════════════════════════════════════════════
function TextAreaField({ label, name, value, onChange, error, required, disabled, placeholder, icon: Icon, rows = 3 }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700 dark:text-dark-muted">
        <span className="flex items-center gap-1.5">
          {Icon && <Icon className="w-4 h-4 text-gray-400" />}
          {label}
          {required && <span className="text-danger">*</span>}
        </span>
      </label>
      <textarea
        name={name}
        value={value || ''}
        onChange={(e) => onChange(prev => ({ ...prev, [name]: e.target.value }))}
        className="input w-full resize-none"
        rows={rows}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
      />
      {error && <p className="text-danger text-xs mt-0.5">{Array.isArray(error) ? error[0] : error}</p>}
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
// STAT BOX COMPONENT
// ═══════════════════════════════════════════════════════════
function StatBox({ label, value, icon: Icon, color, trend }) {
  return (
    <motion.div 
      variants={itemVariants}
      whileHover={{ y: -2 }}
      className="p-4 rounded-xl bg-gray-50 dark:bg-dark-card/50 border border-gray-200 dark:border-dark-border"
    >
      <div className="flex items-center justify-between mb-2">
        {Icon && <Icon className={`w-4 h-4 ${color}`} />}
        {trend && (
          <span className={`text-xs font-medium ${trend > 0 ? 'text-success' : 'text-danger'}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-500 dark:text-dark-muted mt-1">{label}</p>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════
export default function SubjectManagement() {
  const queryClient = useQueryClient();
  
  // State Management
  const [search, setSearch] = useState('');
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

  const debouncedSearch = useDebounce(search, 500);

  // Fetch subjects with filters
  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ['admin-subjects', debouncedSearch],
    queryFn: () => api.get('/admin/subjects', {
      params: {
        page: 1,
        search: debouncedSearch || undefined,
      }
    }),
    placeholderData: (prev) => prev,
    staleTime: 30000,
  });

  const subjects = data?.data?.data || [];
  const meta = data?.data?.meta || {};

  // Show toast notification
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // ═══════════════════════════════════════════════════════════
  // MUTATIONS
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



  // ═══════════════════════════════════════════════════════════
  // HANDLERS
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

  // Category options
  const categoryOptions = [
    { value: 'productive', label: 'Produktif', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30' },
    { value: 'normative', label: 'Normatif', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30' },
    { value: 'adaptive', label: 'Adaptif', color: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30' },
  ];

  const getCategoryConfig = (category) => {
    return categoryOptions.find(c => c.value === category) || categoryOptions[0];
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
  // LOADING & ERROR
  // ═══════════════════════════════════════════════════════════
  if (isLoading && !isFetching) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="w-14 h-14 border-3 border-primary-500/30 border-t-primary-400 rounded-full mx-auto mb-4" />
          <p className="text-gray-600 dark:text-dark-muted">Memuat data mata pelajaran...</p>
        </motion.div>
      </div>
    );
  }
  
  if (isError) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="w-12 h-12 text-danger mx-auto mb-3" />
        <p className="text-danger font-medium mb-2">Gagal memuat data</p>
        <Button variant="outline" onClick={() => queryClient.invalidateQueries(['admin-subjects'])}>Coba Lagi</Button>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      
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
            <BookOpen className="w-6 h-6 text-primary-400" />
            <span className="text-gradient">Manajemen Mata Pelajaran</span>
          </h1>
          <p className="text-gray-600 dark:text-dark-muted mt-1.5 ml-9">Kelola mata pelajaran produktif, normatif, dan adaptif.</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <Button variant="danger" size="sm" onClick={handleBulkDelete} className="flex items-center gap-1.5">
              <Trash2 className="w-4 h-4" /> Hapus ({selectedIds.length})
            </Button>
          )}

          <Button onClick={() => { setFormData({ category: 'productive', credits: 4, is_active: true }); setErrors({}); setIsCreateOpen(true); }} 
            className="flex items-center gap-1.5" disabled={createSubjectMutation.isLoading}>
            <Plus className="w-4 h-4" /> {createSubjectMutation.isLoading ? 'Menyimpan...' : 'Tambah Mapel'}
          </Button>
        </div>
      </motion.div>

      {/* STATS OVERVIEW */}
      <motion.div variants={containerVariants} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatBox label="Total Mapel" value={stats.total} icon={BookOpen} color="text-primary-400" trend={12} />
        <StatBox label="Produktif" value={stats.productive} icon={TrendingUp} color="text-purple-400" />
        <StatBox label="Normatif" value={stats.normative} icon={BookOpen} color="text-blue-400" />
        <StatBox label="Adaptif" value={stats.adaptive} icon={BookOpen} color="text-green-400" />
        <StatBox label="Aktif" value={stats.active} icon={CheckCircle2} color="text-success" />
        <StatBox label="Non-Aktif" value={stats.total - stats.active} icon={AlertCircle} color="text-danger" />
      </motion.div>

      {/* FILTERS */}
      <motion.div variants={itemVariants} className="card">
        <div className="flex flex-col lg:flex-row gap-4 items-end lg:items-center justify-between">
          <div className="flex-1 w-full">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Cari kode atau nama mata pelajaran..." value={search}
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
            {selectedIds.length} mata pelajaran terpilih
          </span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setSelectedIds([])}>Batal</Button>
            <Button size="sm" variant="danger" onClick={handleBulkDelete}>Hapus Terpilih</Button>
          </div>
        </motion.div>
      )}

      {/* TABLE */}
      <motion.div variants={itemVariants} className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-dark-card border-b border-gray-200 dark:border-dark-border">
              <tr>
                <th className="px-4 py-3">
                  <input type="checkbox" checked={subjects.length > 0 && selectedIds.length === subjects.length} 
                    onChange={toggleSelectAll} className="w-4 h-4 rounded border-gray-300 dark:border-dark-border" />
                </th>
                <th className="px-4 py-3 font-medium text-gray-600 dark:text-dark-muted">Mapel</th>
                <th className="px-4 py-3 font-medium text-gray-600 dark:text-dark-muted hidden md:table-cell">Kode</th>
                <th className="px-4 py-3 font-medium text-gray-600 dark:text-dark-muted hidden lg:table-cell">Kategori</th>
                <th className="px-4 py-3 font-medium text-gray-600 dark:text-dark-muted hidden xl:table-cell">Kredit</th>
                <th className="px-4 py-3 font-medium text-gray-600 dark:text-dark-muted">Status</th>
                <th className="px-4 py-3 font-medium text-gray-600 dark:text-dark-muted text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-dark-border">
              {subjects.map((subject) => {
                const catConfig = getCategoryConfig(subject.category);
                return (
                  <motion.tr key={subject.id} variants={itemVariants} 
                    className={`hover:bg-gray-50 dark:hover:bg-dark-card/50 transition-colors ${selectedIds.includes(subject.id) ? 'bg-primary-500/5' : ''}`}>
                    <td className="px-4 py-4">
                      <input type="checkbox" checked={selectedIds.includes(subject.id)} onChange={() => toggleSelect(subject.id)} 
                        className="w-4 h-4 rounded border-gray-300 dark:border-dark-border" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500/20 to-primary-600/20 
                          border border-primary-500/30 flex items-center justify-center text-primary-600 dark:text-primary-400">
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{subject.name}</p>
                          {subject.description && <p className="text-xs text-gray-500 dark:text-dark-muted truncate max-w-[250px]">{subject.description}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <span className="font-mono text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-dark-card px-2 py-1 rounded">
                        {subject.code}
                      </span>
                    </td>
                    <td className="px-4 py-4 hidden lg:table-cell">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${catConfig.color}`}>
                        {catConfig.label}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-gray-600 dark:text-dark-muted hidden xl:table-cell">
                      <span className="font-medium">{subject.credits}</span> SKS
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${subject.is_active ? 'text-success' : 'text-danger'}`}>
                        <span className={`w-2 h-2 rounded-full ${subject.is_active ? 'bg-success animate-pulse' : 'bg-danger'}`} />
                        {subject.is_active ? 'Aktif' : 'Non-Aktif'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openViewModal(subject)} title="Lihat Detail" 
                          className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => openEditModal(subject)} title="Edit" 
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(subject.id)} title="Hapus" 
                          className="p-2 text-gray-500 hover:text-danger hover:bg-danger/10 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
              {subjects.length === 0 && (
                <tr><td colSpan="7" className="text-center py-12"><div className="text-gray-400 mb-2">📭</div>
                  <p className="text-gray-500">{search ? 'Tidak ada mata pelajaran yang cocok.' : 'Belum ada data mata pelajaran.'}</p></td></tr>
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
          MODAL: CREATE / EDIT SUBJECT
          ═══════════════════════════════════════════════════════════ */}
      {(isCreateOpen || isEditOpen) && (
        <Modal isOpen={isCreateOpen || isEditOpen} onClose={() => { setIsCreateOpen(false); setIsEditOpen(false); }} 
          title={isCreateOpen ? "✨ Tambah Mata Pelajaran Baru" : "✏️ Edit Mata Pelajaran"} size="xl">
          <form onSubmit={isCreateOpen ? handleCreateSubmit : handleEditSubmit} className="space-y-6 max-h-[75vh] overflow-y-auto pr-2">
            
            {/* Section 1: Basic Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white pb-2 border-b dark:border-dark-border flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary-600" /> Informasi Mata Pelajaran
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField label="Kode Mapel" name="code" value={formData.code} onChange={setFormData} error={errors.code} required placeholder="Contoh: RPL-101" icon={Tag} helperText="Kode unik untuk mata pelajaran" />
                <InputField label="Nama Mapel" name="name" value={formData.name} onChange={setFormData} error={errors.name} required placeholder="Contoh: Pemrograman Web" icon={BookOpen} />
              </div>
              <TextAreaField label="Deskripsi" name="description" value={formData.description} onChange={setFormData} error={errors.description} placeholder="Deskripsi singkat tentang mata pelajaran ini..." icon={BookOpen} rows={3} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SelectField label="Kategori" name="category" value={formData.category || 'productive'} onChange={setFormData} 
                  options={[
                    {value:'productive',label:'📊 Produktif - Kejuruan RPL'},
                    {value:'normative',label:'📚 Normatif - Wajib Nasional'},
                    {value:'adaptive',label:'🔧 Adaptif - Pendukung'}
                  ]} 
                  error={errors.category} required icon={BarChart3} />
                <InputField label="Kredit (SKS)" name="credits" type="number" min="1" max="10" value={formData.credits} onChange={setFormData} error={errors.credits} required placeholder="4" helperText="Jumlah kredit per minggu" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="is_active" checked={formData.is_active !== false} 
                  onChange={(e) => setFormData({...formData, is_active: e.target.checked})} className="w-4 h-4 text-primary-600 rounded" />
                <label htmlFor="is_active" className="text-sm text-gray-700 dark:text-dark-muted cursor-pointer">Mata Pelajaran Aktif</label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 flex justify-end gap-3 border-t border-gray-200 dark:border-dark-border sticky bottom-0 bg-white dark:bg-dark-card py-4">
              <Button type="button" variant="outline" onClick={() => { setIsCreateOpen(false); setIsEditOpen(false); }}>Batal</Button>
              <Button type="submit" loading={createSubjectMutation.isLoading || updateSubjectMutation.isLoading}>
                {isCreateOpen ? '💾 Simpan Mapel' : '✏️ Update Mapel'}
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
            <div className="flex items-center gap-4 pb-4 border-b dark:border-dark-border">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500/20 to-primary-600/20 border-2 border-primary-500/30 flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-primary-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{selectedSubject.name}</h3>
                <p className="text-gray-600 dark:text-dark-muted font-mono">{selectedSubject.code}</p>
                <div className="flex gap-2 mt-2">
                  {(() => {
                    const catConfig = getCategoryConfig(selectedSubject.category);
                    return (
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${catConfig.color}`}>
                        {catConfig.label}
                      </span>
                    );
                  })()}
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${selectedSubject.is_active ? 'bg-success/10 text-success border border-success/30' : 'bg-danger/10 text-danger border border-danger/30'}`}>
                    {selectedSubject.is_active ? 'Aktif' : 'Non-Aktif'}
                  </span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatBox label="Kredit" value={`${selectedSubject.credits} SKS`} icon={Clock} color="text-primary-400" />
              <StatBox label="Total Kelas" value={selectedSubject.class_count || 0} icon={Users} color="text-purple-400" />
              <StatBox label="Total Siswa" value={selectedSubject.student_count || 0} icon={Users} color="text-blue-400" />
              <StatBox label="Jadwal" value={selectedSubject.schedule_count || 0} icon={Calendar} color="text-accent-cyan" />
            </div>

            {/* Details */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Deskripsi</h4>
              <p className="text-sm text-gray-600 dark:text-dark-muted p-4 rounded-xl bg-gray-50 dark:bg-dark-card/50 border border-gray-200 dark:border-dark-border">
                {selectedSubject.description || 'Tidak ada deskripsi'}
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t dark:border-dark-border">
                <DetailItem icon={Calendar} label="Dibuat Pada" value={new Date(selectedSubject.created_at).toLocaleDateString('id-ID')} />
                <DetailItem icon={Clock} label="Terakhir Update" value={new Date(selectedSubject.updated_at).toLocaleDateString('id-ID')} />
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t dark:border-dark-border flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setIsViewOpen(false); openEditModal(selectedSubject); }}>
                <Edit2 className="w-4 h-4 mr-1" /> Edit
              </Button>
              <Button variant="danger" onClick={() => { setIsViewOpen(false); handleDelete(selectedSubject.id); }}>
                <Trash2 className="w-4 h-4 mr-1" /> Hapus
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirmation Modals */}
      <ConfirmModal isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={confirmDeleteAction}
        title="Hapus Mata Pelajaran?" message="Apakah Anda yakin ingin menghapus mata pelajaran ini? Pastikan tidak ada jadwal yang menggunakan mapel ini." />
      
      <ConfirmModal isOpen={confirmBulkDelete} onClose={() => setConfirmBulkDelete(false)} onConfirm={confirmBulkDeleteAction}
        title={`Hapus ${selectedIds.length} Mata Pelajaran?`} message="Apakah Anda yakin ingin menghapus mata pelajaran yang terpilih? Tindakan ini tidak dapat dibatalkan." />

    </motion.div>
  );
}