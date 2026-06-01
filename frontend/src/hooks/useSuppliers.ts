import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { suppliersApi } from '../api/suppliers';
import type { SupplierFilters, SupplierFormValues } from '../types/supplier';
import { useSnackbar } from 'notistack';

const KEYS = {
  list:   (f: SupplierFilters) => ['suppliers', f] as const,
  detail: (id: string)         => ['suppliers', id] as const,
};

export const useSupplierList = (filters: SupplierFilters = {}) =>
  useQuery({ queryKey: KEYS.list(filters), queryFn: () => suppliersApi.list(filters) });

export const useSupplier = (id: string) =>
  useQuery({ queryKey: KEYS.detail(id), queryFn: () => suppliersApi.get(id), enabled: !!id });

export const useCreateSupplier = () => {
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  return useMutation({
    mutationFn: (data: SupplierFormValues) => suppliersApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['suppliers'] });
      enqueueSnackbar('Supplier created successfully', { variant: 'success' });
    },
    onError: () => enqueueSnackbar('Failed to create supplier', { variant: 'error' }),
  });
};

export const useUpdateSupplier = () => {
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SupplierFormValues> }) =>
      suppliersApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['suppliers'] });
      enqueueSnackbar('Supplier updated successfully', { variant: 'success' });
    },
    onError: () => enqueueSnackbar('Failed to update supplier', { variant: 'error' }),
  });
};

export const useDeactivateSupplier = () => {
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  return useMutation({
    mutationFn: (id: string) => suppliersApi.deactivate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['suppliers'] });
      enqueueSnackbar('Supplier deactivated', { variant: 'info' });
    },
  });
};
