import api from './axiosInstance';
import type { User } from '../types/auth';

export interface UserCreatePayload {
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: string;
  password: string;
  confirm_password: string;
}

export interface UserUpdatePayload {
  first_name?: string;
  last_name?: string;
  phone?: string;
  role?: string;
  is_active?: boolean;
}

export interface UserListParams {
  search?: string;
  role?: string;
  is_active?: boolean;
  page?: number;
  page_size?: number;
}

export interface UserListResponse {
  count: number;
  total_pages: number;
  current_page: number;
  results: User[];
}

export interface AuditLog {
  id: number;
  user: string;
  user_email: string;
  action: string;
  resource: string;
  resource_id: string;
  ip_address: string;
  success: boolean;
  extra_data: Record<string, any>;
  created_at: string;
}

export interface AuditLogListResponse {
  count: number;
  total_pages: number;
  current_page: number;
  results: AuditLog[];
}

export const usersApi = {
  list: (params: UserListParams = {}): Promise<UserListResponse> =>
    api.get('/auth/users/', { params }).then(r => r.data),

  get: (id: string): Promise<User> =>
    api.get(`/auth/users/${id}/`).then(r => r.data.data),

  create: (data: UserCreatePayload): Promise<User> =>
    api.post('/auth/users/', data).then(r => r.data.data),

  update: (id: string, data: UserUpdatePayload): Promise<User> =>
    api.put(`/auth/users/${id}/`, data).then(r => r.data.data),

  deactivate: (id: string): Promise<void> =>
    api.delete(`/auth/users/${id}/`).then(r => r.data),

  auditLogs: (params: { page?: number; page_size?: number; search?: string; action?: string } = {}): Promise<AuditLogListResponse> =>
    api.get('/auth/audit-logs/', { params }).then(r => r.data),
};
