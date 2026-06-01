import axios from "axios";

/**
 * Real Health Check Implementation
 * Faz verificações HTTP reais de serviços
 */

export interface HealthCheckConfig {
  region: string;
  endpoint: string;
  timeout: number;
  retries: number;
}

export interface HealthCheckResult {
  region: string;
  isHealthy: boolean;
  responseTime: number;
  statusCode?: number;
  error?: string;
  timestamp: number;
}

/**
 * Executar health check real em um endpoint
 */
export async function performRealHealthCheck(
  config: HealthCheckConfig
): Promise<HealthCheckResult> {
  const startTime = Date.now();
  let lastError: string | undefined;
  let statusCode: number | undefined;

  for (let attempt = 0; attempt < config.retries; attempt++) {
    try {
      const response = await axios.get(`${config.endpoint}/health`, {
        timeout: config.timeout,
        validateStatus: (status) => status < 500, // Aceita 2xx, 3xx, 4xx
      });

      const responseTime = Date.now() - startTime;
      statusCode = response.status;

      // Considera saudável se status 200-299
      const isHealthy = response.status >= 200 && response.status < 300;

      return {
        region: config.region,
        isHealthy,
        responseTime,
        statusCode,
        timestamp: Date.now(),
      };
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);

      // Aguarda antes de retry
      if (attempt < config.retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }

  const responseTime = Date.now() - startTime;

  return {
    region: config.region,
    isHealthy: false,
    responseTime,
    error: lastError,
    timestamp: Date.now(),
  };
}

/**
 * Health check em paralelo para múltiplas regiões
 */
export async function performMultiRegionHealthCheck(
  configs: HealthCheckConfig[]
): Promise<HealthCheckResult[]> {
  const results = await Promise.all(
    configs.map((config) => performRealHealthCheck(config))
  );

  return results;
}

/**
 * Determinar região saudável com menor latência
 */
export function selectHealthiestRegion(
  results: HealthCheckResult[]
): HealthCheckResult | null {
  const healthyRegions = results.filter((r) => r.isHealthy);

  if (healthyRegions.length === 0) {
    return null;
  }

  // Retorna a região com menor tempo de resposta
  return healthyRegions.reduce((prev, current) =>
    prev.responseTime < current.responseTime ? prev : current
  );
}

/**
 * Monitorar saúde contínua de regiões
 */
export class RegionHealthMonitor {
  private configs: HealthCheckConfig[];
  private results: Map<string, HealthCheckResult> = new Map();
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor(configs: HealthCheckConfig[]) {
    this.configs = configs;
  }

  /**
   * Iniciar monitoramento contínuo
   */
  start(intervalMs: number = 30000): void {
    if (this.monitoringInterval) {
      return; // Já está rodando
    }

    console.log(`[HealthMonitor] Iniciando monitoramento a cada ${intervalMs}ms`);

    // Fazer check inicial
    this.checkAll();

    // Agendar checks periódicos
    this.monitoringInterval = setInterval(() => {
      this.checkAll();
    }, intervalMs);
  }

  /**
   * Parar monitoramento
   */
  stop(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log("[HealthMonitor] Monitoramento parado");
    }
  }

  /**
   * Executar check em todas as regiões
   */
  private async checkAll(): Promise<void> {
    const results = await performMultiRegionHealthCheck(this.configs);

    for (const result of results) {
      this.results.set(result.region, result);
    }

    // Log de status
    const statusSummary = results
      .map((r) => `${r.region}: ${r.isHealthy ? "✓" : "✗"}`)
      .join(" | ");

    console.log(`[HealthMonitor] Status: ${statusSummary}`);
  }

  /**
   * Obter resultado mais recente de uma região
   */
  getRegionStatus(region: string): HealthCheckResult | undefined {
    return this.results.get(region);
  }

  /**
   * Obter todas as regiões saudáveis
   */
  getHealthyRegions(): HealthCheckResult[] {
    return Array.from(this.results.values()).filter((r) => r.isHealthy);
  }

  /**
   * Obter região mais saudável (menor latência)
   */
  getHealthiestRegion(): HealthCheckResult | null {
    const healthyRegions = this.getHealthyRegions();
    if (healthyRegions.length === 0) {
      return null;
    }

    return healthyRegions.reduce((prev, current) =>
      prev.responseTime < current.responseTime ? prev : current
    );
  }

  /**
   * Obter todas as regiões e seus status
   */
  getAllRegionStatus(): HealthCheckResult[] {
    return Array.from(this.results.values());
  }
}
