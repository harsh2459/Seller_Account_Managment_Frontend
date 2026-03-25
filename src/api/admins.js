import client from './client';

export const adminsApi = {
  list: (params) => client.get('/admins', { params }),
  get: (id) => client.get(`/admins/${id}`),
  create: (data) => client.post('/admins', data),
  update: (id, data) => client.put(`/admins/${id}`, data),
  remove: (id) => client.delete(`/admins/${id}`),
  suspend: (id, data) => client.post(`/admins/${id}/suspend`, data),
  unsuspend: (id) => client.post(`/admins/${id}/unsuspend`),
  resetPassword: (id, data) => client.post(`/admins/${id}/reset-password`, data),
  changeMyPassword: (data) => client.put('/admins/me/password', data),
};
