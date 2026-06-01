import axiosInstance from './axiosInstance';
import type { Customer, CustomerFormValues, CustomerListResponse, CustomerFilters } from '../types/customer';

export const customersApi = {
  list: (filters: CustomerFilters = {}) =>
    axiosInstance.get<{ success: boolean; data: CustomerListResponse }>('/customers/', { params: filters })
      .then(r => r.data.data),

  get: (id: string) =>
    axiosInstance.get<{ success: boolean; data: Customer }>(`/customers/${id}/`)
      .then(r => r.data.data),

  create: (data: Partial<CustomerFormValues>) =>
    axiosInstance.post<{ success: boolean; data: Customer }>('/customers/', data)
      .then(r => r.data.data),

  update: (id: string, data: Partial<CustomerFormValues>) =>
    axiosInstance.put<{ success: boolean; data: Customer }>(`/customers/${id}/`, data)
      .then(r => r.data.data),
};
