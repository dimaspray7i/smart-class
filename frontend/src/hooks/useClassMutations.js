import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../../api';
import { createErrorToast } from '../utils/errorHandler';

export function useClassMutations(callbacks = {}) {
  const queryClient = useQueryClient();

  const createClassMutation = useMutation({
    mutationFn: (classData) => adminAPI.createClass(classData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-classes'] });
      callbacks.onCreate?.();
    },
    onError: (err) => {
      const errorToast = createErrorToast(err, 'ClassMutations');
      callbacks.onError?.(err, errorToast);
    },
  });

  const updateClassMutation = useMutation({
    mutationFn: ({ id, ...classData }) => adminAPI.updateClass(id, classData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-classes'] });
      callbacks.onUpdate?.();
    },
    onError: (err) => {
      const errorToast = createErrorToast(err, 'ClassMutations');
      callbacks.onError?.(err, errorToast);
    },
  });

  const deleteClassMutation = useMutation({
    mutationFn: (id) => adminAPI.deleteClass(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-classes'] });
      callbacks.onDelete?.();
    },
    onError: (err) => {
      const errorToast = createErrorToast(err, 'ClassMutations');
      callbacks.onError?.(err, errorToast);
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids) => adminAPI.bulkDeleteClasses(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-classes'] });
      callbacks.onBulkDelete?.();
    },
    onError: (err) => {
      const errorToast = createErrorToast(err, 'ClassMutations');
      callbacks.onError?.(err, errorToast);
    },
  });

  return {
    createClassMutation,
    updateClassMutation,
    deleteClassMutation,
    bulkDeleteMutation,
  };
}
