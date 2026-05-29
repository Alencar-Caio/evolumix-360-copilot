import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { queries, approvals } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const approvalsRouter = router({
  listPending: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    // Only admins can view pending approvals
    if (ctx.user?.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can view approvals" });
    }

    const pendingApprovals = await db
      .select()
      .from(approvals)
      .where(eq(approvals.status, 'pending'))
      .limit(100);

    // Enrich with query data
    const enriched = await Promise.all(
      pendingApprovals.map(async (approval) => {
        const query = await db
          .select()
          .from(queries)
          .where(eq(queries.id, approval.queryId))
          .limit(1);

        return {
          ...approval,
          queryText: query[0]?.queryText || '',
          response: query[0]?.responseText || '',
          riskClassification: query[0]?.riskClassification || 'low',
          faithfulnessScore: query[0]?.faithfulnessScore || 0,
          citationCoverageScore: query[0]?.citationCoverageScore || 0,
          submittedBy: query[0]?.userId ? `User ${query[0].userId}` : 'Unknown',
          submittedAt: query[0]?.createdAt || new Date(),
        };
      })
    );

    return enriched;
  }),

  approve: protectedProcedure
    .input(z.object({ queryId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Only admins can approve
      if (ctx.user?.role !== 'admin') {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can approve" });
      }

      // Find the approval record
      const approval = await db
        .select()
        .from(approvals)
        .where(eq(approvals.queryId, input.queryId))
        .limit(1);

      if (!approval.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Approval not found" });
      }

      // Update approval status
      await db
        .update(approvals)
        .set({
          status: 'approved',
          reviewedBy: ctx.user?.id,
          reviewedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(approvals.id, approval[0].id));

      return { success: true };
    }),

  reject: protectedProcedure
    .input(z.object({ queryId: z.number(), reason: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Only admins can reject
      if (ctx.user?.role !== 'admin') {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can reject" });
      }

      // Find the approval record
      const approval = await db
        .select()
        .from(approvals)
        .where(eq(approvals.queryId, input.queryId))
        .limit(1);

      if (!approval.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Approval not found" });
      }

      // Update approval status
      await db
        .update(approvals)
        .set({
          status: 'rejected',
          reviewedBy: ctx.user?.id,
          reviewNotes: input.reason,
          reviewedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(approvals.id, approval[0].id));

      return { success: true };
    }),
});
