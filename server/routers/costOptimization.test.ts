/**
 * Testes para Cost Optimization Router
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { costOptimizationRouter } from './costOptimization';
import { resetCostOptimization } from '../_core/operations/costOptimization';

// Mock context
const mockContext = {
  user: { id: 'test-user', role: 'admin' as const },
  req: {} as any,
  res: {} as any,
};

describe('Cost Optimization Router', () => {
  beforeEach(() => {
    resetCostOptimization();
  });

  describe('recordMetric', () => {
    it('deve registrar métrica de custo via tRPC', async () => {
      const caller = costOptimizationRouter.createCaller(mockContext);

      const result = await caller.recordMetric({
        service: 'compute',
        cost: 100,
        unit: 'hours',
        quantity: 10,
      });

      expect(result.success).toBe(true);
    });
  });

  describe('analyzeCosts', () => {
    beforeEach(async () => {
      const caller = costOptimizationRouter.createCaller(mockContext);

      for (let i = 0; i < 5; i++) {
        await caller.recordMetric({
          service: `service-${i}`,
          cost: 100 + i * 10,
          unit: 'units',
          quantity: 100,
        });
      }
    });

    it('deve analisar custos por período', async () => {
      const caller = costOptimizationRouter.createCaller(mockContext);

      const analysis = await caller.analyzeCosts({
        period: 'daily',
        days: 30,
      });

      expect(analysis).toBeDefined();
      expect(analysis.totalCost).toBeGreaterThan(0);
    });

    it('deve retornar top expensive services', async () => {
      const caller = costOptimizationRouter.createCaller(mockContext);

      const analysis = await caller.analyzeCosts({
        period: 'daily',
        days: 30,
      });

      expect(analysis.topExpensiveServices.length).toBeGreaterThan(0);
    });
  });

  describe('generateRecommendations', () => {
    beforeEach(async () => {
      const caller = costOptimizationRouter.createCaller(mockContext);

      for (let i = 0; i < 10; i++) {
        await caller.recordMetric({
          service: `service-${i}`,
          cost: 100,
          unit: 'units',
          quantity: 100,
        });
      }
    });

    it('deve gerar recomendações de otimização', async () => {
      const caller = costOptimizationRouter.createCaller(mockContext);

      const recommendations = await caller.generateRecommendations();

      expect(Array.isArray(recommendations)).toBe(true);
    });
  });

  describe('projectCosts', () => {
    beforeEach(async () => {
      const caller = costOptimizationRouter.createCaller(mockContext);

      for (let i = 0; i < 5; i++) {
        await caller.recordMetric({
          service: 'compute',
          cost: 100,
          unit: 'hours',
          quantity: 10,
        });
      }
    });

    it('deve projetar custos futuros', async () => {
      const caller = costOptimizationRouter.createCaller(mockContext);

      const projections = await caller.projectCosts({
        months: 3,
      });

      expect(projections.length).toBe(3);
    });

    it('deve incluir confiança nas projeções', async () => {
      const caller = costOptimizationRouter.createCaller(mockContext);

      const projections = await caller.projectCosts({
        months: 3,
      });

      expect(projections[0].confidence).toBeGreaterThan(0);
    });
  });

  describe('getStatistics', () => {
    beforeEach(async () => {
      const caller = costOptimizationRouter.createCaller(mockContext);

      await caller.recordMetric({
        service: 'compute',
        cost: 100,
        unit: 'hours',
        quantity: 10,
      });
    });

    it('deve obter estatísticas de custo', async () => {
      const caller = costOptimizationRouter.createCaller(mockContext);

      const stats = await caller.getStatistics();

      expect(stats.totalCostTracked).toBeGreaterThan(0);
      expect(stats.servicesMonitored).toBeGreaterThan(0);
    });
  });

  describe('getAllRecommendations', () => {
    it('deve listar todas as recomendações', async () => {
      const caller = costOptimizationRouter.createCaller(mockContext);

      const recommendations = await caller.getAllRecommendations();

      expect(Array.isArray(recommendations)).toBe(true);
    });
  });
});
