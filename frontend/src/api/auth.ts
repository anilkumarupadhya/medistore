import axiosInstance from './axiosInstance';
import type { LoginRequest, LoginResponse, User, ChangePasswordRequest } from '../types/auth';

export const authApi = {
  login: (data: LoginRequest) =>
    axiosInstance.post<LoginResponse>('/auth/login/', data),

  logout: (refresh: string) =>
    axiosInstance.post('/auth/logout/', { refresh }),

  getMe: () =>
    axiosInstance.get<{ success: boolean; data: User }>('/auth/me/'),

  updateMe: (data: Partial<Pick<User, 'first_name' | 'last_name' | 'phone'>>) =>
    axiosInstance.put<{ success: boolean; data: User }>('/auth/me/', data),

  changePassword: (data: ChangePasswordRequest) =>
    axiosInstance.post('/auth/change-password/', data),
};
