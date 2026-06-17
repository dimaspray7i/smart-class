import { performanceMonitor } from '../utils/performanceMonitor';
import { activityLogger, LogLevel } from '../utils/activityLogger';

/**
 * Hook to monitor React Query performance
 */
export function useQueryPerformance() {
  return {
    /**
     * Create a query observer callback that tracks performance
     */
    createObserver: (queryName) => ({
      onSuccess: (data) => {
        // Log successful query
        activityLogger.log('QUERY_SUCCESS', {
          query: queryName,
          dataSize: JSON.stringify(data).length
        }, LogLevel.DEBUG);
      },
      onError: (error) => {
        // Log query error
        activityLogger.logError('QUERY_FAILED', error, {
          query: queryName
        });
      }
    }),

    /**
     * Track query execution time
     */
    trackQuery: (queryName, duration) => {
      performanceMonitor.trackQuery(queryName, duration);
    },

    /**
     * Get query stats
     */
    getQueryStats: (queryName) => {
      return performanceMonitor.getMetricStats(queryName);
    }
  };
}

/**
 * Hook to monitor mutation performance
 */
export function useMutationPerformance() {
  return {
    /**
     * Track mutation execution time
     */
    trackMutation: (mutationName, duration) => {
      performanceMonitor.trackQuery(`mutation-${mutationName}`, duration);
    },

    /**
     * Get mutation stats
     */
    getMutationStats: (mutationName) => {
      return performanceMonitor.getMetricStats(`mutation-${mutationName}`);
    }
  };
}

export default { useQueryPerformance, useMutationPerformance };
