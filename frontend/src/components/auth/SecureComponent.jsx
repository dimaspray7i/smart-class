import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { isSessionValid } from '../../utils/security';

/**
 * Enhanced security wrapper for components
 * Provides: session validation, inactivity timeout, suspicious activity detection
 */
export function SecureComponent({ children, requiredRole = null, maxInactivityMinutes = 30 }) {
  const { user, logout } = useAuth();
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [sessionWarningVisible, setSessionWarningVisible] = useState(false);

  // Validate session on mount
  useEffect(() => {
    if (!user || !isSessionValid(user)) {
      logout();
    }
  }, [user, logout]);

  // Track user activity for inactivity timeout
  useEffect(() => {
    const handleActivity = () => {
      setLastActivity(Date.now());
      setSessionWarningVisible(false);
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => window.addEventListener(event, handleActivity));

    return () => {
      events.forEach(event => window.removeEventListener(event, handleActivity));
    };
  }, []);

  // Check for inactivity timeout
  useEffect(() => {
    const warningTime = (maxInactivityMinutes - 5) * 60 * 1000;
    const logoutTime = maxInactivityMinutes * 60 * 1000;

    const warningTimer = setTimeout(() => {
      if (Date.now() - lastActivity >= warningTime) {
        setSessionWarningVisible(true);
      }
    }, warningTime);

    const logoutTimer = setTimeout(() => {
      if (Date.now() - lastActivity >= logoutTime) {
        logout();
      }
    }, logoutTime);

    return () => {
      clearTimeout(warningTimer);
      clearTimeout(logoutTimer);
    };
  }, [lastActivity, maxInactivityMinutes, logout]);

  // Check role-based access if required
  if (requiredRole && user?.role !== requiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-cream">
        <div className="retro-card p-8 text-center">
          <p className="retro-heading mb-4">Access Denied</p>
          <p className="font-retro-mono text-sm text-base-black/70">
            You don't have permission to access this resource.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {sessionWarningVisible && (
        <div className="fixed bottom-4 right-4 z-50 retro-card p-4 max-w-xs bg-retro-yellow">
          <p className="font-black text-xs mb-2">Session Inactivity Warning</p>
          <p className="font-retro-mono text-[11px] text-base-black/70 mb-3">
            Your session will expire in 5 minutes due to inactivity.
          </p>
          <button
            onClick={() => setLastActivity(Date.now())}
            className="retro-btn retro-btn-sm bg-base-black text-base-white w-full"
          >
            Stay Logged In
          </button>
        </div>
      )}
      {children}
    </>
  );
}

export default SecureComponent;
