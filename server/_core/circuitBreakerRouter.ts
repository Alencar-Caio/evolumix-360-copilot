/**
 * Circuit Breaker Router - Expõe status via tRPC
 */

import { router, publicProcedure } from './trpc';
import { getCircuitBreakerStatus, resetCircuitBreaker } from './circuitBreaker';
import { z } from 'zod';

export const circuitBreakerRouter = router({
  /**
   * Obter status de todos os circuit breakers
   */
  status: publicProcedure.query(async () => {
    return getCircuitBreakerStatus();
  }),
  
  /**
   * Reset um circuit breaker específico
   */
  reset: publicProcedure
    .input(z.enum(['llm', 'database', 's3']))
    .mutation(({ input }) => {
      resetCircuitBreaker(input);
      return { success: true, breaker: input };
    }),
});
