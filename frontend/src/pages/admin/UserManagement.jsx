import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { 
  Plus, Search, Edit2, Trash2, KeyRound, X, Loader2, User, Mail, Lock, Phone,
  Download, Upload, Filter, MoreVertical, Check, ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  Calendar, MapPin, Link as LinkIcon, ExternalLink, Image as ImageIcon,
  AlertCircle, CheckCircle2, Clock, Activity, Eye, Users, Settings,
  FileText, Copy, RefreshCw, Tag, Star, Award, TrendingUp, ChartBar as BarChart3,
  Globe2 as Globe, Smartphone, Monitor, Tablet, Wifi, Zap, MessageSquare, Bookmark,
  GitBranch, GitCommitHorizontal as GitCommit, GitPullRequest, RefreshCw as History, LogOut, Shield, Key,
  UserCheck, UserX, Users as Users2, UserPlus, FolderOpen, Package, Layers, Menu, GraduationCap, BookOpen, Smile, Sparkles, Rocket
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
const pageVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1, 
    transition: { staggerChildren: 0.04, delayChildren: 0.1 } 
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, rotate: -1, scale: 0.98 },
  visible: { 
    opacity: 1, 
    y: 0, 
    rotate: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 120, damping: 18, mass: 0.1 } 
  }
};

/**
 * 🏷️ Simplified Tag Component for consistency
 */
function RetroTag({ label, color = 'orange' }) {
  const colors = {
    orange: 'bg-retro-orange/10 text-retro-orange border-retro-orange',
    blue: 'bg-retro-blue/10 text-retro-blue border-retro-blue',
    purple: 'bg-retro-purple/10 text-retro-purple border-retro-purple',
    lime: 'bg-retro-lime/10 text-retro-lime border-retro-lime',
    green: 'bg-retro-green/10 text-retro-green border-retro-green',
    pink: 'bg-retro-pink/10 text-retro-pink border-retro-pink',
    gray: 'bg-base-gray/10 text-base-black/50 border-base-black/10',
  };
  return (
    <span className={twMerge("px-2 py-0.5 rounded-retro text-[9px] font-black uppercase border-2", colors[color])}>
      {label}
    </span>
  );
}

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

/**
 * 📚 Retro Subject Multi-Select
 */
function RetroSubjectMultiSelect({ label, value = [], onChange, subjects = [], error }) {
  const toggleSubject = (id) => {
    const next = value.includes(id) ? value.filter(i => i !== id) : [...value, id];
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <label className="block text-[10px] font-black uppercase tracking-wider text-base-black">{label}</label>
      <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1">
        {subjects.map(s => (
          <button
            key={s.id}
            type="button"
            onClick={() => toggleSubject(s.id)}
            className={twMerge(
              "px-3 py-1 rounded-retro border-2 font-retro-mono text-[10px] transition-all",
              value.includes(s.id) 
                ? "bg-retro-purple text-base-white border-base-black shadow-hard-sm" 
                : "bg-base-white text-base-black border-base-black/20 hover:border-base-black"
            )}
          >
            {s.name}
          </button>
        ))}
      </div>
      {error && <p className="text-danger text-[9px] font-retro-mono">{error}</p>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// 🖼️ RETRO AVATAR UPLOAD (Enhanced)
// ═══════════════════════════════════════════════════════════
function RetroAvatarUpload({ value, onChange, error }) {
  const [preview, setPreview] = useState(value);
  const fileInputRef = useRef(null);
  
  useEffect(() => { if (typeof value === 'string') setPreview(value); }, [value]);
  
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { showToast('❌ Max file size 5MB', 'error'); return; }
      const reader = new FileReader();
      reader.onloadend = () => { setPreview(reader.result); onChange(file); };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-[10px] font-black uppercase tracking-wider text-base-black flex items-center gap-1.5">
        <ImageIcon className="w-3.5 h-3.5" /> Profile Avatar
      </label>
      <div className="flex items-center gap-4">
        <motion.div whileHover={{ scale: 1.05 }} className="relative">
          <div className="w-16 h-16 retro-card bg-retro-orange/20 border-retro-orange flex items-center justify-center overflow-hidden">
            {preview ? <img src={typeof preview === 'string' ? preview : URL.createObjectURL(preview)} alt="Preview" className="w-full h-full object-cover" /> : <User className="w-8 h-8 text-retro-orange" />}
          </div>
          <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute -bottom-1.5 -right-1.5 p-1.5 retro-btn retro-btn-sm bg-retro-purple hover:bg-retro-purple/90 text-base-white rounded-full shadow-[2px_2px_0px_0px_#111111]">
            <ImageIcon className="w-3 h-3" />
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
        </motion.div>
        <div className="flex-1">
          <p className="text-[10px] font-retro-mono text-base-black/70">Upload avatar (max 5MB)</p>
          <p className="text-[9px] font-retro-mono text-base-black/40">JPG, PNG, WebP • Recommended: 200x200px</p>
          {value && typeof value !== 'string' && <p className="text-[9px] font-retro-mono text-retro-orange mt-1">📁 {value.name}</p>}
        </div>
      </div>
      {error && <p className="text-danger text-[9px] font-retro-mono">{error}</p>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// 🎭 RETRO CONFIRM MODAL (Enhanced)
// ═══════════════════════════════════════════════════════════
function RetroConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = "Ya, Lanjutkan", cancelText = "Batal", variant = "danger", details }) {
  if (!isOpen) return null;
  const variants = {
    danger: { icon: AlertCircle, color: 'text-danger', bg: 'bg-danger', border: 'border-danger', label: 'DANGER' },
    warning: { icon: AlertCircle, color: 'text-warning', bg: 'bg-warning', border: 'border-warning', label: 'WARNING' },
    success: { icon: CheckCircle2, color: 'text-success', bg: 'bg-success', border: 'border-success', label: 'CONFIRM' },
  };
  const config = variants[variant];
  const Icon = config.icon;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="md">
      <div className="text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className={`w-16 h-16 mx-auto mb-4 retro-card ${config.bg}/10 ${config.border} border-4 flex items-center justify-center`}>
          <Icon className={`w-8 h-8 ${config.color}`} />
        </motion.div>
        <h3 className="retro-heading text-base mb-2 text-base-black">{title}</h3>
        <p className="font-retro-mono text-[10px] text-base-black/70 mb-4">{message}</p>
        {details && <div className="retro-card bg-base-gray/20 p-3 mb-4 text-left"><p className="text-[10px] font-retro-mono text-base-black/70 whitespace-pre-wrap">{details}</p></div>}
        <div className="flex gap-3 justify-center">
          <button onClick={onClose} className="retro-btn retro-btn-outline">{cancelText}</button>
          <button onClick={onConfirm} className={`retro-btn ${variant === 'danger' ? 'bg-danger hover:bg-danger/90' : variant === 'warning' ? 'bg-warning hover:bg-warning/90 text-base-black' : 'bg-success hover:bg-success/90'} text-base-white`}>{confirmText}</button>
        </div>
        <div className="absolute -top-3 -right-3 retro-sticker bg-retro-yellow text-base-black text-[10px] px-2 py-0.5 font-black">{config.label}</div>
      </div>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════
// 📋 DETAIL ITEM HELPER (Retro Style)
// ═══════════════════════════════════════════════════════════
function RetroDetailItem({ icon: Icon, label, value, valueClass = '', multiline = false, copyable = false }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => { if (copyable && value) { await navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 2000); } };
  
  return (
    <div className="flex items-start gap-3">
      {Icon && <Icon className="w-4 h-4 mt-0.5 text-base-black/50" />}
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-black uppercase tracking-wider text-base-black/50">{label}</p>
        <div className="flex items-center gap-2">
          <p className={`text-sm font-retro-display font-black text-base-black ${valueClass} ${multiline ? 'whitespace-pre-wrap' : 'truncate'}`}>{value || '-'}</p>
          {copyable && value && (
            <button onClick={handleCopy} className="p-1 hover:bg-retro-yellow/30 rounded transition-colors" title="Copy">
              {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5 text-base-black/40" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// 🎯 MAIN COMPONENT - EXPANDED & FEATURE-RICH
// ═══════════════════════════════════════════════════════════
export default function UserManagement() {
  const queryClient = useQueryClient();
  
  // ═════════════════════════════════════════════════════════
  // STATE MANAGEMENT (EXPANDED)
  // ═════════════════════════════════════════════════════════
  const [search, setSearch] = useState('');
  const [advancedFilters, setAdvancedFilters] = useState({ role: 'all', status: 'all', class: 'all', dateFrom: '', dateTo: '' });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', role: 'siswa', is_active: true,
    nis: '', nip: '', class_level: 'X', class_id: '',
    bio: '', github_url: '', linkedin_url: '', avatar_url: '',
    subjects: []
  });
  const [errors, setErrors] = useState({});
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [toast, setToast] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmBulkAction, setConfirmBulkAction] = useState(null);
  const [inlineEditId, setInlineEditId] = useState(null);
  const [inlineEditField, setInlineEditField] = useState('');
  const [inlineEditValue, setInlineEditValue] = useState('');
  const [userTags, setUserTags] = useState({});
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);

  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to page 1 on new search
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  // Escape key down listener to close modals
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsCreateOpen(false);
        setIsEditOpen(false);
        setIsViewOpen(false);
        setConfirmDelete(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ═════════════════════════════════════════════════════════
  // DATA FETCHING (EXPANDED)
  // ═════════════════════════════════════════════════════════
  const { data, isPending, isError, isFetching, refetch } = useQuery({
    queryKey: ['admin-users', debouncedSearch, advancedFilters, page, perPage, sortBy, sortOrder],
    queryFn: () => {
      const cleanFilters = Object.entries(advancedFilters).reduce((acc, [key, value]) => {
        acc[key] = value === 'all' ? undefined : value;
        return acc;
      }, {});

      return adminAPI.getUsers({
        page, 
        per_page: perPage, 
        search: debouncedSearch || undefined, 
        ...cleanFilters, 
        sort_by: sortBy, 
        sort_order: sortOrder 
      });
    },
    placeholderData: (prev) => prev,
    staleTime: 30000,
  });

  // Fetch dependencies sequentially to avoid deadlock/timeout on single-threaded PHP built-in server
  useEffect(() => {
    const loadFormDependencies = async () => {
      if (!isCreateOpen && !isEditOpen) return;
      try {
        let subjectsData = [];
        try {
          const subjectsRes = await adminAPI.getSubjects({ all: 1 });
          subjectsData = Array.isArray(subjectsRes.data) ? subjectsRes.data : (subjectsRes.data?.data || subjectsRes.data || []);
        } catch (e) {
          console.error('Failed to fetch subjects dependency in UserManagement:', e);
        }

        let classesData = [];
        try {
          const classesRes = await adminAPI.getClasses({ all: 1 });
          classesData = Array.isArray(classesRes.data) ? classesRes.data : (classesRes.data?.data || classesRes.data || []);
        } catch (e) {
          console.error('Failed to fetch classes dependency in UserManagement:', e);
        }

        setSubjects(subjectsData);
        setClasses(classesData);
      } catch (err) {
        console.error('Failed to fetch dependencies in UserManagement:', err);
      }
    };
    loadFormDependencies();
  }, [isCreateOpen, isEditOpen]);

  const users = data?.data || [];
  const meta = data?.meta || {};

  // ═════════════════════════════════════════════════════════
  // QUICK STATS CALCULATION (NEW FEATURE)
  // ═════════════════════════════════════════════════════════
  const stats = useMemo(() => {
    const today = new Date().toDateString();
    return {
      total: meta.total || 0,
      active: users.filter(u => u.is_active).length,
      newToday: users.filter(u => new Date(u.created_at).toDateString() === today).length,
      admin: users.filter(u => u.role === 'admin').length,
      guru: users.filter(u => u.role === 'guru').length,
      siswa: users.filter(u => u.role === 'siswa').length,
      withAvatar: users.filter(u => u.avatar_url).length,
      pklStudents: users.filter(u => u.role === 'siswa' && u.profile?.class_level === 'XII').length,
    };
  }, [users, meta]);

  // ═════════════════════════════════════════════════════════
  // TOAST NOTIFICATION HELPER
  // ═════════════════════════════════════════════════════════
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // ═════════════════════════════════════════════════════════
  // MUTATIONS (EXPANDED)
  // ═════════════════════════════════════════════════════════
  const createUserMutation = useMutation({
    mutationFn: (payload) => {
      const formDataObj = new FormData();
      Object.keys(payload).forEach(key => {
        if (key === 'subjects' && Array.isArray(payload[key])) payload[key].forEach(id => formDataObj.append('subjects[]', id));
        else if (key === 'is_active') formDataObj.append(key, payload[key] ? '1' : '0');
        else if (key === 'avatar_url' && payload[key] instanceof File) formDataObj.append('avatar', payload[key]);
        else if (payload[key] !== undefined && payload[key] !== null && payload[key] !== '' && typeof payload[key] !== 'object') formDataObj.append(key, payload[key]);
      });
      return adminAPI.createUser(formDataObj);
    },
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ['admin-users'] }); 
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
      setIsCreateOpen(false); setFormData({}); setErrors({}); showToast('✅ User created successfully!', 'success'); 
    },
    onError: (err) => { setErrors(err.errors || err.response?.data?.errors || {}); showToast(`❌ ${err.message || err.response?.data?.message || 'Failed to create user'}`, 'error'); }
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, ...payload }) => {
      const formDataObj = new FormData();
      formDataObj.append('_method', 'PUT');
      Object.keys(payload).forEach(key => {
        if (key === 'subjects' && Array.isArray(payload[key])) payload[key].forEach(sid => formDataObj.append('subjects[]', sid));
        else if (key === 'is_active') formDataObj.append(key, payload[key] ? '1' : '0');
        else if (key === 'avatar_url' && payload[key] instanceof File) formDataObj.append('avatar', payload[key]);
        else if (payload[key] !== undefined && payload[key] !== null && payload[key] !== '' && typeof payload[key] !== 'object') formDataObj.append(key, payload[key]);
      });
      return adminAPI.updateUser(id, formDataObj);
    },
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ['admin-users'] }); 
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
      setIsEditOpen(false); setSelectedUser(null); setFormData({}); setErrors({}); showToast('✅ User updated successfully!', 'success'); 
    },
    onError: (err) => { setErrors(err.errors || err.response?.data?.errors || {}); showToast(`❌ ${err.message || err.response?.data?.message || 'Failed to update user'}`, 'error'); }
  });

  const deleteUserMutation = useMutation({ mutationFn: (id) => adminAPI.deleteUser(id), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-users'] }); queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] }); queryClient.invalidateQueries({ queryKey: ['admin-analytics'] }); showToast('✅ User deleted!', 'success'); setConfirmDelete(null); }, onError: (err) => showToast(`❌ ${err.message || 'Failed to delete'}`, 'error') });
  const bulkDeleteMutation = useMutation({ mutationFn: (ids) => adminAPI.deleteUser(null, { ids }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-users'] }); queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] }); queryClient.invalidateQueries({ queryKey: ['admin-analytics'] }); setSelectedIds([]); showToast('✅ Selected users deleted!', 'success'); setConfirmBulkAction(null); }, onError: (err) => showToast(`❌ ${err.message || 'Bulk delete failed'}`, 'error') });
  const bulkActivateMutation = useMutation({ mutationFn: (ids) => adminAPI.bulkUserAction('activate', ids), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-users'] }); queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] }); queryClient.invalidateQueries({ queryKey: ['admin-analytics'] }); setSelectedIds([]); showToast('✅ Selected users activated!', 'success'); setConfirmBulkAction(null); }, onError: (err) => showToast(`❌ ${err.message || 'Bulk activate failed'}`, 'error') });
  const bulkDeactivateMutation = useMutation({ mutationFn: (ids) => adminAPI.bulkUserAction('deactivate', ids), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-users'] }); queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] }); queryClient.invalidateQueries({ queryKey: ['admin-analytics'] }); setSelectedIds([]); showToast('✅ Selected users deactivated!', 'success'); setConfirmBulkAction(null); }, onError: (err) => showToast(`❌ ${err.message || 'Bulk deactivate failed'}`, 'error') });
  const resetPasswordMutation = useMutation({ mutationFn: (id) => adminAPI.resetPassword(id, 'password123'), onSuccess: () => showToast('✅ Password reset to "password123"', 'success'), onError: (err) => showToast(`❌ ${err.message || 'Reset failed'}`, 'error') });
  const exportUsersMutation = useMutation({ mutationFn: (params) => adminAPI.exportUsers('csv', params), onSuccess: (blob) => { const url = window.URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `users-${new Date().toISOString().split('T')[0]}.csv`; a.click(); showToast('✅ Export started!', 'success'); }, onError: () => showToast('❌ Export failed', 'error') });
  const importUsersMutation = useMutation({ mutationFn: (file) => adminAPI.importUsers(file), onSuccess: (res) => { setIsImportOpen(false); queryClient.invalidateQueries({ queryKey: ['admin-users'] }); queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] }); queryClient.invalidateQueries({ queryKey: ['admin-analytics'] }); showToast(`✅ Imported ${res.data?.imported || 0} users!`, 'success'); }, onError: (err) => showToast(`❌ ${err.response?.data?.message || 'Import failed'}`, 'error') });

  // ═════════════════════════════════════════════════════════
  // HANDLERS (EXPANDED)
  // ═════════════════════════════════════════════════════════
  const handleCreateSubmit = (e) => { e.preventDefault(); const payload = { ...formData }; if (payload.role !== 'siswa') { delete payload.nis; delete payload.class_level; delete payload.class_id; } if (payload.role !== 'guru') { delete payload.nip; delete payload.subjects; } if (payload.avatar_url instanceof File) { payload.avatar = payload.avatar_url; delete payload.avatar_url; } createUserMutation.mutate(payload); };
  const handleEditSubmit = (e) => { e.preventDefault(); if (!selectedUser) return; const payload = { ...formData }; if (payload.role !== 'siswa') { delete payload.nis; delete payload.class_level; delete payload.class_id; } if (payload.role !== 'guru') { delete payload.nip; delete payload.subjects; } if (payload.avatar_url instanceof File) { payload.avatar = payload.avatar_url; delete payload.avatar_url; } updateUserMutation.mutate({ id: selectedUser.id, ...payload }); };
  
  const openEditModal = (user) => { setSelectedUser(user); setFormData({ name: user.name || '', email: user.email || '', phone: user.phone || '', role: user.role || 'siswa', is_active: user.is_active !== false, nis: user.profile?.nis || '', nip: user.profile?.nip || '', class_level: user.profile?.class_level || '', class_id: user.classes?.find(c => c.pivot?.role_in_class === 'siswa')?.id || '', bio: user.profile?.bio || '', github_url: user.profile?.github_url || '', linkedin_url: user.profile?.linkedin_url || '', avatar_url: user.avatar_url || '', subjects: user.profile?.subjects?.map(s => s.id) || [], }); setIsEditOpen(true); setErrors({}); };
  const openViewModal = (user) => { setSelectedUser(user); setIsViewOpen(true); };
  
  const handleDelete = (id) => setConfirmDelete(id);
  const confirmDeleteAction = () => { if (confirmDelete) deleteUserMutation.mutate(confirmDelete); };
  
  const handleBulkDelete = () => { if (selectedIds.length > 0) setConfirmBulkAction({ action: 'delete', count: selectedIds.length }); };
  const handleBulkActivate = () => { if (selectedIds.length > 0) setConfirmBulkAction({ action: 'activate', count: selectedIds.length }); };
  const handleBulkDeactivate = () => { if (selectedIds.length > 0) setConfirmBulkAction({ action: 'deactivate', count: selectedIds.length }); };
  const confirmBulkActionExecute = () => { if (!confirmBulkAction) return; if (confirmBulkAction.action === 'delete') bulkDeleteMutation.mutate(selectedIds); else if (confirmBulkAction.action === 'activate') bulkActivateMutation.mutate(selectedIds); else if (confirmBulkAction.action === 'deactivate') bulkDeactivateMutation.mutate(selectedIds); };
  
  const handleResetPassword = (id) => { if (window.confirm('Reset password to "password123"?')) resetPasswordMutation.mutate(id); };
  
  const toggleSelectAll = () => { setSelectedIds(selectedIds.length === users.length ? [] : users.map(u => u.id)); };
  const toggleSelect = (id) => { setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]); };
  
  const handleExport = () => { exportUsersMutation.mutate({ search, ...advancedFilters }); };
  const handleImport = (file) => { if (file) importUsersMutation.mutate(file); };
  
  const clearSearch = useCallback(() => setSearch(''), []);
  const clearFilters = () => { setAdvancedFilters({ role: 'all', status: 'all', class: 'all', dateFrom: '', dateTo: '' }); setSearch(''); };
  
  const handleRoleChange = useCallback((updater) => { setFormData(prev => { const nextState = typeof updater === 'function' ? updater(prev) : updater; const newRole = nextState.role; return { ...nextState, nis: newRole === 'siswa' ? (prev.nis || '') : '', nip: newRole === 'guru' ? (prev.nip || '') : '', class_level: newRole === 'siswa' ? (prev.class_level || 'X') : '', class_id: newRole === 'siswa' ? (prev.class_id || '') : '', subjects: newRole === 'guru' ? (prev.subjects || []) : [], }; }); }, []);
  
  const startInlineEdit = (userId, field, currentValue) => { setInlineEditId(userId); setInlineEditField(field); setInlineEditValue(currentValue || ''); };
  const saveInlineEdit = (userId, field) => { /* Implement API call to update single field */ setInlineEditId(null); showToast('✅ Updated!', 'success'); };
  const cancelInlineEdit = () => { setInlineEditId(null); setInlineEditField(''); setInlineEditValue(''); };
  
  const addUserTag = (userId, tag) => { setUserTags(prev => ({ ...prev, [userId]: [...(prev[userId] || []), tag] })); };
  const removeUserTag = (userId, tag) => { setUserTags(prev => ({ ...prev, [userId]: (prev[userId] || []).filter(t => t !== tag) })); };

  // ═════════════════════════════════════════════════════════
  // ⏳ LOADING STATE (RETRO STYLE - EXPANDED)
  // ═════════════════════════════════════════════════════════
  if (isPending && !isFetching) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-retro-grid">
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-20 h-20 mx-auto mb-4 border-4 border-base-black rounded-retro-lg flex items-center justify-center bg-retro-orange shadow-hard">
            <Users className="w-10 h-10 text-base-white animate-pulse" />
          </motion.div>
          <h2 className="retro-heading retro-heading-orange text-2xl mb-2">LOADING USERS</h2>
          <p className="font-retro-mono text-sm text-base-black/70 mb-4">Fetching awesome people...</p>
          <div className="w-48 mx-auto h-4 border-4 border-base-black rounded-sm overflow-hidden bg-base-white">
            <motion.div className="h-full bg-retro-blue" animate={{ x: ['-100%', '100%'] }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} style={{ width: '50%' }} />
          </div>
          <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 0.5, repeat: Infinity }} className="mt-4"><Smile className="w-6 h-6 text-retro-yellow mx-auto animate-wobble" /></motion.div>
          <div className="mt-4 flex gap-2 justify-center"><div className="w-2 h-2 bg-retro-orange rounded-full animate-bounce" style={{animationDelay:'0ms'}}/><div className="w-2 h-2 bg-retro-blue rounded-full animate-bounce" style={{animationDelay:'150ms'}}/><div className="w-2 h-2 bg-retro-yellow rounded-full animate-bounce" style={{animationDelay:'300ms'}}/></div>
        </motion.div>
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════
  // ❌ ERROR STATE (RETRO STYLE - EXPANDED)
  // ═════════════════════════════════════════════════════════
  if (isError) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="retro-card p-8 text-center max-w-lg mx-auto bg-base-white">
        <motion.div animate={{ scale: [1, 1.1, 1], rotate: [0, -5, 5, 0] }} transition={{ duration: 0.5, repeat: Infinity }} className="w-16 h-16 mx-auto mb-4 border-4 border-base-black rounded-retro-lg flex items-center justify-center bg-danger shadow-[4px_4px_0px_0px_#111111]">
          <AlertCircle className="w-8 h-8 text-base-white" />
        </motion.div>
        <h3 className="retro-heading text-xl mb-3 text-base-black">Oops! Connection Error</h3>
        <p className="font-retro-mono text-sm text-base-black/70 mb-5">Failed to load user data.</p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => refetch()} className="retro-btn retro-btn-secondary flex items-center gap-2"><RefreshCw className="w-4 h-4" /> Retry</button>
          <button onClick={() => window.history.back()} className="retro-btn retro-btn-outline">Go Back</button>
        </div>
        <details className="mt-4 text-left"><summary className="cursor-pointer text-[10px] font-retro-mono text-base-black/50">Error Details</summary><pre className="retro-card bg-base-gray/20 p-3 mt-2 text-[9px] font-retro-mono overflow-x-auto">{error?.message || 'Unknown error'}</pre></details>
        <div className="absolute -top-3 -right-3 retro-sticker bg-retro-yellow text-base-black text-xs px-3 py-1 font-black">ERROR!</div>
      </motion.div>
    );
  }

  // ═════════════════════════════════════════════════════════
  // 🎨 MAIN RENDER - EXPANDED RETRO FUTURISTIC UI
  // ═════════════════════════════════════════════════════════
  return (
    <motion.div 
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* 🏛️ PAGE HEADER */}
      <PageHeader 
        title={ID.nav.users}
        icon={Users}
        description="Kelola data siswa, guru, dan administrator. Pantau aktivitas dan kesehatan sistem secara menyeluruh."
        breadcrumbs={[{ label: ID.nav.users, path: '/admin/users' }]}
        actions={
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsImportOpen(true)}
              className="hidden sm:flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Impor CSV
            </Button>
            <Button 
              variant="primary" 
              onClick={() => { setFormData({role:'siswa',is_active:true,class_level:'X',subjects:[],class_id:''}); setErrors({}); setIsCreateOpen(true); }}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Tambah Pengguna
            </Button>
          </div>
        }
      />

      {/* 📊 QUICK STATS */}
      <StatGrid>
        <RetroStatWidget
          title="Total Pengguna"
          value={stats.total}
          icon={Users}
          color="orange"
          badge="SISTEM"
          onClick={() => setAdvancedFilters({ ...advancedFilters, role: 'all' })}
        />
        <RetroStatWidget
          title="Siswa Aktif"
          value={stats.siswa}
          icon={UserPlus}
          color="blue"
          trend={12}
          onClick={() => setAdvancedFilters({ ...advancedFilters, role: 'siswa' })}
        />
        <RetroStatWidget
          title="Guru"
          value={stats.guru}
          icon={GraduationCap}
          color="purple"
          onClick={() => setAdvancedFilters({ ...advancedFilters, role: 'guru' })}
        />
        <RetroStatWidget
          title="Admin"
          value={stats.admin}
          icon={Shield}
          color="lime"
          onClick={() => setAdvancedFilters({ ...advancedFilters, role: 'admin' })}
        />
      </StatGrid>

      {/* 🔍 SEARCH & FILTERS */}
      <RetroSection>
        <RetroCard className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <Input 
                label="Cari Pengguna"
                placeholder="Cari berdasarkan nama, email, NIS/NIP..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                prefix={<Search className="w-4 h-4" />}
                suffix={search && <X className="w-4 h-4 cursor-pointer" onClick={() => setSearch('')} />}
              />
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                {showAdvancedFilters ? 'Sembunyikan' : 'Tampilkan'} Penyaring
              </Button>
              <Button 
                variant="outline" 
                onClick={clearFilters}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <AnimatePresence>
            {showAdvancedFilters && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden pt-4 mt-4 border-t-2 border-base-black/10"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Select 
                    label="Peran"
                    value={advancedFilters.role}
                    onChange={(e) => setAdvancedFilters({...advancedFilters, role: e.target.value})}
                    options={[
                      { value: 'all', label: 'Semua Peran' },
                      { value: 'admin', label: 'Admin' },
                      { value: 'guru', label: 'Guru' },
                      { value: 'siswa', label: 'Siswa' }
                    ]}
                  />
                  <Select 
                    label="Status"
                    value={advancedFilters.status}
                    onChange={(e) => setAdvancedFilters({...advancedFilters, status: e.target.value})}
                    options={[
                      { value: 'all', label: 'Semua Status' },
                      { value: 'active', label: 'Aktif' },
                      { value: 'inactive', label: 'Nonaktif' }
                    ]}
                  />
                  <Select 
                    label="Tingkat"
                    value={advancedFilters.class}
                    onChange={(e) => setAdvancedFilters({...advancedFilters, class: e.target.value})}
                    options={[
                      { value: 'all', label: 'Semua Tingkat' },
                      { value: 'X', label: 'Kelas X' },
                      { value: 'XI', label: 'Kelas XI' },
                      { value: 'XII', label: 'Kelas XII' }
                    ]}
                  />
                  <div className="flex items-end">
                    <Button 
                      variant="primary" 
                      className="w-full"
                      onClick={() => queryClient.invalidateQueries(['admin-users'])}
                    >
                      Terapkan Penyaring
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </RetroCard>
      </RetroSection>

      {/* 📋 USERS TABLE */}
      <RetroSection title="Pengguna Sistem" icon={Users}>
        <RetroTable 
          isLoading={isPending}
          data={users}
          columns={[
            {
              header: 'Pengguna',
              key: 'name',
              render: (name, user) => (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 retro-card bg-retro-orange/20 border-2 border-retro-orange flex items-center justify-center overflow-hidden">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <span className="font-black text-retro-orange text-lg">{name?.charAt(0)}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-retro-display font-black text-base-black text-sm leading-tight truncate">{name}</p>
                    <p className="font-retro-mono text-[10px] text-base-black/50 truncate">{user.email}</p>
                  </div>
                </div>
              )
            },
            {
              header: 'Peran',
              key: 'role',
              render: (role) => (
                <div className="flex flex-col gap-1">
                  <RetroTag 
                    label={role === 'admin' ? 'Admin' : role === 'guru' ? 'Guru' : 'Siswa'} 
                    color={role === 'admin' ? 'blue' : role === 'guru' ? 'purple' : 'orange'} 
                  />
                </div>
              )
            },
            {
              header: 'Identitas',
              key: 'profile',
              className: 'hidden lg:table-cell',
              render: (profile, user) => (
                <div className="space-y-1">
                  <p className="font-bold text-[10px]">
                    {user.role === 'siswa' ? `NIS: ${profile?.nis || user.nis || '-'}` : `NIP: ${profile?.nip || user.nip || '-'}`}
                  </p>
                  {user.role === 'siswa' && user.classes?.[0] && (
                    <p className="text-[9px] text-retro-blue font-black uppercase">
                      {user.classes[0].name}
                    </p>
                  )}
                </div>
              )
            },
            {
              header: 'Status',
              key: 'is_active',
              render: (active) => (
                <span className={twMerge(
                  "px-2 py-0.5 rounded-full text-[8px] font-black uppercase border-2",
                  active ? "bg-success/10 text-success border-success" : "bg-danger/10 text-danger border-danger"
                )}>
                  {active ? 'Aktif' : 'Nonaktif'}
                </span>
              )
            }
          ]}
          actions={(user) => (
            <TableActions 
              onView={() => openViewModal(user)}
              onReset={() => handleResetPassword(user.id)}
              onEdit={() => openEditModal(user)}
              onDelete={() => handleDelete(user.id)}
              onMore={() => (
                <>
                  <button className="w-full text-left px-3 py-2 text-[10px] font-retro-mono hover:bg-retro-yellow/20 rounded flex items-center gap-2 transition-colors"><UserPlus className="w-3.5 h-3.5" /> Masukkan Kelas</button>
                  <button className="w-full text-left px-3 py-2 text-[10px] font-retro-mono hover:bg-retro-yellow/20 rounded flex items-center gap-2 transition-colors"><MessageSquare className="w-3.5 h-3.5" /> Kirim Pesan</button>
                  <button className="w-full text-left px-3 py-2 text-[10px] font-retro-mono hover:bg-retro-yellow/20 rounded flex items-center gap-2 transition-colors"><History className="w-3.5 h-3.5" /> Lihat Log</button>
                </>
              )}
            />
          )}
          pagination={{
            ...meta,
            onPageChange: (p) => setPage(p)
          }}
        />
      </RetroSection>

      {/* ═══════════════════════════════════════════════════════════
          🎭 MODAL: CREATE / EDIT USER (EXPANDED)
          ═══════════════════════════════════════════════════════════ */}
      {(isCreateOpen || isEditOpen) && (
        <Modal isOpen={isCreateOpen || isEditOpen} onClose={() => { setIsCreateOpen(false); setIsEditOpen(false); }} title={isCreateOpen ? "✨ TAMBAH PENGGUNA BARU" : "✏️ UBAH PENGGUNA"} size="2xl">
          <form onSubmit={isCreateOpen ? handleCreateSubmit : handleEditSubmit} className="space-y-5">
            
            {/* Section 1: Basic Info */}
            <div className="space-y-4">
              <h3 className="retro-heading retro-heading-sm text-retro-blue flex items-center gap-2"><User className="w-5 h-5" /> INFORMASI DASAR</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <RetroInput label="Nama Lengkap" name="name" value={formData.name} onChange={setFormData} error={errors.name} required placeholder="Ahmad Rizki" icon={User} maxLength={100} />
                <RetroInput label="Email" name="email" type="email" value={formData.email} onChange={setFormData} error={errors.email} required placeholder="email@rpl.id" icon={Mail} />
              </div>
              {isCreateOpen && (
                <>
                  <RetroInput label="Kata Sandi" name="password" type="password" value={formData.password} onChange={setFormData} error={errors.password} required placeholder="Minimal 8 karakter" icon={Lock} helperText="ℹ️ Min 8 karakter, 1 huruf kapital, 1 angka" />
                  {/* Password Strength Indicator */}
                  {formData.password && (
                    <div className="space-y-1">
                      <div className="flex gap-1">
                        {[1,2,3,4].map(i => <div key={i} className={`h-1 flex-1 rounded-sm ${formData.password.length >= i*2 ? (formData.password.length >= 8 ? 'bg-success' : 'bg-warning') : 'bg-base-gray'}`} />)}
                      </div>
                      <p className="text-[9px] font-retro-mono text-base-black/50">Kata sandi {formData.password.length < 6 ? 'Lemah' : formData.password.length < 8 ? 'Sedang' : 'Kuat'}</p>
                    </div>
                  )}
                </>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <RetroSelect label="Peran" name="role" value={formData.role || 'siswa'} onChange={handleRoleChange} options={[{value:'siswa',label:'🎓 Siswa'},{value:'guru',label:'👨‍🏫 Guru'},{value:'admin',label:'🛡️ Admin'}]} error={errors.role} required disabled={isEditOpen} />
                <div className="flex items-center pt-6"><input type="checkbox" id="is_active" checked={formData.is_active !== false} onChange={(e) => setFormData({...formData, is_active: e.target.checked})} className="w-4 h-4 accent-retro-orange border-2 border-base-black" /><label htmlFor="is_active" className="ml-2 text-[10px] font-retro-mono text-base-black/70 cursor-pointer">Akun Aktif (dapat masuk)</label></div>
              </div>
            </div>

            {/* Section 2: Role-Specific Fields */}
            {formData.role === 'siswa' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4 p-4 retro-card bg-retro-blue/10 border-retro-blue">
                <h3 className="retro-heading retro-heading-sm text-retro-blue flex items-center gap-2">🎓 DATA SISWA <span className="text-[10px] font-retro-mono text-retro-blue/70 font-normal">(wajib)</span></h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <RetroInput label="NIS" name="nis" value={formData.nis} onChange={setFormData} error={errors.nis} required placeholder="20250001" helperText="Nomor Induk Siswa" maxLength={20} />
                  <RetroSelect label="Tingkat Kelas" name="class_level" value={formData.class_level || 'X'} onChange={(setter) => { setFormData(prev => { const ns = typeof setter === 'function' ? setter(prev) : setter; return { ...ns, class_id: '' }; }); }} options={[{value:'X',label:'Kelas X'},{value:'XI',label:'Kelas XI'},{value:'XII',label:'Kelas XII'}]} error={errors.class_level} required />
                  <RetroSelect label="Pilih Kelas" name="class_id" value={formData.class_id} onChange={setFormData} options={classes.filter(c => c.level === (formData.class_level || 'X')).map(c => ({ value: c.id, label: c.name }))} placeholder="— Pilih Kelas —" error={errors.class_id} helperText="Pilih kelas untuk pendaftaran" searchable />
                </div>
                {/* PKL Notice for Grade 12 */}
                {formData.class_level === 'XII' && (
                  <div className="p-3 retro-card bg-retro-pink/10 border-retro-pink"><p className="text-[10px] font-retro-mono text-retro-pink flex items-start gap-2">🎒 <span><strong>Siswa PKL:</strong> Siswa ini dapat melakukan absensi dari lokasi perusahaan yang disetujui. Atur lokasi PKL di Pengaturan.</span></p></div>
                )}
              </motion.div>
            )}

            {formData.role === 'guru' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4 p-4 retro-card bg-retro-purple/10 border-retro-purple">
                <h3 className="retro-heading retro-heading-sm text-retro-purple flex items-center gap-2">👨‍🏫 DATA GURU <span className="text-[10px] font-retro-mono text-retro-purple/70 font-normal">(wajib)</span></h3>
                <RetroInput label="NIP" name="nip" value={formData.nip} onChange={setFormData} error={errors.nip} required placeholder="198001012020011001" helperText="Nomor Induk Pegawai" maxLength={20} />
                <RetroSubjectMultiSelect label="Mata Pelajaran yang Diajar" value={formData.subjects} onChange={(v) => setFormData({...formData, subjects: v})} subjects={subjects} error={errors.subjects} required />
              </motion.div>
            )}

            {formData.role === 'admin' && (
              <div className="p-3 retro-card bg-retro-orange/10 border-retro-orange"><p className="text-[10px] font-retro-mono text-retro-orange flex items-start gap-2">⚠️ <span><strong>Admin</strong> hanya membutuhkan nama, email & kata sandi.</span></p></div>
            )}

            {/* Section 3: Optional Details (Collapsible) */}
            <details className="group">
              <summary className="cursor-pointer text-[10px] font-black uppercase tracking-wider text-base-black/50 hover:text-base-black flex items-center gap-2 list-none select-none py-2">
                <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
                Avatar & Detail Tambahan (Opsional)
              </summary>
              <div className="mt-4 space-y-4 pt-3 border-t-2 border-base-black/10">
                <RetroAvatarUpload value={formData.avatar_url} onChange={(file) => setFormData({...formData, avatar_url: file})} error={errors.avatar} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <RetroInput label="Telepon" name="phone" value={formData.phone} onChange={setFormData} error={errors.phone} placeholder="08123456789" icon={Phone} maxLength={20} />
                  <RetroInput label="Bio Singkat" name="bio" value={formData.bio} onChange={setFormData} error={errors.bio} placeholder="Ceritakan tentang diri Anda..." maxLength={500} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <RetroInput label="GitHub" name="github_url" value={formData.github_url} onChange={setFormData} error={errors.github_url} placeholder="https://github.com/username" icon={ExternalLink} />
                  <RetroInput label="LinkedIn" name="linkedin_url" value={formData.linkedin_url} onChange={setFormData} error={errors.linkedin_url} placeholder="https://linkedin.com/in/username" icon={ExternalLink} />
                </div>
              </div>
            </details>

            {/* Action Buttons */}
            <div className="pt-6 flex justify-end gap-3 border-t-4 border-base-black sticky bottom-0 bg-base-cream py-4 z-10 mt-6">
              <button 
                type="button" 
                onClick={() => { setIsCreateOpen(false); setIsEditOpen(false); }} 
                className="retro-btn retro-btn-outline"
              >
                BATAL
              </button>
              <button 
                type="submit" 
                className="retro-btn flex items-center gap-2" 
                disabled={createUserMutation.isPending || updateUserMutation.isPending}
              >
                {(createUserMutation.isPending || updateUserMutation.isPending) ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Rocket className="w-4 h-4" />
                )}
                {isCreateOpen ? 'TAMBAH PENGGUNA' : 'SIMPAN PERUBAHAN'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ═══════════════════════════════════════════════════════════
          👁️ MODAL: VIEW USER DETAIL (EXPANDED)
          ═══════════════════════════════════════════════════════════ */}
      {isViewOpen && selectedUser && (
        <Modal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} title="👤 PROFIL PENGGUNA" size="lg">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4 pb-4 border-b-4 border-base-black">
              <motion.div whileHover={{ scale: 1.05, rotate: 3 }} className="w-20 h-20 retro-card bg-retro-orange/20 border-retro-orange flex items-center justify-center">
                {selectedUser.avatar_url ? <img src={selectedUser.avatar_url} alt={selectedUser.name} className="w-full h-full rounded-retro-lg object-cover" /> : <User className="w-10 h-10 text-retro-orange" />}
              </motion.div>
              <div>
                <h3 className="retro-heading retro-heading-lg text-base-black">{selectedUser.name}</h3>
                <p className="font-retro-mono text-sm text-base-black/70">{selectedUser.email}</p>
                <div className="flex gap-2 mt-2">
                  <span className={`retro-badge text-[10px] ${selectedUser.role === 'admin' ? 'retro-badge-blue' : selectedUser.role === 'guru' ? 'retro-badge-green' : 'retro-badge-purple'}`}>{selectedUser.role === 'admin' ? 'Admin' : selectedUser.role === 'guru' ? 'Guru' : 'Siswa'}</span>
                  {selectedUser.is_active ? <span className="retro-badge retro-badge-green text-[10px]">Aktif</span> : <span className="retro-badge retro-badge-red text-[10px]">Nonaktif</span>}
                  {selectedUser.profile?.class_level === 'XII' && selectedUser.role === 'siswa' && <span className="retro-badge retro-badge-pink text-[10px] animate-pulse">PKL</span>}
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="retro-card p-3 text-center bg-retro-blue/10 border-retro-blue"><p className="text-2xl font-retro-display font-black text-retro-blue">{selectedUser.attendance_summary?.total || 0}</p><p className="text-[9px] font-retro-mono text-base-black/50">Kehadiran</p></div>
              <div className="retro-card p-3 text-center bg-retro-green/10 border-retro-green"><p className="text-2xl font-retro-display font-black text-retro-green">{selectedUser.attendance_summary?.rate || 0}%</p><p className="text-[9px] font-retro-mono text-base-black/50">Tingkat</p></div>
              <div className="retro-card p-3 text-center bg-retro-purple/10 border-retro-purple"><p className="text-2xl font-retro-display font-black text-retro-purple">{selectedUser.profile?.subjects?.length || 0}</p><p className="text-[9px] font-retro-mono text-base-black/50">{selectedUser.role === 'guru' ? 'Mata Pelajaran' : 'Kelas'}</p></div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <RetroDetailItem icon={Mail} label="Email" value={selectedUser.email} copyable />
                <RetroDetailItem icon={Phone} label="Telepon" value={selectedUser.phone || '-'} copyable />
                <RetroDetailItem icon={Calendar} label="Bergabung" value={new Date(selectedUser.created_at).toLocaleDateString('id-ID')} />
                <RetroDetailItem icon={Clock} label="Masuk Terakhir" value={selectedUser.last_login ? new Date(selectedUser.last_login).toLocaleString('id-ID') : 'Belum Pernah'} />
              </div>
              <div className="space-y-3">
                {selectedUser.role === 'siswa' && (<>
                  <RetroDetailItem label="NIS" value={selectedUser.profile?.nis || selectedUser.nis || '-'} copyable />
                  <RetroDetailItem label="Tingkat Kelas" value={selectedUser.profile?.class_level ? `Kelas ${selectedUser.profile.class_level}` : '-'} />
                  {selectedUser.classes?.[0] && <RetroDetailItem label="Kelas Terdaftar" value={selectedUser.classes[0].name} />}
                </>)}
                {selectedUser.role === 'guru' && (<>
                  <RetroDetailItem label="NIP" value={selectedUser.profile?.nip || selectedUser.nip || '-'} copyable />
                  <RetroDetailItem label="Mata Pelajaran" value={selectedUser.profile?.subjects?.map(s => `${s.code} ${s.name}`).join(', ') || '-'} multiline />
                </>)}
                {selectedUser.profile?.bio && <RetroDetailItem label="Bio" value={selectedUser.profile.bio} multiline />}
              </div>
            </div>

            {/* Social & Links */}
            {(selectedUser.profile?.github_url || selectedUser.profile?.linkedin_url) && (
              <div className="pt-4 border-t-2 border-base-black/10">
                <h4 className="text-[10px] font-black uppercase tracking-wider text-base-black/70 mb-3">Tautan Sosial</h4>
                <div className="flex gap-3">
                  {selectedUser.profile?.github_url && <a href={selectedUser.profile.github_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[10px] font-retro-mono text-base-black/70 hover:text-retro-orange transition-colors"><ExternalLink className="w-4 h-4" /> GitHub</a>}
                  {selectedUser.profile?.linkedin_url && <a href={selectedUser.profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[10px] font-retro-mono text-base-black/70 hover:text-retro-blue transition-colors"><ExternalLink className="w-4 h-4" /> LinkedIn</a>}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="pt-4 border-t-4 border-base-black flex justify-end gap-2">
              <button onClick={() => { setIsViewOpen(false); openEditModal(selectedUser); }} className="retro-btn retro-btn-outline"><Edit2 className="w-4 h-4 mr-1" /> Ubah</button>
              <button onClick={() => { setIsViewOpen(false); handleResetPassword(selectedUser.id); }} className="retro-btn retro-btn-outline"><KeyRound className="w-4 h-4 mr-1" /> Reset PW</button>
              <button onClick={() => { setIsViewOpen(false); handleDelete(selectedUser.id); }} className="retro-btn bg-danger hover:bg-danger/90 text-base-white"><Trash2 className="w-4 h-4 mr-1" /> Hapus</button>
            </div>
          </div>
        </Modal>
      )}

      {/* ═══════════════════════════════════════════════════════════
          📥 MODAL: IMPORT USERS (NEW FEATURE)
          ═══════════════════════════════════════════════════════════ */}
      {isImportOpen && (
        <Modal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} title="📥 IMPOR PENGGUNA" size="md">
          <div className="space-y-4">
            <p className="font-retro-mono text-[10px] text-base-black/70">Unggah file CSV dengan kolom: name, email, role, phone, nis/nip (opsional)</p>
            <div className="retro-card p-6 border-4 border-dashed border-base-black/30 text-center">
              <Upload className="w-12 h-12 text-base-black/30 mx-auto mb-3" />
              <p className="font-retro-mono text-[10px] text-base-black/50 mb-3">Tarik & lepas atau klik untuk mencari</p>
              <input type="file" accept=".csv" onChange={(e) => e.target.files?.[0] && handleImport(e.target.files[0])} className="hidden" id="import-file" />
              <label htmlFor="import-file" className="retro-btn retro-btn-sm cursor-pointer">Pilih File CSV</label>
            </div>
            <div className="retro-card bg-base-gray/20 p-3"><p className="text-[9px] font-retro-mono text-base-black/50">📋 <strong>Format CSV:</strong><br/>name,email,role,phone,nis<br/>Ahmad,email@test.com,siswa,08123456789,20250001</p></div>
            <div className="flex justify-end gap-2"><button onClick={() => setIsImportOpen(false)} className="retro-btn retro-btn-outline">Batal</button><button disabled className="retro-btn" title="Pilih file terlebih dahulu">Impor</button></div>
          </div>
        </Modal>
      )}

      {/* Confirmation Modals */}
      <RetroConfirmModal isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={confirmDeleteAction} title="Hapus Pengguna?" message="Apakah Anda yakin ingin menghapus pengguna ini? Tindakan ini tidak dapat dibatalkan." details={confirmDelete ? `Pengguna: ${users.find(u => u.id === confirmDelete)?.name}` : ''} />
      <RetroConfirmModal isOpen={!!confirmBulkAction} onClose={() => setConfirmBulkAction(null)} onConfirm={confirmBulkActionExecute} title={`${confirmBulkAction?.action === 'delete' ? 'Hapus' : confirmBulkAction?.action === 'activate' ? 'Aktifkan' : 'Nonaktifkan'} ${confirmBulkAction?.count} Pengguna?`} message={`Apakah Anda yakin ingin melakukan ${confirmBulkAction?.action === 'delete' ? 'penghapusan' : confirmBulkAction?.action === 'activate' ? 'pengaktifan' : 'penonaktifan'} pada ${confirmBulkAction?.count} pengguna terpilih?`} variant={confirmBulkAction?.action === 'delete' ? 'danger' : 'warning'} />

      {/* Floating Action Button */}
      <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => { setFormData({role:'siswa',is_active:true,class_level:'X'}); setIsCreateOpen(true); }} className="fixed bottom-6 right-6 z-50 retro-btn retro-btn-lg retro-btn-sticker hidden md:flex items-center gap-2"><Plus className="w-5 h-5" /><span className="hidden lg:inline">Tambah Pengguna</span></motion.button>

      {/* Decorative Footer Stickers */}
      <div className="fixed bottom-4 left-4 z-0 hidden lg:block pointer-events-none"><motion.div animate={{ rotate: [0, -10, 10, -5, 5, 0] }} transition={{ duration: 3, repeat: Infinity }} className="retro-sticker bg-retro-pink text-base-white text-[10px] px-3 py-1">POWERED BY RPL</motion.div></div>
      <div className="fixed bottom-4 right-4 z-0 hidden lg:block pointer-events-none"><motion.div animate={{ rotate: [0, 10, -10, 5, -5, 0] }} transition={{ duration: 3, repeat: Infinity, delay: 1 }} className="retro-sticker bg-retro-lime text-base-black text-[10px] px-3 py-1">v2.0 RETRO ✨</motion.div></div>
      
      {/* Keyboard Shortcuts Hint */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-0 hidden lg:block pointer-events-none"><p className="text-[9px] font-retro-mono text-base-black/30">🎮 Pintasan: Ctrl+N (Baru), Ctrl+E (Ubah), Del (Hapus), Esc (Tutup)</p></div>
    </motion.div>
  );
}