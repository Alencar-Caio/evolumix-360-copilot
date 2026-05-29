import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, boolean, decimal, index } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  isAuthorized: int("isAuthorized").default(0).notNull(),
  authorizationReason: text("authorizationReason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Documentos técnicos (FISPQs, fichas técnicas, catálogos)
 */
export const documents = mysqlTable("documents", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  documentType: mysqlEnum("documentType", ["FISPQ", "technical_sheet", "catalog", "other"]).notNull(),
  supplierId: varchar("supplierId", { length: 255 }),
  currentVersionId: int("currentVersionId"),
  status: mysqlEnum("status", ["draft", "approved", "archived"]).default("draft").notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  createdByIdx: index("createdBy_idx").on(table.createdBy),
  statusIdx: index("status_idx").on(table.status),
}));

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

/**
 * Histórico versionado de documentos
 */
export const documentVersions = mysqlTable("documentVersions", {
  id: int("id").autoincrement().primaryKey(),
  documentId: int("documentId").notNull(),
  versionNumber: int("versionNumber").notNull(),
  storageKey: varchar("storageKey", { length: 512 }).notNull(),
  storageUrl: varchar("storageUrl", { length: 1024 }).notNull(),
  fileSize: int("fileSize"),
  mimeType: varchar("mimeType", { length: 100 }),
  metadata: json("metadata"),
  approvedBy: int("approvedBy"),
  approvalStatus: mysqlEnum("approvalStatus", ["pending", "approved", "rejected"]).default("pending").notNull(),
  rejectionReason: text("rejectionReason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  approvedAt: timestamp("approvedAt"),
}, (table) => ({
  documentIdIdx: index("documentId_idx").on(table.documentId),
  approvalStatusIdx: index("approvalStatus_idx").on(table.approvalStatus),
}));

export type DocumentVersion = typeof documentVersions.$inferSelect;
export type InsertDocumentVersion = typeof documentVersions.$inferInsert;

/**
 * Consultas ao copiloto de IA
 */
export const queries = mysqlTable("queries", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  queryText: text("queryText").notNull(),
  responseText: text("responseText"),
  usedDocumentIds: json("usedDocumentIds"),
  citations: json("citations"),
  faithfulnessScore: decimal("faithfulnessScore", { precision: 3, scale: 2 }),
  citationCoverageScore: decimal("citationCoverageScore", { precision: 3, scale: 2 }),
  riskClassification: mysqlEnum("riskClassification", ["low", "medium", "high", "critical"]).default("low").notNull(),
  requiresApproval: boolean("requiresApproval").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("userId_idx").on(table.userId),
  riskIdx: index("riskClassification_idx").on(table.riskClassification),
  requiresApprovalIdx: index("requiresApproval_idx").on(table.requiresApproval),
}));

export type Query = typeof queries.$inferSelect;
export type InsertQuery = typeof queries.$inferInsert;

/**
 * Fluxo de aprovação humana
 */
export const approvals = mysqlTable("approvals", {
  id: int("id").autoincrement().primaryKey(),
  queryId: int("queryId").notNull(),
  submittedBy: int("submittedBy").notNull(),
  submittedAt: timestamp("submittedAt").defaultNow().notNull(),
  reviewedBy: int("reviewedBy"),
  reviewedAt: timestamp("reviewedAt"),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  reviewNotes: text("reviewNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  queryIdIdx: index("queryId_idx").on(table.queryId),
  statusIdx: index("status_idx").on(table.status),
  reviewedByIdx: index("reviewedBy_idx").on(table.reviewedBy),
}));

export type Approval = typeof approvals.$inferSelect;
export type InsertApproval = typeof approvals.$inferInsert;

/**
 * Diagnósticos 360º estruturados
 */
export const diagnostics = mysqlTable("diagnostics", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  clientName: varchar("clientName", { length: 255 }).notNull(),
  area: decimal("area", { precision: 10, scale: 2 }),
  footTraffic: varchar("footTraffic", { length: 100 }),
  currentProducts: json("currentProducts"),
  currentConsumption: decimal("currentConsumption", { precision: 10, scale: 2 }),
  currentCost: decimal("currentCost", { precision: 12, scale: 2 }),
  analysisChemical: text("analysisChemical"),
  analysisHygiene: text("analysisHygiene"),
  analysisROI: text("analysisROI"),
  recommendations: json("recommendations"),
  closingScript: text("closingScript"),
  status: mysqlEnum("status", ["draft", "completed", "approved"]).default("draft").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("userId_idx").on(table.userId),
  statusIdx: index("status_idx").on(table.status),
}));

export type Diagnostic = typeof diagnostics.$inferSelect;
export type InsertDiagnostic = typeof diagnostics.$inferInsert;

/**
 * Cálculos de ROI persistidos
 */
export const roiCalculations = mysqlTable("roiCalculations", {
  id: int("id").autoincrement().primaryKey(),
  diagnosticId: int("diagnosticId").notNull(),
  costPerLiterDiluted: decimal("costPerLiterDiluted", { precision: 10, scale: 2 }),
  yield: decimal("yield", { precision: 10, scale: 2 }),
  monthlyConsumption: decimal("monthlyConsumption", { precision: 10, scale: 2 }),
  monthlySavings: decimal("monthlySavings", { precision: 12, scale: 2 }),
  paybackMonths: decimal("paybackMonths", { precision: 5, scale: 1 }),
  beforeCost: decimal("beforeCost", { precision: 12, scale: 2 }),
  afterCost: decimal("afterCost", { precision: 12, scale: 2 }),
  savingsPercentage: decimal("savingsPercentage", { precision: 5, scale: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  diagnosticIdIdx: index("diagnosticId_idx").on(table.diagnosticId),
}));

export type RoiCalculation = typeof roiCalculations.$inferSelect;
export type InsertRoiCalculation = typeof roiCalculations.$inferInsert;

/**
 * Auditoria completa de operações
 */
export const auditLogs = mysqlTable("auditLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entityType", { length: 100 }),
  entityId: int("entityId"),
  details: json("details"),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: varchar("userAgent", { length: 512 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("userId_idx").on(table.userId),
  actionIdx: index("action_idx").on(table.action),
  createdAtIdx: index("createdAt_idx").on(table.createdAt),
}));

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

/**
 * Relações entre tabelas
 */
export const usersRelations = relations(users, ({ many }) => ({
  documents: many(documents),
  queries: many(queries),
  diagnostics: many(diagnostics),
  auditLogs: many(auditLogs),
}));

export const documentsRelations = relations(documents, ({ one, many }) => ({
  creator: one(users, { fields: [documents.createdBy], references: [users.id] }),
  versions: many(documentVersions),
}));

export const documentVersionsRelations = relations(documentVersions, ({ one }) => ({
  document: one(documents, { fields: [documentVersions.documentId], references: [documents.id] }),
  approver: one(users, { fields: [documentVersions.approvedBy], references: [users.id] }),
}));

export const queriesRelations = relations(queries, ({ one, many }) => ({
  user: one(users, { fields: [queries.userId], references: [users.id] }),
  approvals: many(approvals),
}));

export const approvalsRelations = relations(approvals, ({ one }) => ({
  query: one(queries, { fields: [approvals.queryId], references: [queries.id] }),
  submitter: one(users, { fields: [approvals.submittedBy], references: [users.id] }),
  reviewer: one(users, { fields: [approvals.reviewedBy], references: [users.id] }),
}));

export const diagnosticsRelations = relations(diagnostics, ({ one, many }) => ({
  user: one(users, { fields: [diagnostics.userId], references: [users.id] }),
  roiCalculations: many(roiCalculations),
}));

export const roiCalculationsRelations = relations(roiCalculations, ({ one }) => ({
  diagnostic: one(diagnostics, { fields: [roiCalculations.diagnosticId], references: [diagnostics.id] }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, { fields: [auditLogs.userId], references: [users.id] }),
}));
