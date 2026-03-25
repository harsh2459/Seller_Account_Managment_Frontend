import client from './client';

export const sellersApi = {
  list: (params) => client.get('/sellers', { params }),
  get: (id) => client.get(`/sellers/${id}`),
  create: (data) => client.post('/sellers', data),
  update: (id, data) => client.put(`/sellers/${id}`, data),
  remove: (id) => client.delete(`/sellers/${id}`),
};
