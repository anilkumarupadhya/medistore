import api from './axiosInstance';
import type { ReportFilters } from '../types/report';

export const reportsApi = {
  sales: (params: ReportFilters = {}) =>
    api.get('/reports/sales/', { params }).then(r => r.data.data),

  inventory: () =>
    api.get('/reports/inventory/').then(r => r.data.data),

  purchases: (params: ReportFilters = {}) =>
    api.get('/reports/purchases/', { params }).then(r => r.data.data),
};
