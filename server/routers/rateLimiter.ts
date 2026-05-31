/**
 * Rate Limiter Router
 * 
 * Endpoints tRPC para gerenciamento de rate limiting
 * Integração real com middleware Express
 */

import { z } from 'zod';
import { protectedProcedure, router, adminProcedure } from '../_core/trpc';
import { 
  initializeRateLimiter, 
  checkRateLimit, 
  getRateLimiterStatistics, 
  resetRateLimiter,
  getRemainingTokens,
  getResetTime,
  getAllowRate 
} from '../_core/resilience/rateLimiter';

// Inicializar rate limiter
initializeRateLimiter();

export const rateLimiterRouter = router({
  /**
   * Verificar rate limit
   */
  checkLimit: protectedProcedure
    .input(
      z.object({
        ip: z.string(),
        userId: z.string().optional(),
      })
    )
    .query(({ input }) => {
      try {
        const result = checkRateLimit(input.ip, input.userId);

        return {
          success: true,
          allowed: result.allowed,
          remaining: result.remaining,
          resetAt: result.resetAt,
          retryAfter: result.retryAfter,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Rate limit check failed',
        };
      }
    }),

  /**
   * Obter tokens restantes para o cliente
   */
  getRemaining: protectedProcedure
    .input(
      z.object({
        ip: z.string(),
        userId: z.string().optional(),
      })
    )
    .query(({ input }) => {
      try {
        const remaining = getRemainingTokens(input.ip, input.userId);

        return {
          success: true,
          remaining,
          timestamp: Date.now(),
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get remaining tokens',
        };
      }
    }),

  /**
   * Obter tempo de reset do rate limit
   */
  getResetAt: protectedProcedure
    .input(
      z.object({
        ip: z.string(),
        userId: z.string().optional(),
      })
    )
    .query(({ input }) => {
      try {
        const resetAt = getResetTime(input.ip, input.userId);

        return {
          success: true,
          resetAt,
          secondsUntilReset: Math.max(0, (resetAt - Date.now()) / 1000),
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get reset time',
        };
      }
    }),

  /**
   * Obter taxa de permissão (allow rate)
   */
  getAllowRate: protectedProcedure.query(() => {
    try {
      const allowRate = getAllowRate();

      return {
        success: true,
        allowRate: Number(allowRate.toFixed(4)),
        percentage: Number((allowRate * 100).toFixed(2)),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get allow rate',
      };
    }
  }),

  /**
   * Obter estatísticas de rate limiting
   */
  getStatistics: protectedProcedure.query(() => {
    try {
      const stats = getRateLimiterStatistics();

      return {
        success: true,
        statistics: {
          totalRequests: stats.totalRequests,
          allowedRequests: stats.allowedRequests,
          deniedRequests: stats.deniedRequests,
          totalBuckets: stats.totalBuckets,
          ipBuckets: stats.ipBuckets,
          userBuckets: stats.userBuckets,
          allowRate: Number(stats.allowRate.toFixed(2)),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get statistics',
      };
    }
  }),

  /**
   * Resetar rate limiter (admin only)
   */
  reset: adminProcedure.mutation(() => {
    try {
      resetRateLimiter();
      initializeRateLimiter();

      return {
        success: true,
        message: 'Rate limiter reset successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Reset failed',
      };
    }
  }),

  /**
   * Obter configuração de rate limiting
   */
  getConfig: protectedProcedure.query(() => {
    try {
      return {
        success: true,
        config: {
          globalLimit: 1000,
          perIpLimit: 100,
          perUserLimit: 50,
          refillInterval: 1000,
          description: 'Rate limiting configuration with Token Bucket algorithm',
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get config',
      };
    }
  }),
});
