import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { inventoryApi } from '../api/inventory';
import type { StockTransactionForm } from '../types/inventory';

export const INVENTORY_KEYS = {
  all:        ['inventory'] as const,
  list:       (filters: object) => ['inventory', 'list', filters] as const,
  summary:    ['inventory', 'summary'] as const,
  history:    (medicineId: string) => ['inventory', 'history', medicineId] as const,
};

export function useInventoryList(filters: object = {}) {
  return useQuery({
    queryKey: INVENTORY_KEYS.list(filters),
    queryFn:  () => inventoryApi.list(filters).then(r => r.data),
    staleTime: 30_000,
  });
}

export function useInventorySummary() {
  return useQuery({
    queryKey: INVENTORY_KEYS.summary,
    queryFn:  () => inventoryApi.summary().then(r => r.data.data),
    staleTime: 60_000,
  });
}

export function useMedicineHistory(medicineId: string) {
  return useQuery({
    queryKey: INVENTORY_KEYS.history(medicineId),
    queryFn:  () => inventoryApi.medicineHistory(medicineId).then(r => r.data),
    enabled:  !!medicineId,
  });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  return useMutation({
    mutationFn: (data: StockTransactionForm) => inventoryApi.create(data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: INVENTORY_KEYS.all });
      qc.invalidateQueries({ queryKey: ['medicines'] });
      const tx = (res.data as any).data;
      enqueueSnackbar(
        `${tx.tx_type.replace('_', ' ')} recorded: ${tx.quantity} units of ${tx.medicine_name}.`,
        { variant: 'success' }
      );
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error?.message ?? 'Transaction failed.';
      enqueueSnackbar(msg, { variant: 'error' });
    },
  });
}
