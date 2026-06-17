import { useState, useCallback } from 'react';

export function useScheduleUI() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [toast, setToast] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const openEditModal = useCallback((schedule) => {
    setSelectedSchedule(schedule);
    setIsEditOpen(true);
  }, []);

  const openViewModal = useCallback((schedule) => {
    setSelectedSchedule(schedule);
    setIsViewOpen(true);
  }, []);

  const closeModals = useCallback(() => {
    setIsCreateOpen(false);
    setIsEditOpen(false);
    setIsViewOpen(false);
    setSelectedSchedule(null);
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
    selectedSchedule,
    setSelectedSchedule,
    selectedIds,
    setSelectedIds,
    confirmDelete,
    setConfirmDelete,
    confirmBulkDelete,
    setConfirmBulkDelete,
    toast,
    setToast,
    sidebarOpen,
    setSidebarOpen,
    showToast,
    openEditModal,
    openViewModal,
    closeModals,
    toggleSelect,
    toggleSelectAll,
  };
}
