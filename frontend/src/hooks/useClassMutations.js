import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../../api';

export function useClassMutations(callbacks = {}) {
  const queryClient = useQueryClient();

  const createClassMutation = useMutation({
    mutationFn: (classData) => adminAPI.createClass(classData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-classes'] });
      callbacks.onCreate?.();
    },
    onError: (err) => callbacks.onError?.(err),
  });

  const updateClassMutation = useMutation({
    mutationFn: ({ id, ...classData }) => adminAPI.updateClass(id, classData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-classes'] });
      callbacks.onUpdate?.();
    },
    onError: (err) => callbacks.onError?.(err),
  });

  const deleteClassMutation = useMutation({
    mutationFn: (id) => adminAPI.deleteClass(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-classes'] });
      callbacks.onDelete?.();
    },
    onError: (err) => callbacks.onError?.(err),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids) => adminAPI.bulkDeleteClasses(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-classes'] });
      callbacks.onBulkDelete?.();
    },
    onError: (err) => callbacks.onError?.(err),
  });

  return {
    createClassMutation,
    updateClassMutation,
    deleteClassMutation,
    bulkDeleteMutation,
  };
}
