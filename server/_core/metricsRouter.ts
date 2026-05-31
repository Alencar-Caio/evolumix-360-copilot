/**
 * Metrics Router - Expõe métricas via tRPC
 */

import { router, publicProcedure } from './trpc';
import { getMetricsEndpoint, getMetricsHealth } from './metrics';

export const metricsRouter = router({
  /**
   * Obter todas as métricas em formato Prometheus
   */
  prometheus: publicProcedure.query(async () => {
    return getMetricsEndpoint();
  }),
  
  /**
   * Health check das métricas
   */
  health: publicProcedure.query(async () => {
    return getMetricsHealth();
  }),
});
