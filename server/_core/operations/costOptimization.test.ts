/**
 * Testes para Cost Optimization Dashboard
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  recordCostMetric,
  analyzeCosts,
  generateOptimizationRecommendations,
  projectCosts,
  getRecommendation,
  getAllRecommendations,
  getCostStatistics,
  resetCostOptimization,
  type CostMetric,
} from './costOptimization';

const mockMetrics: CostMetric[] = [
  {
    service: 'compute',
    date: new Date('2026-05-25'),
    cost: 100,
    unit: 'hours',
    quantity: 10,
  },
  {
    service: 'storage',
    date: new Date('2026-05-26'),
    cost: 50,
    unit: 'GB',
    quantity: 500,
  },
  {
    service: 'database',
    date: new Date('2026-05-27'),
    cost: 75,
    unit: 'requests',
    quantity: 1000,
  },
  {
    service: 'compute',
    date: new Date('2026-05-28'),
    cost: 120,
    unit: 'hours',
    quantity: 12,
  },
  {
    service: 'storage',
    date: new Date('2026-05-29'),
    cost: 55,
    unit: 'GB',
    quantity: 550,
  },
];

describe('Cost Optimization Dashboard', () => {
  beforeEach(() => {
    resetCostOptimization();
  });

  describe('Cost Recording', () => {
    it('deve registrar métrica de custo', () => {
      recordCostMetric(mockMetrics[0]);

      const stats = getCostStatistics();

      expect(stats.totalCostTracked).toBeGreaterThan(0);
    });

    it('deve rastrear múltiplas métricas', () => {
      mockMetrics.forEach((metric) => recordCostMetric(metric));

      const stats = getCostStatistics();

      expect(stats.servicesMonitored).toBe(3);
    });

    it('deve calcular custo médio por métrica', () => {
      mockMetrics.forEach((metric) => recordCostMetric(metric));

      const stats = getCostStatistics();

      expect(stats.averageCostPerMetric).toBeGreaterThan(0);
    });
  });

  describe('Cost Analysis', () => {
    beforeEach(() => {
      mockMetrics.forEach((metric) => recordCostMetric(metric));
    });

    it('deve analisar custos por período', () => {
      const startDate = new Date('2026-05-25');
      const endDate = new Date('2026-05-31');

      const analysis = analyzeCosts('daily', startDate, endDate);

      expect(analysis).toBeDefined();
      expect(analysis.totalCost).toBeGreaterThan(0);
      expect(analysis.costByService.size).toBeGreaterThan(0);
    });

    it('deve identificar serviços mais caros', () => {
      const startDate = new Date('2026-05-25');
      const endDate = new Date('2026-05-31');

      const analysis = analyzeCosts('daily', startDate, endDate);

      expect(analysis.topExpensiveServices.length).toBeGreaterThan(0);
      expect(analysis.topExpensiveServices[0].cost).toBeGreaterThanOrEqual(
        analysis.topExpensiveServices[1]?.cost || 0
      );
    });

    it('deve calcular percentual de custo por serviço', () => {
      const startDate = new Date('2026-05-25');
      const endDate = new Date('2026-05-31');

      const analysis = analyzeCosts('daily', startDate, endDate);

      const totalPercentage = analysis.topExpensiveServices.reduce((sum, s) => sum + s.percentage, 0);

      expect(totalPercentage).toBeGreaterThan(0);
      expect(totalPercentage).toBeLessThanOrEqual(100);
    });

    it('deve rastrear tendências de custo', () => {
      const startDate = new Date('2026-05-25');
      const endDate = new Date('2026-05-31');

      const analysis = analyzeCosts('daily', startDate, endDate);

      expect(analysis.trends.length).toBeGreaterThan(0);
    });
  });

  describe('Optimization Recommendations', () => {
    beforeEach(() => {
      // Adicionar muitas métricas para gerar recomendações
      for (let i = 0; i < 10; i++) {
        recordCostMetric({
          service: `service-${i}`,
          date: new Date(),
          cost: 100 + i * 10,
          unit: 'units',
          quantity: 100,
        });
      }

      // Adicionar métricas de storage grande
      for (let i = 0; i < 5; i++) {
        recordCostMetric({
          service: 'storage',
          date: new Date(),
          cost: 50,
          unit: 'GB',
          quantity: 500,
        });
      }
    });

    it('deve gerar recomendações de otimização', () => {
      const recommendations = generateOptimizationRecommendations();

      expect(recommendations.length).toBeGreaterThan(0);
    });

    it('deve incluir estimativa de economia', () => {
      const recommendations = generateOptimizationRecommendations();

      expect(recommendations[0].estimatedSavings).toBeGreaterThan(0);
    });

    it('deve priorizar recomendações', () => {
      const recommendations = generateOptimizationRecommendations();

      expect(recommendations[0].priority).toMatch(/high|medium|low/);
    });

    it('deve obter recomendação por ID', () => {
      const recommendations = generateOptimizationRecommendations();

      if (recommendations.length > 0) {
        const rec = getRecommendation(recommendations[0].id);

        expect(rec).toBeDefined();
        expect(rec?.id).toBe(recommendations[0].id);
      }
    });

    it('deve listar todas as recomendações', () => {
      generateOptimizationRecommendations();

      const allRecs = getAllRecommendations();

      expect(allRecs.length).toBeGreaterThan(0);
    });
  });

  describe('Cost Projections', () => {
    beforeEach(() => {
      mockMetrics.forEach((metric) => recordCostMetric(metric));
    });

    it('deve projetar custos futuros', () => {
      const projections = projectCosts(3);

      expect(projections.length).toBe(3);
    });

    it('deve incluir confiança na projeção', () => {
      const projections = projectCosts(3);

      expect(projections[0].confidence).toBeGreaterThan(0);
      expect(projections[0].confidence).toBeLessThanOrEqual(100);
    });

    it('deve calcular variância de baseline', () => {
      const projections = projectCosts(3);

      expect(projections[0].baselineVariance).toBeGreaterThanOrEqual(0);
    });

    it('deve incluir mês da projeção', () => {
      const projections = projectCosts(3);

      expect(projections[0].month).toMatch(/\d{4}-\d{2}/);
    });
  });

  describe('Statistics', () => {
    it('deve coletar estatísticas de custo', () => {
      mockMetrics.forEach((metric) => recordCostMetric(metric));

      const stats = getCostStatistics();

      expect(stats.totalCostTracked).toBeGreaterThan(0);
      expect(stats.servicesMonitored).toBeGreaterThan(0);
    });

    it('deve rastrear economia potencial', () => {
      for (let i = 0; i < 10; i++) {
        recordCostMetric({
          service: `service-${i}`,
          date: new Date(),
          cost: 100,
          unit: 'units',
          quantity: 100,
        });
      }

      generateOptimizationRecommendations();

      const stats = getCostStatistics();

      expect(stats.potentialSavings).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Reset', () => {
    it('deve resetar estado', () => {
      mockMetrics.forEach((metric) => recordCostMetric(metric));
      generateOptimizationRecommendations();

      resetCostOptimization();

      const stats = getCostStatistics();

      expect(stats.totalCostTracked).toBe(0);
      expect(stats.servicesMonitored).toBe(0);
      expect(getAllRecommendations().length).toBe(0);
    });
  });
});
