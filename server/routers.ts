import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { documentsRouter } from "./routers/documents";
import { copilotRouter } from "./routers/copilot";
import { diagnosticsRouter } from "./routers/diagnostics";
import { approvalsRouter } from "./routers/approvals";
import { whatsappRouter } from "./routers/whatsapp";
import { exportsRouter } from "./routers/exports";
import { crmRouter } from "./routers/crm";
import { exportRouter } from "./routers/export";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  documents: documentsRouter,
  copilot: copilotRouter,
  diagnostics: diagnosticsRouter,
  approvals: approvalsRouter,
  whatsapp: whatsappRouter,
  exports: exportsRouter,
  export: exportRouter,
  crm: crmRouter,
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
