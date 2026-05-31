# Implementation Kit - Gap 3: Health Checks Granulares

**Status:** Pronto para Implementação  
**Tempo Estimado:** 4 horas  
**Dificuldade:** Média  
**Dependências:** Nenhuma

---

## 📋 Checklist de Implementação

- [ ] Criar `server/_core/healthChecks.ts`
- [ ] Criar `server/_core/healthRouter.ts`
- [ ] Integrar em `server/routers.ts`
- [ ] Criar testes em `server/_core/healthChecks.test.ts`
- [ ] Testar endpoints `/api/trpc/health.live`, `/api/trpc/health.ready`
- [ ] Configurar Kubernetes deployment (opcional)
- [ ] Commit: `git commit -m "feat: implement health checks"`

---

## 📝 Passo 1: Criar Health Checks Service

**Arquivo:** `server/_core/healthChecks.ts`

```typescript
import { getDb } from '../db';
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
    redis?: HealthCheckResult;
    llm?: HealthCheckResult;
    s3?: HealthCheckResult;
    elasticsearch?: HealthCheckResult;
  };
}

/**
 * Verificar saúde do banco de dados
 */
export async function checkDatabase(): Promise<HealthCheckResult> {
  const start = Date.now();
  try {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    
    // Executar query simples
    await db.query.users.findFirst({ limit: 1 });
    
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
    const response = await fetch(
      (process.env.BUILT_IN_FORGE_API_URL || 'http://localhost:3000') + '/health',
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.BUILT_IN_FORGE_API_KEY || ''}`,
        },
        signal: AbortSignal.timeout(5000),
      }
    );
    
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
```

---

## 📝 Passo 2: Criar Health Router

**Arquivo:** `server/_core/healthRouter.ts`

```typescript
import { router, publicProcedure } from './trpc';
import {
  getLivenessStatus,
  getReadinessStatus,
  getDetailedHealth,
} from './healthChecks';

export const healthRouter = router({
  /**
   * Liveness Probe - Kubernetes usa para saber se está vivo
   */
  live: publicProcedure.query(async () => {
    return await getLivenessStatus();
  }),
  
  /**
   * Readiness Probe - Kubernetes usa para saber se pronto para tráfego
   */
  ready: publicProcedure.query(async () => {
    return await getReadinessStatus();
  }),
  
  /**
   * Detailed Health - Dashboard de monitoramento
   */
  detailed: publicProcedure.query(async () => {
    return await getDetailedHealth();
  }),
});
```

---

## 📝 Passo 3: Integrar no Router Principal

**Arquivo:** `server/routers.ts` (adicionar)

```typescript
import { healthRouter } from './_core/healthRouter';

export const appRouter = router({
  health: healthRouter,
  // ... resto dos routers
});
```

---

## 📝 Passo 4: Criar Testes

**Arquivo:** `server/_core/healthChecks.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { 
  checkDatabase, 
  checkLLM, 
  getLivenessStatus, 
  getReadinessStatus,
  getDetailedHealth 
} from './healthChecks';

describe('Health Checks', () => {
  beforeEach(() => {
    // Setup
  });

  describe('Liveness Probe', () => {
    it('should return alive status', async () => {
      const status = await getLivenessStatus();
      expect(status.status).toBe('alive');
      expect(status.timestamp).toBeGreaterThan(0);
    });
  });

  describe('Readiness Probe', () => {
    it('should return readiness status', async () => {
      const status = await getReadinessStatus();
      expect(status).toHaveProperty('status');
      expect(status).toHaveProperty('checks');
      expect(status).toHaveProperty('uptime');
    });

    it('should include database check', async () => {
      const status = await getReadinessStatus();
      expect(status.checks).toHaveProperty('database');
    });
  });

  describe('Detailed Health', () => {
    it('should return detailed health info', async () => {
      const health = await getDetailedHealth();
      expect(health).toHaveProperty('version');
      expect(health).toHaveProperty('environment');
      expect(health).toHaveProperty('memory');
      expect(health).toHaveProperty('cpu');
      expect(health).toHaveProperty('checks');
    });

    it('should include memory metrics', async () => {
      const health = await getDetailedHealth();
      expect(health.memory).toHaveProperty('rss');
      expect(health.memory).toHaveProperty('heapUsed');
      expect(health.memory).toHaveProperty('heapTotal');
    });
  });
});
```

---

## 🧪 Passo 5: Testar

```bash
# Executar testes
pnpm test server/_core/healthChecks.test.ts

# Testar endpoints em desenvolvimento
curl http://localhost:3000/api/trpc/health.live
curl http://localhost:3000/api/trpc/health.ready
curl http://localhost:3000/api/trpc/health.detailed
```

---

## 🚀 Passo 6: Kubernetes Configuration (Opcional)

**Arquivo:** `k8s/deployment.yaml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: evolumix-copilot
spec:
  replicas: 3
  selector:
    matchLabels:
      app: evolumix-copilot
  template:
    metadata:
      labels:
        app: evolumix-copilot
    spec:
      containers:
      - name: copilot
        image: evolumix-360-copilot:2.0.0
        ports:
        - containerPort: 3000
        
        # Liveness Probe
        livenessProbe:
          httpGet:
            path: /api/trpc/health.live
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        
        # Readiness Probe
        readinessProbe:
          httpGet:
            path: /api/trpc/health.ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 2
        
        # Startup Probe
        startupProbe:
          httpGet:
            path: /api/trpc/health.live
            port: 3000
          initialDelaySeconds: 0
          periodSeconds: 10
          timeoutSeconds: 3
          failureThreshold: 30
        
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
```

---

## ✅ Validação

- [ ] Testes passando (100%)
- [ ] `/api/trpc/health.live` retornando 200
- [ ] `/api/trpc/health.ready` retornando status correto
- [ ] `/api/trpc/health.detailed` mostrando métricas
- [ ] Kubernetes conseguindo usar probes

---

## 📊 Métricas Esperadas

| Métrica | Esperado |
|---------|----------|
| Liveness Latency | < 10ms |
| Readiness Latency | < 100ms |
| Detailed Latency | < 200ms |
| Database Check | < 50ms |
| LLM Check | < 5000ms |

---

## 🔗 Próximo Gap

Após completar este gap, prosseguir para **Gap 4: Circuit Breaker Pattern**

