import api from './axios';

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

export const saveAuth = (token, user) => {
  localStorage.setItem('rpl_token', token);
  localStorage.setItem('rpl_user', JSON.stringify(user));
};

export const clearAuth = () => {
  localStorage.removeItem('rpl_token');
  localStorage.removeItem('rpl_user');
};

export const getAuth = () => {
  const user = localStorage.getItem('rpl_user');
  return user ? JSON.parse(user) : null;
};

export const isAuthenticated = () => !!localStorage.getItem('rpl_token');