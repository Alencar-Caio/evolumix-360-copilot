import { describe, it, expect, beforeEach } from 'vitest';
import { performanceMonitor } from './performanceBaseline';

describe('Performance Baseline', () => {
  beforeEach(() => {
    performanceMonitor.clear();
  });

  it('should record metrics', () => {
    performanceMonitor.recordMetric('test-op', 100);
    performanceMonitor.recordMetric('test-op', 110);
    performanceMonitor.recordMetric('test-op', 90);

    const exported = performanceMonitor.exportMetrics();
    expect(exported['test-op']).toHaveLength(3);
  });

  it('should calculate baseline percentiles', () => {
    for (let i = 0; i < 100; i++) {
      performanceMonitor.recordMetric('api-call', 50 + Math.random() * 50);
    }

    const baseline = performanceMonitor.calculateBaseline();
    expect(baseline['api-call']).toBeDefined();
    expect(baseline['api-call'].p50).toBeGreaterThan(0);
    expect(baseline['api-call'].p95).toBeGreaterThanOrEqual(baseline['api-call'].p50);
    expect(baseline['api-call'].p99).toBeGreaterThanOrEqual(baseline['api-call'].p95);
  });

  it('should detect regressions', () => {
    // Create baseline
    for (let i = 0; i < 50; i++) {
      performanceMonitor.recordMetric('slow-op', 100);
    }
    performanceMonitor.calculateBaseline();

    // Simulate regression
    for (let i = 0; i < 50; i++) {
      performanceMonitor.recordMetric('slow-op', 250); // 2.5x slower
    }

    const regressions = performanceMonitor.detectRegressions();
    const regression = regressions.find((r) => r.metric === 'slow-op');
    expect(regression?.isRegression).toBe(true);
    expect(regression?.degradation).toBeGreaterThan(1.2);
  });

  it('should validate thresholds', () => {
    performanceMonitor.recordMetric('fast-op', 50, 100);
    performanceMonitor.recordMetric('slow-op', 150, 100);

    const violations = performanceMonitor.validateThresholds();
    expect(violations).toHaveLength(1);
    expect(violations[0].metric).toBe('slow-op');
    expect(violations[0].exceeded).toBe(true);
  });

  it('should measure async functions', async () => {
    const result = await performanceMonitor.measureAsync('async-op', async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return 'done';
    });

    expect(result).toBe('done');
    const exported = performanceMonitor.exportMetrics();
    expect(exported['async-op']).toHaveLength(1);
    expect(exported['async-op'][0].duration).toBeGreaterThanOrEqual(10);
  });

  it('should measure sync functions', () => {
    const result = performanceMonitor.measureSync('sync-op', () => {
      let sum = 0;
      for (let i = 0; i < 1000; i++) {
        sum += i;
      }
      return sum;
    });

    expect(result).toBe(499500);
    const exported = performanceMonitor.exportMetrics();
    expect(exported['sync-op']).toHaveLength(1);
  });

  it('should generate performance report', () => {
    performanceMonitor.recordMetric('op1', 100);
    performanceMonitor.recordMetric('op2', 200);
    performanceMonitor.calculateBaseline();

    const report = performanceMonitor.getReport();
    expect(report.baseline).toBeDefined();
    expect(report.regressions).toBeDefined();
    expect(report.violations).toBeDefined();
    expect(report.totalMetrics).toBe(2);
    expect(report.totalSamples).toBe(2);
  });

  it('should handle multiple operations', () => {
    const operations = ['db-query', 'cache-hit', 'api-call', 'cpu-intensive'];

    for (const op of operations) {
      for (let i = 0; i < 10; i++) {
        performanceMonitor.recordMetric(op, Math.random() * 100);
      }
    }

    const baseline = performanceMonitor.calculateBaseline();
    expect(Object.keys(baseline)).toHaveLength(4);

    for (const op of operations) {
      expect(baseline[op].samples).toBe(10);
      expect(baseline[op].mean).toBeGreaterThan(0);
      expect(baseline[op].min).toBeLessThanOrEqual(baseline[op].mean);
      expect(baseline[op].max).toBeGreaterThanOrEqual(baseline[op].mean);
    }
  });

  it('should clear metrics', () => {
    performanceMonitor.recordMetric('test', 100);
    expect(performanceMonitor.exportMetrics()['test']).toHaveLength(1);

    performanceMonitor.clear();
    expect(Object.keys(performanceMonitor.exportMetrics())).toHaveLength(0);
  });

  it('should handle empty metrics gracefully', () => {
    const baseline = performanceMonitor.calculateBaseline();
    expect(Object.keys(baseline)).toHaveLength(0);

    const regressions = performanceMonitor.detectRegressions();
    expect(regressions).toHaveLength(0);

    const violations = performanceMonitor.validateThresholds();
    expect(violations).toHaveLength(0);
  });

  it('should track metric statistics correctly', () => {
    const values = [10, 20, 30, 40, 50];
    for (const val of values) {
      performanceMonitor.recordMetric('stats-test', val);
    }

    const baseline = performanceMonitor.calculateBaseline();
    const stats = baseline['stats-test'];

    expect(stats.min).toBe(10);
    expect(stats.max).toBe(50);
    expect(stats.mean).toBe(30);
    expect(stats.p50).toBe(30);
    expect(stats.samples).toBe(5);
  });
});
