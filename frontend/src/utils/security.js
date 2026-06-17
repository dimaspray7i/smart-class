/**
 * Security utilities for role-based access control and authorization
 */

export const ROLES = {
  ADMIN: 'admin',
  GURU: 'guru',
  SISWA: 'siswa',
};

export const ROLE_HIERARCHY = {
  admin: ['admin', 'guru', 'siswa'],
  guru: ['guru', 'siswa'],
  siswa: ['siswa'],
};

/**
 * Check if user has required role
 */
export function hasRole(userRole, requiredRole) {
  if (!userRole || !requiredRole) return false;
  return ROLE_HIERARCHY[userRole]?.includes(requiredRole) || false;
}

/**
 * Check if user has any of the required roles
 */
export function hasAnyRole(userRole, requiredRoles = []) {
  if (!userRole) return false;
  return requiredRoles.some(role => hasRole(userRole, role));
}

/**
 * Check if user has all required roles
 */
export function hasAllRoles(userRole, requiredRoles = []) {
  if (!userRole) return false;
  return requiredRoles.every(role => hasRole(userRole, role));
}

/**
 * Protected route configuration
 */
export const PROTECTED_ROUTES = {
  // Admin routes
  '/admin/dashboard': [ROLES.ADMIN],
  '/admin/users': [ROLES.ADMIN],
  '/admin/classes': [ROLES.ADMIN],
  '/admin/schedules': [ROLES.ADMIN],
  '/admin/subjects': [ROLES.ADMIN],
  '/admin/settings': [ROLES.ADMIN],

  // Guru routes
  '/guru/dashboard': [ROLES.GURU, ROLES.ADMIN],
  '/guru/students': [ROLES.GURU, ROLES.ADMIN],
  '/guru/grades': [ROLES.GURU, ROLES.ADMIN],
  '/guru/attendance': [ROLES.GURU, ROLES.ADMIN],

  // Student routes
  '/student/dashboard': [ROLES.SISWA, ROLES.GURU, ROLES.ADMIN],
  '/student/schedules': [ROLES.SISWA, ROLES.GURU, ROLES.ADMIN],
  '/student/attendance': [ROLES.SISWA, ROLES.GURU, ROLES.ADMIN],
  '/student/grades': [ROLES.SISWA, ROLES.GURU, ROLES.ADMIN],
};

/**
 * Check if user can access route
 */
export function canAccessRoute(userRole, pathname) {
  const allowedRoles = PROTECTED_ROUTES[pathname];
  if (!allowedRoles) return true; // Public route
  return hasAnyRole(userRole, allowedRoles);
}

/**
 * Check if user can perform action
 */
export function canPerformAction(userRole, action) {
  const actions = {
    // Admin only
    'create_user': [ROLES.ADMIN],
    'edit_user': [ROLES.ADMIN],
    'delete_user': [ROLES.ADMIN],
    'create_class': [ROLES.ADMIN],
    'edit_class': [ROLES.ADMIN],
    'delete_class': [ROLES.ADMIN],
    'create_schedule': [ROLES.ADMIN],
    'edit_schedule': [ROLES.ADMIN],
    'delete_schedule': [ROLES.ADMIN],

    // Guru and Admin
    'view_grades': [ROLES.GURU, ROLES.ADMIN],
    'input_grades': [ROLES.GURU, ROLES.ADMIN],
    'view_attendance': [ROLES.GURU, ROLES.ADMIN],
    'take_attendance': [ROLES.GURU, ROLES.ADMIN],

    // Everyone can view own data
    'view_own_profile': [ROLES.ADMIN, ROLES.GURU, ROLES.SISWA],
    'edit_own_profile': [ROLES.ADMIN, ROLES.GURU, ROLES.SISWA],
  };

  const allowedRoles = actions[action];
  if (!allowedRoles) return false;
  return hasAnyRole(userRole, allowedRoles);
}

/**
 * Validate user session
 */
export function isSessionValid(user) {
  if (!user) return false;
  if (!user.id || !user.role || !user.email) return false;
  if (!ROLES[user.role.toLowerCase()]) return false;

  // Check if session token exists (handled by auth context)
  return true;
}

/**
 * Require authentication decorator
 */
export function requireAuth(Component) {
  return function ProtectedComponent(props) {
    const { user } = props;
    if (!isSessionValid(user)) {
      return <div>Unauthorized access. Please login.</div>;
    }
    return <Component {...props} />;
  };
}

/**
 * Require specific role decorator
 */
export function requireRole(Component, requiredRoles) {
  return function ProtectedComponent(props) {
    const { user } = props;
    if (!isSessionValid(user) || !hasAnyRole(user.role, requiredRoles)) {
      return <div>You do not have permission to access this page.</div>;
    }
    return <Component {...props} />;
  };
}
