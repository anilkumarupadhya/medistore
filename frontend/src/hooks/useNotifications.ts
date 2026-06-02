import { useQuery } from '@tanstack/react-query';
import { notificationsApi } from '../api/notifications';

export const useNotifications = () =>
  useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.list(),
    refetchInterval: 5 * 60 * 1000,
  });
