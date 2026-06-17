import React, { useEffect, useCallback } from 'react';
import { performanceMonitor } from '../utils/performanceMonitor';
import { activityLogger } from '../utils/activityLogger';

export const PerformanceContext = React.createContext(null);

export function PerformanceProvider({ children }) {
  useEffect(() => {
    // Initialize performance monitoring
    performanceMonitor.mark('app-start');

    // Report Web Vitals
    if (import.meta.env.DEV) {
      performanceMonitor.reportWebVitals();
    }

    // Cleanup on unmount
    return () => {
      performanceMonitor.mark('app-end');
      performanceMonitor.measure('app-lifetime', 'app-start', 'app-end');
    };
  }, []);

  // Monitor page visibility and log when user returns to tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        activityLogger.log('PAGE_HIDDEN', {}, 'DEBUG');
      } else {
        activityLogger.log('PAGE_VISIBLE', {}, 'DEBUG');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const value = {
    performanceMonitor,
    reportMetrics: useCallback(() => {
      return performanceMonitor.generateReport();
    }, []),
    exportMetrics: useCallback((format) => {
      return performanceMonitor.exportMetrics(format);
    }, [])
  };

  return (
    <PerformanceContext.Provider value={value}>
      {children}
    </PerformanceContext.Provider>
  );
}

export function usePerformance() {
  const context = React.useContext(PerformanceContext);
  if (!context) {
    throw new Error('usePerformance must be used within PerformanceProvider');
  }
  return context;
}

export default PerformanceProvider;
