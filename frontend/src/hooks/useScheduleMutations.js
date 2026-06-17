import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../../api';

export function useScheduleMutations(onSuccess) {
  const queryClient = useQueryClient();

  const createScheduleMutation = useMutation({
    mutationFn: (newSchedule) => adminAPI.createSchedule(newSchedule),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-schedules'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
      onSuccess.onCreate?.();
    },
    onError: (err) => onSuccess.onError?.(err),
  });

  const updateScheduleMutation = useMutation({
    mutationFn: ({ id, ...updatedData }) => adminAPI.updateSchedule(id, updatedData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-schedules'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
      onSuccess.onUpdate?.();
    },
    onError: (err) => onSuccess.onError?.(err),
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: (id) => adminAPI.deleteSchedule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-schedules'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
      onSuccess.onDelete?.();
    },
    onError: (err) => onSuccess.onError?.(err),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids) => adminAPI.bulkDeleteSchedules(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-schedules'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
      onSuccess.onBulkDelete?.();
    },
    onError: (err) => onSuccess.onError?.(err),
  });

  const exportSchedulesMutation = useMutation({
    mutationFn: (filters) => adminAPI.exportSchedules('csv', filters),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `schedules-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      onSuccess.onExport?.();
    },
    onError: (err) => onSuccess.onError?.(err),
  });

  return {
    createScheduleMutation,
    updateScheduleMutation,
    deleteScheduleMutation,
    bulkDeleteMutation,
    exportSchedulesMutation,
  };
}
