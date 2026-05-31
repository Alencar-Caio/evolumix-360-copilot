/**
 * Health Router - Expõe health checks via tRPC
 */

import { router, publicProcedure } from './trpc';
import {
  getLivenessStatus,
  getReadinessStatus,
  getDetailedHealth,
} from './healthChecks';

export const healthRouter = router({
  /**
   * Liveness Probe - Kubernetes usa para saber se está vivo
   * GET /api/trpc/health.live
   */
  live: publicProcedure.query(async () => {
    return await getLivenessStatus();
  }),
  
  /**
   * Readiness Probe - Kubernetes usa para saber se pronto para tráfego
   * GET /api/trpc/health.ready
   */
  ready: publicProcedure.query(async () => {
    return await getReadinessStatus();
  }),
  
  /**
   * Detailed Health - Dashboard de monitoramento
   * GET /api/trpc/health.detailed
   */
  detailed: publicProcedure.query(async () => {
    return await getDetailedHealth();
  }),
});
