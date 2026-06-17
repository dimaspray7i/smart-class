import { useState, useCallback } from 'react';

export function useUserUI() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const openEditModal = useCallback((user) => {
    setSelectedUser(user);
    setIsEditOpen(true);
  }, []);

  const openViewModal = useCallback((user) => {
    setSelectedUser(user);
    setIsViewOpen(true);
  }, []);

  const closeModals = useCallback(() => {
    setIsCreateOpen(false);
    setIsEditOpen(false);
    setIsViewOpen(false);
    setSelectedUser(null);
  }, []);

  const toggleSelect = useCallback((id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  }, []);

  const toggleSelectAll = useCallback((allIds) => {
    setSelectedIds(prev => prev.length === allIds.length ? [] : allIds);
  }, []);

  return {
    isCreateOpen,
    setIsCreateOpen,
    isEditOpen,
    setIsEditOpen,
    isViewOpen,
    setIsViewOpen,
    selectedUser,
    setSelectedUser,
    selectedIds,
    setSelectedIds,
    confirmDelete,
    setConfirmDelete,
    confirmBulkDelete,
    setConfirmBulkDelete,
    toast,
    setToast,
    showToast,
    openEditModal,
    openViewModal,
    closeModals,
    toggleSelect,
    toggleSelectAll,
  };
}
