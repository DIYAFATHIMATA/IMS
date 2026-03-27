const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const apiRequest = async (path, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch (_error) {
    throw new Error('Cannot connect to server. Please start backend on port 5000 and try again.');
  }

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      typeof data === 'object' && data?.message
        ? data.message
        : 'Request failed';
    throw new Error(message);
  }

  return data;
};

export const healthApi = {
  getStatus: () => apiRequest('/health')
};

export const usersApi = {
  getAll: (token) =>
    apiRequest('/users', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }),
  create: (payload, token) =>
    apiRequest('/users', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    }),
  update: (id, payload, token) =>
    apiRequest(`/users/${id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    }),
  remove: (id, token) =>
    apiRequest(`/users/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`
      }
    }),
  getProfile: (token) =>
    apiRequest('/users/profile', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }),
  updateProfile: (payload, token) =>
    apiRequest('/users/profile', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    }),
  changePassword: (payload, token) =>
    apiRequest('/users/change-password', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    })
};

export const authApi = {
  register: (payload) =>
    apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  login: (payload) =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  me: (token) =>
    apiRequest('/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
};

export const inventoryApi = {
  getItems: (token) =>
    apiRequest('/inventory/items', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }),
  createItem: (payload, token) =>
    apiRequest('/inventory/items', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    }),
  updateItem: (id, payload, token) =>
    apiRequest(`/inventory/items/${id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    }),
  removeItem: (id, token) =>
    apiRequest(`/inventory/items/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`
      }
    }),
  getStockTransactions: (token, limit = 8) =>
    apiRequest(`/inventory/stock-transactions?limit=${limit}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
};

export const resourceApi = {
  getAll: (resourceKey, token) =>
    apiRequest(`/resources/${resourceKey}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }),
  create: (resourceKey, payload, token) =>
    apiRequest(`/resources/${resourceKey}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    }),
  update: (resourceKey, id, payload, token) =>
    apiRequest(`/resources/${resourceKey}/${id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    }),
  remove: (resourceKey, id, token) =>
    apiRequest(`/resources/${resourceKey}/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
};

export const salesApi = {
  checkout: (payload, token) =>
    apiRequest('/sales/checkout', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    })
};

export const purchasesApi = {
  getAll: (token) =>
    apiRequest('/purchases', {
      headers: { Authorization: `Bearer ${token}` }
    }),
  record: (payload, token) =>
    apiRequest('/purchases/record', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    })
};

export const billsApi = {
  getAll: (token) =>
    apiRequest('/bills', {
      headers: { Authorization: `Bearer ${token}` }
    }),
  create: (payload, token) =>
    apiRequest('/bills', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload)
    }),
  update: (id, payload, token) =>
    apiRequest(`/bills/${id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload)
    }),
  remove: (id, token) =>
    apiRequest(`/bills/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
};

export const invoicesApi = {
  getAll: (token) =>
    apiRequest('/invoices', {
      headers: { Authorization: `Bearer ${token}` }
    }),
  create: (payload, token) =>
    apiRequest('/invoices', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload)
    }),
  update: (id, payload, token) =>
    apiRequest(`/invoices/${id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload)
    }),
  remove: (id, token) =>
    apiRequest(`/invoices/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
};

export const customersApi = {
  getAll: (token) =>
    apiRequest('/customers', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }),
  create: (payload, token) =>
    apiRequest('/customers', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    }),
  update: (id, payload, token) =>
    apiRequest(`/customers/${id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    }),
  remove: (id, token) =>
    apiRequest(`/customers/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`
      }
    }),
  getHistory: (id, token) =>
    apiRequest(`/customers/${id}/history`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
};

export const salesReturnsApi = {
  getAll: (token) =>
    apiRequest('/sales/returns', {
      headers: { Authorization: `Bearer ${token}` }
    }),
  create: (payload, token) =>
    apiRequest('/sales/returns', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload)
    })
};

export const reportsApi = {
  getSummary: (token) =>
    apiRequest('/reports/summary', {
      headers: { Authorization: `Bearer ${token}` }
    }),
  getInventory: (token) =>
    apiRequest('/reports/inventory', {
      headers: { Authorization: `Bearer ${token}` }
    }),
  getSales: (token) =>
    apiRequest('/reports/sales', {
      headers: { Authorization: `Bearer ${token}` }
    }),
  getPurchases: (token) =>
    apiRequest('/reports/purchases', {
      headers: { Authorization: `Bearer ${token}` }
    }),
  getSupplierPerformance: (token) =>
    apiRequest('/reports/supplier-performance', {
      headers: { Authorization: `Bearer ${token}` }
    })
};

export const supplyRequestsApi = {
  getAll: (token) =>
    apiRequest('/supply-requests', {
      headers: { Authorization: `Bearer ${token}` }
    }),
  create: (payload, token) =>
    apiRequest('/supply-requests', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload)
    }),
  approve: (id, payload, token) =>
    apiRequest(`/supply-requests/${id}/approve`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload || { status: 'Approved' })
    }),
  respond: (id, decision, token) =>
    apiRequest(`/supply-requests/${id}/respond`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ decision })
    }),
  updateStatus: (id, status, token) =>
    apiRequest(`/supply-requests/${id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status })
    }),
  markReceived: (id, token) =>
    apiRequest(`/supply-requests/${id}/receive`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` }
    }),
  verify: (id, token) =>
    apiRequest(`/supply-requests/${id}/verify`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` }
    })
};

export const suppliersApi = {
  getAll: (token, params = {}) => {
    const query = new URLSearchParams();
    if (params.category) query.set('category', params.category);
    if (params.search) query.set('search', params.search);
    if (params.userId) query.set('userId', params.userId);
    const qs = query.toString();

    return apiRequest(`/suppliers${qs ? `?${qs}` : ''}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  create: (payload, token) =>
    apiRequest('/suppliers', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload)
    }),
  getById: (id, token) =>
    apiRequest(`/suppliers/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    }),
  update: (id, payload, token) =>
    apiRequest(`/suppliers/${id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload)
    })
};

export const ordersApi = {
  getSupplierOrders: (token, params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.status) query.set('status', params.status);
    const qs = query.toString();

    return apiRequest(`/orders/supplier${qs ? `?${qs}` : ''}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  getById: (orderId, token) =>
    apiRequest(`/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${token}` }
    }),
  updateStatus: (orderId, payload, token) =>
    apiRequest(`/orders/update-status/${orderId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload || {})
    }),
  addDeliveryNote: (orderId, note, token) =>
    apiRequest(`/orders/${orderId}/delivery-note`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ note })
    })
};

export const notificationsApi = {
  getAll: (token, limit = 50) =>
    apiRequest(`/notifications?limit=${limit}`, {
      headers: { Authorization: `Bearer ${token}` }
    }),
  markRead: (id, token) =>
    apiRequest(`/notifications/${id}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` }
    }),
  markAllRead: (token) =>
    apiRequest('/notifications/read-all', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` }
    })
};

export const activityLogsApi = {
  getAll: (token, limit = 100) =>
    apiRequest(`/activity-logs?limit=${limit}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
};
