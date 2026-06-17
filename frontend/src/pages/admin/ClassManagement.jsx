import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, X, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { adminAPI } from '../../api';
import { ID } from '../../i18n/id';

// Hooks
import { useClassForm } from '../../hooks/useClassForm';
import { useClassFilters } from '../../hooks/useClassFilters';
import { useClassUI } from '../../hooks/useClassUI';
import { useClassMutations } from '../../hooks/useClassMutations';

// UI Components
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import Toast from '../../components/ui/Toast';
import { PageHeader, RetroSection, StatGrid, RetroCard, RetroStatWidget } from '../../components/ui/RetroLayouts';
import RetroTable, { TableActions } from '../../components/ui/RetroTable';
import { School, Users, BookOpen, Calendar } from 'lucide-react';

const LEVELS = [
  { value: 'X', label: 'Kelas X' },
  { value: 'XI', label: 'Kelas XI' },
  { value: 'XII', label: 'Kelas XII' }
];

export default function ClassManagement() {
  const queryClient = useQueryClient();

  // Custom hooks
  const filters = useClassFilters();
  const form = useClassForm();
  const ui = useClassUI();
  const [majors, setMajors] = useState([]);

  const mutations = useClassMutations({
    onCreate: () => {
      ui.setIsCreateOpen(false);
      form.resetForm();
      ui.showToast('✅ Kelas berhasil dibuat!', 'success');
    },
    onUpdate: () => {
      ui.setIsEditOpen(false);
      form.resetForm();
      ui.showToast('✅ Kelas berhasil diupdate!', 'success');
    },
    onDelete: () => {
      ui.setConfirmDelete(null);
      ui.showToast('✅ Kelas berhasil dihapus!', 'success');
    },
    onBulkDelete: () => {
      ui.setSelectedIds([]);
      ui.showToast('✅ Kelas berhasil dihapus!', 'success');
      ui.setConfirmBulkDelete(false);
    },
    onError: (err) => {
      ui.showToast(`❌ ${err.response?.data?.message || 'Terjadi kesalahan'}`, 'error');
      form.setErrors(err.response?.data?.errors || {});
    }
  });

  // Load majors
  useEffect(() => {
    const loadMajors = async () => {
      try {
        const res = await adminAPI.getMajors?.().catch(() => ({ data: [] }));
        setMajors(Array.isArray(res.data) ? res.data : res.data?.data || []);
      } catch (err) {
        console.error('Failed to load majors:', err);
      }
    };
    loadMajors();
  }, []);

  // Fetch classes
  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ['admin-classes', filters.page, filters.debouncedSearch, filters.levelFilter, filters.statusFilter],
    queryFn: () => adminAPI.getClasses({
      page: filters.page,
      search: filters.debouncedSearch || undefined,
      level: filters.levelFilter === 'all' ? undefined : filters.levelFilter,
      is_active: filters.statusFilter === 'all' ? undefined : filters.statusFilter === 'active',
    }),
    placeholderData: (prev) => prev,
    staleTime: 30000,
  });

  const classes = data?.data || [];
  const meta = data?.meta || {};

  // Handlers
  const handleCreateSubmit = (e) => {
    e.preventDefault();
    mutations.createClassMutation.mutate(form.formData);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!ui.selectedClass) return;
    mutations.updateClassMutation.mutate({ id: ui.selectedClass.id, ...form.formData });
  };

  // Loading
  if (isLoading && !isFetching) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <Loader2 className="w-20 h-20 mx-auto mb-4 text-retro-orange animate-spin" />
          <h2 className="retro-heading text-2xl">LOADING CLASSES</h2>
        </motion.div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="retro-card p-8 text-center max-w-lg mx-auto">
        <AlertCircle className="w-16 h-16 mx-auto mb-4 text-danger" />
        <h3 className="retro-heading text-xl mb-3">Connection Error</h3>
        <Button onClick={() => queryClient.invalidateQueries(['admin-classes'])}>Retry</Button>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <PageHeader
        title={ID.nav.classes}
        icon={School}
        description="Kelola data kelas dan tingkat pendidikan"
        breadcrumbs={[{ label: ID.nav.classes, path: '/admin/classes' }]}
        actions={
          <Button variant="primary" onClick={() => { ui.setIsCreateOpen(true); form.resetForm(); }} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Tambah Kelas
          </Button>
        }
      />

      {/* Stats */}
      <StatGrid>
        <RetroStatWidget title="Total Kelas" value={meta.total || 0} icon={School} color="orange" />
        <RetroStatWidget title="Kelas X" value={meta.level_x || 0} icon={Users} color="blue" />
        <RetroStatWidget title="Kelas XI" value={meta.level_xi || 0} icon={BookOpen} color="purple" />
        <RetroStatWidget title="Kelas XII" value={meta.level_xii || 0} icon={Calendar} color="lime" />
      </StatGrid>

      {/* Search & Filters */}
      <RetroSection>
        <RetroCard className="p-4 space-y-4">
          <Input
            label="Cari Kelas"
            placeholder="Cari nama atau kode..."
            value={filters.search}
            onChange={(e) => filters.setSearch(e.target.value)}
            prefix={<Search className="w-4 h-4" />}
            suffix={filters.search && <X className="w-4 h-4 cursor-pointer" onClick={() => filters.setSearch('')} />}
          />

          {filters.showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                label="Filter Level"
                value={filters.levelFilter}
                onChange={(e) => filters.setLevelFilter(e.target.value)}
                options={[{ value: 'all', label: 'Semua Level' }, ...LEVELS]}
              />
              <Select
                label="Filter Status"
                value={filters.statusFilter}
                onChange={(e) => filters.setStatusFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'Semua Status' },
                  { value: 'active', label: 'Aktif' },
                  { value: 'inactive', label: 'Tidak Aktif' }
                ]}
              />
              <Button variant="outline" onClick={filters.resetFilters}>Reset</Button>
            </div>
          )}

          <Button variant="outline" size="sm" onClick={() => filters.setShowFilters(!filters.showFilters)}>
            {filters.showFilters ? 'Sembunyikan' : 'Tampilkan'} Filter
          </Button>
        </RetroCard>
      </RetroSection>

      {/* Bulk Actions */}
      {ui.selectedIds.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="retro-card p-3 bg-retro-orange/10 border-retro-orange flex items-center justify-between">
          <span className="text-xs font-black">{ui.selectedIds.length} kelas terpilih</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => ui.setSelectedIds([])}>Batal</Button>
            <Button size="sm" className="bg-danger" onClick={() => ui.setConfirmBulkDelete(true)}>Hapus</Button>
          </div>
        </motion.div>
      )}

      {/* Table */}
      <RetroSection>
        <RetroTable
          data={classes}
          columns={[
            { header: 'Nama', key: 'name', render: (name, item) => <div><p className="font-black">{name}</p><p className="text-[10px] text-base-black/50">{item.code}</p></div> },
            { header: 'Level', key: 'level', render: (level) => <span className="retro-badge retro-badge-blue">{`KELAS ${level}`}</span> },
            { header: 'Kapasitas', key: 'capacity', render: (cap) => <span className="font-black">{cap} Siswa</span> },
            { header: 'Status', key: 'is_active', render: (active) => <span className={`retro-badge ${active ? 'retro-badge-green' : 'retro-badge-red'}`}>{active ? 'AKTIF' : 'NONAKTIF'}</span> }
          ]}
          actions={(row) => (
            <TableActions
              onEdit={() => { ui.setSelectedClass(row); form.setFormWithClass(row); ui.setIsEditOpen(true); }}
              onDelete={() => ui.setConfirmDelete(row.id)}
            />
          )}
          selectedIds={ui.selectedIds}
          onSelect={ui.toggleSelect}
          onSelectAll={() => ui.toggleSelectAll(classes.map(c => c.id))}
          pagination={{
            currentPage: meta.current_page || 1,
            totalPages: meta.last_page || 1,
            totalItems: meta.total || 0,
            onPageChange: filters.setPage
          }}
        />
      </RetroSection>

      {/* Modal */}
      {(ui.isCreateOpen || ui.isEditOpen) && (
        <Modal isOpen onClose={ui.closeModals} title={ui.isCreateOpen ? "Tambah Kelas" : "Edit Kelas"} size="2xl">
          <form onSubmit={ui.isCreateOpen ? handleCreateSubmit : handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Nama Kelas" value={form.formData.name} onChange={(e) => form.setFormData({ ...form.formData, name: e.target.value })} error={form.errors.name} />
              <Input label="Kode Kelas" value={form.formData.code} onChange={(e) => form.setFormData({ ...form.formData, code: e.target.value })} error={form.errors.code} />
              <Select label="Level" value={form.formData.level} onChange={(e) => form.setFormData({ ...form.formData, level: e.target.value })} options={LEVELS} />
              <Input label="Kapasitas" type="number" value={form.formData.capacity} onChange={(e) => form.setFormData({ ...form.formData, capacity: e.target.value })} />
            </div>
            <Input label="Deskripsi" value={form.formData.description} onChange={(e) => form.setFormData({ ...form.formData, description: e.target.value })} />
            <div className="flex justify-end gap-3 pt-6 border-t-4 border-base-black">
              <Button variant="outline" onClick={ui.closeModals}>Batal</Button>
              <Button type="submit" variant="primary" loading={mutations.createClassMutation.isPending || mutations.updateClassMutation.isPending}>
                {ui.isCreateOpen ? 'Tambah' : 'Update'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation */}
      {ui.confirmDelete && (
        <Modal isOpen onClose={() => ui.setConfirmDelete(null)} title="Hapus Kelas" size="md">
          <div className="text-center p-4">
            <p className="mb-6">Yakin ingin menghapus kelas ini?</p>
            <div className="flex gap-4">
              <Button variant="outline" className="flex-1" onClick={() => ui.setConfirmDelete(null)}>Batal</Button>
              <Button className="bg-danger flex-1" onClick={() => mutations.deleteClassMutation.mutate(ui.confirmDelete)}>Hapus</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Toast */}
      {ui.toast && <Toast message={ui.toast.message} type={ui.toast.type} />}
    </motion.div>
  );
}
