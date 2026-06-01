import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { customersApi } from '../api/customers';
import type { CustomerFormValues, CustomerFilters } from '../types/customer';

const KEYS = {
  list:   (f: CustomerFilters) => ['customers', f] as const,
  detail: (id: string)         => ['customers', id] as const,
};

export const useCustomerList = (filters: CustomerFilters = {}) =>
  useQuery({ queryKey: KEYS.list(filters), queryFn: () => customersApi.list(filters) });

export const useCustomer = (id: string) =>
  useQuery({ queryKey: KEYS.detail(id), queryFn: () => customersApi.get(id), enabled: !!id });

export const useCreateCustomer = () => {
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  return useMutation({
    mutationFn: (data: Partial<CustomerFormValues>) => customersApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      enqueueSnackbar('Customer created successfully', { variant: 'success' });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error?.message ?? 'Failed to create customer';
      enqueueSnackbar(msg, { variant: 'error' });
    },
  });
};

export const useUpdateCustomer = () => {
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CustomerFormValues> }) =>
      customersApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      enqueueSnackbar('Customer updated successfully', { variant: 'success' });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error?.message ?? 'Failed to update customer';
      enqueueSnackbar(msg, { variant: 'error' });
    },
  });
};
