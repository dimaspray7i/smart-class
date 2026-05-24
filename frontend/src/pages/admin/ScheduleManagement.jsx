import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, Search, Edit2, Trash2, X, Loader2, Calendar, Clock, Users, BookOpen,
  Download, Upload, Filter, MoreVertical, Check, ChevronDown, ChevronUp,
  MapPin, ArrowRight, School, UserCheck, LayoutGrid, List as ListIcon,
  AlertCircle, CheckCircle2, Eye, RefreshCw, ChevronRight, ChevronLeft,
  Menu, Star, Sparkles, Smile, FileText, Rocket, Settings, CalendarDays, Target, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminAPI } from '../../api';
import { ID } from '../../i18n/id';

// 🏛️ CENTRALIZED UI COMPONENTS
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Toast from '../../components/ui/Toast';
import RetroTable, { TableActions } from '../../components/ui/RetroTable';
import { PageHeader, RetroSection, StatGrid, RetroCard, RetroStatWidget } from '../../components/ui/RetroLayouts';
import { twMerge } from 'tailwind-merge';

// 🎨 ANIMATION VARIANTS
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

const retroCardVariants = {
  hidden: { opacity: 0, y: 30, rotate: -1 },
  visible: { opacity: 1, y: 0, rotate: 0, transition: { type: "spring", stiffness: 100, damping: 15, mass: 0.1 } }
};

const floatVariants = {
  animate: { y: [0, -8, 0], rotate: [0, 2, -2, 0], transition: { duration: 4, repeat: Infinity, ease: "easeInOut" } }
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

// 🆕 QUICK TIME TEMPLATES
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
  const [formData, setFormData] = useState({
    class_id: '', subject_id: '', teacher_id: '', day: 'senin', 
    start_time: '07:00', end_time: '08:30', room: '', is_active: true
  });
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
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search, 500);

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, classFilter, dayFilter, teacherFilter]);

  // Filter teachers based on selected subject in Create/Edit form
  const filteredTeachers = useMemo(() => {
    if (!formData.subject_id) return teachers;
    const targetSubjectId = Number(formData.subject_id);
    return teachers.filter(t => {
      const teacherSubjects = t.profile?.subjects || [];
      return teacherSubjects.some(s => s.id === targetSubjectId);
    });
  }, [teachers, formData.subject_id]);

  // Fetch dependencies for forms sequentially to avoid deadlock/timeout on single-threaded PHP built-in server
  useEffect(() => {
    const loadDependencies = async () => {
      try {
        let classesData = [];
        try {
          const classesRes = await adminAPI.getClasses({ is_active: true, all: true });
          classesData = Array.isArray(classesRes.data) ? classesRes.data : (classesRes.data?.data || classesRes.data || []);
        } catch (e) {
          console.error('Failed to fetch classes dependency:', e);
        }

        let subjectsData = [];
        try {
          const subjectsRes = await adminAPI.getSubjects({ is_active: true, all: true });
          subjectsData = Array.isArray(subjectsRes.data) ? subjectsRes.data : (subjectsRes.data?.data || subjectsRes.data || []);
        } catch (e) {
          console.error('Failed to fetch subjects dependency:', e);
        }

        let teachersData = [];
        try {
          const teachersRes = await adminAPI.getUsers({ role: 'guru', is_active: true, all: true });
          teachersData = Array.isArray(teachersRes.data) ? teachersRes.data : (teachersRes.data?.data || teachersRes.data || []);
        } catch (e) {
          console.error('Failed to fetch teachers dependency:', e);
        }

        setClasses(classesData);
        setSubjects(subjectsData);
        setTeachers(teachersData);
      } catch (err) {
        console.error('Failed to fetch dependencies:', err);
      }
    };
    loadDependencies();
  }, []);

  // Fetch schedules with filters (ORIGINAL PRESERVED)
  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ['admin-schedules', page, debouncedSearch, classFilter, dayFilter, teacherFilter],
    queryFn: () => adminAPI.getSchedules({
        page,
        search: debouncedSearch || undefined,
        class_id: classFilter === 'all' ? undefined : classFilter,
        day: dayFilter === 'all' ? undefined : dayFilter,
        teacher_id: teacherFilter === 'all' ? undefined : teacherFilter,
    }),
    placeholderData: (prev) => prev,
    staleTime: 30000,
  });

  const schedules = data?.data || [];
  const meta = data?.meta || {};

  // 📊 QUICK STATS CALCULATION
  const stats = useMemo(() => {
    return {
      total: meta.total || 0,
      active: schedules.length,
      byDay: {
        senin: schedules.filter(s => s.day === 'senin').length,
        selasa: schedules.filter(s => s.day === 'selasa').length,
        rabu: schedules.filter(s => s.day === 'rabu').length,
        kamis: schedules.filter(s => s.day === 'kamis').length,
        jumat: schedules.filter(s => s.day === 'jumat').length,
        sabtu: schedules.filter(s => s.day === 'sabtu').length,
      }
    };
  }, [schedules, meta]);

  // Show toast notification (ORIGINAL PRESERVED)
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // ═══════════════════════════════════════════════════════════
  // MUTATIONS (ORIGINAL PRESERVED)
  // ═══════════════════════════════════════════════════════════
  const createScheduleMutation = useMutation({
    mutationFn: (newSchedule) => adminAPI.createSchedule(newSchedule),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-schedules'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
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
    mutationFn: ({ id, ...updatedData }) => adminAPI.updateSchedule(id, updatedData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-schedules'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
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
    mutationFn: (id) => adminAPI.deleteSchedule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-schedules'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
      showToast('✅ Jadwal berhasil dihapus!', 'success');
      setConfirmDelete(null);
    },
    onError: (err) => {
      showToast(`❌ ${err.response?.data?.message || 'Gagal menghapus jadwal'}`, 'error');
    }
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids) => adminAPI.bulkDeleteSchedules(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-schedules'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
      setSelectedIds([]);
      showToast('✅ Jadwal berhasil dihapus!', 'success');
      setConfirmBulkDelete(false);
    },
    onError: (err) => {
      showToast(`❌ ${err.response?.data?.message || 'Gagal menghapus jadwal'}`, 'error');
    }
  });

  const exportSchedulesMutation = useMutation({
    mutationFn: (filters) => adminAPI.exportSchedules('csv', filters),
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
  const getClassName = (id) => (Array.isArray(classes) ? classes.find(c => c.id === id)?.name : '') || '-';
  const getSubjectName = (id) => (Array.isArray(subjects) ? subjects.find(s => s.id === id)?.name : '') || '-';
  const getTeacherName = (id) => (Array.isArray(teachers) ? teachers.find(t => t.id === id)?.name : '') || '-';

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
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* 🏛️ PAGE HEADER */}
      <PageHeader 
        title={ID.nav.schedules}
        icon={Calendar}
        description="Rencanakan dan kelola jadwal pelajaran kelas, distribusi mata pelajaran, dan alokasi ruangan."
        breadcrumbs={[{ label: ID.nav.schedules, path: '/admin/schedules' }]}
        actions={
          <div className="flex gap-2">
            <div className="flex p-1 bg-base-gray/20 rounded-retro-sm">
              <button 
                onClick={() => setViewMode('list')}
                className={twMerge(
                  "p-2 rounded-retro-sm transition-all",
                  viewMode === 'list' ? "bg-base-black text-base-white shadow-hard-sm" : "hover:bg-base-black/10 text-base-black"
                )}
              >
                <ListIcon className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode('grid')}
                className={twMerge(
                  "p-2 rounded-retro-sm transition-all",
                  viewMode === 'grid' ? "bg-base-black text-base-white shadow-hard-sm" : "hover:bg-base-black/10 text-base-black"
                )}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode('weekly')}
                className={twMerge(
                  "p-2 rounded-retro-sm transition-all",
                  viewMode === 'weekly' ? "bg-base-black text-base-white shadow-hard-sm" : "hover:bg-base-black/10 text-base-black"
                )}
              >
                <CalendarDays className="w-4 h-4" />
              </button>
            </div>
            <Button 
              variant="primary" 
              onClick={() => { setFormData({ day: 'senin', start_time: '07:00', end_time: '08:30', is_active: true }); setErrors({}); setIsCreateOpen(true); }}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Tambah Jadwal
            </Button>
          </div>
        }
      />

      {/* 📊 QUICK STATS */}
      <StatGrid>
        <RetroStatWidget
          title="Total Jadwal"
          value={meta.total || 0}
          icon={Calendar}
          color="orange"
        />
        <RetroStatWidget
          title="Kelas Terdaftar"
          value={classes.length}
          icon={School}
          color="blue"
        />
        <RetroStatWidget
          title="Mapel Aktif"
          value={subjects.length}
          icon={BookOpen}
          color="purple"
        />
        <RetroStatWidget
          title="Total Guru"
          value={teachers.length}
          icon={Users}
          color="lime"
        />
      </StatGrid>

      {/* 🔍 SEARCH & FILTERS */}
      <RetroSection>
        <RetroCard className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <Input 
                label="Cari Jadwal"
                placeholder="Cari mata pelajaran atau guru..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                prefix={<Search className="w-4 h-4" />}
                suffix={search && <X className="w-4 h-4 cursor-pointer" onClick={() => setSearch('')} />}
              />
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                {showFilters ? 'Sembunyikan' : 'Tampilkan'} Filter
              </Button>
              <Button 
                variant="outline" 
                onClick={() => { setSearch(''); setClassFilter('all'); setDayFilter('all'); setTeacherFilter('all'); }}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden pt-4 mt-4 border-t-2 border-base-black/10"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Select 
                    label="Filter Kelas"
                    value={classFilter}
                    onChange={(e) => setClassFilter(e.target.value)}
                    options={[
                      { value: 'all', label: 'Semua Kelas' },
                      ...classes.map(c => ({ value: c.id, label: c.name }))
                    ]}
                  />
                  <Select 
                    label="Filter Hari"
                    value={dayFilter}
                    onChange={(e) => setDayFilter(e.target.value)}
                    options={[
                      { value: 'all', label: 'Semua Hari' },
                      ...dayOptions
                    ]}
                  />
                  <Select 
                    label="Filter Guru"
                    value={teacherFilter}
                    onChange={(e) => setTeacherFilter(e.target.value)}
                    options={[
                      { value: 'all', label: 'Semua Guru' },
                      ...teachers.map(t => ({ value: t.id, label: t.name }))
                    ]}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </RetroCard>
      </RetroSection>

      {/* Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} 
          className="retro-card p-3 bg-retro-orange/10 border-retro-orange flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wide text-base-black">
            {selectedIds.length} jadwal terpilih
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setSelectedIds([])}>Batal</Button>
            <Button variant="primary" size="sm" onClick={handleBulkDelete} className="bg-danger border-danger">Hapus Terpilih</Button>
          </div>
        </motion.div>
      )}

      {/* 📋 DATA PRESENTATION */}
      <RetroSection>
        {viewMode === 'list' ? (
          <RetroTable 
            isLoading={isLoading}
            data={schedules}
            columns={[
              {
                header: 'Kelas',
                key: 'class_id',
                render: (id) => (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-retro-sm bg-retro-orange/20 border-2 border-retro-orange flex items-center justify-center">
                      <School className="w-4 h-4 text-retro-orange" />
                    </div>
                    <span className="font-retro-display font-black text-base-black text-sm">{getClassName(id)}</span>
                  </div>
                )
              },
              {
                header: 'Mata Pelajaran & Guru',
                key: 'subject_id',
                render: (sid, item) => (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-3.5 h-3.5 text-retro-purple" />
                      <span className="text-base-black font-black text-sm">{getSubjectName(sid)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-base-black/50">
                      <Users className="w-3 h-3" />
                      <span className="text-[10px] font-retro-mono">{getTeacherName(item.teacher_id)}</span>
                    </div>
                  </div>
                )
              },
              {
                header: 'Jadwal',
                key: 'day',
                render: (day, item) => (
                  <div className="flex flex-col">
                    <span className="font-black text-base-black uppercase tracking-wider text-xs">{day}</span>
                    <span className="text-[10px] text-base-black/60 flex items-center gap-1 font-retro-mono">
                      <Clock className="w-3 h-3" /> {item.start_time} - {item.end_time}
                    </span>
                  </div>
                )
              },
              {
                header: 'Ruangan',
                key: 'room',
                render: (room) => (
                  <div className="flex items-center gap-1.5 text-base-black/70">
                    <MapPin className="w-3.5 h-3.5 text-retro-orange" />
                    <span className="text-xs font-retro-mono">{room || '-'}</span>
                  </div>
                )
              },
              {
                header: 'Status',
                key: 'is_active',
                render: (active) => (
                  <span className={`retro-badge text-[10px] ${active ? 'retro-badge-green' : 'retro-badge-red'}`}>
                    {active ? 'AKTIF' : 'NON-AKTIF'}
                  </span>
                )
              }
            ]}
            actions={(row) => (
              <TableActions 
                onView={() => openViewModal(row)}
                onEdit={() => openEditModal(row)}
                onDelete={() => handleDelete(row.id)}
              />
            )}
            selectedIds={selectedIds}
            onSelect={toggleSelect}
            onSelectAll={toggleSelectAll}
            pagination={{
              currentPage: meta.current_page || 1,
              totalPages: meta.last_page || 1,
              totalItems: meta.total || 0,
              onPageChange: (p) => setPage(p)
            }}
          />
        ) : viewMode === 'grid' ? (
          /* GRID VIEW (CARDS) */
          <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {schedules.map((schedule) => (
              <motion.div 
                key={schedule.id} 
                variants={itemVariants} 
                whileHover={{ y: -4, rotate: 1 }}
                className={twMerge(
                  "retro-card relative group p-4 bg-base-white",
                  selectedIds.includes(schedule.id) && "ring-4 ring-retro-orange shadow-hard"
                )}
              >
                <div className="absolute top-3 right-3 z-10">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.includes(schedule.id)} 
                    onChange={() => toggleSelect(schedule.id)} 
                    className="w-4 h-4 accent-retro-orange border-2 border-base-black cursor-pointer" 
                  />
                </div>
                
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 retro-card bg-retro-orange/20 border-retro-orange flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-retro-orange" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-retro-display font-black text-base-black text-sm truncate">{getClassName(schedule.class_id)}</h4>
                    <p className="text-[10px] font-retro-mono text-base-black/60 capitalize">{schedule.day}</p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-xs">
                    <BookOpen className="w-4 h-4 text-retro-purple" />
                    <span className="text-base-black/80 truncate">{getSubjectName(schedule.subject_id)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Users className="w-4 h-4 text-retro-blue" />
                    <span className="text-base-black/80 truncate">{getTeacherName(schedule.teacher_id)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Clock className="w-4 h-4 text-retro-lime" />
                    <span className="text-base-black/80">{schedule.start_time} - {schedule.end_time}</span>
                  </div>
                  {schedule.room && (
                    <div className="flex items-center gap-2 text-xs">
                      <MapPin className="w-4 h-4 text-retro-yellow" />
                      <span className="text-base-black/80 truncate">Ruang {schedule.room}</span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t-2 border-base-black/10 flex justify-between items-center">
                  <span className={`retro-badge text-[10px] ${schedule.is_active ? 'retro-badge-green' : 'retro-badge-red'}`}>
                    {schedule.is_active ? 'AKTIF' : 'NON-AKTIF'}
                  </span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEditModal(schedule)} className="p-1.5 retro-btn retro-btn-sm retro-btn-outline"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDelete(schedule.id)} className="p-1.5 retro-btn retro-btn-sm bg-danger text-base-white border-danger"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          /* WEEKLY VIEW (CALENDAR STYLE) */
          <motion.div variants={itemVariants} className="retro-card bg-base-white overflow-hidden p-6">
            <div className="overflow-x-auto">
              <div className="min-w-[800px] grid grid-cols-6 gap-3">
                <div className="font-black text-[10px] uppercase tracking-widest text-base-black/40 p-2 text-center flex items-center justify-center border-2 border-dashed border-base-black/10 rounded-retro-sm">Waktu</div>
                {dayOptions.map(d => (
                  <div key={d.value} className="retro-card bg-retro-blue text-base-white border-2 border-base-black p-3 text-center font-black text-xs uppercase tracking-tight shadow-hard-sm">
                    {d.label}
                  </div>
                ))}
                
                {['07:00','08:30','10:00','11:30','13:00','14:30'].map(time => (
                  <React.Fragment key={time}>
                    <div className="p-2 flex items-center justify-center font-retro-mono text-xs font-black text-base-black/60 bg-base-gray/10 rounded-retro-sm border-2 border-base-black/5">
                      {time}
                    </div>
                    {dayOptions.map(d => {
                      const slot = schedules.find(s => s.day === d.value && s.start_time === time && s.is_active);
                      return (
                        <motion.div 
                          key={`${d.value}-${time}`} 
                          whileHover={slot ? { scale: 1.02, y: -2 } : {}}
                          className={twMerge(
                            "p-3 border-2 rounded-retro-sm min-h-[80px] transition-all",
                            slot 
                              ? "bg-retro-yellow/20 border-retro-yellow shadow-hard-sm cursor-pointer" 
                              : "bg-base-gray/5 border-base-black/5 border-dashed"
                          )}
                          onClick={() => slot && openViewModal(slot)}
                        >
                          {slot ? (
                            <div className="space-y-1">
                              <p className="text-[10px] font-black text-base-black leading-tight uppercase truncate">{getSubjectName(slot.subject_id)}</p>
                              <div className="flex items-center gap-1">
                                <School className="w-2.5 h-2.5 text-retro-orange" />
                                <span className="font-retro-mono text-[9px] font-bold text-base-black/60 truncate">{getClassName(slot.class_id)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="w-2.5 h-2.5 text-retro-purple" />
                                <span className="font-retro-mono text-[9px] text-base-black/40 truncate">{slot.room || '-'}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                              <Plus className="w-4 h-4 text-base-black/20" />
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>
            <div className="mt-8 flex items-center justify-center gap-4 py-4 bg-base-gray/5 border-2 border-dashed border-base-black/10 rounded-retro-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-retro-yellow/20 border-2 border-retro-yellow rounded-sm" />
                <span className="text-[10px] font-retro-mono font-bold text-base-black/60 uppercase">Jadwal Aktif</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-base-gray/5 border-2 border-dashed border-base-black/10 rounded-sm" />
                <span className="text-[10px] font-retro-mono font-bold text-base-black/60 uppercase">Slot Kosong</span>
              </div>
              <p className="text-[10px] font-retro-mono text-base-black/40 italic ml-4">
                💡 Tampilan mingguan hanya menampilkan jadwal aktif.
              </p>
            </div>
          </motion.div>
        )}
      </RetroSection>

        {/* ═══════════════════════════════════════════════════════════
            MODAL: CREATE / EDIT SCHEDULE (ORIGINAL PRESERVED + RETRO + 🆕 QUICK TEMPLATES)
            ═══════════════════════════════════════════════════════════ */}
      {/* ═══════════════════════════════════════════════════════════
          MODALS: CREATE / EDIT (REFACTORED WITH STANDARDIZED UI)
          ═══════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {(isCreateOpen || isEditOpen) && (
          <Modal 
            isOpen={isCreateOpen || isEditOpen} 
            onClose={() => { setIsCreateOpen(false); setIsEditOpen(false); }} 
            title={isCreateOpen ? "Tambah Jadwal Baru" : "Ubah Entri Jadwal"} 
            size="2xl"
          >
            <form onSubmit={isCreateOpen ? handleCreateSubmit : handleEditSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <Select 
                    label="Kelas Sasaran"
                    value={formData.class_id}
                    onChange={(e) => setFormData({...formData, class_id: e.target.value})}
                    options={[
                      { value: '', label: 'Pilih Kelas' },
                      ...classes.map(c => ({ value: c.id, label: c.name }))
                    ]}
                    required
                    error={errors.class_id}
                  />
                  <Select 
                    label="Mata Pelajaran"
                    value={formData.subject_id}
                    onChange={(e) => {
                      const newSubjectId = e.target.value;
                      const targetSubjectId = Number(newSubjectId);
                      const eligibleTeachers = teachers.filter(t => 
                        (t.profile?.subjects || []).some(s => s.id === targetSubjectId)
                      );
                      
                      let nextTeacherId = '';
                      if (eligibleTeachers.length === 1) {
                        nextTeacherId = eligibleTeachers[0].id;
                      } else if (formData.teacher_id) {
                        const keepsTeacher = eligibleTeachers.some(t => t.id === Number(formData.teacher_id));
                        if (keepsTeacher) nextTeacherId = formData.teacher_id;
                      }
                      
                      setFormData(prev => ({
                        ...prev,
                        subject_id: newSubjectId,
                        teacher_id: nextTeacherId
                      }));
                    }}
                    options={[
                      { value: '', label: 'Pilih Mata Pelajaran' },
                      ...subjects.map(s => ({ value: s.id, label: `${s.code} - ${s.name}` }))
                    ]}
                    required
                    error={errors.subject_id}
                  />
                  {formData.subject_id && filteredTeachers.length === 1 ? (
                    <div className="space-y-1.5">
                      <label className="font-retro-mono text-xs uppercase text-base-black font-black flex items-center gap-2"><Users className="w-3.5 h-3.5" /> Guru Pengampu</label>
                      <div className="w-full px-3 py-2 border-2 border-base-black rounded-retro bg-base-gray/20 font-retro-mono text-sm text-base-black/70 cursor-not-allowed">
                        {filteredTeachers[0].name}
                      </div>
                      <p className="text-[10px] text-base-black/50 font-retro-mono mt-1 italic">Diisi otomatis berdasarkan mapel terpilih.</p>
                    </div>
                  ) : formData.subject_id && filteredTeachers.length > 1 ? (
                    <Select 
                      label="Pilih Guru Pengampu"
                      value={formData.teacher_id}
                      onChange={(e) => setFormData({...formData, teacher_id: e.target.value})}
                      options={[
                        { value: '', label: 'Terdapat beberapa guru, silakan pilih' },
                        ...filteredTeachers.map(t => ({ value: t.id, label: t.name }))
                      ]}
                      required
                      error={errors.teacher_id}
                    />
                  ) : formData.subject_id && filteredTeachers.length === 0 ? (
                    <div className="space-y-1.5">
                      <label className="font-retro-mono text-xs uppercase text-base-black font-black flex items-center gap-2"><Users className="w-3.5 h-3.5" /> Guru Pengampu</label>
                      <div className="w-full px-3 py-2 border-2 border-danger rounded-retro bg-danger/10 font-retro-mono text-sm text-danger cursor-not-allowed">
                        Tidak ada guru yang mengampu mapel ini
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <Select 
                      label="Hari"
                      value={formData.day}
                      onChange={(e) => setFormData({...formData, day: e.target.value})}
                      options={dayOptions}
                      required
                    />
                    <Input 
                      label="Ruangan"
                      placeholder="Contoh: LAB-01"
                      value={formData.room}
                      onChange={(e) => setFormData({...formData, room: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input 
                      label="Waktu Mulai"
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                      required
                    />
                    <Input 
                      label="Waktu Selesai"
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                      required
                    />
                  </div>

                  <div className="p-3 retro-card bg-retro-yellow/5 border-retro-yellow/20">
                    <p className="text-[10px] font-black uppercase tracking-widest text-base-black/40 mb-3 flex items-center gap-2">
                      <Clock className="w-3 h-3" /> Templat Cepat
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {quickTimeTemplates.map(t => (
                        <button 
                          type="button" 
                          key={t.label} 
                          onClick={() => setFormData({...formData, start_time: t.start, end_time: t.end})} 
                          className="px-2 py-1 bg-base-white border-2 border-base-black rounded-retro-sm text-[9px] font-black hover:bg-retro-yellow transition-colors"
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-base-gray/5 rounded-retro-sm">
                    <input 
                      type="checkbox" 
                      id="is_active_check"
                      checked={formData.is_active !== false} 
                      onChange={(e) => setFormData({...formData, is_active: e.target.checked})} 
                      className="w-4 h-4 accent-retro-orange border-2 border-base-black rounded-sm"
                    />
                    <label htmlFor="is_active_check" className="text-xs font-black uppercase tracking-tight text-base-black/60 cursor-pointer">
                      Aktifkan Jadwal
                    </label>
                  </div>
                </div>
              </div>

              {errors.non_field_errors && (
                <div className="p-4 retro-card bg-danger/10 border-danger border-2 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-danger" />
                  <div>
                    <p className="text-xs font-black uppercase text-danger">Konflik Jadwal!</p>
                    <p className="text-[10px] font-retro-mono text-base-black/70 mt-1">{Array.isArray(errors.non_field_errors) ? errors.non_field_errors[0] : errors.non_field_errors}</p>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-6 border-t-4 border-base-black">
                <Button variant="outline" type="button" onClick={() => { setIsCreateOpen(false); setIsEditOpen(false); }}>Batal</Button>
                <Button variant="primary" type="submit" loading={createScheduleMutation.isPending || updateScheduleMutation.isPending}>
                  {isCreateOpen ? 'Tambah Jadwal' : 'Simpan Perubahan'}
                </Button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════
          MODAL: VIEW DETAILS
          ═══════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isViewOpen && selectedSchedule && (
          <Modal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} title="Detail Jadwal" size="lg">
            <div className="space-y-8">
              <div className="flex items-center gap-6 p-4 bg-retro-orange/5 border-2 border-retro-orange rounded-retro">
                <div className="w-20 h-20 retro-card bg-retro-orange border-4 border-base-black flex items-center justify-center flex-shrink-0 shadow-hard">
                  <Calendar className="w-10 h-10 text-base-white" />
                </div>
                <div className="min-w-0">
                  <span className="retro-badge retro-badge-orange text-[9px] mb-2 inline-block">SESI KELAS</span>
                  <h3 className="retro-heading text-2xl text-base-black truncate">{getClassName(selectedSchedule.class_id)}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="font-retro-display font-black text-retro-orange uppercase text-xs">{selectedSchedule.day}</span>
                    <span className="text-base-black/30 font-black">•</span>
                    <span className="font-retro-mono text-xs text-base-black/60">{selectedSchedule.start_time} - {selectedSchedule.end_time}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <RetroCard variant="purple" className="p-4 border-2">
                  <div className="flex items-center gap-3 mb-3">
                    <BookOpen className="w-5 h-5 text-retro-purple" />
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-base-black/50">Mata Pelajaran</h4>
                  </div>
                  <p className="font-retro-display font-black text-base-black text-lg truncate">
                    {getSubjectName(selectedSchedule.subject_id)}
                  </p>
                </RetroCard>

                <RetroCard variant="blue" className="p-4 border-2">
                  <div className="flex items-center gap-3 mb-3">
                    <Users className="w-5 h-5 text-retro-blue" />
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-base-black/50">Guru</h4>
                  </div>
                  <p className="font-retro-display font-black text-base-black text-lg truncate">
                    {getTeacherName(selectedSchedule.teacher_id)}
                  </p>
                </RetroCard>

                <RetroCard variant="white" className="p-4 border-2">
                  <div className="flex items-center gap-3 mb-3">
                    <MapPin className="w-5 h-5 text-retro-orange" />
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-base-black/50">Lokasi</h4>
                  </div>
                  <p className="font-retro-display font-black text-base-black text-lg">
                    {selectedSchedule.room || 'Belum Ditentukan'}
                  </p>
                </RetroCard>

                <RetroCard variant="lime" className="p-4 border-2">
                  <div className="flex items-center gap-3 mb-3">
                    <Clock className="w-5 h-5 text-retro-lime" />
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-base-black/50">Status</h4>
                  </div>
                  <span className={twMerge(
                    "retro-badge text-xs px-4",
                    selectedSchedule.is_active ? "retro-badge-green" : "retro-badge-red"
                  )}>
                    {selectedSchedule.is_active ? 'SESI AKTIF' : 'NON-AKTIF'}
                  </span>
                </RetroCard>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t-4 border-base-black">
                <Button variant="outline" onClick={() => setIsViewOpen(false)}>Tutup</Button>
                <Button variant="primary" onClick={() => { setIsViewOpen(false); openEditModal(selectedSchedule); }}>Ubah Entri</Button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Confirmation Modals */}
      <Modal isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Konfirmasi Penghapusan" size="md">
        <div className="text-center p-4">
          <div className="w-20 h-20 bg-danger/10 border-4 border-danger rounded-retro mx-auto mb-6 flex items-center justify-center">
            <Trash2 className="w-10 h-10 text-danger" />
          </div>
          <h3 className="retro-heading text-xl mb-3">Hapus jadwal ini?</h3>
          <p className="text-sm font-retro-mono text-base-black/60 mb-8">
            Tindakan ini akan menghapus sesi kelas ini secara permanen. Tindakan ini tidak dapat dibatalkan.
          </p>
          <div className="flex gap-4 justify-center">
            <Button variant="outline" className="flex-1" onClick={() => setConfirmDelete(null)}>Batal</Button>
            <Button variant="primary" className="bg-danger border-danger flex-1" onClick={confirmDeleteAction}>Ya, Hapus</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={confirmBulkDelete} onClose={() => setConfirmBulkDelete(false)} title="Hapus Massal" size="md">
        <div className="text-center p-4">
          <div className="w-20 h-20 bg-danger/10 border-4 border-danger rounded-retro mx-auto mb-6 flex items-center justify-center">
            <Trash2 className="w-10 h-10 text-danger" />
          </div>
          <h3 className="retro-heading text-xl mb-3">Hapus {selectedIds.length} jadwal terpilih?</h3>
          <p className="text-sm font-retro-mono text-base-black/60 mb-8">
            Anda akan menghapus beberapa entri jadwal sekaligus. Tindakan ini bersifat final.
          </p>
          <div className="flex gap-4 justify-center">
            <Button variant="outline" className="flex-1" onClick={() => setConfirmBulkDelete(false)}>Batal</Button>
            <Button variant="primary" className="bg-danger border-danger flex-1" onClick={confirmBulkDeleteAction}>Ya, Hapus Semua</Button>
          </div>
        </div>
      </Modal>

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