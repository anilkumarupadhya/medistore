import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { usersApi } from '../api/users';
import type { UserListParams, UserCreatePayload, UserUpdatePayload } from '../api/users';

export const useUserList = (params: UserListParams = {}) =>
  useQuery({
    queryKey: ['users', params],
    queryFn: () => usersApi.list(params),
  });

export const useCreateUser = () => {
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  return useMutation({
    mutationFn: (data: UserCreatePayload) => usersApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      enqueueSnackbar('User created successfully', { variant: 'success' });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error?.message ?? 'Failed to create user';
      enqueueSnackbar(msg, { variant: 'error' });
    },
  });
};

export const useUpdateUser = () => {
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UserUpdatePayload }) =>
      usersApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      enqueueSnackbar('User updated successfully', { variant: 'success' });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error?.message ?? 'Failed to update user';
      enqueueSnackbar(msg, { variant: 'error' });
    },
  });
};

export const useDeactivateUser = () => {
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  return useMutation({
    mutationFn: (id: string) => usersApi.deactivate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      enqueueSnackbar('User deactivated', { variant: 'success' });
    },
    onError: () => enqueueSnackbar('Failed to deactivate user', { variant: 'error' }),
  });
};

export const useAuditLogs = (params: { page?: number; page_size?: number; search?: string; action?: string } = {}) =>
  useQuery({
    queryKey: ['audit-logs', params],
    queryFn: () => usersApi.auditLogs(params),
  });
