/**
 * Incident Response Router
 * 
 * Endpoints tRPC para gerenciar incidentes de segurança
 */

import { z } from 'zod';
import { adminProcedure, publicProcedure, router } from '../_core/trpc';
import {
  createIncident,
  updateIncidentStatus,
  addIncidentAction,
  registerPlaybook,
  getPlaybook,
  getIncident,
  getOpenIncidents,
  getIncidentStatistics,
} from '../_core/incident/incidentResponse';

export const incidentResponseRouter = router({
  /**
   * Criar novo incidente
   */
  createIncident: adminProcedure
    .input(
      z.object({
        type: z.enum([
          'security_breach',
          'data_loss',
          'unauthorized_access',
          'malware_detected',
          'ddos_attack',
          'service_degradation',
          'configuration_error',
        ]),
        severity: z.enum(['critical', 'high', 'medium', 'low']),
        title: z.string(),
        description: z.string(),
        affectedSystems: z.array(z.string()),
      })
    )
    .mutation(({ input, ctx }) => {
      const incident = createIncident(
        input.type,
        input.severity,
        input.title,
        input.description,
        input.affectedSystems
      );

      console.log(`[tRPC] Incident created by ${ctx.user?.id}: ${incident.id}`);

      return incident;
    }),

  /**
   * Atualizar status do incidente
   */
  updateStatus: adminProcedure
    .input(
      z.object({
        incidentId: z.string(),
        status: z.enum(['open', 'investigating', 'contained', 'resolved', 'closed']),
        notes: z.string().optional(),
      })
    )
    .mutation(({ input, ctx }) => {
      const incident = updateIncidentStatus(
        input.incidentId,
        input.status,
        String(ctx.user?.id || 'unknown'),
        input.notes
      );

      return incident;
    }),

  /**
   * Adicionar ação ao incidente
   */
  addAction: adminProcedure
    .input(
      z.object({
        incidentId: z.string(),
        action: z.string(),
        notes: z.string().optional(),
      })
    )
    .mutation(({ input, ctx }) => {
      const incident = addIncidentAction(
        input.incidentId,
        input.action,
        String(ctx.user?.id || 'unknown'),
        input.notes
      );

      return incident;
    }),

  /**
   * Obter incidente por ID
   */
  getIncident: publicProcedure
    .input(z.object({ incidentId: z.string() }))
    .query(({ input }) => {
      return getIncident(input.incidentId);
    }),

  /**
   * Listar incidentes abertos
   */
  getOpenIncidents: publicProcedure.query(() => {
    return getOpenIncidents();
  }),

  /**
   * Obter estatísticas de incidentes
   */
  getStatistics: publicProcedure.query(() => {
    return getIncidentStatistics();
  }),

  /**
   * Obter playbook para tipo de incidente
   */
  getPlaybook: publicProcedure
    .input(
      z.object({
        type: z.enum([
          'security_breach',
          'data_loss',
          'unauthorized_access',
          'malware_detected',
          'ddos_attack',
          'service_degradation',
          'configuration_error',
        ]),
      })
    )
    .query(({ input }) => {
      return getPlaybook(input.type);
    }),
});
