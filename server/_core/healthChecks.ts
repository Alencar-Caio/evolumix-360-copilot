/**
 * Health Checks Granulares - Gap 3
 * Liveness, Readiness, Detailed probes para Kubernetes
 */

import { logger } from './logger';

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency: number;
  details?: any;
}

interface HealthStatus {
  status: 'alive' | 'ready' | 'not-ready';
  timestamp: number;
  uptime: number;
  checks: {
    database: HealthCheckResult;
    llm?: HealthCheckResult;
  };
}

/**
 * Verificar saúde do banco de dados
 */
export async function checkDatabase(): Promise<HealthCheckResult> {
  const start = Date.now();
  try {
    // Simular check de banco de dados
    // Em produção, executar query simples
    await new Promise(resolve => setTimeout(resolve, 10));
    
    return {
      status: 'healthy',
      latency: Date.now() - start,
    };
  } catch (error) {
    logger.error('Database health check failed', { error });
    return {
      status: 'unhealthy',
      latency: Date.now() - start,
      details: { error: (error as Error).message },
    };
  }
}

/**
 * Verificar saúde do LLM
 */
export async function checkLLM(): Promise<HealthCheckResult> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(
      (process.env.BUILT_IN_FORGE_API_URL || 'http://localhost:3000') + '/health',
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.BUILT_IN_FORGE_API_KEY || ''}`,
        },
        signal: controller.signal,
      }
    );
    
    clearTimeout(timeout);
    
    if (!response.ok) {
      throw new Error(`LLM returned ${response.status}`);
    }
    
    return {
      status: 'healthy',
      latency: Date.now() - start,
    };
  } catch (error) {
    logger.error('LLM health check failed', { error });
    return {
      status: 'unhealthy',
      latency: Date.now() - start,
      details: { error: (error as Error).message },
    };
  }
}

/**
 * Liveness Probe - Está vivo?
 */
export async function getLivenessStatus(): Promise<{ status: 'alive'; timestamp: number }> {
  return {
    status: 'alive',
    timestamp: Date.now(),
  };
}

/**
 * Readiness Probe - Pronto para receber tráfego?
 */
export async function getReadinessStatus(): Promise<HealthStatus> {
  const checks = {
    database: await checkDatabase(),
    llm: await checkLLM(),
  };
  
  const anyUnhealthy = Object.values(checks).some(c => c.status === 'unhealthy');
  
  return {
    status: anyUnhealthy ? 'not-ready' : 'ready',
    timestamp: Date.now(),
    uptime: process.uptime(),
    checks,
  };
}

/**
 * Detailed Health Status
 */
export async function getDetailedHealth(): Promise<any> {
  const readiness = await getReadinessStatus();
  
  return {
    version: '2.0.0',
    environment: process.env.NODE_ENV,
    uptime: process.uptime(),
    timestamp: Date.now(),
    memory: {
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
      heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
    },
    cpu: process.cpuUsage(),
    checks: readiness.checks,
    status: readiness.status,
  };
}
