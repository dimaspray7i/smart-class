import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit2, Trash2, KeyRound, X, Loader2, User, Mail, Lock, Phone } from 'lucide-react';
import { api } from '../../api';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button'; 

// ═══════════════════════════════════════════════════════════
// DEBOUNCE HOOK
// ═══════════════════════════════════════════════════════════
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

// ═══════════════════════════════════════════════════════════
// INPUT FIELD COMPONENT (Fixed - no HTML injection)
// ═══════════════════════════════════════════════════════════
function InputField({ label, name, type = "text", value, onChange, error, required, disabled, placeholder, icon: Icon, ...props }) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700 dark:text-dark-muted mb-1">
        <span className="flex items-center gap-1.5">
          {Icon && <Icon className="w-4 h-4 text-gray-400" />}
          {label}
          {required && <span className="text-red-500">*</span>}
        </span>
      </label>
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
        <p className="text-red-500 text-xs mt-1">
          {Array.isArray(error) ? error[0] : error}
        </p>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// SELECT FIELD COMPONENT
// ═══════════════════════════════════════════════════════════
function SelectField({ label, name, value, onChange, options, error, required, disabled, icon: Icon }) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700 dark:text-dark-muted mb-1">
        <span className="flex items-center gap-1.5">
          {Icon && <Icon className="w-4 h-4 text-gray-400" />}
          {label}
          {required && <span className="text-red-500">*</span>}
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
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-red-500 text-xs mt-1">
          {Array.isArray(error) ? error[0] : error}
        </p>
      )}
    </div>
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
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [subjects, setSubjects] = useState([]); // For teacher subjects

  // Fetch subjects for teacher
  useEffect(() => {
    if (isCreateOpen || isEditOpen) {
      api.get('/admin/subjects')
        .then(res => {
          const subjectData = res.data?.data || [];
          setSubjects(subjectData);
        })
        .catch(err => console.error('Failed to fetch subjects:', err));
    }
  }, [isCreateOpen, isEditOpen]);

  // Debounce search
  const debouncedSearch = useDebounce(search, 500);

  // ═══════════════════════════════════════════════════════════
  // API QUERIES
  // ═══════════════════════════════════════════════════════════
  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ['admin-users', debouncedSearch, roleFilter],
    queryFn: () => api.get('/admin/users', {
      params: {
        page: 1,
        search: debouncedSearch || undefined,
        role: roleFilter === 'all' ? undefined : roleFilter,
      }
    }),
    placeholderData: (previousData) => previousData,
    staleTime: 30000,
  });

  const users = data?.data?.data || [];
  const meta = data?.data?.meta || {};

  // ═══════════════════════════════════════════════════════════
  // API MUTATIONS
  // ═══════════════════════════════════════════════════════════
  const createUserMutation = useMutation({
    mutationFn: (newUser) => api.post('/admin/users', newUser),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setIsCreateOpen(false);
      setFormData({});
      setErrors({});
      alert('✅ User berhasil dibuat!');
    },
    onError: (err) => {
      setErrors(err.response?.data?.errors || {});
      alert(`❌ ${err.response?.data?.message || 'Gagal membuat user'}`);
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
      alert('✅ User berhasil diupdate!');
    },
    onError: (err) => {
      setErrors(err.response?.data?.errors || {});
      alert(`❌ ${err.response?.data?.message || 'Gagal update user'}`);
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      alert('✅ User berhasil dihapus!');
    },
    onError: (err) => {
      alert(`❌ ${err.response?.data?.message || 'Gagal menghapus user'}`);
    }
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (id) => api.post(`/admin/users/${id}/reset-password`, { password: 'password123' }),
    onSuccess: () => {
      alert('✅ Password berhasil direset ke "password123"');
    },
    onError: (err) => {
      alert(`❌ ${err.response?.data?.message || 'Gagal reset password'}`);
    }
  });

  // ═══════════════════════════════════════════════════════════
  // EVENT HANDLERS
  // ═══════════════════════════════════════════════════════════
  const handleCreateSubmit = (e) => {
    e.preventDefault();
    
    const payload = { ...formData };
    
    // Clean up fields based on role
    if (payload.role !== 'siswa') {
      delete payload.nis;
      delete payload.class_level;
    }
    if (payload.role !== 'guru') {
      delete payload.nip;
      delete payload.subjects;
    }
    
    createUserMutation.mutate(payload);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    
    const payload = { ...formData };
    
    // Clean up fields based on role
    if (payload.role !== 'siswa') {
      delete payload.nis;
      delete payload.class_level;
    }
    if (payload.role !== 'guru') {
      delete payload.nip;
      delete payload.subjects;
    }
    
    updateUserMutation.mutate({ id: selectedUser.id, ...payload });
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      role: user.role || 'siswa',
      is_active: user.is_active !== false,
      nis: user.profile?.nis || '',
      nip: user.profile?.nip || '',
      class_level: user.profile?.class_level || '',
      bio: user.profile?.bio || '',
      github_url: user.profile?.github_url || '',
      linkedin_url: user.profile?.linkedin_url || '',
      subjects: user.profile?.subjects?.map(s => s.id) || [],
    });
    setIsEditOpen(true);
    setErrors({});
  };

  const handleDelete = useCallback((id) => {
    if (window.confirm('⚠️ Apakah Anda yakin ingin menghapus user ini?\n\nTindakan ini tidak dapat dibatalkan.')) {
      deleteUserMutation.mutate(id);
    }
  }, []);

  const handleResetPassword = useCallback((id) => {
    if (window.confirm('🔑 Reset password user ini ke "password123"?\n\nUser harus login ulang setelah ini.')) {
      resetPasswordMutation.mutate(id);
    }
  }, []);

  const clearSearch = useCallback(() => setSearch(''), []);

  const handleRoleChange = useCallback((newRole) => {
    setFormData(prev => ({
      ...prev,
      role: newRole,
      nis: newRole === 'siswa' ? prev.nis : '',
      nip: newRole === 'guru' ? prev.nip : '',
      class_level: newRole === 'siswa' ? prev.class_level : '',
      subjects: newRole === 'guru' ? prev.subjects : [],
    }));
  }, []);

  // ═══════════════════════════════════════════════════════════
  // LOADING & ERROR STATES
  // ═══════════════════════════════════════════════════════════
  if (isLoading && !isFetching) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        <span className="ml-3 text-gray-600">Memuat data user...</span>
      </div>
    );
  }
  
  if (isError) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 font-medium mb-2">❌ Gagal memuat data</p>
        <Button variant="outline" onClick={() => queryClient.invalidateQueries(['admin-users'])}>
          Coba Lagi
        </Button>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // RENDER UI
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text">Manajemen User</h1>
          <p className="text-gray-600 dark:text-dark-muted mt-1">Kelola akun Siswa, Guru, dan Admin.</p>
        </div>
        <Button 
          onClick={() => { 
            setFormData({ role: 'siswa', is_active: true }); 
            setErrors({}); 
            setIsCreateOpen(true); 
          }} 
          className="flex items-center gap-2"
          disabled={createUserMutation.isLoading}
        >
          <Plus className="w-4 h-4" /> 
          {createUserMutation.isLoading ? 'Menyimpan...' : 'Tambah User'}
        </Button>
      </div>

      {/* FILTERS */}
      <div className="card flex flex-col md:flex-row gap-4 items-end md:items-center justify-between">
        <div className="flex-1 w-full md:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama atau email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10 pr-10 w-full"
            />
            {search && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            {isFetching && debouncedSearch !== search && (
              <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
          {search && debouncedSearch !== search && (
            <p className="text-xs text-gray-500 mt-1 ml-1">Mencari...</p>
          )}
        </div>
        <div className="w-full md:w-48">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="input w-full"
          >
            <option value="all">Semua Role</option>
            <option value="siswa">Siswa</option>
            <option value="guru">Guru</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>

      {/* TABLE */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-dark-card border-b border-gray-200 dark:border-dark-border">
              <tr>
                <th className="px-6 py-3 font-medium text-gray-600 dark:text-dark-muted">User</th>
                <th className="px-6 py-3 font-medium text-gray-600 dark:text-dark-muted">Role</th>
                <th className="px-6 py-3 font-medium text-gray-600 dark:text-dark-muted">Status</th>
                <th className="px-6 py-3 font-medium text-gray-600 dark:text-dark-muted">Identity</th>
                <th className="px-6 py-3 font-medium text-gray-600 dark:text-dark-muted text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-dark-border">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-dark-card/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-700 dark:text-primary-300 font-bold text-sm">
                        {user.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-dark-text">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium uppercase tracking-wide ${
                      user.role === 'admin' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                      user.role === 'guru' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${user.is_active ? 'text-green-600' : 'text-red-600'}`}>
                      <span className={`w-2 h-2 rounded-full ${user.is_active ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                      {user.is_active ? 'Aktif' : 'Non-Aktif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-dark-muted font-mono text-xs">
                    {user.role === 'siswa' && user.profile?.nis ? `NIS: ${user.profile.nis}` : 
                     user.role === 'guru' && user.profile?.nip ? `NIP: ${user.profile.nip}` : 
                     '-'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button 
                        onClick={() => handleResetPassword(user.id)} 
                        title="Reset Password" 
                        className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                        disabled={resetPasswordMutation.isLoading}
                      >
                        <KeyRound className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => openEditModal(user)} 
                        title="Edit" 
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(user.id)} 
                        title="Hapus" 
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        disabled={deleteUserMutation.isLoading}
                      >
                        {deleteUserMutation.isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center py-12">
                    <div className="text-gray-400 mb-2">📭</div>
                    <p className="text-gray-500">
                      {search || roleFilter !== 'all' 
                        ? 'Tidak ada user yang cocok dengan filter.' 
                        : 'Belum ada data user.'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* PAGINATION INFO */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-dark-border text-sm text-gray-600 dark:text-dark-muted flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>
            Menampilkan <strong>{meta.from || 0}</strong> - <strong>{meta.to || 0}</strong> dari <strong>{meta.total || 0}</strong> data
            {debouncedSearch && <span className="ml-1 text-gray-400">untuk "{debouncedSearch}"</span>}
          </span>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          MODAL FORM: CREATE / EDIT USER (FIXED & ENHANCED)
          ═══════════════════════════════════════════════════════════ */}
      {(isCreateOpen || isEditOpen) && (
        <Modal 
          isOpen={isCreateOpen || isEditOpen} 
          onClose={() => { setIsCreateOpen(false); setIsEditOpen(false); }} 
          title={isCreateOpen ? "✨ Tambah User Baru" : "✏️ Edit User"}
          size="xl"
        >
          <form onSubmit={isCreateOpen ? handleCreateSubmit : handleEditSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
            
            {/* SECTION 1: Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text pb-2 border-b dark:border-dark-border flex items-center gap-2">
                <User className="w-5 h-5 text-primary-600" />
                Informasi Dasar
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField 
                  label="Nama Lengkap" 
                  name="name" 
                  value={formData.name} 
                  onChange={setFormData} 
                  error={errors.name} 
                  required 
                  placeholder="Contoh: Ahmad Rizki"
                  icon={User}
                />
                <InputField 
                  label="Email" 
                  name="email" 
                  type="email" 
                  value={formData.email} 
                  onChange={setFormData} 
                  error={errors.email} 
                  required 
                  // Email CAN be edited now (removed disabled={isEditOpen})
                  placeholder="email@rpl.id"
                  icon={Mail}
                />
              </div>

              {isCreateOpen && (
                <InputField 
                  label="Password" 
                  name="password" 
                  type="password" 
                  value={formData.password} 
                  onChange={setFormData} 
                  error={errors.password} 
                  required 
                  placeholder="Minimal 8 karakter"
                  icon={Lock}
                />
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SelectField 
                  label="Role" 
                  name="role" 
                  value={formData.role || 'siswa'} 
                  onChange={handleRoleChange} 
                  options={[
                    { value: 'siswa', label: '🎓 Siswa' },
                    { value: 'guru', label: '👨‍🏫 Guru' },
                    { value: 'admin', label: '🛡️ Admin' },
                  ]}
                  error={errors.role}
                  required
                  disabled={isEditOpen}
                />
                <div className="flex items-center pt-6">
                  <input 
                    type="checkbox" 
                    id="is_active" 
                    checked={formData.is_active !== false} 
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})} 
                    className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500 border-gray-300 dark:border-dark-border" 
                  />
                  <label htmlFor="is_active" className="ml-2 text-sm font-medium text-gray-700 dark:text-dark-muted cursor-pointer">
                    User Aktif (dapat login)
                  </label>
                </div>
              </div>
            </div>

            {/* SECTION 2: Student Information */}
            {formData.role === 'siswa' && (
              <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
                  <span>🎓</span> Informasi Siswa
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField 
                    label="NIS (Nomor Induk Siswa)" 
                    name="nis" 
                    value={formData.nis} 
                    onChange={setFormData} 
                    error={errors.nis} 
                    placeholder="Contoh: 20250001"
                    required
                  />
                  <SelectField 
                    label="Kelas" 
                    name="class_level" 
                    value={formData.class_level || 'X'} 
                    onChange={setFormData}
                    options={[
                      { value: 'X', label: 'Kelas X' },
                      { value: 'XI', label: 'Kelas XI' },
                      { value: 'XII', label: 'Kelas XII' },
                    ]}
                    error={errors.class_level}
                    required
                  />
                </div>
              </div>
            )}

            {/* SECTION 3: Teacher Information */}
            {formData.role === 'guru' && (
              <div className="space-y-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100 flex items-center gap-2">
                  <span>👨‍🏫</span> Informasi Guru
                </h3>
                
                <InputField 
                  label="NIP (Nomor Induk Pegawai)" 
                  name="nip" 
                  value={formData.nip} 
                  onChange={setFormData} 
                  error={errors.nip} 
                  placeholder="Contoh: 198001012020011001"
                  required
                />
                
                <div className="space-y-2 col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-muted">
                    Mata Pelajaran (Pilih minimal satu) <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {subjects.length > 0 ? subjects.map((sub) => (
                      <label key={sub.id} className="flex items-center p-2 border border-gray-200 dark:border-dark-border rounded hover:bg-gray-50 dark:hover:bg-dark-card cursor-pointer">
                        <input
                          type="checkbox"
                          checked={(formData.subjects || []).includes(sub.id)}
                          onChange={(e) => {
                            const current = formData.subjects || [];
                            if (e.target.checked) {
                              setFormData({...formData, subjects: [...current, sub.id]});
                            } else {
                              setFormData({...formData, subjects: current.filter(id => id !== sub.id)});
                            }
                          }}
                          className="w-4 h-4 text-primary-600 rounded border-gray-300 dark:border-dark-border"
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-dark-muted">{sub.name}</span>
                      </label>
                    )) : (
                      <p className="text-sm text-gray-500 p-2">Tidak ada data mata pelajaran. Silakan tambahkan di menu Kelola Mapel.</p>
                    )}
                  </div>
                  {errors.subjects && (
                    <p className="text-red-500 text-xs mt-1">
                      {Array.isArray(errors.subjects) ? errors.subjects[0] : errors.subjects}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* SECTION 4: Admin Notice */}
            {formData.role === 'admin' && (
              <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <p className="text-sm text-orange-800 dark:text-orange-200 flex items-start gap-2">
                  <span>⚠️</span>
                  <span><strong>Admin</strong> tidak memerlukan NIS/NIP. Hanya informasi dasar yang diperlukan.</span>
                </p>
              </div>
            )}

            {/* SECTION 5: Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text pb-2 border-b dark:border-dark-border flex items-center gap-2">
                <Phone className="w-5 h-5 text-primary-600" />
                Informasi Kontak (Opsional)
              </h3>
              
              <InputField 
                label="Nomor Telepon" 
                name="phone" 
                value={formData.phone} 
                onChange={setFormData} 
                error={errors.phone} 
                placeholder="08123456789"
                icon={Phone}
              />
            </div>

            {/* ACTION BUTTONS */}
            <div className="pt-4 flex justify-end gap-3 border-t border-gray-200 dark:border-dark-border sticky bottom-0 bg-white dark:bg-dark-card py-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => { setIsCreateOpen(false); setIsEditOpen(false); }}
                disabled={createUserMutation.isLoading || updateUserMutation.isLoading}
              >
                Batal
              </Button>
              <Button 
                type="submit" 
                loading={createUserMutation.isLoading || updateUserMutation.isLoading}
                disabled={createUserMutation.isLoading || updateUserMutation.isLoading}
              >
                {isCreateOpen ? '💾 Simpan User' : '✏️ Update User'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}