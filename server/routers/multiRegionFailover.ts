/**
 * Multi-Region Failover Router
 * 
 * Endpoints tRPC para gerenciamento de failover entre regiões
 */

import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { initializeFailover, triggerFailover, getActiveRegion, getRegionStatuses, getFailoverHistory, getFailoverStatistics } from '../_core/resilience/multiRegionFailover';

export const multiRegionFailoverRouter = router({
  /**
   * Inicializar failover
   */
  initialize: protectedProcedure
    .input(
      z.object({
        regions: z.array(
          z.object({
            name: z.string(),
            endpoint: z.string().url(),
            healthy: z.boolean(),
            lastHealthCheck: z.date(),
            responseTime: z.number(),
            failureCount: z.number(),
            successCount: z.number(),
          })
        ),
        primaryRegion: z.string(),
        healthCheckInterval: z.number().default(5000),
        failureThreshold: z.number().default(3),
        recoveryTimeout: z.number().default(30000),
      })
    )
    .mutation(({ input }) => {
      try {
        initializeFailover({
          regions: input.regions,
          primaryRegion: input.primaryRegion,
          healthCheckInterval: input.healthCheckInterval,
          failureThreshold: input.failureThreshold,
          recoveryTimeout: input.recoveryTimeout,
        });
        return {
          success: true,
          message: 'Failover initialized',
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Initialization failed',
        };
      }
    }),

  /**
   * Obter região ativa
   */
  getActiveRegion: protectedProcedure.query(() => {
    try {
      const activeRegion = getActiveRegion();
      return {
        success: true,
        activeRegion,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get active region',
      };
    }
  }),

  /**
   * Triggar failover
   */
  triggerFailover: protectedProcedure
    .input(
      z.object({
        failingRegion: z.string(),
      })
    )
    .mutation(({ input }) => {
      try {
        triggerFailover(input.failingRegion);
        return {
          success: true,
          message: `Failover triggered for region ${input.failingRegion}`,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failover trigger failed',
        };
      }
    }),

  /**
   * Obter status de todas as regiões
   */
  getRegionStatus: protectedProcedure.query(() => {
    try {
      const regions = getRegionStatuses();
      return {
        success: true,
        regions,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get region status',
      };
    }
  }),

  /**
   * Obter histórico de failovers
   */
  getFailoverHistory: protectedProcedure.query(() => {
    try {
      const history = getFailoverHistory();
      return {
        success: true,
        history,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get failover history',
      };
    }
  }),

  /**
   * Obter estatísticas de failover
   */
  getStatistics: protectedProcedure.query(() => {
    try {
      const stats = getFailoverStatistics();
      return {
        success: true,
        statistics: stats,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get statistics',
      };
    }
  }),
});
