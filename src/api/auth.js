import client from './client';

export const authApi = {
  login: (credentials) => client.post('/auth/login', credentials),
  refresh: (refreshToken) => client.post('/auth/refresh', { refreshToken }),
  logout: (refreshToken) => client.post('/auth/logout', { refreshToken }),
  logoutAll: () => client.post('/auth/logout-all'),
  me: () => client.get('/auth/me'),
};

export const setupApi = {
  status: () => client.get('/setup/status'),
  createFirstAdmin: (data) => client.post('/setup/first-admin', data),
};
