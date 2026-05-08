import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, Search, Edit2, Trash2, KeyRound, X, Loader2, User, Mail, Lock, Phone,
  Download, Filter, Check, Calendar, ExternalLink, Image as ImageIcon,
  AlertCircle, CheckCircle2, Activity, Eye
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
        {error && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <AlertCircle className="w-4 h-4 text-danger" />
          </div>
        )}
      </div>
      {helperText && <p className="text-xs text-gray-500 dark:text-gray-600">{helperText}</p>}
      {error && (
        <p className="text-danger text-xs mt-0.5">
          {Array.isArray(error) ? error[0] : error}
        </p>
      )}
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
      {error && (
        <p className="text-danger text-xs mt-0.5">
          {Array.isArray(error) ? error[0] : error}
        </p>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MULTI SELECT SUBJECTS COMPONENT (Teacher)
// ═══════════════════════════════════════════════════════════
function SubjectMultiSelect({ label, value, onChange, subjects, error, required }) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredSubjects = useMemo(() => {
    return subjects.filter(sub => 
      sub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.code.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [subjects, searchTerm]);

  const selectedSubjects = useMemo(() => {
    return subjects.filter(sub => (value || []).includes(sub.id));
  }, [subjects, value]);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-dark-muted">
        {label} {required && <span className="text-danger">*</span>}
      </label>
      
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Cari mata pelajaran..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input pl-9 text-sm py-2"
        />
      </div>
      
      {/* Selected Tags */}
      {selectedSubjects.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedSubjects.map((sub) => (
            <span 
              key={sub.id}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/30"
            >
              {sub.code}
              <button
                type="button"
                onClick={() => onChange((value || []).filter(id => id !== sub.id))}
                className="hover:text-danger transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      
      {/* Options List */}
      <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-dark-border rounded-xl">
        {filteredSubjects.length > 0 ? (
          filteredSubjects.map((sub) => {
            const isSelected = (value || []).includes(sub.id);
            return (
              <label
                key={sub.id}
                className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${
                  isSelected 
                    ? 'bg-primary-500/10 border-l-2 border-primary-500' 
                    : 'hover:bg-gray-50 dark:hover:bg-dark-card/50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => {
                    if (e.target.checked) {
                      onChange([...(value || []), sub.id]);
                    } else {
                      onChange((value || []).filter(id => id !== sub.id));
                    }
                  }}
                  className="w-4 h-4 text-primary-600 rounded border-gray-300 dark:border-dark-border"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {sub.code} - {sub.name}
                  </p>
                  {sub.description && (
                    <p className="text-xs text-gray-500 dark:text-dark-muted truncate">
                      {sub.description}
                    </p>
                  )}
                </div>
                {isSelected && <Check className="w-4 h-4 text-primary-600" />}
              </label>
            );
          })
        ) : (
          <p className="p-4 text-sm text-gray-500 text-center">
            {searchTerm ? 'Tidak ada hasil pencarian.' : 'Tidak ada data mata pelajaran.'}
          </p>
        )}
      </div>
      
      {error && (
        <p className="text-danger text-xs">
          {Array.isArray(error) ? error[0] : error}
        </p>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// AVATAR UPLOAD COMPONENT
// ═══════════════════════════════════════════════════════════
function AvatarUpload({ value, onChange, error }) {
  const [preview, setPreview] = useState(value);
  
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Ukuran file maksimal 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
        onChange(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-dark-muted">
        <span className="flex items-center gap-1.5">
          <ImageIcon className="w-4 h-4 text-gray-400" />
          Foto Profil
        </span>
      </label>
      
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500/20 to-primary-600/20 
            border-2 border-primary-500/30 flex items-center justify-center overflow-hidden">
            {preview ? (
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <User className="w-10 h-10 text-primary-400" />
            )}
          </div>
          <label className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-primary-600 
            text-white cursor-pointer hover:bg-primary-700 transition-colors shadow-lg">
            <ImageIcon className="w-4 h-4" />
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>
        
        <div className="flex-1">
          <p className="text-sm text-gray-600 dark:text-dark-muted">
            Upload foto profil (maks. 5MB)
          </p>
          <p className="text-xs text-gray-500">Format: JPG, PNG, WebP</p>
        </div>
      </div>
      
      {error && <p className="text-danger text-xs">{error}</p>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// CONFIRMATION MODAL COMPONENT
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
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════
export default function UserManagement() {
  const queryClient = useQueryClient();
  
  // State Management
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [subjects, setSubjects] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [toast, setToast] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);

  const debouncedSearch = useDebounce(search, 500);

  // Fetch subjects
  useEffect(() => {
    if (isCreateOpen || isEditOpen) {
      api.get('/admin/subjects')
        .then(res => setSubjects(res.data?.data?.data || []))
        .catch(err => console.error('Failed to fetch subjects:', err));
    }
  }, [isCreateOpen, isEditOpen]);

  // Fetch users with filters
  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ['admin-users', debouncedSearch, roleFilter, statusFilter],
    queryFn: () => api.get('/admin/users', {
      params: {
        page: 1,
        search: debouncedSearch || undefined,
        role: roleFilter === 'all' ? undefined : roleFilter,
        is_active: statusFilter === 'all' ? undefined : statusFilter === 'active',
      }
    }),
    placeholderData: (prev) => prev,
    staleTime: 30000,
  });

  const users = data?.data?.data || [];
  const meta = data?.data?.meta || {};

  // Show toast notification
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // ═══════════════════════════════════════════════════════════
  // MUTATIONS
  // ═══════════════════════════════════════════════════════════
  const createUserMutation = useMutation({
    mutationFn: (newUser) => api.post('/admin/users', newUser),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setIsCreateOpen(false);
      setFormData({});
      setErrors({});
      showToast('✅ User berhasil dibuat!', 'success');
    },
    onError: (err) => {
      setErrors(err.response?.data?.errors || {});
      showToast(`❌ ${err.response?.data?.message || 'Gagal membuat user'}`, 'error');
    }
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, ...updatedData }) => api.put(`/admin/users/${id}`, updatedData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setIsEditOpen(false);
      setSelectedUser(null);
      setFormData({});
      setErrors({});
      showToast('✅ User berhasil diupdate!', 'success');
    },
    onError: (err) => {
      setErrors(err.response?.data?.errors || {});
      showToast(`❌ ${err.response?.data?.message || 'Gagal update user'}`, 'error');
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      showToast('✅ User berhasil dihapus!', 'success');
      setConfirmDelete(null);
    },
    onError: (err) => {
      showToast(`❌ ${err.response?.data?.message || 'Gagal menghapus user'}`, 'error');
    }
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids) => Promise.all(ids.map(id => api.delete(`/admin/users/${id}`))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setSelectedIds([]);
      showToast('✅ User berhasil dihapus!', 'success');
      setConfirmBulkDelete(false);
    },
    onError: (err) => {
      showToast(`❌ ${err.response?.data?.message || 'Gagal menghapus user'}`, 'error');
    }
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (id) => api.post(`/admin/users/${id}/reset-password`, { password: 'password123' }),
    onSuccess: () => showToast('✅ Password direset ke "password123"', 'success'),
    onError: (err) => showToast(`❌ ${err.response?.data?.message || 'Gagal reset password'}`, 'error')
  });

  // ═══════════════════════════════════════════════════════════
  // EXPORT FUNCTION - FIXED!
  // ═══════════════════════════════════════════════════════════
  const handleExport = useCallback(async () => {
    try {
      const filters = {
        search: debouncedSearch || undefined,
        role: roleFilter === 'all' ? undefined : roleFilter,
        is_active: statusFilter === 'all' ? undefined : statusFilter === 'active',
      };

      const token = localStorage.getItem('rpl_token');
      const queryParams = new URLSearchParams();
      
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.role) queryParams.append('role', filters.role);
      if (filters.is_active !== undefined) queryParams.append('is_active', filters.is_active);
      
      const url = `${import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1'}/admin/users/export?${queryParams.toString()}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'text/csv',
        },
      });

      if (!response.ok) {
        throw new Error('Gagal export data');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      a.remove();
      
      showToast('✅ Data berhasil diexport!', 'success');
      
    } catch (error) {
      console.error('Export error:', error);
      showToast(`❌ ${error.message || 'Gagal export data'}`, 'error');
    }
  }, [debouncedSearch, roleFilter, statusFilter, showToast]);

  const clearSearch = useCallback(() => setSearch(''), []);
  const handleRoleChange = useCallback((newRole) => {
    setFormData(prev => ({
      ...prev, role: newRole,
      nis: newRole === 'siswa' ? prev.nis : '',
      nip: newRole === 'guru' ? prev.nip : '',
      class_level: newRole === 'siswa' ? prev.class_level : '',
      subjects: newRole === 'guru' ? prev.subjects : [],
    }));
  }, []);

  // ═══════════════════════════════════════════════════════════
  // EVENT HANDLERS
  // ═══════════════════════════════════════════════════════════
  const handleCreateSubmit = (e) => {
    e.preventDefault();
    const payload = { ...formData };
    if (payload.role !== 'siswa') { delete payload.nis; delete payload.class_level; }
    if (payload.role !== 'guru') { delete payload.nip; delete payload.subjects; }
    createUserMutation.mutate(payload);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    const payload = { ...formData };
    if (payload.role !== 'siswa') { delete payload.nis; delete payload.class_level; }
    if (payload.role !== 'guru') { delete payload.nip; delete payload.subjects; }
    updateUserMutation.mutate({ id: selectedUser.id, ...payload });
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name || '', email: user.email || '', phone: user.phone || '',
      role: user.role || 'siswa', is_active: user.is_active !== false,
      nis: user.profile?.nis || '', nip: user.profile?.nip || '',
      class_level: user.profile?.class_level || '', bio: user.profile?.bio || '',
      github_url: user.profile?.github_url || '', linkedin_url: user.profile?.linkedin_url || '',
      avatar_url: user.avatar_url || '', subjects: user.profile?.subjects?.map(s => s.id) || [],
    });
    setIsEditOpen(true);
    setErrors({});
  };

  const openViewModal = (user) => {
    setSelectedUser(user);
    setIsViewOpen(true);
  };

  const handleDelete = (id) => setConfirmDelete(id);
  
  const confirmDeleteAction = () => {
    if (confirmDelete) deleteUserMutation.mutate(confirmDelete);
  };

  const handleBulkDelete = () => {
    if (selectedIds.length > 0) setConfirmBulkDelete(true);
  };
  
  const confirmBulkDeleteAction = () => {
    if (selectedIds.length > 0) bulkDeleteMutation.mutate(selectedIds);
  };

  const handleResetPassword = (id) => {
    if (window.confirm('Reset password user ini ke "password123"?')) {
      resetPasswordMutation.mutate(id);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === users.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(users.map(u => u.id));
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  // ═══════════════════════════════════════════════════════════
  // LOADING & ERROR
  // ═══════════════════════════════════════════════════════════
  if (isLoading && !isFetching) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="w-14 h-14 border-3 border-primary-500/30 border-t-primary-400 rounded-full mx-auto mb-4" />
          <p className="text-gray-600 dark:text-dark-muted">Memuat data user...</p>
        </motion.div>
      </div>
    );
  }
  
  if (isError) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="w-12 h-12 text-danger mx-auto mb-3" />
        <p className="text-danger font-medium mb-2">Gagal memuat data</p>
        <Button variant="outline" onClick={() => queryClient.invalidateQueries(['admin-users'])}>Coba Lagi</Button>
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manajemen User</h1>
          <p className="text-gray-600 dark:text-dark-muted mt-1">Kelola akun Siswa, Guru, dan Admin.</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <Button variant="danger" size="sm" onClick={handleBulkDelete} className="flex items-center gap-1.5">
              <Trash2 className="w-4 h-4" /> Hapus ({selectedIds.length})
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleExport} className="flex items-center gap-1.5">
            <Download className="w-4 h-4" /> Export
          </Button>
          <Button onClick={() => { setFormData({ role: 'siswa', is_active: true }); setErrors({}); setIsCreateOpen(true); }} 
            className="flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Tambah User
          </Button>
        </div>
      </motion.div>

      {/* FILTERS - SIMPLIFIED */}
      <motion.div variants={itemVariants} className="card">
        <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center justify-between">
          <div className="flex-1 w-full">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Cari nama, email, atau NIS/NIP..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)} 
                className="input pl-10 pr-10 w-full" 
              />
              {search && (
                <button 
                  onClick={clearSearch} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select 
              value={roleFilter} 
              onChange={(e) => setRoleFilter(e.target.value)} 
              className="input w-full sm:w-32"
            >
              <option value="all">Semua Role</option>
              <option value="siswa">Siswa</option>
              <option value="guru">Guru</option>
              <option value="admin">Admin</option>
            </select>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)} 
              className="input w-full sm:w-32"
            >
              <option value="all">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="inactive">Non-Aktif</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* BULK ACTIONS BAR */}
      {selectedIds.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} 
          className="flex items-center justify-between p-3 bg-primary-500/10 border border-primary-500/30 rounded-xl">
          <span className="text-sm text-primary-600 dark:text-primary-400 font-medium">
            {selectedIds.length} user terpilih
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
          <table className="w-full text-sm text-left min-w-[700px]">
            <thead className="bg-gray-50 dark:bg-dark-card border-b border-gray-200 dark:border-dark-border">
              <tr>
                <th className="px-4 py-3 w-10">
                  <input type="checkbox" checked={users.length > 0 && selectedIds.length === users.length} 
                    onChange={toggleSelectAll} className="w-4 h-4 rounded border-gray-300 dark:border-dark-border" />
                </th>
                <th className="px-4 py-3 font-medium text-gray-600 dark:text-dark-muted min-w-[200px]">User</th>
                <th className="px-4 py-3 font-medium text-gray-600 dark:text-dark-muted min-w-[100px]">Role</th>
                <th className="px-4 py-3 font-medium text-gray-600 dark:text-dark-muted min-w-[150px] hidden md:table-cell">Identity</th>
                <th className="px-4 py-3 font-medium text-gray-600 dark:text-dark-muted min-w-[100px] hidden lg:table-cell">Status</th>
                <th className="px-4 py-3 font-medium text-gray-600 dark:text-dark-muted text-right min-w-[120px]">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-dark-border">
              {users.map((user) => (
                <motion.tr key={user.id} variants={itemVariants} 
                  className={`hover:bg-gray-50 dark:hover:bg-dark-card/50 transition-colors ${selectedIds.includes(user.id) ? 'bg-primary-500/5' : ''}`}>
                  <td className="px-4 py-4 w-10">
                    <input type="checkbox" checked={selectedIds.includes(user.id)} onChange={() => toggleSelect(user.id)} 
                      className="w-4 h-4 rounded border-gray-300 dark:border-dark-border" />
                  </td>
                  <td className="px-4 py-4 min-w-[200px]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500/20 to-primary-600/20 
                        border border-primary-500/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-sm flex-shrink-0">
                        {user.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">{user.name}</p>
                        <p className="text-xs text-gray-500 dark:text-dark-muted truncate">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 min-w-[100px]">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium uppercase tracking-wide inline-block ${
                      user.role === 'admin' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                      user.role === 'guru' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    }`}>{user.role}</span>
                  </td>
                  <td className="px-4 py-4 text-gray-600 dark:text-dark-muted font-mono text-xs hidden md:table-cell min-w-[150px]">
                    {user.role === 'siswa' && user.profile?.nis ? `NIS: ${user.profile.nis}` : 
                     user.role === 'guru' && user.profile?.nip ? `NIP: ${user.profile.nip}` : '-'}
                  </td>
                  <td className="px-4 py-4 hidden lg:table-cell min-w-[100px]">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${user.is_active ? 'text-success' : 'text-danger'}`}>
                      <span className={`w-2 h-2 rounded-full ${user.is_active ? 'bg-success animate-pulse' : 'bg-danger'}`} />
                      {user.is_active ? 'Aktif' : 'Non-Aktif'}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right min-w-[120px]">
                    <div className="flex items-center justify-end gap-1 flex-shrink-0">
                      <button onClick={() => openViewModal(user)} title="Lihat Detail" 
                        className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleResetPassword(user.id)} title="Reset Password" 
                        className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors">
                        <KeyRound className="w-4 h-4" />
                      </button>
                      <button onClick={() => openEditModal(user)} title="Edit" 
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(user.id)} title="Hapus" 
                        className="p-2 text-gray-500 hover:text-danger hover:bg-danger/10 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan="6" className="text-center py-12"><div className="text-gray-400 mb-2">📭</div>
                  <p className="text-gray-500">{search || roleFilter !== 'all' ? 'Tidak ada user yang cocok.' : 'Belum ada data user.'}</p></td></tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-dark-border text-sm text-gray-600 dark:text-dark-muted flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>Menampilkan <strong>{meta.from || 0}</strong> - <strong>{meta.to || 0}</strong> dari <strong>{meta.total || 0}</strong> data</span>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════
          MODAL: CREATE / EDIT USER
          ═══════════════════════════════════════════════════════════ */}
      {(isCreateOpen || isEditOpen) && (
        <Modal isOpen={isCreateOpen || isEditOpen} onClose={() => { setIsCreateOpen(false); setIsEditOpen(false); }} 
          title={isCreateOpen ? "✨ Tambah User Baru" : "✏️ Edit User"} size="2xl">
          <form onSubmit={isCreateOpen ? handleCreateSubmit : handleEditSubmit} className="space-y-6 max-h-[75vh] overflow-y-auto pr-2">
            
            {/* Section 1: Basic Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white pb-2 border-b dark:border-dark-border flex items-center gap-2">
                <User className="w-5 h-5 text-primary-600" /> Informasi Dasar
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField label="Nama Lengkap" name="name" value={formData.name} onChange={setFormData} error={errors.name} required placeholder="Contoh: Ahmad Rizki" icon={User} />
                <InputField label="Email" name="email" type="email" value={formData.email} onChange={setFormData} error={errors.email} required placeholder="email@rpl.id" icon={Mail} />
              </div>
              {isCreateOpen && <InputField label="Password" name="password" type="password" value={formData.password} onChange={setFormData} error={errors.password} required placeholder="Minimal 8 karakter" icon={Lock} helperText="Gunakan kombinasi huruf, angka, dan simbol" />}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SelectField label="Role" name="role" value={formData.role || 'siswa'} onChange={handleRoleChange} 
                  options={[{value:'siswa',label:'🎓 Siswa'}, {value:'guru',label:'👨‍🏫 Guru'}, {value:'admin',label:'🛡️ Admin'}]} 
                  error={errors.role} required disabled={isEditOpen} />
                <div className="flex items-center pt-6"><input type="checkbox" id="is_active" checked={formData.is_active !== false} 
                  onChange={(e) => setFormData({...formData, is_active: e.target.checked})} className="w-4 h-4 text-primary-600 rounded" />
                  <label htmlFor="is_active" className="ml-2 text-sm text-gray-700 dark:text-dark-muted cursor-pointer">User Aktif (dapat login)</label></div>
              </div>
            </div>

            {/* Section 2: Avatar */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white pb-2 border-b dark:border-dark-border flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-primary-600" /> Foto Profil
              </h3>
              <AvatarUpload value={formData.avatar_url} onChange={(url) => setFormData({...formData, avatar_url: url})} error={errors.avatar_url} />
            </div>

            {/* Section 3: Role-Specific */}
            {formData.role === 'siswa' && (
              <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">🎓 Informasi Siswa</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField label="NIS" name="nis" value={formData.nis} onChange={setFormData} error={errors.nis} required placeholder="Contoh: 20250001" />
                  <SelectField label="Kelas" name="class_level" value={formData.class_level || 'X'} onChange={setFormData} 
                    options={[{value:'X',label:'Kelas X'}, {value:'XI',label:'Kelas XI'}, {value:'XII',label:'Kelas XII'}]} error={errors.class_level} required />
                </div>
              </div>
            )}

            {formData.role === 'guru' && (
              <div className="space-y-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
                <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100 flex items-center gap-2">👨‍🏫 Informasi Guru</h3>
                <InputField label="NIP" name="nip" value={formData.nip} onChange={setFormData} error={errors.nip} required placeholder="Contoh: 198001012020011001" />
                <SubjectMultiSelect label="Mata Pelajaran" value={formData.subjects} onChange={(v) => setFormData({...formData, subjects: v})} subjects={subjects} error={errors.subjects} required />
              </div>
            )}

            {formData.role === 'admin' && (
              <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800">
                <p className="text-sm text-orange-800 dark:text-orange-200 flex items-start gap-2">⚠️ <span><strong>Admin</strong> tidak memerlukan NIS/NIP.</span></p>
              </div>
            )}

            {/* Section 4: Profile Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white pb-2 border-b dark:border-dark-border flex items-center gap-2">
                <User className="w-5 h-5 text-primary-600" /> Detail Profil (Opsional)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField label="Nomor Telepon" name="phone" value={formData.phone} onChange={setFormData} error={errors.phone} placeholder="08123456789" icon={Phone} />
                <InputField label="Bio Singkat" name="bio" value={formData.bio} onChange={setFormData} error={errors.bio} placeholder="Ceritakan tentang diri Anda..." />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField label="GitHub" name="github_url" value={formData.github_url} onChange={setFormData} error={errors.github_url} placeholder="https://github.com/username" icon={ExternalLink} />
                <InputField label="LinkedIn" name="linkedin_url" value={formData.linkedin_url} onChange={setFormData} error={errors.linkedin_url} placeholder="https://linkedin.com/in/username" icon={ExternalLink} />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 flex justify-end gap-3 border-t border-gray-200 dark:border-dark-border sticky bottom-0 bg-white dark:bg-dark-card py-4">
              <Button type="button" variant="outline" onClick={() => { setIsCreateOpen(false); setIsEditOpen(false); }}>Batal</Button>
              <Button type="submit" loading={createUserMutation.isLoading || updateUserMutation.isLoading}>
                {isCreateOpen ? '💾 Simpan User' : '✏️ Update User'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ═══════════════════════════════════════════════════════════
          MODAL: VIEW USER DETAIL
          ═══════════════════════════════════════════════════════════ */}
      {isViewOpen && selectedUser && (
        <Modal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} title="👤 Detail User" size="lg">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4 pb-4 border-b dark:border-dark-border">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500/20 to-primary-600/20 border-2 border-primary-500/30 flex items-center justify-center">
                {selectedUser.avatar_url ? (
                  <img src={selectedUser.avatar_url} alt={selectedUser.name} className="w-full h-full rounded-2xl object-cover" />
                ) : (
                  <User className="w-10 h-10 text-primary-400" />
                )}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{selectedUser.name}</h3>
                <p className="text-gray-600 dark:text-dark-muted">{selectedUser.email}</p>
                <span className={`inline-flex mt-2 px-3 py-1 rounded-full text-xs font-medium ${
                  selectedUser.role === 'admin' ? 'bg-orange-100 text-orange-700' :
                  selectedUser.role === 'guru' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                }`}>{selectedUser.role.toUpperCase()}</span>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <DetailItem icon={Mail} label="Email" value={selectedUser.email} />
                <DetailItem icon={Phone} label="Telepon" value={selectedUser.phone || '-'} />
                <DetailItem icon={Calendar} label="Bergabung" value={new Date(selectedUser.created_at).toLocaleDateString('id-ID')} />
                <DetailItem icon={Activity} label="Status" value={selectedUser.is_active ? 'Aktif' : 'Non-Aktif'} 
                  valueClass={selectedUser.is_active ? 'text-success' : 'text-danger'} />
              </div>
              <div className="space-y-3">
                {selectedUser.role === 'siswa' && (
                  <>
                    <DetailItem label="NIS" value={selectedUser.profile?.nis || '-'} />
                    <DetailItem label="Kelas" value={selectedUser.profile?.class_level ? `Kelas ${selectedUser.profile.class_level}` : '-'} />
                  </>
                )}
                {selectedUser.role === 'guru' && (
                  <>
                    <DetailItem label="NIP" value={selectedUser.profile?.nip || '-'} />
                    <DetailItem label="Mapel" value={selectedUser.profile?.subjects?.map(s => s.name).join(', ') || '-'} />
                  </>
                )}
                {selectedUser.profile?.bio && <DetailItem label="Bio" value={selectedUser.profile.bio} multiline />}
              </div>
            </div>

            {/* Social Links */}
            {(selectedUser.profile?.github_url || selectedUser.profile?.linkedin_url) && (
              <div className="pt-4 border-t dark:border-dark-border">
                <h4 className="text-sm font-medium text-gray-700 dark:text-dark-muted mb-3">Social Links</h4>
                <div className="flex gap-3">
                  {selectedUser.profile?.github_url && (
                    <a href={selectedUser.profile.github_url} target="_blank" rel="noopener noreferrer" 
                      className="flex items-center gap-2 text-sm text-gray-600 dark:text-dark-muted hover:text-primary-600 transition-colors">
                      <ExternalLink className="w-4 h-4" /> GitHub
                    </a>
                  )}
                  {selectedUser.profile?.linkedin_url && (
                    <a href={selectedUser.profile.linkedin_url} target="_blank" rel="noopener noreferrer" 
                      className="flex items-center gap-2 text-sm text-gray-600 dark:text-dark-muted hover:text-primary-600 transition-colors">
                      <ExternalLink className="w-4 h-4" /> LinkedIn
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="pt-4 border-t dark:border-dark-border flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setIsViewOpen(false); openEditModal(selectedUser); }}>
                <Edit2 className="w-4 h-4 mr-1" /> Edit
              </Button>
              <Button variant="danger" onClick={() => { setIsViewOpen(false); handleDelete(selectedUser.id); }}>
                <Trash2 className="w-4 h-4 mr-1" /> Hapus
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirmation Modals */}
      <ConfirmModal isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={confirmDeleteAction}
        title="Hapus User?" message="Apakah Anda yakin ingin menghapus user ini? Tindakan ini tidak dapat dibatalkan." />
      
      <ConfirmModal isOpen={confirmBulkDelete} onClose={() => setConfirmBulkDelete(false)} onConfirm={confirmBulkDeleteAction}
        title={`Hapus ${selectedIds.length} User?`} message="Apakah Anda yakin ingin menghapus user yang terpilih? Tindakan ini tidak dapat dibatalkan." />

    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════
// HELPER: Detail Item Component
// ═══════════════════════════════════════════════════════════
function DetailItem({ icon: Icon, label, value, valueClass = '', multiline = false }) {
  return (
    <div className="flex items-start gap-3">
      {Icon && <Icon className="w-4 h-4 text-gray-400 mt-0.5" />}
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-600">{label}</p>
        <p className={`text-sm font-medium text-gray-900 dark:text-white ${valueClass} ${multiline ? 'whitespace-pre-wrap' : ''}`}>
          {value}
        </p>
      </div>
    </div>
  );
}