import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, queries, auditLogs, documents, documentVersions, approvals, diagnostics, roiCalculations } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Helpers para documentos
export async function getApprovedDocuments() {
  const db = await getDb();
  if (!db) return [];
  // Retorna documentos com status 'approved'
  return db.select().from(documents).where(eq(documents.status, 'approved'));
}

// Helpers para consultas
export async function createQuery(data: {
  userId: number;
  queryText: string;
  responseText?: string;
  usedDocumentIds?: number[];
  citations?: any[];
  faithfulnessScore?: number;
  citationCoverageScore?: number;
  riskClassification: 'low' | 'medium' | 'high' | 'critical';
  requiresApproval: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(queries).values({
    userId: data.userId,
    queryText: data.queryText,
    responseText: data.responseText || null,
    usedDocumentIds: data.usedDocumentIds ? JSON.stringify(data.usedDocumentIds) : null,
    citations: data.citations ? JSON.stringify(data.citations) : null,
    faithfulnessScore: data.faithfulnessScore ? String(data.faithfulnessScore) : null,
    citationCoverageScore: data.citationCoverageScore ? String(data.citationCoverageScore) : null,
    riskClassification: data.riskClassification,
    requiresApproval: data.requiresApproval,
  } as any);
  
  return result;
}

// Helpers para auditoria
export async function logAudit(data: {
  userId: number;
  action: string;
  entityType?: string;
  entityId?: number;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
}) {
  const db = await getDb();
  if (!db) return;
  
  await db.insert(auditLogs).values({
    userId: data.userId,
    action: data.action,
    entityType: data.entityType,
    entityId: data.entityId,
    details: data.details ? JSON.stringify(data.details) : null,
    ipAddress: data.ipAddress,
    userAgent: data.userAgent,
  });
}

// TODO: add more feature queries as your schema grows
