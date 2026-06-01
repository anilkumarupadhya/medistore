import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { medicinesApi } from '../api/medicines';
import type { MedicineFilters, MedicineFormValues } from '../types/medicine';

export const MEDICINE_KEYS = {
  all:     ['medicines'] as const,
  list:    (filters: MedicineFilters) => ['medicines', 'list', filters] as const,
  detail:  (id: string) => ['medicines', 'detail', id] as const,
  lowStock: ['medicines', 'low-stock'] as const,
  expiring: (days: number) => ['medicines', 'expiring', days] as const,
};

export function useMedicineList(filters: MedicineFilters) {
  return useQuery({
    queryKey:  MEDICINE_KEYS.list(filters),
    queryFn:   () => medicinesApi.list(filters).then(r => r.data),
    staleTime: 60_000,
  });
}

export function useMedicine(id: string) {
  return useQuery({
    queryKey: MEDICINE_KEYS.detail(id),
    queryFn:  () => medicinesApi.get(id).then(r => r.data.data),
    enabled:  !!id,
  });
}

export function useLowStockMedicines() {
  return useQuery({
    queryKey: MEDICINE_KEYS.lowStock,
    queryFn:  () => medicinesApi.lowStock().then(r => r.data),
    staleTime: 2 * 60_000,
  });
}

export function useExpiringMedicines(days = 30) {
  return useQuery({
    queryKey: MEDICINE_KEYS.expiring(days),
    queryFn:  () => medicinesApi.expiring(days).then(r => r.data),
    staleTime: 5 * 60_000,
  });
}

export function useCreateMedicine() {
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  return useMutation({
    mutationFn: (data: Partial<MedicineFormValues>) => medicinesApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: MEDICINE_KEYS.all });
      enqueueSnackbar('Medicine added successfully.', { variant: 'success' });
    },
    onError: () => enqueueSnackbar('Failed to add medicine.', { variant: 'error' }),
  });
}

export function useUpdateMedicine() {
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<MedicineFormValues> }) =>
      medicinesApi.update(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: MEDICINE_KEYS.all });
      qc.invalidateQueries({ queryKey: MEDICINE_KEYS.detail(id) });
      enqueueSnackbar('Medicine updated successfully.', { variant: 'success' });
    },
    onError: () => enqueueSnackbar('Failed to update medicine.', { variant: 'error' }),
  });
}

export function useDeleteMedicine() {
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  return useMutation({
    mutationFn: (id: string) => medicinesApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: MEDICINE_KEYS.all });
      enqueueSnackbar('Medicine deactivated.', { variant: 'info' });
    },
    onError: () => enqueueSnackbar('Failed to deactivate medicine.', { variant: 'error' }),
  });
}

export function useBulkImport() {
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  return useMutation({
    mutationFn: (file: File) => medicinesApi.bulkImport(file),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: MEDICINE_KEYS.all });
      const d = res.data as any;
      enqueueSnackbar(
        `Import complete: ${d.created} created, ${d.skipped} skipped, ${d.errors} errors.`,
        { variant: d.errors > 0 ? 'warning' : 'success' }
      );
    },
    onError: () => enqueueSnackbar('Bulk import failed.', { variant: 'error' }),
  });
}
