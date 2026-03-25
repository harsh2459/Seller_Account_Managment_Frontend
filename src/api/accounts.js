import client from './client';

export const accountsApi = {
  list:        (sellerId, params)       => client.get(`/sellers/${sellerId}/accounts`, { params }),
  get:         (sellerId, id)           => client.get(`/sellers/${sellerId}/accounts/${id}`),
  credentials: (sellerId, id)           => client.get(`/sellers/${sellerId}/accounts/${id}/credentials`),
  create:      (sellerId, data)         => client.post(`/sellers/${sellerId}/accounts`, data),
  update:      (sellerId, id, data)     => client.put(`/sellers/${sellerId}/accounts/${id}`, data),
  remove:      (sellerId, id)           => client.delete(`/sellers/${sellerId}/accounts/${id}`),

  // ── Order management ─────────────────────────────────────────
  getOrders: (sellerId, id, params) =>
    client.get(`/sellers/${sellerId}/accounts/${id}/orders`, { params }),

  packShipment: (sellerId, id, data) =>
    client.post(`/sellers/${sellerId}/accounts/${id}/orders/pack`, data),

  markReadyToDispatch: (sellerId, id, data) =>
    client.post(`/sellers/${sellerId}/accounts/${id}/orders/dispatch`, data),

  cancelShipment: (sellerId, id, data) =>
    client.post(`/sellers/${sellerId}/accounts/${id}/orders/cancel`, data),

  bulkPackShipments: (sellerId, id, data) =>
    client.post(`/sellers/${sellerId}/accounts/${id}/orders/bulk-pack`, data),

  downloadLabels: (sellerId, id, shipmentIds) =>
    client.get(`/sellers/${sellerId}/accounts/${id}/orders/labels`, {
      params: { shipmentIds: shipmentIds.join(',') },
      responseType: 'blob',
    }),
  downloadManifest: (sellerId, id, shipmentIds) =>
    client.get(`/sellers/${sellerId}/accounts/${id}/orders/manifest`, {
      params: { shipmentIds: shipmentIds.join(',') },
      responseType: 'blob',
    }),
};
