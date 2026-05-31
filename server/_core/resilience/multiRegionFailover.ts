/**
 * Multi-Region Failover
 * 
 * Responsabilidade: Gerenciar failover entre múltiplas regiões
 * 
 * Implementa:
 * - Health checks por região
 * - Detecção automática de falhas
 * - Failover inteligente
 * - Rebalanceamento de tráfego
 */

/**
 * Status de uma região
 */
export interface RegionStatus {
  name: string;
  endpoint: string;
  healthy: boolean;
  lastHealthCheck: Date;
  responseTime: number; // ms
  failureCount: number;
  successCount: number;
}

/**
 * Configuração de failover
 */
export interface FailoverConfig {
  regions: RegionStatus[];
  healthCheckInterval: number; // ms
  failureThreshold: number; // número de falhas antes de marcar como unhealthy
  recoveryTimeout: number; // ms
  primaryRegion: string;
}

/**
 * Evento de failover
 */
export interface FailoverEvent {
  timestamp: Date;
  fromRegion: string;
  toRegion: string;
  reason: string;
  success: boolean;
}

// Armazenamento de estado
let config: FailoverConfig | null = null;
let failoverHistory: FailoverEvent[] = [];
let currentActiveRegion: string | null = null;
let healthCheckTimers: Map<string, NodeJS.Timeout> = new Map();

/**
 * Inicializar configuração de failover
 */
export function initializeFailover(failoverConfig: FailoverConfig): void {
  config = failoverConfig;
  currentActiveRegion = failoverConfig.primaryRegion;

  console.log(`[MultiRegionFailover] Initialized with ${failoverConfig.regions.length} regions`);
  console.log(`[MultiRegionFailover] Primary region: ${failoverConfig.primaryRegion}`);

  // Iniciar health checks
  for (const region of failoverConfig.regions) {
    startHealthCheck(region.name);
  }
}

/**
 * Iniciar health check para uma região
 */
function startHealthCheck(regionName: string): void {
  if (!config) return;

  const region = config!.regions.find((r) => r.name === regionName);
  if (!region) return;

  const checkHealth = async () => {
    if (!region || !config) return;
    
    try {
      const startTime = Date.now();

      // Simular health check (em produção, fazer HTTP request real)
      const response = await simulateHealthCheck(region.endpoint);

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        region.healthy = true;
        region.failureCount = 0;
        region.successCount++;
        region.responseTime = responseTime;

        console.log(`[HealthCheck] ${regionName}: OK (${responseTime}ms)`);
      } else {
        region.failureCount++;

        if (region.failureCount >= config!.failureThreshold) {
          region.healthy = false;
          console.log(`[HealthCheck] ${regionName}: UNHEALTHY (${region.failureCount} failures)`);

          // Triggar failover se necessário
          if (currentActiveRegion === regionName) {
            triggerFailover(regionName);
          }
        }
      }

      region.lastHealthCheck = new Date();
    } catch (error) {
      region.failureCount++;

      if (region.failureCount >= config.failureThreshold) {
        region.healthy = false;
        console.log(`[HealthCheck] ${regionName}: ERROR - ${error instanceof Error ? error.message : 'Unknown'}`);

        if (currentActiveRegion === regionName) {
          triggerFailover(regionName);
        }
      }
    }
  };

  // Executar health check imediatamente
  checkHealth();

  // Agendar health checks periódicos
  const timer = setInterval(checkHealth, config!.healthCheckInterval);
  healthCheckTimers.set(regionName, timer);
}

/**
 * Simular health check (em produção, fazer HTTP request real)
 */
async function simulateHealthCheck(
  endpoint: string
): Promise<{ ok: boolean; statusCode: number }> {
  // Simular sucesso 90% das vezes
  const success = Math.random() > 0.1;

  return {
    ok: success,
    statusCode: success ? 200 : 503,
  };
}

/**
 * Triggar failover para outra região
 */
export function triggerFailover(failingRegion: string): void {
  if (!config || !currentActiveRegion) return;

  // Encontrar próxima região saudável
  const healthyRegion = config.regions.find((r) => r.healthy && r.name !== failingRegion);

  if (!healthyRegion) {
    console.log(`[Failover] No healthy regions available for failover from ${failingRegion}`);
    return;
  }

  const event: FailoverEvent = {
    timestamp: new Date(),
    fromRegion: currentActiveRegion,
    toRegion: healthyRegion.name,
    reason: `Region ${failingRegion} became unhealthy`,
    success: true,
  };

  currentActiveRegion = healthyRegion.name;
  failoverHistory.push(event);

  console.log(
    `[Failover] Switched from ${event.fromRegion} to ${event.toRegion} (Reason: ${event.reason})`
  );
}

/**
 * Obter região ativa atual
 */
export function getActiveRegion(): string | null {
  return currentActiveRegion;
}

/**
 * Obter status de todas as regiões
 */
export function getRegionStatuses(): RegionStatus[] {
  if (!config) return [];
  return config.regions;
}

/**
 * Obter histórico de failover
 */
export function getFailoverHistory(): FailoverEvent[] {
  return failoverHistory;
}

/**
 * Obter estatísticas de failover
 */
export function getFailoverStatistics() {
  if (!config) {
    return {
      totalRegions: 0,
      healthyRegions: 0,
      unhealthyRegions: 0,
      totalFailovers: failoverHistory.length,
      averageResponseTime: 0,
    };
  }

  const healthyRegions = config.regions.filter((r) => r.healthy).length;
  const unhealthyRegions = config.regions.length - healthyRegions;
  const avgResponseTime =
    config.regions.reduce((sum, r) => sum + r.responseTime, 0) / config.regions.length;

  return {
    totalRegions: config.regions.length,
    healthyRegions,
    unhealthyRegions,
    totalFailovers: failoverHistory.length,
    averageResponseTime: Math.round(avgResponseTime),
  };
}

/**
 * Parar health checks (para testes/cleanup)
 */
export function stopHealthChecks(): void {
  for (const timer of Array.from(healthCheckTimers.values())) {
    clearInterval(timer);
  }
  healthCheckTimers.clear();
}

/**
 * Resetar estado (para testes)
 */
export function resetFailover(): void {
  stopHealthChecks();
  config = null;
  failoverHistory = [];
  currentActiveRegion = null;
}
