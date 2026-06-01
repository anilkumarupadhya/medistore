import api from './axiosInstance';
import type { SupplierFormValues, SupplierFilters, SupplierListResponse, Supplier } from '../types/supplier';

export const suppliersApi = {
  list: (filters: SupplierFilters = {}) =>
    api.get<{ success: boolean; data: SupplierListResponse }>('/suppliers/', { params: filters })
       .then(r => r.data.data),

  get: (id: string) =>
    api.get<{ success: boolean; data: Supplier }>(`/suppliers/${id}/`)
       .then(r => r.data.data),

  create: (data: SupplierFormValues) =>
    api.post<{ success: boolean; data: Supplier }>('/suppliers/', data)
       .then(r => r.data.data),

  update: (id: string, data: Partial<SupplierFormValues>) =>
    api.patch<{ success: boolean; data: Supplier }>(`/suppliers/${id}/`, data)
       .then(r => r.data.data),

  deactivate: (id: string) =>
    api.delete(`/suppliers/${id}/`).then(r => r.data),
};
