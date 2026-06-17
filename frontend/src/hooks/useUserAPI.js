import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../../api';
import { createErrorToast } from '../utils/errorHandler';

export function useUserMutations(callbacks = {}) {
  const queryClient = useQueryClient();

  const createUserMutation = useMutation({
    mutationFn: (userData) => adminAPI.createUser(userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      callbacks.onCreate?.();
    },
    onError: (err) => {
      const errorToast = createErrorToast(err, 'UserAPI');
      callbacks.onError?.(err, errorToast);
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, ...userData }) => adminAPI.updateUser(id, userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      callbacks.onUpdate?.();
    },
    onError: (err) => {
      const errorToast = createErrorToast(err, 'UserAPI');
      callbacks.onError?.(err, errorToast);
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id) => adminAPI.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      callbacks.onDelete?.();
    },
    onError: (err) => {
      const errorToast = createErrorToast(err, 'UserAPI');
      callbacks.onError?.(err, errorToast);
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids) => adminAPI.bulkDeleteUsers(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      callbacks.onBulkDelete?.();
    },
    onError: (err) => {
      const errorToast = createErrorToast(err, 'UserAPI');
      callbacks.onError?.(err, errorToast);
    },
  });

  return {
    createUserMutation,
    updateUserMutation,
    deleteUserMutation,
    bulkDeleteMutation,
  };
}
