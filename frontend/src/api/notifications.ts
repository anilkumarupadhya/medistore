import api from './axiosInstance';

export const notificationsApi = {
  list: () =>
    api.get('/notifications/').then(r => r.data.data),
};
