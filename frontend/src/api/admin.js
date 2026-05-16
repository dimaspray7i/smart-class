import api from './axios'

// ═══════════════════════════════════════════════════════════
// 🛡️ ADMIN API SERVICE
// All admin panel API endpoints organized by feature
// ═══════════════════════════════════════════════════════════

export const adminAPI = {
  // ════════════════════════════════════════════════════════
  // 📊 DASHBOARD & ANALYTICS
  // ════════════════════════════════════════════════════════
  
  /**
   * 📈 Get admin dashboard overview
   */
  getDashboard: () => api.get('/admin/dashboard'),
  
  /**
   * 📊 Get attendance analytics with filters
   * @param {Object} [params] - { date_from, date_to, class_id, teacher_id, etc. }
   */
  getAttendanceAnalytics: (params) => 
    api.get('/admin/analytics/attendance', { params }),

  /**
   * ⏱️ Get raw attendance list for management
   */
  getAttendance: (params) => 
    api.get('/admin/attendance', { params }),

  /**
   * ⏱️ Update attendance status manually
   */
  updateAttendanceStatus: (id, status, notes) => 
    api.patch(`/admin/attendance/${id}/status`, { status, notes }),
  
  /**
   * 👥 Get student analytics with filters
   * @param {Object} [params] - { class_id, status, date_range, etc. }
   */
  getStudentAnalytics: (params) => 
    api.get('/admin/analytics/students', { params }),
  
  /**
   * 📦 Export analytics data
   * @param {'csv'|'json'} [type='csv'] - Export format
   * @param {Object} [params] - Filter parameters
   */
  exportAnalytics: (type = 'csv', params) =>
    api.get('/admin/analytics/export', { 
      params: { ...params, format: type },
      responseType: type === 'pdf' ? 'blob' : 'json'
    }),
  
  // ════════════════════════════════════════════════════════
  // 👥 USER MANAGEMENT
  // ════════════════════════════════════════════════════════
  
  /**
   * 👥 List users with pagination & filters
   * @param {Object} [params] - { page, per_page, search, role, is_active, etc. }
   */
  getUsers: (params) => 
    api.get('/admin/users', { params }),
  
  /**
   * 👤 Get single user details
   * @param {number|string} id - User ID
   */
  getUser: (id) => 
    api.get(`/admin/users/${id}`),
  
  /**
   * ➕ Create new user
   * @param {Object} data - User creation data
   */
  createUser: (data) => 
    api.post('/admin/users', data),
  
  /**
   * ✏️ Update existing user
   * @param {number|string} id - User ID
   * @param {Object} data - Fields to update
   */
  updateUser: (id, data) => {
    if (data instanceof FormData) {
      return api.post(`/admin/users/${id}`, data);
    }
    return api.put(`/admin/users/${id}`, data);
  },
  
  /**
   * 🗑️ Delete user (soft delete)
   * @param {number|string} id - User ID
   */
  deleteUser: (id) => 
    api.delete(`/admin/users/${id}`),
  
  /**
   * 🔑 Reset user password
   * @param {number|string} id - User ID
   * @param {string} password - New password
   */
  resetPassword: (id, password) => 
    api.post(`/admin/users/${id}/reset-password`, { password }),
  
  /**
   * 🎭 Update user role
   * @param {number|string} id - User ID
   * @param {'admin'|'guru'|'siswa'} role - New role
   */
  updateRole: (id, role) => 
    api.patch(`/admin/users/${id}/role`, { role }),
  
  /**
   * 📤 Export users list
   * @param {'csv'|'json'} [format='csv'] - Export format
   * @param {Object} [params] - Filter parameters
   */
  exportUsers: (format = 'csv', params) =>
    api.get('/admin/users/export', { 
      params: { ...params, format },
      responseType: 'blob'
    }),
  
  /**
   * 🔄 Bulk user operations
   * @param {'activate'|'deactivate'|'delete'} action - Bulk action
   * @param {number[]} ids - Array of user IDs
   */
  bulkUserAction: (action, ids) =>
    api.post('/admin/users/bulk', { action, ids }),
  
  // ════════════════════════════════════════════════════════
  // 🏫 CLASS MANAGEMENT
  // ════════════════════════════════════════════════════════
  
  /**
   * 📚 List classes with filters
   * @param {Object} [params] - { page, search, level, is_active, etc. }
   */
  getClasses: (params) => 
    api.get('/admin/classes', { params }),
  
  /**
   * 🏫 Get single class details
   * @param {number|string} id - Class ID
   */
  getClass: (id) => 
    api.get(`/admin/classes/${id}`),
  
  /**
   * ➕ Create new class
   * @param {Object} data - Class creation data
   */
  createClass: (data) => 
    api.post('/admin/classes', data),
  
  /**
   * ✏️ Update existing class
   * @param {number|string} id - Class ID
   * @param {Object} data - Fields to update
   */
  updateClass: (id, data) => {
    if (data instanceof FormData) {
      return api.post(`/admin/classes/${id}`, data);
    }
    return api.put(`/admin/classes/${id}`, data);
  },
  
  /**
   * 🗑️ Delete class
   * @param {number|string} id - Class ID
   */
  deleteClass: (id) => 
    api.delete(`/admin/classes/${id}`),
  
  /**
   * 📤 Export classes list
   * @param {'csv'|'json'} [format='csv'] - Export format
   * @param {Object} [params] - Filter parameters
   */
  exportClasses: (format = 'csv', params) =>
    api.get('/admin/classes/export', { 
      params: { ...params, format },
      responseType: 'blob'
    }),
  
  // ════════════════════════════════════════════════════════
  // 📚 SUBJECT MANAGEMENT
  // ════════════════════════════════════════════════════════
  
  /**
   * 📖 List subjects with filters
   * @param {Object} [params] - { page, search, category, is_active, etc. }
   */
  getSubjects: (params) => 
    api.get('/admin/subjects', { params }),
  
  /**
   * 📕 Get single subject details
   * @param {number|string} id - Subject ID
   */
  getSubject: (id) => 
    api.get(`/admin/subjects/${id}`),
  
  /**
   * ➕ Create new subject
   * @param {Object} data - Subject creation data
   */
  createSubject: (data) => 
    api.post('/admin/subjects', data),
  
  /**
   * ✏️ Update existing subject
   * @param {number|string} id - Subject ID
   * @param {Object} data - Fields to update
   */
  updateSubject: (id, data) => {
    if (data instanceof FormData) {
      return api.post(`/admin/subjects/${id}`, data);
    }
    return api.put(`/admin/subjects/${id}`, data);
  },
  
  /**
   * 🗑️ Delete subject
   * @param {number|string} id - Subject ID
   */
  deleteSubject: (id) => 
    api.delete(`/admin/subjects/${id}`),
  
  /**
   * 🧹 Bulk delete subjects
   * @param {number[]} ids - Array of subject IDs
   */
  bulkDeleteSubjects: (ids) => 
    api.post('/admin/subjects/bulk/delete', { ids }),
  
  /**
   * 🏷️ Get subject categories
   */
  getSubjectCategories: () => 
    api.get('/admin/subjects/categories'),
  
  /**
   * 📤 Export subjects list
   * @param {'csv'|'json'} [format='csv'] - Export format
   * @param {Object} [params] - Filter parameters
   */
  exportSubjects: (format = 'csv', params) =>
    api.get('/admin/subjects/export', { 
      params: { ...params, format },
      responseType: 'blob'
    }),
  
  // ════════════════════════════════════════════════════════
  // 📅 SCHEDULE MANAGEMENT
  // ════════════════════════════════════════════════════════
  
  /**
   * 🗓️ List schedules with filters
   * @param {Object} [params] - { page, search, class_id, teacher_id, day, etc. }
   */
  getSchedules: (params) => 
    api.get('/admin/schedules', { params }),
  
  /**
   * 📋 Get single schedule details
   * @param {number|string} id - Schedule ID
   */
  getSchedule: (id) => 
    api.get(`/admin/schedules/${id}`),
  
  /**
   * ➕ Create new schedule
   * @param {Object} data - Schedule creation data
   */
  createSchedule: (data) => 
    api.post('/admin/schedules', data),
  
  /**
   * ✏️ Update existing schedule
   * @param {number|string} id - Schedule ID
   * @param {Object} data - Fields to update
   */
  updateSchedule: (id, data) => {
    if (data instanceof FormData) {
      return api.post(`/admin/schedules/${id}`, data);
    }
    return api.put(`/admin/schedules/${id}`, data);
  },
  
  /**
   * 🗑️ Delete schedule
   * @param {number|string} id - Schedule ID
   */
  deleteSchedule: (id) => 
    api.delete(`/admin/schedules/${id}`),
  
  /**
   * 🧹 Bulk delete schedules
   * @param {number[]} ids - Array of schedule IDs
   */
  bulkDeleteSchedules: (ids) => 
    api.post('/admin/schedules/bulk/delete', { ids }),
  
  /**
   * ⚠️ Check for schedule conflicts before creating/updating
   * @param {Object} data - Schedule data to validate
   * @returns {Promise} { hasConflict: boolean, conflicts: Array }
   */
  checkScheduleConflict: (data) => 
    api.post('/admin/schedules/check-conflict', data),
  
  /**
   * 👨‍🏫 Get schedules by teacher
   * @param {number|string} teacherId - Teacher user ID
   * @param {Object} [params] - Optional date filters
   */
  getSchedulesByTeacher: (teacherId, params) => 
    api.get(`/admin/schedules/by-teacher/${teacherId}`, { params }),
  
  /**
   * 🏫 Get schedules by class
   * @param {number|string} classId - Class ID
   */
  getSchedulesByClass: (classId) => 
    api.get(`/admin/schedules/by-class/${classId}`),
  
  /**
   * 📅 Get weekly timetable view
   * @param {Object} [params] - { week_start, class_id, teacher_id }
   */
  getWeeklySchedule: (params) => 
    api.get('/admin/schedules/weekly-view', { params }),
  
  /**
   * 📤 Export schedules list
   * @param {'csv'|'json'} [format='csv'] - Export format
   * @param {Object} [params] - Filter parameters
   */
  exportSchedules: (format = 'csv', params) =>
    api.get('/admin/schedules/export', { 
      params: { ...params, format },
      responseType: 'blob'
    }),
  
  /**
   * 📋 Get schedule templates for quick creation
   */
  getScheduleTemplates: () => 
    api.get('/admin/schedules/templates'),
  
  /**
   * ➕ Create schedule from template
   * @param {number} templateId - Template ID
   * @param {Object} [overrides] - Fields to override from template
   */
  createScheduleFromTemplate: (templateId, overrides) =>
    api.post('/admin/schedules/from-template', { template_id: templateId, ...overrides }),
  
  // ════════════════════════════════════════════════════════
  // ⚙️ SYSTEM SETTINGS
  // ════════════════════════════════════════════════════════
  
  /**
   * ⚙️ Get all system settings
   */
  getSettings: () => api.get('/admin/settings'),
  
  /**
   * ✏️ Update system settings
   * @param {Object} data - Settings to update (can be partial)
   */
  updateSettings: (data) => {
    if (data instanceof FormData) {
      return api.post('/admin/settings', data);
    }
    return api.put('/admin/settings', data);
  },
  
  /**
   * 🔄 Reset settings to defaults
   * @param {string} [section] - Optional section to reset ('general', 'attendance', etc.)
   */
  resetSettings: (section) => 
    api.post('/admin/settings/reset', { section }),
  
  /**
   * 📤 Export settings
   */
  exportSettings: () => api.get('/admin/settings/export'),
  
  /**
   * 🎨 Get branding preview with current settings
   */
  getBrandingPreview: () => api.get('/admin/settings/branding/preview'),
  
  // ════════════════════════════════════════════════════════
  // 💼 PKL / INTERNSHIP MANAGEMENT
  // ════════════════════════════════════════════════════════
  
  /**
   * 🏢 List PKL locations
   * @param {Object} [params] - { page, search, is_approved, etc. }
   */
  getPklLocations: (params) => 
    api.get('/admin/pkl-locations', { params }),
  
  /**
   * 🏢 Get single PKL location
   * @param {number|string} id - Location ID
   */
  getPklLocation: (id) => 
    api.get(`/admin/pkl-locations/${id}`),
  
  /**
   * ➕ Create PKL location
   * @param {Object} data - Location data
   */
  createPklLocation: (data) => 
    api.post('/admin/pkl-locations', data),
  
  /**
   * ✏️ Update PKL location
   * @param {number|string} id - Location ID
   * @param {Object} data - Fields to update
   */
  updatePklLocation: (id, data) => {
    if (data instanceof FormData) {
      return api.post(`/admin/pkl-locations/${id}?_method=PUT`, data);
    }
    return api.put(`/admin/pkl-locations/${id}`, data);
  },
  
  /**
   * 🗑️ Delete PKL location
   * @param {number|string} id - Location ID
   */
  deletePklLocation: (id) => 
    api.delete(`/admin/pkl-locations/${id}`),
  
  /**
   * ✅ Approve PKL location
   * @param {number|string} id - Location ID
   */
  approvePklLocation: (id) => 
    api.patch(`/admin/pkl-locations/${id}/approve`),
  
  /**
   * ✅ Get approved PKL locations for student assignment
   */
  getApprovedPklLocations: () => 
    api.get('/admin/pkl-locations/approved'),
  
  /**
   * 👥 Get eligible students for PKL (Grade 12 RPL)
   * @param {Object} [params] - { search, class_id, etc. }
   */
  getPklStudents: (params) => 
    api.get('/admin/pkl/students', { params }),
  
  /**
   * 🎯 Assign students to PKL location
   * @param {Object} data - { student_ids: number[], pkl_location_id: number }
   */
  assignPklStudents: (data) => 
    api.post('/admin/pkl/assign', data),
  
  /**
   * 🔄 Unassign student from PKL
   * @param {number|string} studentId - Student ID
   */
  unassignPklStudent: (studentId) => 
    api.post(`/admin/pkl/unassign/${studentId}`),
  
  /**
   * 📤 Export PKL assignments
   * @param {'csv'|'json'} [format='csv'] - Export format
   */
  exportPklAssignments: (format = 'csv') =>
    api.get('/admin/pkl/assignments/export', { 
      params: { format },
      responseType: 'blob'
    }),
  
  // ════════════════════════════════════════════════════════
  // 🔧 SYSTEM UTILITIES
  // ════════════════════════════════════════════════════════
  
  /**
   * 🧹 Clear application cache
   */
  clearCache: () => api.post('/admin/cache/clear'),
  
  /**
   * 🗑️ Clear application logs
   */
  clearLogs: () => api.post('/admin/logs/clear'),
  
  /**
   * 📋 Get recent logs
   * @param {number} [limit=100] - Number of log entries
   */
  getRecentLogs: (limit = 100) => 
    api.get('/admin/logs/recent', { params: { limit } }),
  
  /**
   * ⚡ Optimize database
   */
  optimizeDatabase: () => api.post('/admin/database/optimize'),
  
  /**
   * 💾 Trigger database backup
   */
  triggerBackup: () => api.post('/admin/database/backup'),
  
  /**
   * ℹ️ Get system information
   */
  getSystemInfo: () => api.get('/admin/system/info'),
}