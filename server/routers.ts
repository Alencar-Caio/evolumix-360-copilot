import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { healthRouter } from "./_core/healthRouter";
import { circuitBreakerRouter } from "./_core/circuitBreakerRouter";
import { metricsRouter } from "./_core/metricsRouter";
import { publicProcedure, router } from "./_core/trpc";
import { documentsRouter } from "./routers/documents";
import { copilotRouter } from "./routers/copilot";
import { diagnosticsRouter } from "./routers/diagnostics";
import { approvalsRouter } from "./routers/approvals";
import { whatsappRouter } from "./routers/whatsapp";
import { exportsRouter } from "./routers/exports";
import { crmRouter } from "./routers/crm";
import { exportRouter } from "./routers/export";
import { complianceRouter } from "./routers/compliance";
import { incidentResponseRouter } from "./routers/incidentResponse";
import { costOptimizationRouter } from "./routers/costOptimization";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  health: healthRouter,
  circuitBreaker: circuitBreakerRouter,
  metrics: metricsRouter,
  system: systemRouter,
  documents: documentsRouter,
  copilot: copilotRouter,
  diagnostics: diagnosticsRouter,
  approvals: approvalsRouter,
  whatsapp: whatsappRouter,
  exports: exportsRouter,
  export: exportRouter,
  crm: crmRouter,
  compliance: complianceRouter,
  incidentResponse: incidentResponseRouter,
  costOptimization: costOptimizationRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
});

export type AppRouter = typeof appRouter;
