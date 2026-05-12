import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, Search, Edit2, Trash2, X, Loader2, Calendar, Clock, Users, BookOpen,
  Download, Filter, ChevronDown, ChevronUp, AlertCircle, CheckCircle2,
  Eye, RefreshCw, ChevronRight, ChevronLeft, MapPin, ArrowRight,
  School, UserCheck, LayoutGrid, List as ListIcon
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
function DetailItem({ icon: Icon, label, value, valueClass = '' }) {
  return (
    <div className="flex items-start gap-3">
      {Icon && <Icon className="w-4 h-4 text-gray-400 mt-0.5" />}
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-600">{label}</p>
        <p className={`text-sm font-medium text-gray-900 dark:text-white ${valueClass}`}>{value}</p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// DAY OPTIONS
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
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════
export default function ScheduleManagement() {
  const queryClient = useQueryClient();
  
  // State Management
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

  const debouncedSearch = useDebounce(search, 500);

  // Fetch dependencies for forms
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

  // Fetch schedules with filters
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

  // Show toast notification
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // ═══════════════════════════════════════════════════════════
  // MUTATIONS
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
      // Handle conflict error specifically
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
  // HANDLERS
  // ═══════════════════════════════════════════════════════════
  const handleCreateSubmit = (e) => {
    e.preventDefault();
    createScheduleMutation.mutate(formData);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!selectedSchedule) return;
    updateScheduleMutation.mutate({ id: selectedSchedule.id, ...formData });
  };

  const openEditModal = (schedule) => {
    setSelectedSchedule(schedule);
    setFormData({
      class_id: schedule.class_id,
      subject_id: schedule.subject_id,
      teacher_id: schedule.teacher_id,
      day: schedule.day,
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      room: schedule.room || '',
      is_active: schedule.is_active !== false,
    });
    setIsEditOpen(true);
    setErrors({});
  };

  const openViewModal = (schedule) => {
    setSelectedSchedule(schedule);
    setIsViewOpen(true);
  };

  const handleDelete = (id) => setConfirmDelete(id);
  const confirmDeleteAction = () => { if (confirmDelete) deleteScheduleMutation.mutate(confirmDelete); };
  
  const handleBulkDelete = () => { if (selectedIds.length > 0) setConfirmBulkDelete(true); };
  const confirmBulkDeleteAction = () => { if (selectedIds.length > 0) bulkDeleteMutation.mutate(selectedIds); };

  const toggleSelectAll = () => {
    setSelectedIds(selectedIds.length === schedules.length ? [] : schedules.map(s => s.id));
  };
  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleExport = () => {
    exportSchedulesMutation.mutate({
      search: debouncedSearch || undefined,
      class_id: classFilter === 'all' ? undefined : classFilter,
      day: dayFilter === 'all' ? undefined : dayFilter,
      teacher_id: teacherFilter === 'all' ? undefined : teacherFilter,
    });
  };

  const clearSearch = useCallback(() => setSearch(''), []);

  // Helper to get names from IDs
  const getClassName = (id) => classes.find(c => c.id === id)?.name || '-';
  const getSubjectName = (id) => subjects.find(s => s.id === id)?.name || '-';
  const getTeacherName = (id) => teachers.find(t => t.id === id)?.name || '-';

  // ═══════════════════════════════════════════════════════════
  // LOADING & ERROR
  // ═══════════════════════════════════════════════════════════
  if (isLoading && !isFetching) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="w-14 h-14 border-3 border-primary-500/30 border-t-primary-400 rounded-full mx-auto mb-4" />
          <p className="text-gray-600 dark:text-dark-muted">Memuat data jadwal...</p>
        </motion.div>
      </div>
    );
  }
  
  if (isError) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="w-12 h-12 text-danger mx-auto mb-3" />
        <p className="text-danger font-medium mb-2">Gagal memuat data</p>
        <Button variant="outline" onClick={() => queryClient.invalidateQueries(['admin-schedules'])}>Coba Lagi</Button>
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manajemen Jadwal</h1>
          <p className="text-gray-600 dark:text-dark-muted mt-1">Atur jadwal pelajaran untuk setiap kelas dan guru.</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <Button variant="danger" size="sm" onClick={handleBulkDelete} className="flex items-center gap-1.5">
              <Trash2 className="w-4 h-4" /> Hapus ({selectedIds.length})
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleExport} disabled={exportSchedulesMutation.isLoading} className="flex items-center gap-1.5">
            <Download className="w-4 h-4" /> {exportSchedulesMutation.isLoading ? 'Exporting...' : 'Export'}
          </Button>
          
          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 dark:bg-dark-card rounded-lg p-1 border border-gray-200 dark:border-dark-border">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-dark-bg shadow text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
              title="List View"
            >
              <ListIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-dark-bg shadow text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          <Button onClick={() => { setFormData({ day: 'senin', start_time: '07:00', end_time: '08:30', is_active: true }); setErrors({}); setIsCreateOpen(true); }} 
            className="flex items-center gap-1.5" disabled={createScheduleMutation.isLoading}>
            <Plus className="w-4 h-4" /> {createScheduleMutation.isLoading ? 'Menyimpan...' : 'Tambah Jadwal'}
          </Button>
        </div>
      </motion.div>

      {/* FILTERS */}
      <motion.div variants={itemVariants} className="card">
        <div className="flex flex-col lg:flex-row gap-4 items-end lg:items-center justify-between">
          <div className="flex-1 w-full">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Cari kelas, mapel, atau guru..." value={search}
                onChange={(e) => setSearch(e.target.value)} className="input pl-10 pr-10 w-full" />
              {search && (
                <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setShowFilters(!showFilters)} className="btn btn-outline flex items-center gap-1.5">
              <Filter className="w-4 h-4" /> Filter {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="input w-36">
              <option value="all">Semua Kelas</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={dayFilter} onChange={(e) => setDayFilter(e.target.value)} className="input w-32">
              <option value="all">Semua Hari</option>
              {dayOptions.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
            <select value={teacherFilter} onChange={(e) => setTeacherFilter(e.target.value)} className="input w-36">
              <option value="all">Semua Guru</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        </div>
        
        {/* Extended Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} 
              exit={{ height: 0, opacity: 0 }} className="mt-4 pt-4 border-t border-gray-200 dark:border-dark-border">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <InputField label="Waktu Mulai" name="time_start_filter" type="time" value="" onChange={() => {}} />
                <InputField label="Waktu Selesai" name="time_end_filter" type="time" value="" onChange={() => {}} />
                <SelectField label="Ruang" name="room_filter" value="" onChange={() => {}} options={[{value:'',label:'Semua Ruang'}]} />
                <Button variant="outline" className="w-full" onClick={() => { setSearch(''); setClassFilter('all'); setDayFilter('all'); setTeacherFilter('all'); }}>Reset Filter</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* BULK ACTIONS BAR */}
      {selectedIds.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} 
          className="flex items-center justify-between p-3 bg-primary-500/10 border border-primary-500/30 rounded-xl">
          <span className="text-sm text-primary-600 dark:text-primary-400 font-medium">
            {selectedIds.length} jadwal terpilih
          </span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setSelectedIds([])}>Batal</Button>
            <Button size="sm" variant="danger" onClick={handleBulkDelete}>Hapus Terpilih</Button>
          </div>
        </motion.div>
      )}

      {/* CONTENT BASED ON VIEW MODE */}
      {viewMode === 'list' ? (
        /* LIST VIEW (TABLE) */
        <motion.div variants={itemVariants} className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 dark:bg-dark-card border-b border-gray-200 dark:border-dark-border">
                <tr>
                  <th className="px-4 py-3">
                    <input type="checkbox" checked={schedules.length > 0 && selectedIds.length === schedules.length} 
                      onChange={toggleSelectAll} className="w-4 h-4 rounded border-gray-300 dark:border-dark-border" />
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-600 dark:text-dark-muted">Kelas</th>
                  <th className="px-4 py-3 font-medium text-gray-600 dark:text-dark-muted hidden md:table-cell">Mapel</th>
                  <th className="px-4 py-3 font-medium text-gray-600 dark:text-dark-muted hidden lg:table-cell">Guru</th>
                  <th className="px-4 py-3 font-medium text-gray-600 dark:text-dark-muted">Hari & Waktu</th>
                  <th className="px-4 py-3 font-medium text-gray-600 dark:text-dark-muted hidden xl:table-cell">Ruang</th>
                  <th className="px-4 py-3 font-medium text-gray-600 dark:text-dark-muted">Status</th>
                  <th className="px-4 py-3 font-medium text-gray-600 dark:text-dark-muted text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-dark-border">
                {schedules.map((schedule) => (
                  <motion.tr key={schedule.id} variants={itemVariants} 
                    className={`hover:bg-gray-50 dark:hover:bg-dark-card/50 transition-colors ${selectedIds.includes(schedule.id) ? 'bg-primary-500/5' : ''}`}>
                    <td className="px-4 py-4">
                      <input type="checkbox" checked={selectedIds.includes(schedule.id)} onChange={() => toggleSelect(schedule.id)} 
                        className="w-4 h-4 rounded border-gray-300 dark:border-dark-border" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <School className="w-4 h-4 text-primary-400" />
                        <span className="font-medium text-gray-900 dark:text-white">{getClassName(schedule.class_id)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-purple-400" />
                        <span className="text-gray-700 dark:text-gray-300">{getSubjectName(schedule.subject_id)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden lg:table-cell">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-400" />
                        <span className="text-gray-700 dark:text-gray-300">{getTeacherName(schedule.teacher_id)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900 dark:text-white capitalize">{schedule.day}</span>
                        <span className="text-xs text-gray-500 dark:text-dark-muted flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {schedule.start_time} - {schedule.end_time}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-gray-600 dark:text-dark-muted hidden xl:table-cell">
                      {schedule.room || '-'}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${schedule.is_active ? 'text-success' : 'text-danger'}`}>
                        <span className={`w-2 h-2 rounded-full ${schedule.is_active ? 'bg-success animate-pulse' : 'bg-danger'}`} />
                        {schedule.is_active ? 'Aktif' : 'Non-Aktif'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openViewModal(schedule)} title="Lihat Detail" 
                          className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => openEditModal(schedule)} title="Edit" 
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(schedule.id)} title="Hapus" 
                          className="p-2 text-gray-500 hover:text-danger hover:bg-danger/10 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
                {schedules.length === 0 && (
                  <tr><td colSpan="8" className="text-center py-12"><div className="text-gray-400 mb-2">📭</div>
                    <p className="text-gray-500">{search || classFilter !== 'all' ? 'Tidak ada jadwal yang cocok.' : 'Belum ada data jadwal.'}</p></td></tr>
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
      ) : (
        /* GRID VIEW (CARDS) */
        <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {schedules.map((schedule) => (
            <motion.div key={schedule.id} variants={itemVariants} whileHover={{ y: -4 }}
              className={`card relative group ${selectedIds.includes(schedule.id) ? 'ring-2 ring-primary-500' : ''}`}>
              <div className="absolute top-3 right-3">
                <input type="checkbox" checked={selectedIds.includes(schedule.id)} onChange={() => toggleSelect(schedule.id)} 
                  className="w-4 h-4 rounded border-gray-300 dark:border-dark-border" />
              </div>
              
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500/20 to-primary-600/20 border border-primary-500/30 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-primary-400" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white">{getClassName(schedule.class_id)}</h4>
                  <p className="text-xs text-gray-500 dark:text-dark-muted capitalize">{schedule.day}</p>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <BookOpen className="w-4 h-4 text-purple-400" />
                  <span className="text-gray-700 dark:text-gray-300">{getSubjectName(schedule.subject_id)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-blue-400" />
                  <span className="text-gray-700 dark:text-gray-300">{getTeacherName(schedule.teacher_id)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-accent-cyan" />
                  <span className="text-gray-700 dark:text-gray-300">{schedule.start_time} - {schedule.end_time}</span>
                </div>
                {schedule.room && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-orange-400" />
                    <span className="text-gray-700 dark:text-gray-300">Ruang {schedule.room}</span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-gray-200 dark:border-dark-border flex justify-between items-center">
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${schedule.is_active ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                  {schedule.is_active ? 'Aktif' : 'Non-Aktif'}
                </span>
                <div className="flex gap-1">
                  <button onClick={() => openEditModal(schedule)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(schedule.id)} className="p-1.5 text-gray-500 hover:text-danger hover:bg-danger/10 rounded transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
          {schedules.length === 0 && (
            <div className="col-span-full text-center py-12">
              <div className="text-gray-400 mb-2">📭</div>
              <p className="text-gray-500">Tidak ada jadwal untuk ditampilkan.</p>
            </div>
          )}
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          MODAL: CREATE / EDIT SCHEDULE
          ═══════════════════════════════════════════════════════════ */}
      {(isCreateOpen || isEditOpen) && (
        <Modal isOpen={isCreateOpen || isEditOpen} onClose={() => { setIsCreateOpen(false); setIsEditOpen(false); }} 
          title={isCreateOpen ? "✨ Tambah Jadwal Baru" : "✏️ Edit Jadwal"} size="xl">
          <form onSubmit={isCreateOpen ? handleCreateSubmit : handleEditSubmit} className="space-y-6 max-h-[75vh] overflow-y-auto pr-2">
            
            {/* Section 1: Basic Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white pb-2 border-b dark:border-dark-border flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary-600" /> Informasi Jadwal
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

              <div className="flex items-center gap-2">
                <input type="checkbox" id="is_active" checked={formData.is_active !== false} 
                  onChange={(e) => setFormData({...formData, is_active: e.target.checked})} className="w-4 h-4 text-primary-600 rounded" />
                <label htmlFor="is_active" className="text-sm text-gray-700 dark:text-dark-muted cursor-pointer">Jadwal Aktif</label>
              </div>
            </div>

            {/* Conflict Warning Placeholder */}
            {errors.non_field_errors && (
              <div className="p-4 bg-danger/10 border border-danger/30 rounded-xl text-danger text-sm flex items-start gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Konflik Jadwal Terdeteksi!</p>
                  <p>{Array.isArray(errors.non_field_errors) ? errors.non_field_errors[0] : errors.non_field_errors}</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-4 flex justify-end gap-3 border-t border-gray-200 dark:border-dark-border sticky bottom-0 bg-white dark:bg-dark-card py-4">
              <Button type="button" variant="outline" onClick={() => { setIsCreateOpen(false); setIsEditOpen(false); }}>Batal</Button>
              <Button type="submit" loading={createScheduleMutation.isLoading || updateScheduleMutation.isLoading}>
                {isCreateOpen ? '💾 Simpan Jadwal' : '✏️ Update Jadwal'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ═══════════════════════════════════════════════════════════
          MODAL: VIEW SCHEDULE DETAIL
          ═══════════════════════════════════════════════════════════ */}
      {isViewOpen && selectedSchedule && (
        <Modal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} title="📅 Detail Jadwal" size="lg">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4 pb-4 border-b dark:border-dark-border">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500/20 to-primary-600/20 border-2 border-primary-500/30 flex items-center justify-center">
                <Calendar className="w-8 h-8 text-primary-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{getClassName(selectedSchedule.class_id)}</h3>
                <p className="text-gray-600 dark:text-dark-muted capitalize">{selectedSchedule.day} • {selectedSchedule.start_time} - {selectedSchedule.end_time}</p>
                <div className="flex gap-2 mt-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${selectedSchedule.is_active ? 'bg-success/10 text-success border border-success/30' : 'bg-danger/10 text-danger border border-danger/30'}`}>
                    {selectedSchedule.is_active ? 'Aktif' : 'Non-Aktif'}
                  </span>
                </div>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <DetailItem icon={BookOpen} label="Mata Pelajaran" value={getSubjectName(selectedSchedule.subject_id)} valueClass="text-purple-600 dark:text-purple-400" />
                <DetailItem icon={Users} label="Guru Pengajar" value={getTeacherName(selectedSchedule.teacher_id)} valueClass="text-blue-600 dark:text-blue-400" />
                <DetailItem icon={Clock} label="Durasi" value={`${selectedSchedule.duration_minutes || 90} Menit`} />
              </div>
              <div className="space-y-4">
                <DetailItem icon={MapPin} label="Ruang" value={selectedSchedule.room || 'Tidak ditentukan'} />
                <DetailItem icon={Calendar} label="Dibuat Pada" value={new Date(selectedSchedule.created_at).toLocaleDateString('id-ID')} />
                <DetailItem icon={RefreshCw} label="Terakhir Update" value={new Date(selectedSchedule.updated_at).toLocaleDateString('id-ID')} />
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t dark:border-dark-border flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setIsViewOpen(false); openEditModal(selectedSchedule); }}>
                <Edit2 className="w-4 h-4 mr-1" /> Edit
              </Button>
              <Button variant="danger" onClick={() => { setIsViewOpen(false); handleDelete(selectedSchedule.id); }}>
                <Trash2 className="w-4 h-4 mr-1" /> Hapus
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirmation Modals */}
      <ConfirmModal isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={confirmDeleteAction}
        title="Hapus Jadwal?" message="Apakah Anda yakin ingin menghapus jadwal ini? Slot waktu ini akan menjadi kosong." />
      
      <ConfirmModal isOpen={confirmBulkDelete} onClose={() => setConfirmBulkDelete(false)} onConfirm={confirmBulkDeleteAction}
        title={`Hapus ${selectedIds.length} Jadwal?`} message="Apakah Anda yakin ingin menghapus jadwal yang terpilih? Tindakan ini tidak dapat dibatalkan." />

    </motion.div>
  );
}