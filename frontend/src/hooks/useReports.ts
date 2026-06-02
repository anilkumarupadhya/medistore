import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '../api/reports';
import type { ReportFilters } from '../types/report';

export const useSalesReport = (filters: ReportFilters = {}) =>
  useQuery({
    queryKey: ['reports', 'sales', filters],
    queryFn: () => reportsApi.sales(filters),
  });

export const useInventoryReport = () =>
  useQuery({
    queryKey: ['reports', 'inventory'],
    queryFn: () => reportsApi.inventory(),
  });

export const usePurchaseReport = (filters: ReportFilters = {}) =>
  useQuery({
    queryKey: ['reports', 'purchases', filters],
    queryFn: () => reportsApi.purchases(filters),
  });
