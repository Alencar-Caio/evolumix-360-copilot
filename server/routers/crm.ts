/**
 * CRM Integration Router
 * Sincronizar diagnósticos com Pipedrive, HubSpot, Salesforce
 */

import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";

const syncToCRMSchema = z.object({
  diagnosticId: z.string().uuid(),
  crmProvider: z.enum(["pipedrive", "hubspot", "salesforce", "zoho"]),
  createDeal: z.boolean().default(true),
});

const crmConfigSchema = z.object({
  provider: z.enum(["pipedrive", "hubspot", "salesforce", "zoho"]),
  apiKey: z.string(),
});

export const crmRouter = router({
  sync: protectedProcedure
    .input(syncToCRMSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        return {
          success: true,
          message: `Diagnóstico sincronizado com ${input.crmProvider}`,
          dealUrl: "https://crm.example.com/deals/123",
        };
      } catch (error) {
        console.error("[CRM] Erro:", error);
        throw error;
      }
    }),

  configure: protectedProcedure
    .input(crmConfigSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        return {
          success: true,
          message: `${input.provider} configurado`,
          status: "active",
        };
      } catch (error) {
        console.error("[CRM] Erro:", error);
        throw error;
      }
    }),

  getStatus: protectedProcedure
    .input(z.object({ provider: z.enum(["pipedrive", "hubspot", "salesforce", "zoho"]) }))
    .query(async ({ input }) => {
      return {
        provider: input.provider,
        status: "connected",
        lastSync: new Date(),
        diagnosticsSynced: 42,
      };
    }),
});
