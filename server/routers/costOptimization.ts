/**
 * Cost Optimization Router
 * 
 * Endpoints tRPC para gerenciar otimização de custos
 */

import { z } from 'zod';
import { adminProcedure, publicProcedure, router } from '../_core/trpc';
import {
  recordCostMetric,
  analyzeCosts,
  generateOptimizationRecommendations,
  projectCosts,
  getRecommendation,
  getAllRecommendations,
  getCostStatistics,
} from '../_core/operations/costOptimization';

export const costOptimizationRouter = router({
  /**
   * Registrar métrica de custo
   */
  recordMetric: adminProcedure
    .input(
      z.object({
        service: z.string(),
        cost: z.number(),
        unit: z.string(),
        quantity: z.number(),
      })
    )
    .mutation(({ input }) => {
      recordCostMetric({
        service: input.service,
        date: new Date(),
        cost: input.cost,
        unit: input.unit,
        quantity: input.quantity,
      });

      return { success: true };
    }),

  /**
   * Analisar custos por período
   */
  analyzeCosts: publicProcedure
    .input(
      z.object({
        period: z.enum(['daily', 'weekly', 'monthly']),
        days: z.number().default(30),
      })
    )
    .query(({ input }) => {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);

      return analyzeCosts(input.period, startDate, endDate);
    }),

  /**
   * Gerar recomendações de otimização
   */
  generateRecommendations: adminProcedure.mutation(() => {
    return generateOptimizationRecommendations();
  }),

  /**
   * Projetar custos futuros
   */
  projectCosts: publicProcedure
    .input(z.object({ months: z.number().min(1).max(12) }))
    .query(({ input }) => {
      return projectCosts(input.months);
    }),

  /**
   * Obter recomendação por ID
   */
  getRecommendation: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input }) => {
      return getRecommendation(input.id);
    }),

  /**
   * Listar todas as recomendações
   */
  getAllRecommendations: publicProcedure.query(() => {
    return getAllRecommendations();
  }),

  /**
   * Obter estatísticas de custo
   */
  getStatistics: publicProcedure.query(() => {
    return getCostStatistics();
  }),
});
