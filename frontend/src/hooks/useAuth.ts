import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { authApi } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import type { LoginRequest, ApiError } from '../types/auth';
import { AxiosError } from 'axios';

export function useLogin() {
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: (response) => {
      const { data } = response.data;
      setAuth(data.user, data.access, data.refresh);
      enqueueSnackbar(`Welcome back, ${data.user.first_name}!`, { variant: 'success' });
      navigate('/dashboard', { replace: true });
    },
    onError: (error: AxiosError<ApiError>) => {
      const message =
        error.response?.data?.error?.message ?? 'Login failed. Please try again.';
      enqueueSnackbar(message, { variant: 'error' });
    },
  });
}

export function useLogout() {
  const { refreshToken, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: () => authApi.logout(refreshToken ?? ''),
    onSettled: () => {
      clearAuth();
      navigate('/login', { replace: true });
      enqueueSnackbar('Logged out successfully.', { variant: 'info' });
    },
  });
}
