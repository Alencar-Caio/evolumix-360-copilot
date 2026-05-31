/**
 * Performance Baseline & Regression Testing
 * 
 * Monitora performance e detecta regressões
 */

import { performance } from 'perf_hooks';

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  threshold?: number;
}

interface PerformanceBaseline {
  [key: string]: {
    p50: number;
    p95: number;
    p99: number;
    mean: number;
    min: number;
    max: number;
    samples: number;
  };
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private baseline: PerformanceBaseline = {};
  private regressionThreshold = 1.2; // 20% degradation

  /**
   * Registrar métrica de performance
   */
  recordMetric(name: string, duration: number, threshold?: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    this.metrics.get(name)!.push({
      name,
      duration,
      timestamp: Date.now(),
      threshold,
    });
  }

  /**
   * Medir execução de função
   */
  async measureAsync<T>(name: string, fn: () => Promise<T>, threshold?: number): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      this.recordMetric(name, duration, threshold);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.recordMetric(name, duration, threshold);
      throw error;
    }
  }

  /**
   * Medir execução síncrona
   */
  measureSync<T>(name: string, fn: () => T, threshold?: number): T {
    const start = performance.now();
    try {
      const result = fn();
      const duration = performance.now() - start;
      this.recordMetric(name, duration, threshold);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.recordMetric(name, duration, threshold);
      throw error;
    }
  }

  /**
   * Calcular baseline de performance
   */
  calculateBaseline(): PerformanceBaseline {
    const baseline: PerformanceBaseline = {};

    for (const [name, metrics] of Array.from(this.metrics.entries())) {
      if (metrics.length === 0) continue;

      const durations = metrics.map((m: PerformanceMetric) => m.duration).sort((a: number, b: number) => a - b);
      const sum = durations.reduce((a: number, b: number) => a + b, 0);

      baseline[name] = {
        p50: durations[Math.floor(durations.length * 0.5)],
        p95: durations[Math.floor(durations.length * 0.95)],
        p99: durations[Math.floor(durations.length * 0.99)],
        mean: sum / durations.length,
        min: durations[0],
        max: durations[durations.length - 1],
        samples: durations.length,
      };
    }

    this.baseline = baseline;
    return baseline;
  }

  /**
   * Detectar regressões
   */
  detectRegressions(): Array<{
    metric: string;
    currentMean: number;
    baselineMean: number;
    degradation: number;
    isRegression: boolean;
  }> {
    const regressions = [];

    for (const [name, currentMetrics] of Array.from(this.metrics.entries())) {
      if (!this.baseline[name] || currentMetrics.length === 0) continue;

      const baselineData = this.baseline[name];
      const currentDurations = currentMetrics.map((m) => m.duration);
      const currentMean = currentDurations.reduce((a, b) => a + b, 0) / currentDurations.length;

      const degradation = currentMean / baselineData.mean;
      const isRegression = degradation > this.regressionThreshold;

      regressions.push({
        metric: name,
        currentMean,
        baselineMean: baselineData.mean,
        degradation,
        isRegression,
      });
    }

    return regressions;
  }

  /**
   * Validar threshold de performance
   */
  validateThresholds(): Array<{
    metric: string;
    duration: number;
    threshold: number;
    exceeded: boolean;
  }> {
    const violations = [];

    for (const [name, metrics] of Array.from(this.metrics.entries())) {
      for (const metric of metrics) {
        if (metric.threshold && metric.duration > metric.threshold) {
          violations.push({
            metric: name,
            duration: metric.duration,
            threshold: metric.threshold,
            exceeded: true,
          });
        }
      }
    }

    return violations;
  }

  /**
   * Obter relatório de performance
   */
  getReport() {
    return {
      baseline: this.baseline,
      regressions: this.detectRegressions(),
      violations: this.validateThresholds(),
      totalMetrics: this.metrics.size,
      totalSamples: Array.from(this.metrics.values()).reduce((sum, m) => sum + m.length, 0),
    };
  }

  /**
   * Limpar métricas
   */
  clear() {
    this.metrics.clear();
    this.baseline = {};
  }

  /**
   * Exportar métricas para análise
   */
  exportMetrics() {
    const exported: Record<string, PerformanceMetric[]> = {};
    for (const [name, metrics] of Array.from(this.metrics.entries())) {
      exported[name] = metrics;
    }
    return exported;
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Decorator para medir performance de métodos
 */
export function Measure(threshold?: number) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const metricName = `${target.constructor.name}.${propertyKey}`;
      return performanceMonitor.measureAsync(metricName, () => originalMethod.apply(this, args), threshold);
    };

    return descriptor;
  };
}

export type { PerformanceMetric, PerformanceBaseline };
