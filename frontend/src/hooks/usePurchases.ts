import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { purchasesApi } from '../api/purchases';
import type { PurchaseFilters, PurchaseOrderForm, GRNForm } from '../types/purchase';
import { useSnackbar } from 'notistack';

const KEYS = {
  list:    (f: PurchaseFilters) => ['purchases', f] as const,
  detail:  (id: string)         => ['purchases', id] as const,
  summary: ()                   => ['purchases', 'summary'] as const,
};

export const usePurchaseList = (filters: PurchaseFilters = {}) =>
  useQuery({ queryKey: KEYS.list(filters), queryFn: () => purchasesApi.list(filters) });

export const usePurchase = (id: string) =>
  useQuery({ queryKey: KEYS.detail(id), queryFn: () => purchasesApi.get(id), enabled: !!id });

export const usePurchaseSummary = () =>
  useQuery({ queryKey: KEYS.summary(), queryFn: () => purchasesApi.summary() });

export const useCreatePurchase = () => {
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  return useMutation({
    mutationFn: (data: PurchaseOrderForm) => purchasesApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchases'] });
      enqueueSnackbar('Purchase order created', { variant: 'success' });
    },
    onError: () => enqueueSnackbar('Failed to create purchase order', { variant: 'error' }),
  });
};

export const useReceivePurchase = () => {
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: GRNForm }) => purchasesApi.receive(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchases'] });
      qc.invalidateQueries({ queryKey: ['medicines'] });
      qc.invalidateQueries({ queryKey: ['inventory'] });
      enqueueSnackbar('Stock received successfully (GRN posted)', { variant: 'success' });
    },
    onError: () => enqueueSnackbar('Failed to receive stock', { variant: 'error' }),
  });
};

export const useCancelPurchase = () => {
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  return useMutation({
    mutationFn: (id: string) => purchasesApi.cancel(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchases'] });
      enqueueSnackbar('Purchase order cancelled', { variant: 'info' });
    },
  });
};
