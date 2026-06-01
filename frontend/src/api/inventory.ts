import axiosInstance from './axiosInstance';
import type { InventoryTransaction, StockTransactionForm, InventorySummary } from '../types/inventory';

interface TransactionListResponse {
  count: number; total_pages: number; current_page: number;
  next: string | null; previous: string | null;
  results: InventoryTransaction[];
}

interface TransactionFilters {
  tx_type?: string;
  medicine_id?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  page_size?: number;
}

export const inventoryApi = {
  list: (filters: TransactionFilters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== '') params.append(k, String(v));
    });
    return axiosInstance.get<TransactionListResponse>(`/inventory/transactions/?${params}`);
  },

  get: (id: number) =>
    axiosInstance.get<{ success: boolean; data: InventoryTransaction }>(`/inventory/transactions/${id}/`),

  create: (data: StockTransactionForm) =>
    axiosInstance.post<{ success: boolean; data: InventoryTransaction }>('/inventory/transactions/', data),

  medicineHistory: (medicineId: string, page = 1) =>
    axiosInstance.get(`/inventory/medicine/${medicineId}/history/?page=${page}`),

  summary: () =>
    axiosInstance.get<{ success: boolean; data: InventorySummary }>('/inventory/summary/'),
};
