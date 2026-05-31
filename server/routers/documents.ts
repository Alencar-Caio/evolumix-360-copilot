import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { storagePut } from "../storage";
import { logAudit } from "../db";
import { getDb } from "../db";
import { documents, documentVersions } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { validateFile } from "../_core/security";

export const documentsRouter = router({
  /**
   * Listar documentos aprovados (acessível a consultores)
   */
  listApproved: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    
    return db.select().from(documents).where(eq(documents.status, 'approved'));
  }),

  /**
   * Listar todos os documentos (apenas admin)
   */
  listAll: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== 'admin') {
      throw new Error('Unauthorized: only admins can list all documents');
    }
    
    const db = await getDb();
    if (!db) return [];
    
    return db.select().from(documents);
  }),

  /**
   * Obter detalhes de um documento com suas versoes
   */
  getById: protectedProcedure
    .input(z.object({ documentId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return null;
      
      const doc = await db.select().from(documents).where(eq(documents.id, input.documentId)).limit(1);
      if (doc.length === 0) return null;
      
      const versions = await db.select().from(documentVersions).where(eq(documentVersions.documentId, input.documentId));
      
      return {
        ...doc[0],
        versions,
      };
    }),

  /**
   * Upload de novo documento
   * Validações:
   * - Arquivo não vazio
   * - Tamanho máximo 50MB
   * - Tipo permitido (PDF, TXT)
   */
  upload: protectedProcedure
    .input(z.object({
      title: z.string().min(3).max(255),
      documentType: z.enum(['FISPQ', 'technical_sheet', 'catalog', 'other']),
      fileBuffer: z.instanceof(Buffer),
      fileName: z.string(),
      mimeType: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        // Validar arquivo
        validateFile(
          {
            size: input.fileBuffer.length,
            mimetype: input.mimeType,
            buffer: input.fileBuffer,
          },
          {
            maxSize: 50 * 1024 * 1024,
            allowedTypes: ['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
          }
        );

        // Upload para S3
        const { key, url } = await storagePut(
          `documents/${ctx.user.id}/${input.fileName}`,
          input.fileBuffer,
          input.mimeType
        );

        // Salvar no banco
        const db = await getDb();
        if (!db) throw new Error('Database connection failed');

        const result = await db.insert(documents).values({
          title: input.title,
          description: null,
          documentType: input.documentType,
          supplierId: null,
          currentVersionId: null,
          status: 'draft',
          createdBy: ctx.user.id,
          updatedAt: new Date(),
        });

        // Log de auditoria
        await logAudit({
          userId: ctx.user.id,
          action: 'document_upload',
          details: { title: input.title, documentType: input.documentType },
        });

        return {
          success: true,
          documentId: (result as any).insertId || Date.now(),
          url,
          key,
        };
      } catch (error) {
        console.error('Document upload error:', error);
        throw error;
      }
    }),

  /**
   * Arquivar documento (apenas admin)
   */
  archive: protectedProcedure
    .input(z.object({
      documentId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Unauthorized: only admins can archive documents');
      }

      const db = await getDb();
      if (!db) throw new Error('Database connection failed');

      await db.update(documents)
        .set({ status: 'archived', updatedAt: new Date() })
        .where(eq(documents.id, input.documentId));

      await logAudit({
        userId: ctx.user.id,
        action: 'document_archive',
        details: { documentId: input.documentId },
      });

      return { success: true };
    }),

  /**
   * Aprovar documento (apenas admin)
   */
  approve: protectedProcedure
    .input(z.object({
      documentId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Unauthorized: only admins can approve documents');
      }

      const db = await getDb();
      if (!db) throw new Error('Database connection failed');

      await db.update(documents)
        .set({ status: 'approved', updatedAt: new Date() })
        .where(eq(documents.id, input.documentId));

      await logAudit({
        userId: ctx.user.id,
        action: 'document_approve',
        details: { documentId: input.documentId },
      });

      return { success: true };
    }),

  /**
   * Deletar documento (apenas admin)
   */
  delete: protectedProcedure
    .input(z.object({
      documentId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Unauthorized: only admins can delete documents');
      }

      const db = await getDb();
      if (!db) throw new Error('Database connection failed');

      await db.delete(documents).where(eq(documents.id, input.documentId));

      await logAudit({
        userId: ctx.user.id,
        action: 'document_delete',
        details: { documentId: input.documentId },
      });

      return { success: true };
    }),
});
