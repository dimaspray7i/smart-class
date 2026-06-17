import React, { useEffect, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, X, Loader2, Calendar, AlertCircle, Smile, RefreshCw, Filter, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { adminAPI } from '../../api';

// Hooks
import { useScheduleForm } from '../../hooks/useScheduleForm';
import { useScheduleFilters } from '../../hooks/useScheduleFilters';
import { useScheduleUI } from '../../hooks/useScheduleUI';
import { useScheduleMutations } from '../../hooks/useScheduleMutations';

// Components
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Toast from '../../components/ui/Toast';
import { RetroSection, RetroCard } from '../../components/ui/RetroLayouts';
import { ScheduleHeader } from './components/ScheduleHeader';
import { ScheduleListView } from './components/ScheduleListView';
import { ScheduleGridView } from './components/ScheduleGridView';
import { ScheduleWeeklyView } from './components/ScheduleWeeklyView';
import { ScheduleFormModal } from './components/ScheduleFormModal';
import { ScheduleViewModal } from './components/ScheduleViewModal';
import { ScheduleConfirmModals } from './components/ScheduleConfirmModals';

const dayOptions = [
  { value: 'senin', label: 'Senin' },
  { value: 'selasa', label: 'Selasa' },
  { value: 'rabu', label: 'Rabu' },
  { value: 'kamis', label: 'Kamis' },
  { value: 'jumat', label: 'Jumat' },
  { value: 'sabtu', label: 'Sabtu' },
];

export default function ScheduleManagement() {
  const filters = useScheduleFilters();
  const ui = useScheduleUI();
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);

  const form = useScheduleForm(teachers);

  // Load dependencies
  useEffect(() => {
    const loadDependencies = async () => {
      try {
        const [classesRes, subjectsRes, teachersRes] = await Promise.all([
          adminAPI.getClasses({ is_active: true, all: true }).catch(() => ({ data: [] })),
          adminAPI.getSubjects({ is_active: true, all: true }).catch(() => ({ data: [] })),
          adminAPI.getUsers({ role: 'guru', is_active: true, all: true }).catch(() => ({ data: [] })),
        ]);

        setClasses(Array.isArray(classesRes.data) ? classesRes.data : classesRes.data?.data || []);
        setSubjects(Array.isArray(subjectsRes.data) ? subjectsRes.data : subjectsRes.data?.data || []);
        setTeachers(Array.isArray(teachersRes.data) ? teachersRes.data : teachersRes.data?.data || []);
      } catch (err) {
        console.error('Failed to load dependencies:', err);
      }
    };
    loadDependencies();
  }, []);

  // Fetch schedules
  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ['admin-schedules', filters.page, filters.debouncedSearch, filters.classFilter, filters.dayFilter, filters.teacherFilter],
    queryFn: () => adminAPI.getSchedules({
      page: filters.page,
      search: filters.debouncedSearch || undefined,
      class_id: filters.classFilter === 'all' ? undefined : filters.classFilter,
      day: filters.dayFilter === 'all' ? undefined : filters.dayFilter,
      teacher_id: filters.teacherFilter === 'all' ? undefined : filters.teacherFilter,
    }),
    placeholderData: (prev) => prev,
    staleTime: 30000,
  });

  const schedules = data?.data || [];
  const meta = data?.meta || {};

  // Mutations
  const mutations = useScheduleMutations({
    onCreate: () => {
      ui.setIsCreateOpen(false);
      form.resetForm();
      ui.showToast('✅ Jadwal berhasil dibuat!', 'success');
    },
    onUpdate: () => {
      ui.setIsEditOpen(false);
      ui.setSelectedSchedule(null);
      form.resetForm();
      ui.showToast('✅ Jadwal berhasil diupdate!', 'success');
    },
    onDelete: () => {
      ui.setConfirmDelete(null);
      ui.showToast('✅ Jadwal berhasil dihapus!', 'success');
    },
    onBulkDelete: () => {
      ui.setSelectedIds([]);
      ui.showToast('✅ Jadwal berhasil dihapus!', 'success');
      ui.setConfirmBulkDelete(false);
    },
    onExport: () => ui.showToast('✅ Data berhasil diexport!', 'success'),
    onError: (err) => {
      const msg = err.response?.data?.message || 'Terjadi kesalahan';
      const type = err.response?.data?.code === 'SCHEDULE_CONFLICT' ? 'warning' : 'error';
      ui.showToast(`❌ ${msg}`, type);
      form.setErrors(err.response?.data?.errors || {});
    }
  });

  // Handlers
  const handleCreateSubmit = (e) => {
    e.preventDefault();
    mutations.createScheduleMutation.mutate(form.formData);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!ui.selectedSchedule) return;
    mutations.updateScheduleMutation.mutate({ id: ui.selectedSchedule.id, ...form.formData });
  };

  const handleOpenEditModal = useCallback((schedule) => {
    ui.openEditModal(schedule);
    form.setFormWithSchedule(schedule);
  }, [ui, form]);

  const handleOpenCreateModal = useCallback(() => {
    ui.setIsCreateOpen(true);
    form.resetForm();
  }, [ui, form]);

  const handleDelete = (id) => {
    ui.setConfirmDelete(id);
  };

  const handleBulkDelete = () => {
    if (ui.selectedIds.length > 0) ui.setConfirmBulkDelete(true);
  };

  // Loading/Error states
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
          <Button variant="outline" className="flex items-center gap-2" onClick={() => window.location.reload()}><RefreshCw className="w-4 h-4" /> Coba Lagi</Button>
          <Button variant="outline" onClick={() => window.history.back()}>Kembali</Button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Header & Stats */}
      <ScheduleHeader
        viewMode={filters.viewMode}
        setViewMode={filters.setViewMode}
        onCreateNew={handleOpenCreateModal}
        meta={meta}
        classes={classes}
        subjects={subjects}
        teachers={teachers}
      />

      {/* Search & Filters */}
      <RetroSection>
        <RetroCard className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <Input
                label="Cari Jadwal"
                placeholder="Cari mata pelajaran atau guru..."
                value={filters.search}
                onChange={(e) => filters.setSearch(e.target.value)}
                prefix={<Search className="w-4 h-4" />}
                suffix={filters.search && <X className="w-4 h-4 cursor-pointer" onClick={() => filters.setSearch('')} />}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => filters.setShowFilters(!filters.showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                {filters.showFilters ? 'Sembunyikan' : 'Tampilkan'} Filter
              </Button>
              <Button variant="outline" onClick={filters.resetFilters}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {filters.showFilters && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden pt-4 mt-4 border-t-2 border-base-black/10">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Select
                  label="Filter Kelas"
                  value={filters.classFilter}
                  onChange={(e) => filters.setClassFilter(e.target.value)}
                  options={[
                    { value: 'all', label: 'Semua Kelas' },
                    ...classes.map(c => ({ value: c.id, label: c.name }))
                  ]}
                />
                <Select
                  label="Filter Hari"
                  value={filters.dayFilter}
                  onChange={(e) => filters.setDayFilter(e.target.value)}
                  options={[
                    { value: 'all', label: 'Semua Hari' },
                    ...dayOptions
                  ]}
                />
                <Select
                  label="Filter Guru"
                  value={filters.teacherFilter}
                  onChange={(e) => filters.setTeacherFilter(e.target.value)}
                  options={[
                    { value: 'all', label: 'Semua Guru' },
                    ...teachers.map(t => ({ value: t.id, label: t.name }))
                  ]}
                />
              </div>
            </motion.div>
          )}
        </RetroCard>
      </RetroSection>

      {/* Bulk Actions */}
      {ui.selectedIds.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="retro-card p-3 bg-retro-orange/10 border-retro-orange flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wide text-base-black">
            {ui.selectedIds.length} jadwal terpilih
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => ui.setSelectedIds([])}>Batal</Button>
            <Button variant="primary" size="sm" onClick={handleBulkDelete} className="bg-danger border-danger">Hapus Terpilih</Button>
          </div>
        </motion.div>
      )}

      {/* Data Views */}
      <RetroSection>
        {filters.viewMode === 'list' ? (
          <ScheduleListView
            schedules={schedules}
            meta={meta}
            classes={classes}
            subjects={subjects}
            teachers={teachers}
            selectedIds={ui.selectedIds}
            onSelect={ui.toggleSelect}
            onSelectAll={() => ui.toggleSelectAll(schedules.map(s => s.id))}
            onView={ui.openViewModal}
            onEdit={handleOpenEditModal}
            onDelete={handleDelete}
            onPageChange={filters.setPage}
          />
        ) : filters.viewMode === 'grid' ? (
          <ScheduleGridView
            schedules={schedules}
            classes={classes}
            subjects={subjects}
            teachers={teachers}
            selectedIds={ui.selectedIds}
            onSelect={ui.toggleSelect}
            onEdit={handleOpenEditModal}
            onDelete={handleDelete}
            onView={ui.openViewModal}
          />
        ) : (
          <ScheduleWeeklyView
            schedules={schedules}
            classes={classes}
            subjects={subjects}
            onView={ui.openViewModal}
          />
        )}
      </RetroSection>

      {/* Modals */}
      <ScheduleFormModal
        isOpen={ui.isCreateOpen || ui.isEditOpen}
        isCreate={ui.isCreateOpen}
        onClose={ui.closeModals}
        onSubmit={ui.isCreateOpen ? handleCreateSubmit : handleEditSubmit}
        formData={form.formData}
        setFormData={form.setFormData}
        errors={form.errors}
        classes={classes}
        subjects={subjects}
        teachers={teachers}
        filteredTeachers={form.filteredTeachers}
        isLoading={mutations.createScheduleMutation.isPending || mutations.updateScheduleMutation.isPending}
      />

      <ScheduleViewModal
        isOpen={ui.isViewOpen}
        onClose={() => ui.setIsViewOpen(false)}
        selectedSchedule={ui.selectedSchedule}
        classes={classes}
        subjects={subjects}
        teachers={teachers}
        onEdit={handleOpenEditModal}
      />

      <ScheduleConfirmModals
        confirmDelete={ui.confirmDelete}
        onDeleteCancel={() => ui.setConfirmDelete(null)}
        onDeleteConfirm={() => {
          if (ui.confirmDelete) mutations.deleteScheduleMutation.mutate(ui.confirmDelete);
        }}
        confirmBulkDelete={ui.confirmBulkDelete}
        selectedIdsCount={ui.selectedIds.length}
        onBulkDeleteCancel={() => ui.setConfirmBulkDelete(false)}
        onBulkDeleteConfirm={() => {
          if (ui.selectedIds.length > 0) mutations.bulkDeleteMutation.mutate(ui.selectedIds);
        }}
        isDeleting={mutations.deleteScheduleMutation.isPending || mutations.bulkDeleteMutation.isPending}
      />

      {/* Toast */}
      {ui.toast && <Toast message={ui.toast.message} type={ui.toast.type} />}

      {/* FAB */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={handleOpenCreateModal}
        className="fixed bottom-6 right-6 z-50 retro-btn retro-btn-lg retro-btn-sticker hidden md:flex items-center gap-2"
      >
        <Plus className="w-5 h-5" /><span className="hidden lg:inline">Tambah Jadwal</span>
      </motion.button>
    </motion.div>
  );
}
