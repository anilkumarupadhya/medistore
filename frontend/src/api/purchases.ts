import api from './axiosInstance';
import type {
  PurchaseOrderForm, PurchaseFilters, PurchaseListResponse,
  PurchaseOrder, PurchaseSummary, GRNForm,
} from '../types/purchase';

export const purchasesApi = {
  list: (filters: PurchaseFilters = {}) =>
    api.get<{ success: boolean; data: PurchaseListResponse }>('/purchases/', { params: filters })
       .then(r => r.data.data),

  get: (id: string) =>
    api.get<{ success: boolean; data: PurchaseOrder }>(`/purchases/${id}/`)
       .then(r => r.data.data),

  create: (data: PurchaseOrderForm) =>
    api.post<{ success: boolean; data: PurchaseOrder }>('/purchases/', data)
       .then(r => r.data.data),

  update: (id: string, data: Partial<PurchaseOrderForm>) =>
    api.patch<{ success: boolean; data: PurchaseOrder }>(`/purchases/${id}/`, data)
       .then(r => r.data.data),

  cancel: (id: string) =>
    api.delete(`/purchases/${id}/`).then(r => r.data),

  receive: (id: string, data: GRNForm) =>
    api.post<{ success: boolean; data: PurchaseOrder }>(`/purchases/${id}/receive/`, data)
       .then(r => r.data.data),

  summary: () =>
    api.get<{ success: boolean; data: PurchaseSummary }>('/purchases/summary/')
       .then(r => r.data.data),
};
