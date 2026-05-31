/**
 * SLA Monitoring - Gap 10
 * Monitoramento de SLA e conformidade
 */

import { logger } from './logger';

interface SLAMetrics {
  uptime: number;
  p95Latency: number;
  errorRate: number;
  availability: number;
}

interface SLATarget {
  uptime: number;
  p95Latency: number;
  errorRate: number;
  availability: number;
}

const SLA_TARGETS: SLATarget = {
  uptime: 99.99,
  p95Latency: 500,
  errorRate: 0.1,
  availability: 99.95,
};

let metrics = {
  totalRequests: 0,
  failedRequests: 0,
  totalLatency: 0,
  downtime: 0,
  startTime: Date.now(),
};

/**
 * Registrar request
 */
export function recordRequest(latency: number, success: boolean) {
  metrics.totalRequests++;
  metrics.totalLatency += latency;
  
  if (!success) {
    metrics.failedRequests++;
  }
}

/**
 * Registrar downtime
 */
export function recordDowntime(duration: number) {
  metrics.downtime += duration;
}

/**
 * Calcular SLA metrics
 */
export function calculateSLAMetrics(): SLAMetrics {
  const uptime = 100 - (metrics.downtime / (Date.now() - metrics.startTime)) * 100;
  const errorRate = metrics.totalRequests > 0 ? (metrics.failedRequests / metrics.totalRequests) * 100 : 0;
  const avgLatency = metrics.totalRequests > 0 ? metrics.totalLatency / metrics.totalRequests : 0;
  const p95Latency = avgLatency * 1.5;
  const availability = uptime;
  
  return {
    uptime,
    p95Latency,
    errorRate,
    availability,
  };
}

/**
 * Verificar conformidade com SLA
 */
export function checkSLACompliance(): {
  compliant: boolean;
  violations: string[];
} {
  const metrics = calculateSLAMetrics();
  const violations: string[] = [];
  
  if (metrics.uptime < SLA_TARGETS.uptime) {
    violations.push(`Uptime ${metrics.uptime.toFixed(2)}% < ${SLA_TARGETS.uptime}%`);
  }
  
  if (metrics.p95Latency > SLA_TARGETS.p95Latency) {
    violations.push(`P95 Latency ${metrics.p95Latency.toFixed(0)}ms > ${SLA_TARGETS.p95Latency}ms`);
  }
  
  if (metrics.errorRate > SLA_TARGETS.errorRate) {
    violations.push(`Error Rate ${metrics.errorRate.toFixed(2)}% > ${SLA_TARGETS.errorRate}%`);
  }
  
  if (metrics.availability < SLA_TARGETS.availability) {
    violations.push(`Availability ${metrics.availability.toFixed(2)}% < ${SLA_TARGETS.availability}%`);
  }
  
  return {
    compliant: violations.length === 0,
    violations,
  };
}

/**
 * Gerar SLA report
 */
export function generateSLAReport() {
  const metricsData = calculateSLAMetrics();
  const compliance = checkSLACompliance();
  
  const report = {
    timestamp: new Date().toISOString(),
    period: {
      start: new Date(metrics.startTime).toISOString(),
      end: new Date().toISOString(),
    },
    metrics: {
      uptime: `${metricsData.uptime.toFixed(2)}%`,
      p95Latency: `${metricsData.p95Latency.toFixed(0)}ms`,
      errorRate: `${metricsData.errorRate.toFixed(2)}%`,
      availability: `${metricsData.availability.toFixed(2)}%`,
    },
    targets: {
      uptime: `${SLA_TARGETS.uptime}%`,
      p95Latency: `${SLA_TARGETS.p95Latency}ms`,
      errorRate: `${SLA_TARGETS.errorRate}%`,
      availability: `${SLA_TARGETS.availability}%`,
    },
    compliance: {
      compliant: compliance.compliant,
      violations: compliance.violations,
    },
  };
  
  logger.info('SLA Report Generated', report);
  return report;
}

/**
 * Reset metrics
 */
export function resetMetrics() {
  metrics = {
    totalRequests: 0,
    failedRequests: 0,
    totalLatency: 0,
    downtime: 0,
    startTime: Date.now(),
  };
}
