import api from './axios';

export const adminAPI = {
  // Dashboard
  getDashboard: () => api.get('/admin/dashboard'),
  
  // Analytics
  getAttendanceAnalytics: (params) => api.get('/admin/analytics/attendance', { params }),
  getStudentAnalytics: (params) => api.get('/admin/analytics/students', { params }),
  
  // User Management
  getUsers: (params) => api.get('/admin/users', { params }),
  getUser: (id) => api.get(`/admin/users/${id}`),
  createUser: (data) => api.post('/admin/users', data),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  resetPassword: (id, password) => api.post(`/admin/users/${id}/reset-password`, { password }),
  updateRole: (id, role) => api.patch(`/admin/users/${id}/role`, { role }),
  
  // Class Management
  getClasses: (params) => api.get('/admin/classes', { params }),
  getClass: (id) => api.get(`/admin/classes/${id}`),
  createClass: (data) => api.post('/admin/classes', data),
  updateClass: (id, data) => api.put(`/admin/classes/${id}`, data),
  deleteClass: (id) => api.delete(`/admin/classes/${id}`),
  
  // Subject Management
  getSubjects: (params) => api.get('/admin/subjects', { params }),
  getSubject: (id) => api.get(`/admin/subjects/${id}`),
  createSubject: (data) => api.post('/admin/subjects', data),
  updateSubject: (id, data) => api.put(`/admin/subjects/${id}`, data),
  deleteSubject: (id) => api.delete(`/admin/subjects/${id}`),
  
  // Schedule Management
  getSchedules: (params) => api.get('/admin/schedules', { params }),
  getSchedule: (id) => api.get(`/admin/schedules/${id}`),
  createSchedule: (data) => api.post('/admin/schedules', data),
  updateSchedule: (id, data) => api.put(`/admin/schedules/${id}`, data),
  deleteSchedule: (id) => api.delete(`/admin/schedules/${id}`),
  checkScheduleConflict: (data) => api.post('/admin/schedules/check-conflict', data),
  getSchedulesByTeacher: (teacherId) => api.get(`/admin/schedules/by-teacher/${teacherId}`),
};