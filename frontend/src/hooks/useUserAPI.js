import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../../api';

export function useUserMutations(callbacks = {}) {
  const queryClient = useQueryClient();

  const createUserMutation = useMutation({
    mutationFn: (userData) => adminAPI.createUser(userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      callbacks.onCreate?.();
    },
    onError: (err) => callbacks.onError?.(err),
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, ...userData }) => adminAPI.updateUser(id, userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      callbacks.onUpdate?.();
    },
    onError: (err) => callbacks.onError?.(err),
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id) => adminAPI.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      callbacks.onDelete?.();
    },
    onError: (err) => callbacks.onError?.(err),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids) => adminAPI.bulkDeleteUsers(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      callbacks.onBulkDelete?.();
    },
    onError: (err) => callbacks.onError?.(err),
  });

  return {
    createUserMutation,
    updateUserMutation,
    deleteUserMutation,
    bulkDeleteMutation,
  };
}
