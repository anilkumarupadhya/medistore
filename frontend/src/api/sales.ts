import axiosInstance from './axiosInstance';
import type { Sale, SaleForm, SaleListResponse, SaleSummary, SaleFilters } from '../types/sale';

export const salesApi = {
  list: (filters: SaleFilters = {}) =>
    axiosInstance.get<{ success: boolean; data: SaleListResponse }>('/sales/', { params: filters })
      .then(r => r.data.data),

  get: (id: string) =>
    axiosInstance.get<{ success: boolean; data: Sale }>(`/sales/${id}/`)
      .then(r => r.data.data),

  create: (data: Omit<SaleForm, 'items'> & { items: { medicine_id: string; quantity: number; unit_price?: number; discount_pct: number }[] }) =>
    axiosInstance.post<{ success: boolean; data: Sale }>('/sales/', data)
      .then(r => r.data.data),

  summary: () =>
    axiosInstance.get<{ success: boolean; data: SaleSummary }>('/sales/summary/')
      .then(r => r.data.data),
};
