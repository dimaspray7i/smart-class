import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Search, Edit2, Trash2, X, Loader2, BookOpen, Download, Upload, Filter, 
  AlertCircle, CheckCircle2, Eye, BarChart3, ChevronRight, ChevronLeft, 
  LayoutGrid, List as ListIcon, Tag, Clock, Users, Calendar, Zap, Sparkles,
  Star, Rocket, Smile, Settings, Menu, RefreshCw
} from 'lucide-react';
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

// 🎨 RETRO ANIMATION VARIANTS
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

const floatVariants = {
  animate: {
    y: [0, -8, 0], rotate: [0, 2, -2, 0],
    transition: { duration: 4, repeat: Infinity, ease: "easeInOut" }
  }
};

// 🎪 DECORATIVE FLOATING ELEMENTS
function SubjectDecorations() {
  return (
    <>
      <motion.div variants={floatVariants} animate="animate" className="absolute top-20 right-10 z-0 hidden lg:block">
        <div className="retro-smiley text-xl animate-wobble">📚</div>
      </motion.div>
      <motion.div variants={floatVariants} animate="animate" className="absolute bottom-32 left-20 z-0 hidden lg:block" style={{animationDelay:'1s'}}>
        <Star className="w-8 h-8 text-retro-yellow fill-retro-yellow drop-shadow-retro animate-sparkle-retro" />
      </motion.div>
      <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-retro-purple/20 rounded-blob blur-2xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-retro-lime/20 rounded-blob blur-2xl pointer-events-none" />
    </>
  );
}

// 📊 CATEGORY OPTIONS & QUICK TEMPLATES
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
// 🎯 MAIN COMPONENT
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
  const [formData, setFormData] = useState({
    name: '', code: '', credits: 4, category: 'productive', is_active: true, description: ''
  });
  const [errors, setErrors] = useState({});
  const [selectedIds, setSelectedIds] = useState([]);
  const [toast, setToast] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [activeView, setActiveView] = useState('list');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch subjects
  const { data, isLoading: isPending, isError, isFetching } = useQuery({
    queryKey: ['admin-subjects', debouncedSearch, categoryFilter],
    queryFn: () => adminAPI.getSubjects({
        search: debouncedSearch || undefined,
        category: categoryFilter === 'all' ? undefined : categoryFilter,
    }),
    placeholderData: (prev) => prev,
    staleTime: 30000,
  });

  const subjects = data?.data || [];
  const meta = data?.meta || {};

  // 📊 QUICK STATS CALCULATION
  const stats = useMemo(() => {
    return {
      total: meta.total || 0,
      active: subjects.filter(s => s.is_active).length,
      productive: subjects.filter(s => s.category === 'productive').length,
      normative: subjects.filter(s => s.category === 'normative').length,
      adaptive: subjects.filter(s => s.category === 'adaptive').length,
    };
  }, [subjects, meta]);

  // Toast notification
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // 🔌 MUTATIONS
  const createSubjectMutation = useMutation({
    mutationFn: (newSubject) => adminAPI.createSubject(newSubject),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subjects'] });
      setIsCreateOpen(false);
      setFormData({});
      setErrors({});
      showToast('Mata pelajaran berhasil dibuat!', 'success');
    },
    onError: (err) => {
      setErrors(err.errors || err.response?.data?.errors || {});
      showToast(err.message || 'Gagal membuat mata pelajaran', 'error');
    }
  });

  const updateSubjectMutation = useMutation({
    mutationFn: ({ id, ...updatedData }) => adminAPI.updateSubject(id, updatedData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subjects'] });
      setIsEditOpen(false);
      setSelectedSubject(null);
      setFormData({});
      setErrors({});
      showToast('Mata pelajaran berhasil diupdate!', 'success');
    },
    onError: (err) => {
      setErrors(err.errors || err.response?.data?.errors || {});
      showToast(err.message || 'Gagal update mata pelajaran', 'error');
    }
  });

  const deleteSubjectMutation = useMutation({
    mutationFn: (id) => adminAPI.deleteSubject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subjects'] });
      showToast('Mata pelajaran berhasil dihapus!', 'success');
      setConfirmDelete(null);
    },
    onError: (err) => {
      showToast(err.message || 'Gagal menghapus mata pelajaran', 'error');
    }
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids) => adminAPI.bulkDeleteSubjects(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subjects'] });
      setSelectedIds([]);
      showToast('Mata pelajaran berhasil dihapus!', 'success');
      setConfirmBulkDelete(false);
    },
    onError: (err) => {
      showToast(err.message || 'Gagal menghapus mata pelajaran', 'error');
    }
  });

  const exportSubjectsMutation = useMutation({
    mutationFn: (filters) => adminAPI.exportSubjects('csv', filters),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `subjects-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      showToast('Data berhasil diexport!', 'success');
    },
    onError: () => showToast('Gagal export data', 'error')
  });

  // 🎮 HANDLERS
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

  // Stats calculated at top

  // ⏳ LOADING & ERROR STATES
  if (isPending && !isFetching) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
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
      <div className="flex items-center justify-center min-h-[400px]">
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

  return (
    <motion.div 
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Decorative Elements */}
      <SubjectDecorations />

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <div className="fixed top-24 right-6 z-50">
            <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
          </div>
        )}
      </AnimatePresence>

      {/* 🏛️ PAGE HEADER */}
      <PageHeader 
        title="Subject Management"
        icon={BookOpen}
        description="Kelola kurikulum, mata pelajaran produktif, normatif, dan adaptif."
        breadcrumbs={[{ label: 'Subjects', path: '/admin/subjects' }]}
        actions={
          <div className="flex gap-2">
            <div className="flex p-1 bg-base-gray/20 rounded-retro-sm">
              <button 
                onClick={() => setActiveView('list')}
                className={twMerge(
                  "p-2 rounded-retro-sm transition-all",
                  activeView === 'list' ? "bg-base-black text-base-white shadow-hard-sm" : "hover:bg-base-black/10 text-base-black"
                )}
              >
                <ListIcon className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setActiveView('grid')}
                className={twMerge(
                  "p-2 rounded-retro-sm transition-all",
                  activeView === 'grid' ? "bg-base-black text-base-white shadow-hard-sm" : "hover:bg-base-black/10 text-base-black"
                )}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
            <Button 
              variant="primary" 
              onClick={() => { setFormData({ category: 'productive', credits: 4, is_active: true }); setErrors({}); setIsCreateOpen(true); }}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Subject
            </Button>
          </div>
        }
      />

      {/* 📊 QUICK STATS */}
      <StatGrid>
        <RetroStatWidget
          title="Total Mapel"
          value={stats.total}
          icon={BookOpen}
          color="orange"
          trend={12}
        />
        <RetroStatWidget
          title="Produktif"
          value={stats.productive}
          icon={BarChart3}
          color="purple"
        />
        <RetroStatWidget
          title="Normatif"
          value={stats.normative}
          icon={BookOpen}
          color="blue"
        />
        <RetroStatWidget
          title="Adaptif"
          value={stats.adaptive}
          icon={Settings}
          color="lime"
        />
        <RetroStatWidget
          title="Aktif"
          value={stats.active}
          icon={CheckCircle2}
          color="green"
        />
        <RetroStatWidget
          title="Non-Aktif"
          value={stats.total - stats.active}
          icon={AlertCircle}
          color="red"
        />
      </StatGrid>

      {/* 🔍 SEARCH & FILTERS */}
      <RetroSection>
        <RetroCard className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <Input 
                label="Cari Mata Pelajaran"
                placeholder="Cari kode atau nama mata pelajaran..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                prefix={<Search className="w-4 h-4" />}
                suffix={search && <X className="w-4 h-4 cursor-pointer" onClick={() => setSearch('')} />}
              />
            </div>
            <div className="flex gap-2">
              <div className="flex bg-base-gray/10 p-1 rounded-retro border-2 border-base-black">
                <button 
                  onClick={() => setCategoryFilter('all')} 
                  className={twMerge(
                    "px-4 py-1.5 rounded-retro-sm text-xs font-black uppercase transition-all",
                    categoryFilter === 'all' ? "bg-base-black text-base-white shadow-hard-sm" : "text-base-black hover:bg-base-black/5"
                  )}
                >
                  Semua
                </button>
                {categoryOptions.map(cat => (
                  <button 
                    key={cat.value} 
                    onClick={() => setCategoryFilter(cat.value)}
                    className={twMerge(
                      "px-4 py-1.5 rounded-retro-sm text-xs font-black uppercase transition-all",
                      categoryFilter === cat.value ? "bg-base-black text-base-white shadow-hard-sm" : "text-base-black hover:bg-base-black/5"
                    )}
                  >
                    {cat.label.split(' ')[1]}
                  </button>
                ))}
              </div>
              <Button 
                variant="outline" 
                onClick={handleExport}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export
              </Button>
            </div>
          </div>
        </RetroCard>
      </RetroSection>

      {/* 📋 TABLE VIEW */}
      {activeView === 'list' && (
        <RetroSection>
          <RetroTable 
            data={subjects}
            isLoading={isPending}
            selectable
            selectedIds={selectedIds}
            onSelectChange={setSelectedIds}
            columns={[
              {
                header: 'Mata Pelajaran',
                key: 'name',
                render: (val, row) => (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-retro bg-retro-orange/20 border-2 border-retro-orange flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-retro-orange" />
                    </div>
                    <div>
                      <p className="font-retro-display font-black text-base-black">{val}</p>
                      <p className="font-retro-mono text-[10px] text-base-black/50">{row.code}</p>
                    </div>
                  </div>
                )
              },
              {
                header: 'Kategori',
                key: 'category',
                render: (val) => {
                  const cat = categoryOptions.find(c => c.value === val);
                  return (
                    <span className={twMerge(
                      "px-2 py-1 rounded-full text-[10px] font-black uppercase border-2",
                      val === 'productive' ? "bg-retro-purple/20 border-retro-purple text-retro-purple" :
                      val === 'normative' ? "bg-retro-blue/20 border-retro-blue text-retro-blue" :
                      "bg-retro-lime/20 border-retro-lime text-retro-lime"
                    )}>
                      {cat?.label || val}
                    </span>
                  );
                }
              },
              {
                header: 'Kredit',
                key: 'credits',
                render: (val) => <span className="font-retro-mono font-black">{val} SKS</span>
              },
              {
                header: 'Status',
                key: 'is_active',
                render: (val) => (
                  <span className={twMerge(
                    "flex items-center gap-1.5 text-xs font-black",
                    val ? "text-success" : "text-danger"
                  )}>
                    <span className={twMerge("w-2 h-2 rounded-sm", val ? "bg-success animate-pulse" : "bg-danger")} />
                    {val ? 'AKTIF' : 'NON-AKTIF'}
                  </span>
                )
              },
              {
                header: 'Actions',
                key: 'actions',
                align: 'right',
                render: (_, row) => (
                  <TableActions 
                    onView={() => openViewModal(row)}
                    onEdit={() => openEditModal(row)}
                    onDelete={() => handleDelete(row.id)}
                  />
                )
              }
            ]}
          />
        </RetroSection>
      )}

      {/* 🎴 GRID VIEW */}
      {activeView === 'grid' && (
        <RetroSection>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {subjects.map((subject) => (
              <RetroCard key={subject.id} className="p-4 group relative overflow-hidden">
                <div className="absolute top-3 right-3 z-10">
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
                  <div className="flex gap-2">
                    <span className={twMerge(
                      "px-2 py-0.5 rounded-full text-[10px] font-black uppercase border-2",
                      subject.category === 'productive' ? "bg-retro-purple/20 border-retro-purple text-retro-purple" :
                      subject.category === 'normative' ? "bg-retro-blue/20 border-retro-blue text-retro-blue" :
                      "bg-retro-lime/20 border-retro-lime text-retro-lime"
                    )}>
                      {subject.category}
                    </span>
                    <span className="font-retro-mono text-[10px] font-black border-2 border-base-black px-2 py-0.5 rounded-full bg-base-gray/20">
                      {subject.credits} SKS
                    </span>
                  </div>
                  {subject.description && (
                    <p className="font-retro-mono text-[10px] text-base-black/50 line-clamp-2 italic">
                      "{subject.description}"
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t-2 border-base-black/10 flex justify-between items-center">
                  <span className={twMerge(
                    "flex items-center gap-1.5 text-[10px] font-black",
                    subject.is_active ? "text-success" : "text-danger"
                  )}>
                    <span className={twMerge("w-2 h-2 rounded-sm", subject.is_active ? "bg-success animate-pulse" : "bg-danger")} />
                    {subject.is_active ? 'AKTIF' : 'NON-AKTIF'}
                  </span>
                  <div className="flex gap-1">
                    <button onClick={() => openEditModal(subject)} className="p-1.5 hover:bg-base-black/10 rounded-retro-sm transition-all">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(subject.id)} className="p-1.5 hover:bg-danger/10 text-danger rounded-retro-sm transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Decorative sticker */}
                <div className="absolute -bottom-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                   <div className="retro-sticker bg-retro-yellow text-base-black text-[8px] px-2 py-0.5 rotate-3">
                     SUBJECT
                   </div>
                </div>
              </RetroCard>
            ))}
          </div>
        </RetroSection>
      )}

      {/* 📝 CREATE/EDIT MODAL */}
      <Modal 
        isOpen={isCreateOpen || isEditOpen} 
        onClose={() => { setIsCreateOpen(false); setIsEditOpen(false); }}
        title={isCreateOpen ? "Create New Subject" : "Edit Subject"}
        size="lg"
      >
        <form onSubmit={isCreateOpen ? handleCreateSubmit : handleEditSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              label="Subject Code"
              name="code"
              value={formData.code}
              onChange={(e) => setFormData({...formData, code: e.target.value})}
              error={errors.code}
              placeholder="e.g., RPL-101"
              required
            />
            <Input 
              label="Subject Name"
              name="name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              error={errors.name}
              placeholder="e.g., Pemrograman Web"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select 
              label="Category"
              name="category"
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              options={categoryOptions}
              error={errors.category}
              required
            />
            <Input 
              label="Credits (SKS)"
              name="credits"
              type="number"
              value={formData.credits}
              onChange={(e) => setFormData({...formData, credits: e.target.value})}
              error={errors.credits}
              placeholder="4"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase text-base-black">Description</label>
            <textarea 
              className="w-full p-3 rounded-retro border-2 border-base-black focus:border-retro-orange focus:ring-4 focus:ring-retro-orange/20 transition-all font-retro-mono text-sm min-h-[100px] bg-base-white"
              placeholder="Describe the subject contents..."
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div className="flex items-center gap-3 p-3 bg-base-gray/20 rounded-retro border-2 border-base-black">
            <input 
              type="checkbox" 
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
              className="w-5 h-5 rounded-sm border-2 border-base-black accent-retro-orange"
            />
            <label htmlFor="is_active" className="font-retro-display font-black text-sm cursor-pointer uppercase">
              Mark as Active
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t-2 border-base-black/10">
            <Button variant="outline" onClick={() => { setIsCreateOpen(false); setIsEditOpen(false); }}>Cancel</Button>
            <Button type="submit" loading={createSubjectMutation.isPending || updateSubjectMutation.isPending}>
              {isCreateOpen ? 'Create Subject' : 'Update Subject'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 🔍 VIEW MODAL */}
      <Modal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} title="Subject Details" size="md">
        {selectedSubject && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-retro bg-retro-orange/20 border-2 border-retro-orange flex items-center justify-center shadow-hard-sm">
                <BookOpen className="w-8 h-8 text-retro-orange" />
              </div>
              <div>
                <h3 className="retro-heading retro-heading-md text-base-black">{selectedSubject.name}</h3>
                <p className="font-retro-mono text-sm text-base-black/50">{selectedSubject.code}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-base-gray/10 rounded-retro border-2 border-base-black">
                <p className="text-[10px] font-black text-base-black/50 uppercase">Category</p>
                <p className="font-retro-display font-black text-sm uppercase">{selectedSubject.category}</p>
              </div>
              <div className="p-3 bg-base-gray/10 rounded-retro border-2 border-base-black">
                <p className="text-[10px] font-black text-base-black/50 uppercase">Credits</p>
                <p className="font-retro-display font-black text-sm">{selectedSubject.credits} SKS</p>
              </div>
            </div>

            <div className="p-4 bg-base-black/5 rounded-retro border-2 border-base-black border-dashed">
              <p className="text-[10px] font-black text-base-black/50 uppercase mb-2">Description</p>
              <p className="font-retro-mono text-sm text-base-black italic line-clamp-4">
                {selectedSubject.description || "No description provided for this subject."}
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t-2 border-base-black/10">
              <Button variant="outline" onClick={() => setIsViewOpen(false)}>Close</Button>
              <Button onClick={() => { setIsViewOpen(false); openEditModal(selectedSubject); }}>Edit Subject</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ⚠️ DELETE CONFIRMATIONS */}
      <Modal 
        isOpen={!!confirmDelete} 
        onClose={() => setConfirmDelete(null)}
        title="Delete Subject?"
        size="sm"
      >
        <div className="text-center p-4">
          <div className="w-16 h-16 bg-danger/10 border-4 border-danger rounded-retro flex items-center justify-center mx-auto mb-4 animate-shake">
            <Trash2 className="w-8 h-8 text-danger" />
          </div>
          <p className="font-retro-mono text-sm text-base-black/70 mb-6">
            Are you sure you want to delete this subject? This action cannot be undone.
          </p>
          <div className="flex justify-center gap-3">
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button variant="danger" onClick={confirmDeleteAction}>Yes, Delete</Button>
          </div>
        </div>
      </Modal>

      <Modal 
        isOpen={confirmBulkDelete} 
        onClose={() => setConfirmBulkDelete(false)}
        title="Delete Selected?"
        size="sm"
      >
        <div className="text-center p-4">
          <div className="w-16 h-16 bg-danger/10 border-4 border-danger rounded-retro flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-8 h-8 text-danger" />
          </div>
          <p className="font-retro-mono text-sm text-base-black/70 mb-6">
            Are you sure you want to delete {selectedIds.length} selected subjects?
          </p>
          <div className="flex justify-center gap-3">
            <Button variant="outline" onClick={() => setConfirmBulkDelete(false)}>Cancel</Button>
            <Button variant="danger" onClick={confirmBulkDeleteAction}>Yes, Delete All</Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}