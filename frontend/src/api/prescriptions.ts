import api from './axiosInstance';
import type { PrescriptionFilters, PrescriptionFormValues } from '../types/prescription';

export const prescriptionsApi = {
  list: (params: PrescriptionFilters = {}) =>
    api.get('/prescriptions/', { params }).then(r => r.data.data),

  get: (id: string) =>
    api.get(`/prescriptions/${id}/`).then(r => r.data.data),

  create: (data: PrescriptionFormValues) =>
    api.post('/prescriptions/', data).then(r => r.data.data),

  update: (id: string, data: Partial<PrescriptionFormValues>) =>
    api.put(`/prescriptions/${id}/`, data).then(r => r.data.data),

  remove: (id: string) =>
    api.delete(`/prescriptions/${id}/`).then(r => r.data),
};
