import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  headers: { 
    'Content-Type': 'application/json'
  },
});

// Add a request interceptor to inject the token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

// --- Projects ---
export const getProjects = () => api.get('/projects').then(r => r.data);
export const createProject = (data) => api.post('/projects', data).then(r => r.data);
export const deleteProject = (id) => api.delete(`/projects/${id}`).then(r => r.data);

// --- Tickets ---
export const getTickets = (params) => api.get('/tickets', { params }).then(r => r.data);
export const getTicket = (id) => api.get(`/tickets/${id}`).then(r => r.data);
export const createTicket = (data) => api.post('/tickets', data).then(r => r.data);
export const updateTicket = (id, data) => api.patch(`/tickets/${id}`, data).then(r => r.data);
export const deleteTicket = (id) => api.delete(`/tickets/${id}`).then(r => r.data);
export const addComment = (ticketId, data) => api.post(`/tickets/${ticketId}/comments`, data).then(r => r.data);

// --- Time Tracking ---
export const startTimer = (data) => api.post('/time/start', data).then(r => r.data);
export const stopTimer = (data) => api.post('/time/stop', data).then(r => r.data);
export const addManualTime = (data) => api.post('/time/manual', data).then(r => r.data);
export const getActiveTimer = (userId) => api.get(`/time/active/${userId}`).then(r => r.data);
export const getBillingData = (start, end, userId) => api.get('/time/billing', { params: { start, end, user_id: userId } }).then(r => r.data);
export const editTimeEntry = (id, data) => api.patch(`/time/entries/${id}`, data).then(r => r.data);
export const getStats = () => api.get('/stats').then(r => r.data);
export const getUsers = () => api.get('/auth/users').then(r => r.data);
export const updateUserRole = (id, role) => api.patch(`/auth/users/${id}/role`, { role }).then(r => r.data);
export const deleteUser = (id) => api.delete(`/auth/users/${id}`).then(r => r.data);

// -- User Account ---
export const getUserProfileEx = (id) => api.get(`/users/profile/${id}`).then(r => r.data);
export const getUserActivityLog = (id) => api.get(`/users/activity/${id}`).then(r => r.data);
export const updateProfileInfo = (data) => api.patch('/auth/profile', data).then(r => r.data);
export const updateProfile = (data) => api.patch('/auth/profile', data).then(r => r.data);
export const changePassword = (data) => api.patch('/users/change-password', data).then(r => r.data);
export const uploadAvatar = (formData) => api.post('/users/upload-avatar', formData, { 
  headers: { 'Content-Type': 'multipart/form-data' } 
}).then(r => r.data);
export const deleteUserAvatar = () => api.delete('/users/delete-avatar').then(r => r.data);
export const updateUserStatus = (status) => api.patch('/users/update-status', { status }).then(r => r.data);
export const checkHandle = (handle) => api.get(`/auth/check-handle/${handle}`).then(r => r.data);

// -- Notifications ---
export const getNotifications = () => api.get('/notifications').then(r => r.data);
export const getUnreadCount = () => api.get('/notifications/unread-count').then(r => r.data);
export const markAsRead = (id) => api.patch(`/notifications/${id}/read`).then(r => r.data);
export const markAllAsRead = () => api.patch('/notifications/read-all').then(r => r.data);

export default api;
