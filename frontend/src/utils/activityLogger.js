/**
 * Activity logging and monitoring for security auditing
 */

const LogLevel = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  CRITICAL: 'CRITICAL'
};

const ActivityType = {
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  VIEW: 'VIEW',
  DOWNLOAD: 'DOWNLOAD',
  EXPORT: 'EXPORT',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  ERROR: 'ERROR',
  SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY'
};

class ActivityLogger {
  constructor() {
    this.logs = [];
    this.maxLogs = 1000;
    this.isLocalStorageAvailable = this.checkLocalStorage();
  }

  checkLocalStorage() {
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Log an activity
   */
  log(activityType, details = {}, level = LogLevel.INFO) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: activityType,
      level,
      details,
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // Add to in-memory logs
    this.logs.push(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Store critical logs in localStorage for persistence
    if (level === LogLevel.CRITICAL || level === LogLevel.ERROR) {
      this.persistLog(logEntry);
    }

    // Console output in development
    if (import.meta.env.DEV) {
      console.log(`[${logEntry.level}] ${activityType}:`, logEntry);
    }

    return logEntry;
  }

  /**
   * Persist logs to localStorage
   */
  persistLog(logEntry) {
    if (!this.isLocalStorageAvailable) return;

    try {
      const key = 'rpl_activity_logs';
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      const updated = [...existing, logEntry].slice(-100); // Keep last 100
      localStorage.setItem(key, JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to persist log:', err);
    }
  }

  /**
   * Log user action
   */
  logUserAction(action, entity, entityId, result = 'success', details = {}) {
    return this.log(action, {
      entity,
      entityId,
      result,
      ...details
    }, LogLevel.INFO);
  }

  /**
   * Log authentication event
   */
  logAuthEvent(eventType, details = {}) {
    return this.log(eventType, {
      ...details
    }, LogLevel.INFO);
  }

  /**
   * Log permission denial
   */
  logPermissionDenied(resource, reason = '', details = {}) {
    return this.log(ActivityType.PERMISSION_DENIED, {
      resource,
      reason,
      ...details
    }, LogLevel.WARN);
  }

  /**
   * Log error
   */
  logError(context, error, details = {}) {
    return this.log(ActivityType.ERROR, {
      context,
      message: error?.message,
      code: error?.code,
      ...details
    }, LogLevel.ERROR);
  }

  /**
   * Log suspicious activity
   */
  logSuspiciousActivity(activity, details = {}) {
    return this.log(ActivityType.SUSPICIOUS_ACTIVITY, {
      activity,
      ...details
    }, LogLevel.CRITICAL);
  }

  /**
   * Get logs for a specific activity type
   */
  getLogsByType(type) {
    return this.logs.filter(log => log.type === type);
  }

  /**
   * Get logs within a time range
   */
  getLogsByTimeRange(startTime, endTime) {
    return this.logs.filter(log => {
      const logTime = new Date(log.timestamp);
      return logTime >= startTime && logTime <= endTime;
    });
  }

  /**
   * Get recent logs
   */
  getRecentLogs(count = 50) {
    return this.logs.slice(-count);
  }

  /**
   * Clear logs
   */
  clearLogs() {
    this.logs = [];
    if (this.isLocalStorageAvailable) {
      localStorage.removeItem('rpl_activity_logs');
    }
  }

  /**
   * Export logs
   */
  exportLogs(format = 'json') {
    if (format === 'csv') {
      return this.exportAsCSV(this.logs);
    }
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Export logs as CSV
   */
  exportAsCSV(logs) {
    const headers = ['timestamp', 'type', 'level', 'details', 'url'];
    const rows = logs.map(log => [
      log.timestamp,
      log.type,
      log.level,
      JSON.stringify(log.details),
      log.url
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csv;
  }

  /**
   * Detect and log suspicious patterns
   */
  detectSuspiciousActivity(userId, activityCount = null) {
    const recentLogs = this.getLogsByTimeRange(
      new Date(Date.now() - 5 * 60 * 1000), // Last 5 minutes
      new Date()
    );

    const errorCount = recentLogs.filter(l => l.level === LogLevel.ERROR).length;
    const deniedCount = recentLogs.filter(l => l.type === ActivityType.PERMISSION_DENIED).length;

    // Flag suspicious patterns
    if (errorCount > 10) {
      this.logSuspiciousActivity('HIGH_ERROR_RATE', { userId, errorCount });
      return true;
    }

    if (deniedCount > 5) {
      this.logSuspiciousActivity('MULTIPLE_PERMISSION_DENIALS', { userId, deniedCount });
      return true;
    }

    return false;
  }
}

// Singleton instance
export const activityLogger = new ActivityLogger();

export { LogLevel, ActivityType };
export default activityLogger;
