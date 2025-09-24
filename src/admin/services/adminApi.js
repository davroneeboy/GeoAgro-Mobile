import { http } from './http';

export const authApi = {
  login: (payload) => http.post('api/login/', payload).then(r => r.data),
  refresh: (refresh) => http.post('api/refresh/', { refresh }).then(r => r.data),
};

export const dashboardApi = {
  getDashboard: () => http.get('api/admin/dashboard/').then(r => r.data),
  getQuickStats: () => http.get('api/admin/quick-stats/').then(r => r.data),
};

export const usersApi = {
  list: (params) => http.get('api/admin/users/', { params }).then(r => r.data),
  detail: (userId) => http.get(`api/admin/users/${userId}/`).then(r => r.data),
  create: (payload) => http.post('api/admin/users/create/', payload).then(r => r.data),
  update: (userId, payload) => http.patch(`api/admin/users/${userId}/update/`, payload).then(r => r.data),
  updateKpi: (userId, payload) => http.patch(`api/admin/users/${userId}/kpi/`, payload).then(r => r.data),
  bulkActions: (payload) => http.post('api/admin/users/bulk-actions/', payload).then(r => r.data),
};

export const moderationApi = {
  queue: (params) => http.get('api/admin/moderation/queue/', { params }).then(r => r.data),
  detail: (plantationId) => http.get(`api/admin/moderation/${plantationId}/`).then(r => r.data),
  bulkActions: (payload) => http.post('api/admin/moderation/bulk-actions/', payload).then(r => r.data),
  stats: () => http.get('api/admin/moderation/stats/').then(r => r.data),
};

export const referencesApi = {
  fruits: {
    list: (params) => http.get('api/admin/references/fruits/', { params }).then(r => r.data),
    create: (payload) => http.post('api/admin/references/fruits/', payload).then(r => r.data),
    update: (id, payload) => http.patch(`api/admin/references/fruits/${id}/`, payload).then(r => r.data),
    delete: (id) => http.delete(`api/admin/references/fruits/${id}/`).then(r => r.data),
  },
  varieties: {
    list: (params) => http.get('api/admin/references/varieties/', { params }).then(r => r.data),
    create: (payload) => http.post('api/admin/references/varieties/', payload).then(r => r.data),
    update: (id, payload) => http.patch(`api/admin/references/varieties/${id}/`, payload).then(r => r.data),
    delete: (id) => http.delete(`api/admin/references/varieties/${id}/`).then(r => r.data),
  },
  districts: {
    list: (params) => http.get('api/admin/references/districts/', { params }).then(r => r.data),
    create: (payload) => http.post('api/admin/references/districts/', payload).then(r => r.data),
    update: (id, payload) => http.patch(`api/admin/references/districts/${id}/`, payload).then(r => r.data),
    delete: (id) => http.delete(`api/admin/references/districts/${id}/`).then(r => r.data),
  },
  farmers: {
    list: (params) => http.get('api/admin/references/farmers/', { params }).then(r => r.data),
    create: (payload) => http.post('api/admin/references/farmers/', payload).then(r => r.data),
    update: (id, payload) => http.patch(`api/admin/references/farmers/${id}/`, payload).then(r => r.data),
    delete: (id) => http.delete(`api/admin/references/farmers/${id}/`).then(r => r.data),
  },
  reservoirs: {
    list: (params) => http.get('api/admin/references/reservoirs/', { params }).then(r => r.data),
    create: (payload) => http.post('api/admin/references/reservoirs/', payload).then(r => r.data),
    update: (id, payload) => http.patch(`api/admin/references/reservoirs/${id}/`, payload).then(r => r.data),
    delete: (id) => http.delete(`api/admin/references/reservoirs/${id}/`).then(r => r.data),
  },
  rootstocks: {
    list: (params) => http.get('api/admin/references/rootstocks/', { params }).then(r => r.data),
    create: (payload) => http.post('api/admin/references/rootstocks/', payload).then(r => r.data),
    update: (id, payload) => http.patch(`api/admin/references/rootstocks/${id}/`, payload).then(r => r.data),
    delete: (id) => http.delete(`api/admin/references/rootstocks/${id}/`).then(r => r.data),
  },
  subsidys: {
    list: (params) => http.get('api/admin/references/subsidys/', { params }).then(r => r.data),
    create: (payload) => http.post('api/admin/references/subsidys/', payload).then(r => r.data),
    update: (id, payload) => http.patch(`api/admin/references/subsidys/${id}/`, payload).then(r => r.data),
    delete: (id) => http.delete(`api/admin/references/subsidys/${id}/`).then(r => r.data),
  },
  trellis: {
    list: (params) => http.get('api/admin/references/trellis/', { params }).then(r => r.data),
    create: (payload) => http.post('api/admin/references/trellis/', payload).then(r => r.data),
    update: (id, payload) => http.patch(`api/admin/references/trellis/${id}/`, payload).then(r => r.data),
    delete: (id) => http.delete(`api/admin/references/trellis/${id}/`).then(r => r.data),
  },
  stats: () => http.get('api/admin/references/stats/').then(r => r.data),
};

export const logsApi = {
  list: (params) => http.get('api/logs/', { params }).then(r => r.data),
}; 