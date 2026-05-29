import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { storagePut } from "../storage";
import { logAudit } from "../db";
import { getDb } from "../db";
import { documents, documentVersions } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

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
   * Upload de novo documento (apenas admin)
   */
  upload: protectedProcedure
    .input(z.object({
      title: z.string(),
      description: z.string().optional(),
      documentType: z.enum(['FISPQ', 'technical_sheet', 'catalog', 'other']),
      supplierId: z.string().optional(),
      fileBuffer: z.instanceof(Buffer),
      fileName: z.string(),
      mimeType: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Unauthorized: only admins can upload documents');
      }
      
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      // Criar documento
      const docResult = await db.insert(documents).values({
        title: input.title,
        description: input.description,
        documentType: input.documentType,
        supplierId: input.supplierId,
        status: 'draft',
        createdBy: ctx.user.id,
      });
      
      const documentId = (docResult as any).insertId;
      
      // Upload para S3
      const storageKey = `documents/${documentId}/v1/${input.fileName}`;
      const { url } = await storagePut(storageKey, input.fileBuffer, input.mimeType);
      
      // Criar versao do documento
      await db.insert(documentVersions).values({
        documentId: documentId,
        versionNumber: 1,
        storageKey,
        storageUrl: url,
        fileSize: input.fileBuffer.length,
        mimeType: input.mimeType,
        metadata: JSON.stringify({ fileName: input.fileName }),
        approvalStatus: 'pending',
      });
      
      // Atualizar currentVersionId
      await db.update(documents).set({ currentVersionId: 1 }).where(eq(documents.id, documentId));
      
      // Log de auditoria
      await logAudit({
        userId: ctx.user.id,
        action: 'document_upload',
        entityType: 'document',
        entityId: documentId,
        details: { title: input.title, documentType: input.documentType },
        ipAddress: (ctx.req as any).ip,
        userAgent: (ctx.req as any).headers['user-agent'],
      });
      
      return {
        documentId,
        versionId: 1,
        storageUrl: url,
        status: 'pending_approval',
      };
    }),

  /**
   * Aprovar documento (apenas admin)
   */
  approve: protectedProcedure
    .input(z.object({
      documentId: z.number(),
      versionId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Unauthorized: only admins can approve documents');
      }
      
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      // Atualizar versao como aprovada
      await db.update(documentVersions)
        .set({
          approvalStatus: 'approved',
          approvedBy: ctx.user.id,
          approvedAt: new Date(),
        })
        .where(eq(documentVersions.id, input.versionId));
      
      // Atualizar documento como aprovado
      await db.update(documents)
        .set({
          status: 'approved',
          currentVersionId: input.versionId,
        })
        .where(eq(documents.id, input.documentId));
      
      // Log de auditoria
      await logAudit({
        userId: ctx.user.id,
        action: 'document_approved',
        entityType: 'document',
        entityId: input.documentId,
        details: { versionId: input.versionId },
        ipAddress: (ctx.req as any).ip,
        userAgent: (ctx.req as any).headers['user-agent'],
      });
      
      return { success: true };
    }),

  /**
   * Rejeitar documento (apenas admin)
   */
  reject: protectedProcedure
    .input(z.object({
      documentId: z.number(),
      versionId: z.number(),
      reason: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Unauthorized: only admins can reject documents');
      }
      
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      // Atualizar versao como rejeitada
      await db.update(documentVersions)
        .set({
          approvalStatus: 'rejected',
          rejectionReason: input.reason,
        })
        .where(eq(documentVersions.id, input.versionId));
      
      // Log de auditoria
      await logAudit({
        userId: ctx.user.id,
        action: 'document_rejected',
        entityType: 'document',
        entityId: input.documentId,
        details: { versionId: input.versionId, reason: input.reason },
        ipAddress: (ctx.req as any).ip,
        userAgent: (ctx.req as any).headers['user-agent'],
      });
      
      return { success: true };
    }),
});
