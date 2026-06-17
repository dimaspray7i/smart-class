import api from './axios';

// ═══════════════════════════════════════════════════════════
// 🎓 STUDENT API SERVICE
// RPL Smart Ecosystem v2.0 - Retro Futuristic Edition
// ═══════════════════════════════════════════════════════════

// Dashboard
export const studentApi = {
  // Dashboard
  getDashboard: () => api.get('/student/dashboard'),

  // Schedules
  getSchedules: (params = {}) => api.get('/student/schedules', { params }),

  // Attendance
  getAttendanceHistory: (params = {}) => api.get('/student/attendance/history', { params }),
  getAttendanceStats: () => api.get('/student/attendance/stats'),
  getTodayAttendance: () => api.get('/student/attendance/today'),
  scanQR: (data) => api.post('/student/attendance', data),
  verifyAttendanceCode: (data) => api.post('/student/attendance/verify-code', data),
  verifyAttendanceFace: (formData) => api.post('/student/attendance/verify-face', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  verifyAttendanceLocation: (data) => api.post('/student/attendance/verify-location', data),
  checkInAttendance: (data) => api.post('/student/attendance/check-in', data),

  // Grades
  getGrades: () => api.get('/student/grades'),

  // Tasks
  getTasks: () => api.get('/student/tasks'),
  uploadTask: (formData) => api.post('/student/tasks/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),

  // PKL
  getPkl: () => api.get('/student/pkl'),
  uploadJournal: (formData) => api.post('/student/pkl/journal', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),

  // Announcements
  getAnnouncements: (params = {}) => api.get('/student/announcements', { params }),

  // Permissions
  getPermissions: (params = {}) => api.get('/student/permissions', { params }),
  createPermission: (formData) => api.post('/student/permissions', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),

  // Profile
  getProfile: () => api.get('/student/profile'),
  updateProfile: (data) => api.put('/student/profile', data),
  uploadAvatar: (formData) => api.post('/student/profile/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  changePassword: (data) => api.post('/student/profile/password', data),

  // Settings
  getSettings: () => api.get('/student/settings'),
  updateSettings: (data) => api.put('/student/settings', data),
};

export default studentApi;
