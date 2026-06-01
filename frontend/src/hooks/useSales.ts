import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { salesApi } from '../api/sales';
import type { SaleFilters } from '../types/sale';

const KEYS = {
  list:    (f: SaleFilters) => ['sales', f] as const,
  detail:  (id: string)     => ['sales', id] as const,
  summary: ()               => ['sales', 'summary'] as const,
};

export const useSaleList = (filters: SaleFilters = {}) =>
  useQuery({ queryKey: KEYS.list(filters), queryFn: () => salesApi.list(filters) });

export const useSale = (id: string) =>
  useQuery({ queryKey: KEYS.detail(id), queryFn: () => salesApi.get(id), enabled: !!id });

export const useSaleSummary = () =>
  useQuery({ queryKey: KEYS.summary(), queryFn: () => salesApi.summary(), staleTime: 30_000 });

export const useCreateSale = () => {
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  return useMutation({
    mutationFn: salesApi.create,
    onSuccess: (sale) => {
      qc.invalidateQueries({ queryKey: ['sales'] });
      qc.invalidateQueries({ queryKey: ['medicines'] });
      qc.invalidateQueries({ queryKey: ['inventory'] });
      enqueueSnackbar(`Invoice ${sale.invoice_number} created successfully`, { variant: 'success' });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error?.message ?? 'Failed to create sale';
      enqueueSnackbar(msg, { variant: 'error' });
    },
  });
};
