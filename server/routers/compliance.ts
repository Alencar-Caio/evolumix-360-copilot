/**
 * Compliance Router
 * 
 * Responsabilidade: Expor endpoints de conformidade via tRPC
 * 
 * Integra:
 * - FIPS 140-2 Compliance
 * - Distributed Tracing
 * - ISO 27001 Security Controls
 */

import { z } from 'zod';
import { protectedProcedure, publicProcedure, router } from '../_core/trpc';
import { startTrace, startSpan, finishSpan, finishTrace, getTracingStatistics } from '../_core/observability/distributedTracing';
import {
  registerSecurityControl,
  calculateComplianceScore,
  reportSecurityIncident,
  getIncidentStatistics,
  type SecurityControl,
  type SecurityIncident,
} from '../_core/compliance/iso27001SecurityControls';

export const complianceRouter = router({
  /**
   * Obter pontuação de conformidade geral
   */
  getComplianceScore: publicProcedure.query(async () => {
    const traceId = startTrace('compliance-service');
    const spanId = startSpan(traceId, 'get_compliance_score', 'compliance-service');

    try {
      const score = calculateComplianceScore();

      finishSpan(spanId);
      finishTrace(traceId);

      return {
        success: true,
        data: score,
      };
    } catch (error) {
      finishSpan(spanId);
      finishTrace(traceId);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }),

  /**
   * Obter estatísticas de incidentes
   */
  getIncidentStats: publicProcedure.query(async () => {
    const traceId = startTrace('compliance-service');
    const spanId = startSpan(traceId, 'get_incident_stats', 'compliance-service');

    try {
      const stats = getIncidentStatistics();

      finishSpan(spanId);
      finishTrace(traceId);

      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      finishSpan(spanId);
      finishTrace(traceId);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }),

  /**
   * Obter estatísticas de tracing
   */
  getTracingStats: publicProcedure.query(async () => {
    const stats = getTracingStatistics();

    return {
      success: true,
      data: stats,
    };
  }),

  /**
   * Registrar controle de segurança (admin only)
   */
  registerControl: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        domain: z.string(),
        name: z.string(),
        description: z.string(),
        status: z.enum(['implemented', 'partial', 'not_implemented', 'planned']),
        maturityLevel: z.number().min(1).max(5),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        return {
          success: false,
          error: 'Only admins can register controls',
        };
      }

      const traceId = startTrace('compliance-service');
      const spanId = startSpan(traceId, 'register_control', 'compliance-service');

      try {
        const control: SecurityControl = {
          ...input,
          evidence: [],
        };

        registerSecurityControl(control);

        finishSpan(spanId);
        finishTrace(traceId);

        return {
          success: true,
          data: control,
        };
      } catch (error) {
        finishSpan(spanId);
        finishTrace(traceId);

        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }),

  /**
   * Reportar incidente de segurança
   */
  reportIncident: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        description: z.string(),
        severity: z.enum(['critical', 'high', 'medium', 'low']),
        type: z.enum(['breach', 'vulnerability', 'unauthorized_access', 'data_loss', 'other']),
        affectedAssets: z.array(z.string()),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const traceId = startTrace('compliance-service');
      const spanId = startSpan(traceId, 'report_incident', 'compliance-service');

      try {
        const incident: SecurityIncident = {
          id: `INC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          ...input,
          discoveredDate: new Date(),
          reportedDate: new Date(),
          status: 'open',
          correctionActions: [],
        };

        reportSecurityIncident(incident);

        finishSpan(spanId);
        finishTrace(traceId);

        return {
          success: true,
          data: incident,
        };
      } catch (error) {
        finishSpan(spanId);
        finishTrace(traceId);

        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }),
});
