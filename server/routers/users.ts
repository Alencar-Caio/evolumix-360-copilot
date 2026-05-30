import { adminProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const usersRouter = router({
  /**
   * Listar todos os usuários (apenas admin)
   */
  listAll: adminProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    return db.select().from(users);
  }),

  /**
   * Listar usuários autorizados
   */
  listAuthorized: adminProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    return db.select().from(users).where(eq(users.isAuthorized, 1));
  }),

  /**
   * Listar usuários não autorizados
   */
  listUnauthorized: adminProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    return db.select().from(users).where(eq(users.isAuthorized, 0));
  }),

  /**
   * Autorizar um usuário
   */
  authorize: adminProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      await db
        .update(users)
        .set({
          isAuthorized: 1,
          authorizationReason: null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, input.userId));

      return { success: true };
    }),

  /**
   * Desautorizar um usuário
   */
  unauthorize: adminProcedure
    .input(z.object({ userId: z.number(), reason: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      await db
        .update(users)
        .set({
          isAuthorized: 0,
          authorizationReason: input.reason || "Desautorizado pelo administrador",
          updatedAt: new Date(),
        })
        .where(eq(users.id, input.userId));

      return { success: true };
    }),

  /**
   * Obter detalhes de um usuário
   */
  getById: adminProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const user = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);

      if (!user.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Usuário não encontrado" });
      }

      return user[0];
    }),

  /**
   * Verificar se o usuário atual está autorizado
   */
  checkAuthorization: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const user = await db.select().from(users).where(eq(users.id, ctx.user?.id || 0)).limit(1);

    if (!user.length) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Usuário não encontrado" });
    }

    return {
      isAuthorized: user[0].isAuthorized === 1,
      reason: user[0].authorizationReason,
    };
  }),
});
