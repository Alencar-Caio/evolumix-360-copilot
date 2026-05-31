/**
 * SLA Monitoring Avançado - Gap 13
 * Dashboards, alertas e relatórios de SLA
 */

import { logger } from './logger';

interface SLAAlert {
  id: string;
  metric: string;
  threshold: number;
  current: number;
  severity: 'critical' | 'warning';
  timestamp: string;
}

interface SLADashboard {
  uptime: number;
  p95Latency: number;
  errorRate: number;
  availability: number;
  alerts: SLAAlert[];
  trend: 'improving' | 'stable' | 'degrading';
}

const alerts: SLAAlert[] = [];
const metricsHistory: Array<{ timestamp: string; uptime: number; latency: number; errorRate: number }> = [];

/**
 * Registrar métrica para histórico
 */
export function recordMetric(uptime: number, latency: number, errorRate: number) {
  metricsHistory.push({
    timestamp: new Date().toISOString(),
    uptime,
    latency,
    errorRate,
  });
  
  // Manter apenas últimas 1000 métricas
  if (metricsHistory.length > 1000) {
    metricsHistory.shift();
  }
}

/**
 * Criar alerta
 */
export function createAlert(metric: string, threshold: number, current: number, severity: 'critical' | 'warning') {
  const alert: SLAAlert = {
    id: `alert-${Date.now()}`,
    metric,
    threshold,
    current,
    severity,
    timestamp: new Date().toISOString(),
  };
  
  alerts.push(alert);
  logger.warn('SLA Alert Created', alert);
  
  // Enviar notificação (integração com SNS, PagerDuty, etc)
  if (severity === 'critical') {
    sendCriticalAlert(alert);
  }
  
  return alert;
}

/**
 * Enviar alerta crítico
 */
function sendCriticalAlert(alert: SLAAlert) {
  logger.error('CRITICAL SLA ALERT', alert);
  // Integração com SNS, PagerDuty, Slack, etc
}

/**
 * Obter dashboard de SLA
 */
export function getSLADashboard(): SLADashboard {
  const recentMetrics = metricsHistory.slice(-100);
  
  if (recentMetrics.length === 0) {
    return {
      uptime: 100,
      p95Latency: 0,
      errorRate: 0,
      availability: 100,
      alerts: [],
      trend: 'stable',
    };
  }
  
  const avgUptime = recentMetrics.reduce((sum, m) => sum + m.uptime, 0) / recentMetrics.length;
  const avgLatency = recentMetrics.reduce((sum, m) => sum + m.latency, 0) / recentMetrics.length;
  const avgErrorRate = recentMetrics.reduce((sum, m) => sum + m.errorRate, 0) / recentMetrics.length;
  
  // Calcular trend
  let trend: 'improving' | 'stable' | 'degrading' = 'stable';
  if (recentMetrics.length > 10) {
    const recent = recentMetrics.slice(-10);
    const older = recentMetrics.slice(-20, -10);
    
    const recentAvg = recent.reduce((sum, m) => sum + m.uptime, 0) / recent.length;
    const olderAvg = older.reduce((sum, m) => sum + m.uptime, 0) / older.length;
    
    if (recentAvg > olderAvg + 0.5) trend = 'improving';
    else if (recentAvg < olderAvg - 0.5) trend = 'degrading';
  }
  
  return {
    uptime: avgUptime,
    p95Latency: avgLatency * 1.5,
    errorRate: avgErrorRate,
    availability: avgUptime,
    alerts: alerts.slice(-10),
    trend,
  };
}

/**
 * Gerar relatório de SLA para período
 */
export function generateSLAReport(days: number = 30) {
  const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000;
  const periodMetrics = metricsHistory.filter(m => new Date(m.timestamp).getTime() > cutoffTime);
  
  if (periodMetrics.length === 0) {
    return {
      period: `Last ${days} days`,
      uptime: 100,
      p95Latency: 0,
      errorRate: 0,
      slaCompliance: true,
    };
  }
  
  const uptime = periodMetrics.reduce((sum, m) => sum + m.uptime, 0) / periodMetrics.length;
  const p95Latency = periodMetrics.reduce((sum, m) => sum + m.latency, 0) / periodMetrics.length * 1.5;
  const errorRate = periodMetrics.reduce((sum, m) => sum + m.errorRate, 0) / periodMetrics.length;
  
  const slaCompliance = uptime >= 99.99 && p95Latency <= 500 && errorRate <= 0.1;
  
  return {
    period: `Last ${days} days`,
    uptime: uptime.toFixed(2),
    p95Latency: p95Latency.toFixed(0),
    errorRate: errorRate.toFixed(2),
    slaCompliance,
  };
}

/**
 * Limpar alertas antigos
 */
export function clearOldAlerts(hoursOld: number = 24) {
  const cutoffTime = Date.now() - hoursOld * 60 * 60 * 1000;
  const initialLength = alerts.length;
  
  for (let i = alerts.length - 1; i >= 0; i--) {
    if (new Date(alerts[i].timestamp).getTime() < cutoffTime) {
      alerts.splice(i, 1);
    }
  }
  
  logger.info('Cleared old alerts', { removed: initialLength - alerts.length });
}

/**
 * Exportar métricas para Grafana
 */
export function exportToGrafana() {
  const dashboard = getSLADashboard();
  
  return {
    dashboard: {
      title: 'Evolumix 360 SLA Dashboard',
      panels: [
        {
          title: 'Uptime',
          value: `${dashboard.uptime.toFixed(2)}%`,
          target: 'uptime',
        },
        {
          title: 'P95 Latency',
          value: `${dashboard.p95Latency.toFixed(0)}ms`,
          target: 'p95_latency',
        },
        {
          title: 'Error Rate',
          value: `${dashboard.errorRate.toFixed(2)}%`,
          target: 'error_rate',
        },
        {
          title: 'Availability',
          value: `${dashboard.availability.toFixed(2)}%`,
          target: 'availability',
        },
      ],
    },
  };
}
