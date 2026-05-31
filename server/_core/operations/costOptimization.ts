/**
 * Cost Optimization Dashboard
 * 
 * Responsabilidade: Monitorar e otimizar custos operacionais
 * 
 * Implementa:
 * - Rastreamento de custos por serviço
 * - Análise de desperdício
 * - Recomendações de otimização
 * - Projeção de custos
 */

/**
 * Métrica de custo
 */
export interface CostMetric {
  service: string;
  date: Date;
  cost: number; // em USD
  unit: string; // GB, requests, hours, etc
  quantity: number;
}

/**
 * Análise de custo
 */
export interface CostAnalysis {
  period: 'daily' | 'weekly' | 'monthly';
  startDate: Date;
  endDate: Date;
  totalCost: number;
  costByService: Map<string, number>;
  topExpensiveServices: ServiceCost[];
  trends: CostTrend[];
}

/**
 * Custo por serviço
 */
export interface ServiceCost {
  service: string;
  cost: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
}

/**
 * Tendência de custo
 */
export interface CostTrend {
  date: Date;
  cost: number;
  changePercent: number;
}

/**
 * Recomendação de otimização
 */
export interface OptimizationRecommendation {
  id: string;
  service: string;
  title: string;
  description: string;
  estimatedSavings: number; // USD por mês
  priority: 'high' | 'medium' | 'low';
  actionItems: string[];
  implementationDifficulty: 'easy' | 'medium' | 'hard';
}

/**
 * Projeção de custo
 */
export interface CostProjection {
  month: string;
  projectedCost: number;
  confidence: number; // 0-100
  baselineVariance: number; // percentual
}

// Armazenamento de estado
let metrics: CostMetric[] = [];
let recommendations: Map<string, OptimizationRecommendation> = new Map();
let stats = {
  totalCostTracked: 0,
  servicesMonitored: 0,
  recommendationsGenerated: 0,
  potentialSavings: 0,
};

/**
 * Registrar métrica de custo
 */
export function recordCostMetric(metric: CostMetric): void {
  metrics.push(metric);
  stats.totalCostTracked += metric.cost;

  const serviceSet = new Set(metrics.map((m) => m.service));
  stats.servicesMonitored = serviceSet.size;

  console.log(`[CostOptimization] Cost recorded: ${metric.service} - $${metric.cost}`);
}

/**
 * Analisar custos por período
 */
export function analyzeCosts(
  period: 'daily' | 'weekly' | 'monthly',
  startDate: Date,
  endDate: Date
): CostAnalysis {
  const periodMetrics = metrics.filter((m) => m.date >= startDate && m.date <= endDate);

  const costByService = new Map<string, number>();
  let totalCost = 0;

  for (const metric of periodMetrics) {
    const current = costByService.get(metric.service) || 0;
    costByService.set(metric.service, current + metric.cost);
    totalCost += metric.cost;
  }

  // Top 5 serviços mais caros
  const topExpensiveServices: ServiceCost[] = Array.from(costByService.entries())
    .map(([service, cost]) => ({
      service,
      cost,
      percentage: (cost / totalCost) * 100,
      trend: 'stable' as const,
    }))
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 5);

  // Tendências
  const trends: CostTrend[] = [];
  let previousCost = 0;
  for (const metric of periodMetrics) {
    const changePercent = previousCost > 0 ? ((metric.cost - previousCost) / previousCost) * 100 : 0;
    trends.push({
      date: metric.date,
      cost: metric.cost,
      changePercent,
    });
    previousCost = metric.cost;
  }

  return {
    period,
    startDate,
    endDate,
    totalCost,
    costByService,
    topExpensiveServices,
    trends,
  };
}

/**
 * Gerar recomendações de otimização
 */
export function generateOptimizationRecommendations(): OptimizationRecommendation[] {
  const serviceSet = new Set(metrics.map((m) => m.service));
  const generatedRecommendations: OptimizationRecommendation[] = [];

  // Recomendação 1: Consolidação de serviços
  if (serviceSet.size > 5) {
    const rec: OptimizationRecommendation = {
      id: `REC-${Date.now()}-1`,
      service: 'infrastructure',
      title: 'Consolidate services',
      description: 'Reduce number of services to improve efficiency',
      estimatedSavings: 500,
      priority: 'high',
      actionItems: ['Analyze service dependencies', 'Plan consolidation', 'Execute migration'],
      implementationDifficulty: 'hard',
    };
    generatedRecommendations.push(rec);
    recommendations.set(rec.id, rec);
    stats.potentialSavings += rec.estimatedSavings;
  }

  // Recomendação 2: Otimização de armazenamento
  const storageMetrics = metrics.filter((m) => m.service.includes('storage'));
  if (storageMetrics.length > 0) {
    const totalStorage = storageMetrics.reduce((sum, m) => sum + m.quantity, 0);
    if (totalStorage > 1000) {
      const rec: OptimizationRecommendation = {
        id: `REC-${Date.now()}-2`,
        service: 'storage',
        title: 'Optimize storage usage',
        description: 'Implement compression and archiving strategies',
        estimatedSavings: 200,
        priority: 'medium',
        actionItems: ['Audit storage usage', 'Implement compression', 'Archive old data'],
        implementationDifficulty: 'medium',
      };
      generatedRecommendations.push(rec);
      recommendations.set(rec.id, rec);
      stats.potentialSavings += rec.estimatedSavings;
    }
  }

  // Recomendação 3: Otimização de compute
  const computeMetrics = metrics.filter((m) => m.service.includes('compute'));
  if (computeMetrics.length > 0) {
    const rec: OptimizationRecommendation = {
      id: `REC-${Date.now()}-3`,
      service: 'compute',
      title: 'Right-size compute resources',
      description: 'Analyze and optimize instance types and sizes',
      estimatedSavings: 300,
      priority: 'high',
      actionItems: ['Analyze utilization', 'Identify underutilized instances', 'Resize instances'],
      implementationDifficulty: 'easy',
    };
    generatedRecommendations.push(rec);
    recommendations.set(rec.id, rec);
    stats.potentialSavings += rec.estimatedSavings;
  }

  stats.recommendationsGenerated += generatedRecommendations.length;

  return generatedRecommendations;
}

/**
 * Projetar custos futuros
 */
export function projectCosts(months: number): CostProjection[] {
  const projections: CostProjection[] = [];
  const recentMetrics = metrics.slice(-30); // Últimos 30 registros

  if (recentMetrics.length === 0) {
    return projections;
  }

  const avgCost = recentMetrics.reduce((sum, m) => sum + m.cost, 0) / recentMetrics.length;

  for (let i = 1; i <= months; i++) {
    const date = new Date();
    date.setMonth(date.getMonth() + i);

    // Simular crescimento de 5% ao mês
    const projectedCost = avgCost * Math.pow(1.05, i);

    projections.push({
      month: date.toISOString().substring(0, 7),
      projectedCost,
      confidence: Math.max(50, 100 - i * 10), // Confiança diminui com o tempo
      baselineVariance: 5 * i, // Variância aumenta
    });
  }

  return projections;
}

/**
 * Obter recomendação por ID
 */
export function getRecommendation(id: string): OptimizationRecommendation | null {
  return recommendations.get(id) || null;
}

/**
 * Listar todas as recomendações
 */
export function getAllRecommendations(): OptimizationRecommendation[] {
  return Array.from(recommendations.values());
}

/**
 * Obter estatísticas
 */
export function getCostStatistics() {
  return {
    ...stats,
    averageCostPerMetric: stats.totalCostTracked / Math.max(metrics.length, 1),
    recommendationImplementationRate: stats.recommendationsGenerated > 0 ? 0 : 0, // Placeholder
  };
}

/**
 * Resetar (para testes)
 */
export function resetCostOptimization(): void {
  metrics = [];
  recommendations.clear();
  stats = {
    totalCostTracked: 0,
    servicesMonitored: 0,
    recommendationsGenerated: 0,
    potentialSavings: 0,
  };
}
