import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, Search, Edit2, Trash2, X, Loader2, School, Users, Calendar,
  Download, Upload, Filter, MoreVertical, Check, ChevronDown, ChevronUp,
  MapPin, Clock, BookOpen, UserPlus, UserMinus, AlertCircle, CheckCircle2,
  Eye, Settings, BarChart3, RefreshCw, ChevronRight, ChevronLeft,
  Menu, Star, Sparkles, Smile, ArrowRight, Target, FileText, Rocket
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminAPI } from '../../api';

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
    transition: { type: "spring", stiffness: 100, damping: 15, mass: 0.1 } 
  }
};

/**
 * ⌨️ Retro Input Component
 */
function RetroInput({ label, name, value, onChange, error, ...props }) {
  return (
    <Input 
      label={label}
      value={value}
      onChange={e => onChange(prev => ({ ...prev, [name]: e.target.value }))}
      error={error}
      {...props}
    />
  );
}

/**
 * ⏬ Retro Select Component
 */
function RetroSelect({ label, name, value, onChange, options = [], error, ...props }) {
  return (
    <Select 
      label={label}
      value={value}
      onChange={e => onChange(prev => ({ ...prev, [name]: e.target.value }))}
      options={options}
      error={error}
      {...props}
    />
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
  const [formData, setFormData] = useState({
    name: '', level: 'X', is_active: true, teacher_id: '', description: ''
  });
  const [errors, setErrors] = useState({});
  const [teachers, setTeachers] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [toast, setToast] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch teachers for form
  useEffect(() => {
    if (isCreateOpen || isEditOpen) {
      adminAPI.getUsers({ role: 'guru', is_active: true, all: 1 })
        .then(res => setTeachers(res.data || []))
        .catch(err => console.error('Failed to fetch teachers:', err));
    }
  }, [isCreateOpen, isEditOpen]);

  // Fetch classes with filters
  const { data, isPending, isError, isFetching } = useQuery({
    queryKey: ['admin-classes', debouncedSearch],
    queryFn: () => adminAPI.getClasses({
      page: 1, 
      search: debouncedSearch || undefined 
    }),
    placeholderData: (prev) => prev,
    staleTime: 30000,
  });

  const classes = data?.data || [];
  const meta = data?.meta || {};

  // 📊 QUICK STATS CALCULATION
  const stats = useMemo(() => {
    return {
      total: meta.total || 0,
      active: classes.filter(c => c.is_active).length,
      grade10: classes.filter(c => c.level === 'X').length,
      grade11: classes.filter(c => c.level === 'XI').length,
      grade12: classes.filter(c => c.level === 'XII').length,
    };
  }, [classes, meta]);

  // Show toast notification
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // ═══════════════════════════════════════════════════════════
  // 🔌 MUTATIONS
  // ═══════════════════════════════════════════════════════════
  const createClassMutation = useMutation({
    mutationFn: (newClass) => adminAPI.createClass(newClass),
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
    mutationFn: ({ id, ...updatedData }) => adminAPI.updateClass(id, updatedData),
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
    mutationFn: (id) => adminAPI.deleteClass(id),
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
    mutationFn: (ids) => adminAPI.deleteClass(null, { ids }),
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
  if (isPending && !isFetching) {
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
    <motion.div 
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* 🏛️ PAGE HEADER */}
      <PageHeader 
        title="Class Management"
        icon={School}
        description="Organize and monitor classroom settings, homeroom assignments, and capacity."
        breadcrumbs={[{ label: 'Classes', path: '/admin/classes' }]}
        actions={
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => {}} 
              className="hidden sm:flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Import
            </Button>
            <Button 
              variant="primary" 
              onClick={() => { setFormData({level:'X',capacity:36,is_active:true}); setErrors({}); setIsCreateOpen(true); }}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Class
            </Button>
          </div>
        }
      />

      {/* 📊 QUICK STATS */}
      <StatGrid>
        <RetroStatWidget
          title="Total Classes"
          value={stats.total}
          icon={School}
          color="orange"
        />
        <RetroStatWidget
          title="Active Students"
          value={stats.totalStudents}
          icon={Users}
          color="blue"
          trend={8}
        />
        <RetroStatWidget
          title="Class Capacity"
          value={stats.totalCapacity}
          icon={MapPin}
          color="purple"
        />
        <RetroStatWidget
          title="Active Classes"
          value={stats.active}
          icon={CheckCircle2}
          color="lime"
        />
      </StatGrid>

        {/* Search */}
      {/* 🔍 SEARCH & FILTERS */}
      <RetroSection>
        <RetroCard className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <Input 
                label="Search Classes"
                placeholder="Search class name..."
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
                {showFilters ? 'Hide' : 'Show'} Filters
              </Button>
              <Button 
                variant="outline" 
                onClick={() => { setSearch(''); setAdvancedFilters({level:'all',status:'all'}); }}
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
                    label="Grade Level"
                    value={advancedFilters.level}
                    onChange={(e) => setAdvancedFilters({...advancedFilters, level: e.target.value})}
                    options={[
                      { value: 'all', label: 'All Levels' },
                      { value: 'X', label: 'Grade X' },
                      { value: 'XI', label: 'Grade XI' },
                      { value: 'XII', label: 'Grade XII' }
                    ]}
                  />
                  <Select 
                    label="Status"
                    value={advancedFilters.status}
                    onChange={(e) => setAdvancedFilters({...advancedFilters, status: e.target.value})}
                    options={[
                      { value: 'all', label: 'All Status' },
                      { value: 'active', label: 'Active Only' },
                      { value: 'inactive', label: 'Inactive Only' }
                    ]}
                  />
                  <div className="flex items-end">
                    <Button 
                      variant="primary" 
                      className="w-full"
                      onClick={() => queryClient.invalidateQueries(['admin-classes'])}
                    >
                      Apply Filters
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </RetroCard>
      </RetroSection>

      {/* 📋 TABS & CONTENT */}
      <div className="space-y-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'schedule', label: 'Schedule', icon: Calendar },
            { id: 'students', label: 'Students', icon: Users },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={twMerge(
                "px-4 py-2 font-black text-xs uppercase tracking-wide rounded-retro border-2 border-base-black transition-all flex items-center gap-2 whitespace-nowrap",
                activeTab === tab.id
                  ? "bg-retro-orange text-base-white shadow-hard-sm -translate-x-0.5 -translate-y-0.5"
                  : "bg-base-white text-base-black hover:bg-retro-yellow/10"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <RetroTable 
            isLoading={isLoading}
            data={classes}
            columns={[
              {
                header: 'Class',
                key: 'name',
                render: (name, cls) => (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 retro-card bg-retro-orange/20 border-2 border-retro-orange flex items-center justify-center">
                      <School className="w-5 h-5 text-retro-orange" />
                    </div>
                    <div>
                      <p className="font-retro-display font-black text-base-black text-sm leading-tight">{name}</p>
                      <p className="font-retro-mono text-[10px] text-base-black/50 truncate max-w-[150px]">{cls.description || 'No description'}</p>
                    </div>
                  </div>
                )
              },
              {
                header: 'Level',
                key: 'level',
                render: (level) => <RetroTag label={`Grade ${level}`} color="blue" />
              },
              {
                header: 'Capacity',
                key: 'capacity',
                render: (capacity, cls) => (
                  <div className="flex flex-col">
                    <span className="font-bold text-sm">{cls.student_count || 0} / {capacity}</span>
                    <div className="w-20 h-1.5 bg-base-black/10 rounded-full overflow-hidden mt-1">
                      <div 
                        className="h-full bg-retro-blue" 
                        style={{ width: `${Math.min(100, ((cls.student_count || 0) / capacity) * 100)}%` }}
                      />
                    </div>
                  </div>
                )
              },
              {
                header: 'Homeroom',
                key: 'wali_kelas',
                className: 'hidden md:table-cell',
                render: (wali) => <span className="text-xs font-retro-mono">{wali?.name || '-'}</span>
              },
              {
                header: 'Status',
                key: 'is_active',
                render: (active) => (
                  <span className={twMerge(
                    "px-2 py-0.5 rounded-full text-[8px] font-black uppercase border-2",
                    active ? "bg-success/10 text-success border-success" : "bg-danger/10 text-danger border-danger"
                  )}>
                    {active ? 'Active' : 'Inactive'}
                  </span>
                )
              }
            ]}
            actions={(cls) => (
              <TableActions 
                onView={() => openViewModal(cls)}
                onEdit={() => openEditModal(cls)}
                onDelete={() => handleDelete(cls.id)}
              />
            )}
            pagination={{
              ...meta,
              onPageChange: (p) => setPage(p)
            }}
          />
        )}

        {(activeTab === 'schedule' || activeTab === 'students') && (
          <RetroCard className="p-12 text-center flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-base-black/5 flex items-center justify-center">
              <Rocket className="w-8 h-8 text-base-black/20" />
            </div>
            <div>
              <h3 className="retro-heading text-lg">Module Integration</h3>
              <p className="font-retro-mono text-sm text-base-black/50">This section is currently being synchronized with the master API.</p>
            </div>
            <Button variant="outline" size="sm">Notify Me When Ready</Button>
          </RetroCard>
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

            <div className="pt-4 flex justify-end gap-3 border-t-4 border-base-black sticky bottom-0 bg-base-cream py-4 z-10 mt-6">
              <button 
                type="button" 
                onClick={() => { setIsCreateOpen(false); setIsEditOpen(false); }} 
                className="retro-btn retro-btn-outline"
              >
                CANCEL
              </button>
              <button 
                type="submit" 
                className="retro-btn flex items-center gap-2" 
                disabled={createClassMutation.isPending || updateClassMutation.isPending}
              >
                {(createClassMutation.isPending || updateClassMutation.isPending) ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Rocket className="w-4 h-4" />
                )}
                {isCreateOpen ? 'CREATE CLASS' : 'SAVE CHANGES'}
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