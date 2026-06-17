import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, X, Loader2, AlertCircle, RefreshCw, Sparkles, Smile } from 'lucide-react';
import { motion } from 'framer-motion';
import { adminAPI } from '../../api';
import { ID } from '../../i18n/id';

// Hooks
import { useUserForm } from '../../hooks/useUserForm';
import { useUserFilters } from '../../hooks/useUserFilters';
import { useUserUI } from '../../hooks/useUserMutations';
import { useUserMutations } from '../../hooks/useUserAPI';

// Helpers
import { RetroInput, RetroSelect, RetroSubjectMultiSelect, RetroAvatarUpload, RetroTag } from './components/UserFormHelpers';

// UI Components
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Toast from '../../components/ui/Toast';
import { PageHeader, RetroSection, StatGrid, RetroCard, RetroStatWidget } from '../../components/ui/RetroLayouts';
import RetroTable, { TableActions } from '../../components/ui/RetroTable';
import { PageHeader as Header } from '../../components/ui/RetroLayouts';
import { Users, School, UserCheck, Mail } from 'lucide-react';

export default function UserManagement() {
  const queryClient = useQueryClient();

  // Custom hooks
  const filters = useUserFilters();
  const form = useUserForm();
  const ui = useUserUI();
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);

  const mutations = useUserMutations({
    onCreate: () => {
      ui.setIsCreateOpen(false);
      form.resetForm();
      ui.showToast('✅ Pengguna berhasil dibuat!', 'success');
    },
    onUpdate: () => {
      ui.setIsEditOpen(false);
      form.resetForm();
      ui.showToast('✅ Pengguna berhasil diupdate!', 'success');
    },
    onDelete: () => {
      ui.setConfirmDelete(null);
      ui.showToast('✅ Pengguna berhasil dihapus!', 'success');
    },
    onBulkDelete: () => {
      ui.setSelectedIds([]);
      ui.showToast('✅ Pengguna berhasil dihapus!', 'success');
      ui.setConfirmBulkDelete(false);
    },
    onError: (err) => {
      ui.showToast(`❌ ${err.response?.data?.message || 'Terjadi kesalahan'}`, 'error');
      form.setErrors(err.response?.data?.errors || {});
    }
  });

  // Load dependencies
  useEffect(() => {
    const loadDeps = async () => {
      try {
        const [subRes, classRes] = await Promise.all([
          adminAPI.getSubjects({ all: 1 }).catch(() => ({ data: [] })),
          adminAPI.getClasses({ all: 1 }).catch(() => ({ data: [] }))
        ]);
        setSubjects(Array.isArray(subRes.data) ? subRes.data : subRes.data?.data || []);
        setClasses(Array.isArray(classRes.data) ? classRes.data : classRes.data?.data || []);
      } catch (err) {
        console.error('Failed to load dependencies:', err);
      }
    };
    loadDeps();
  }, []);

  // Fetch users
  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ['admin-users', filters.page, filters.debouncedSearch, filters.roleFilter, filters.statusFilter],
    queryFn: () => adminAPI.getUsers({
      page: filters.page,
      search: filters.debouncedSearch || undefined,
      role: filters.roleFilter === 'all' ? undefined : filters.roleFilter,
      is_active: filters.statusFilter === 'all' ? undefined : filters.statusFilter === 'active',
    }),
    placeholderData: (prev) => prev,
    staleTime: 30000,
  });

  const users = data?.data || [];
  const meta = data?.meta || {};

  // Handlers
  const handleCreateSubmit = (e) => {
    e.preventDefault();
    mutations.createUserMutation.mutate(form.formData);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!ui.selectedUser) return;
    mutations.updateUserMutation.mutate({ id: ui.selectedUser.id, ...form.formData });
  };

  // Loading
  if (isLoading && !isFetching) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <Sparkles className="w-20 h-20 mx-auto mb-4 text-retro-orange animate-spin" />
          <h2 className="retro-heading text-2xl mb-2">LOADING USERS</h2>
        </motion.div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="retro-card p-8 text-center max-w-lg mx-auto">
        <AlertCircle className="w-16 h-16 mx-auto mb-4 text-danger" />
        <h3 className="retro-heading text-xl mb-3">Koneksi Error</h3>
        <Button onClick={() => queryClient.invalidateQueries(['admin-users'])}>Coba Lagi</Button>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <PageHeader
        title={ID.nav.users}
        icon={Users}
        description="Kelola akun pengguna sistem"
        breadcrumbs={[{ label: ID.nav.users, path: '/admin/users' }]}
        actions={
          <Button variant="primary" onClick={() => { ui.setIsCreateOpen(true); form.resetForm(); }} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Tambah Pengguna
          </Button>
        }
      />

      {/* Stats */}
      <StatGrid>
        <RetroStatWidget title="Total Pengguna" value={meta.total || 0} icon={Users} color="orange" />
        <RetroStatWidget title="Guru" value={meta.guru_count || 0} icon={UserCheck} color="blue" />
        <RetroStatWidget title="Siswa" value={meta.siswa_count || 0} icon={School} color="purple" />
        <RetroStatWidget title="Admin" value={meta.admin_count || 0} icon={Mail} color="lime" />
      </StatGrid>

      {/* Search & Filters */}
      <RetroSection>
        <RetroCard className="p-4 space-y-4">
          <Input
            label="Cari Pengguna"
            placeholder="Cari nama atau email..."
            value={filters.search}
            onChange={(e) => filters.setSearch(e.target.value)}
            prefix={<Search className="w-4 h-4" />}
            suffix={filters.search && <X className="w-4 h-4 cursor-pointer" onClick={() => filters.setSearch('')} />}
          />

          {filters.showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <RetroSelect
                label="Filter Role"
                name="role"
                value={filters.roleFilter}
                onChange={(e) => filters.setRoleFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'Semua Role' },
                  { value: 'admin', label: 'Admin' },
                  { value: 'guru', label: 'Guru' },
                  { value: 'siswa', label: 'Siswa' }
                ]}
              />
              <RetroSelect
                label="Filter Status"
                name="status"
                value={filters.statusFilter}
                onChange={(e) => filters.setStatusFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'Semua Status' },
                  { value: 'active', label: 'Aktif' },
                  { value: 'inactive', label: 'Tidak Aktif' }
                ]}
              />
              <Button variant="outline" onClick={filters.resetFilters}>Reset Filter</Button>
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => filters.setShowFilters(!filters.showFilters)}>
              {filters.showFilters ? 'Sembunyikan' : 'Tampilkan'} Filter
            </Button>
          </div>
        </RetroCard>
      </RetroSection>

      {/* Bulk Actions */}
      {ui.selectedIds.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="retro-card p-3 bg-retro-orange/10 border-retro-orange flex items-center justify-between">
          <span className="text-xs font-black">{ui.selectedIds.length} pengguna terpilih</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => ui.setSelectedIds([])}>Batal</Button>
            <Button size="sm" className="bg-danger" onClick={() => ui.setConfirmBulkDelete(true)}>Hapus</Button>
          </div>
        </motion.div>
      )}

      {/* Table */}
      <RetroSection>
        <RetroTable
          data={users}
          columns={[
            {
              header: 'Nama',
              key: 'name',
              render: (name, item) => <div><p className="font-black">{name}</p><p className="text-[10px] text-base-black/50">{item.email}</p></div>
            },
            {
              header: 'Role',
              key: 'role',
              render: (role) => <RetroTag label={role} color={role === 'admin' ? 'orange' : role === 'guru' ? 'blue' : 'purple'} />
            },
            {
              header: 'Status',
              key: 'is_active',
              render: (active) => <span className={`retro-badge ${active ? 'retro-badge-green' : 'retro-badge-red'}`}>{active ? 'AKTIF' : 'NONAKTIF'}</span>
            }
          ]}
          actions={(row) => (
            <TableActions
              onEdit={() => { ui.openEditModal(row); form.setFormWithUser(row); }}
              onDelete={() => ui.setConfirmDelete(row.id)}
            />
          )}
          selectedIds={ui.selectedIds}
          onSelect={ui.toggleSelect}
          onSelectAll={() => ui.toggleSelectAll(users.map(u => u.id))}
          pagination={{
            currentPage: meta.current_page || 1,
            totalPages: meta.last_page || 1,
            totalItems: meta.total || 0,
            onPageChange: filters.setPage
          }}
        />
      </RetroSection>

      {/* Create/Edit Modal */}
      {(ui.isCreateOpen || ui.isEditOpen) && (
        <Modal isOpen onClose={ui.closeModals} title={ui.isCreateOpen ? "Tambah Pengguna" : "Edit Pengguna"} size="2xl">
          <form onSubmit={ui.isCreateOpen ? handleCreateSubmit : handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <RetroInput label="Nama" name="name" value={form.formData.name} onChange={form.setFormData} error={form.errors.name} />
              <RetroInput label="Email" name="email" type="email" value={form.formData.email} onChange={form.setFormData} error={form.errors.email} />
              <RetroSelect label="Role" name="role" value={form.formData.role} onChange={form.setFormData} options={[
                { value: 'admin', label: 'Admin' },
                { value: 'guru', label: 'Guru' },
                { value: 'siswa', label: 'Siswa' }
              ]} error={form.errors.role} />
              <RetroInput label="Password" name="password" type="password" value={form.formData.password} onChange={form.setFormData} />
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="is_active" checked={form.formData.is_active} onChange={(e) => form.setFormData({ ...form.formData, is_active: e.target.checked })} />
              <label htmlFor="is_active" className="text-xs font-black">Aktifkan Pengguna</label>
            </div>
            <div className="flex justify-end gap-3 pt-6 border-t-4 border-base-black">
              <Button variant="outline" onClick={ui.closeModals}>Batal</Button>
              <Button variant="primary" type="submit" loading={mutations.createUserMutation.isPending || mutations.updateUserMutation.isPending}>
                {ui.isCreateOpen ? 'Tambah' : 'Update'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation */}
      {ui.confirmDelete && (
        <Modal isOpen onClose={() => ui.setConfirmDelete(null)} title="Hapus Pengguna" size="md">
          <div className="text-center p-4">
            <p className="mb-6">Yakin ingin menghapus pengguna ini?</p>
            <div className="flex gap-4">
              <Button variant="outline" className="flex-1" onClick={() => ui.setConfirmDelete(null)}>Batal</Button>
              <Button className="bg-danger flex-1" onClick={() => mutations.deleteUserMutation.mutate(ui.confirmDelete)}>Hapus</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Toast */}
      {ui.toast && <Toast message={ui.toast.message} type={ui.toast.type} />}
    </motion.div>
  );
}
