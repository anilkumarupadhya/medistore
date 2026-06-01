import axiosInstance from './axiosInstance';
import type { Medicine, MedicineFormValues, MedicineListResponse, MedicineFilters } from '../types/medicine';

export const medicinesApi = {
  list: (filters: MedicineFilters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== '' && v !== null) params.append(k, String(v));
    });
    return axiosInstance.get<MedicineListResponse>(`/medicines/?${params}`);
  },

  get: (id: string) =>
    axiosInstance.get<{ success: boolean; data: Medicine }>(`/medicines/${id}/`),

  create: (data: Partial<MedicineFormValues>) =>
    axiosInstance.post<{ success: boolean; data: Medicine }>('/medicines/', data)
      .then(r => r.data.data),

  update: (id: string, data: Partial<MedicineFormValues>) =>
    axiosInstance.put<{ success: boolean; data: Medicine }>(`/medicines/${id}/`, data),

  patch: (id: string, data: Partial<MedicineFormValues>) =>
    axiosInstance.patch<{ success: boolean; data: Medicine }>(`/medicines/${id}/`, data),

  delete: (id: string) =>
    axiosInstance.delete(`/medicines/${id}/`),

  lowStock: (page = 1) =>
    axiosInstance.get<MedicineListResponse>(`/medicines/low-stock/?page=${page}`),

  expiring: (days = 30, page = 1) =>
    axiosInstance.get<MedicineListResponse>(`/medicines/expiring/?days=${days}&page=${page}`),

  barcodeSearch: (barcode: string) =>
    axiosInstance.get<{ success: boolean; data: Medicine }>(`/medicines/barcode/${barcode}/`),

  bulkImport: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return axiosInstance.post('/medicines/bulk-import/', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
