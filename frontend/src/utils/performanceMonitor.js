/**
 * Performance monitoring and profiling utilities
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.marks = new Map();
    this.isDev = import.meta.env.DEV;
  }

  /**
   * Create a performance mark
   */
  mark(name) {
    if (!this.isDev) return;
    performance.mark(name);
    this.marks.set(name, Date.now());
  }

  /**
   * Measure performance between marks
   */
  measure(name, startMark, endMark) {
    if (!this.isDev) return;

    try {
      performance.measure(name, startMark, endMark);
      const measure = performance.getEntriesByName(name)[0];
      this.metrics.set(name, measure.duration);
      this.logMetric(name, measure.duration);
    } catch (err) {
      console.warn(`Failed to measure ${name}:`, err);
    }
  }

  /**
   * Time async function execution
   */
  async timeAsync(name, fn) {
    const startMark = `${name}-start`;
    const endMark = `${name}-end`;

    this.mark(startMark);
    try {
      const result = await fn();
      this.mark(endMark);
      this.measure(name, startMark, endMark);
      return result;
    } catch (err) {
      this.mark(endMark);
      this.measure(name, startMark, endMark);
      throw err;
    }
  }

  /**
   * Time sync function execution
   */
  timeSync(name, fn) {
    const startMark = `${name}-start`;
    const endMark = `${name}-end`;

    this.mark(startMark);
    try {
      const result = fn();
      this.mark(endMark);
      this.measure(name, startMark, endMark);
      return result;
    } catch (err) {
      this.mark(endMark);
      this.measure(name, startMark, endMark);
      throw err;
    }
  }

  /**
   * Measure React component render time
   */
  measureComponent(componentName, renderFn) {
    return this.timeSync(`component-${componentName}-render`, renderFn);
  }

  /**
   * Track query performance
   */
  trackQuery(queryName, duration) {
    const key = `query-${queryName}`;
    if (!this.metrics.has(key)) {
      this.metrics.set(key, { total: 0, count: 0, max: 0, min: Infinity });
    }

    const stats = this.metrics.get(key);
    stats.total += duration;
    stats.count += 1;
    stats.max = Math.max(stats.max, duration);
    stats.min = Math.min(stats.min, duration);

    this.logMetric(key, duration, stats);
  }

  /**
   * Get metric statistics
   */
  getMetricStats(queryName) {
    return this.metrics.get(`query-${queryName}`);
  }

  /**
   * Get all metrics
   */
  getAllMetrics() {
    return Object.fromEntries(this.metrics);
  }

  /**
   * Clear metrics
   */
  clearMetrics() {
    this.metrics.clear();
    this.marks.clear();
  }

  /**
   * Log metric with color coding
   */
  logMetric(name, duration, stats = null) {
    if (!this.isDev) return;

    const color = this.getColorForDuration(duration);
    const suffix = stats ? ` (avg: ${(stats.total / stats.count).toFixed(2)}ms, count: ${stats.count})` : '';

    console.log(
      `%c⏱️  ${name}: ${duration.toFixed(2)}ms${suffix}`,
      `color: ${color}; font-weight: bold;`
    );
  }

  /**
   * Get color based on duration
   */
  getColorForDuration(duration) {
    if (duration < 100) return '#10b981'; // Green - fast
    if (duration < 500) return '#f59e0b'; // Yellow - moderate
    return '#ef4444'; // Red - slow
  }

  /**
   * Report Core Web Vitals
   */
  reportWebVitals() {
    if (!this.isDev) return;

    // Largest Contentful Paint (LCP)
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      console.log('%c📊 LCP:', 'color: #3b82f6; font-weight: bold;', `${lastEntry.renderTime || lastEntry.loadTime}ms`);
    });

    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      }
      console.log('%c📊 CLS:', 'color: #3b82f6; font-weight: bold;', clsValue.toFixed(3));
    });

    clsObserver.observe({ type: 'layout-shift', buffered: true });

    // First Input Delay (FID)
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const firstInput = entries[0];
      console.log('%c📊 FID:', 'color: #3b82f6; font-weight: bold;', `${firstInput.processingDuration}ms`);
    });

    fidObserver.observe({ type: 'first-input', buffered: true });
  }

  /**
   * Get page load time
   */
  getPageLoadTime() {
    if (!window.performance || !window.performance.timing) return null;

    const timing = window.performance.timing;
    return {
      dns: timing.domainLookupEnd - timing.domainLookupStart,
      tcp: timing.connectEnd - timing.connectStart,
      request: timing.responseStart - timing.requestStart,
      response: timing.responseEnd - timing.responseStart,
      dom: timing.domComplete - timing.domLoading,
      load: timing.loadEventEnd - timing.loadEventStart,
      total: timing.loadEventEnd - timing.navigationStart
    };
  }

  /**
   * Profile memory usage
   */
  getMemoryUsage() {
    if (!performance.memory) return null;

    return {
      usedJSHeapSize: (performance.memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
      totalJSHeapSize: (performance.memory.totalJSHeapSize / 1048576).toFixed(2) + ' MB',
      jsHeapSizeLimit: (performance.memory.jsHeapSizeLimit / 1048576).toFixed(2) + ' MB'
    };
  }

  /**
   * Generate performance report
   */
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      metrics: this.getAllMetrics(),
      pageLoadTime: this.getPageLoadTime(),
      memoryUsage: this.getMemoryUsage(),
      slowestOperations: this.getSlowestOperations(5)
    };

    return report;
  }

  /**
   * Get slowest operations
   */
  getSlowestOperations(count = 5) {
    const sorted = Array.from(this.metrics.entries())
      .map(([name, duration]) => ({ name, duration }))
      .sort((a, b) => {
        const durationA = typeof a.duration === 'number' ? a.duration : a.duration.total / a.duration.count;
        const durationB = typeof b.duration === 'number' ? b.duration : b.duration.total / b.duration.count;
        return durationB - durationA;
      })
      .slice(0, count);

    return sorted;
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics(format = 'json') {
    const report = this.generateReport();

    if (format === 'csv') {
      return this.reportToCSV(report);
    }

    return JSON.stringify(report, null, 2);
  }

  /**
   * Convert report to CSV
   */
  reportToCSV(report) {
    const lines = [
      `Timestamp,${report.timestamp}`,
      '',
      'Metrics',
      'Operation,Duration',
      ...Object.entries(report.metrics).map(([name, value]) => {
        const duration = typeof value === 'number' ? value : value.total / value.count;
        return `${name},${duration.toFixed(2)}`;
      }),
      '',
      'Page Load Time (ms)',
      'Phase,Duration',
      ...Object.entries(report.pageLoadTime || {}).map(([phase, duration]) =>
        `${phase},${duration}`
      )
    ];

    return lines.join('\n');
  }
}

export const performanceMonitor = new PerformanceMonitor();

export default performanceMonitor;
