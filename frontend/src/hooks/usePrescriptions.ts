import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { prescriptionsApi } from '../api/prescriptions';
import type { PrescriptionFilters, PrescriptionFormValues } from '../types/prescription';

export const usePrescriptionList = (filters: PrescriptionFilters = {}) =>
  useQuery({
    queryKey: ['prescriptions', filters],
    queryFn: () => prescriptionsApi.list(filters),
  });

export const usePrescription = (id: string | null) =>
  useQuery({
    queryKey: ['prescription', id],
    queryFn: () => prescriptionsApi.get(id!),
    enabled: !!id,
  });

export const useCreatePrescription = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: PrescriptionFormValues) => prescriptionsApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['prescriptions'] }),
  });
};

export const useUpdatePrescription = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PrescriptionFormValues> }) =>
      prescriptionsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['prescriptions'] });
      qc.invalidateQueries({ queryKey: ['prescription'] });
    },
  });
};

export const useDeletePrescription = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => prescriptionsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['prescriptions'] }),
  });
};
