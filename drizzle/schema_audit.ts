/**
 * Schema de Audit Trail Imutável
 * Logs com blockchain-like hashing para conformidade SOC 2, GDPR, HIPAA
 */

import { mysqlTable, varchar, text, timestamp, bigint, json, index } from 'drizzle-orm/mysql-core';

export const immutableAuditLogs = mysqlTable('immutable_audit_logs', {
  id: bigint('id', { mode: 'bigint' }).primaryKey().autoincrement(),
  
  // Conteúdo do evento
  eventType: varchar('event_type', { length: 50 }).notNull(), // 'user_login', 'data_access', 'data_modification'
  entityType: varchar('entity_type', { length: 50 }).notNull(), // 'user', 'document', 'query'
  entityId: varchar('entity_id', { length: 255 }).notNull(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  action: varchar('action', { length: 100 }).notNull(), // 'CREATE', 'READ', 'UPDATE', 'DELETE'
  
  // Detalhes
  details: json('details').$type<Record<string, any>>().notNull(),
  
  // Segurança
  ipAddress: varchar('ip_address', { length: 45 }).notNull(),
  userAgent: text('user_agent'),
  
  // Hashing para imutabilidade
  hash: varchar('hash', { length: 64 }).notNull(), // SHA-256 do evento + hash anterior
  previousHash: varchar('previous_hash', { length: 64 }), // Hash do evento anterior (chain)
  
  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  
}, (table) => ({
  eventTypeIdx: index('idx_event_type').on(table.eventType),
  userIdIdx: index('idx_user_id').on(table.userId),
  entityIdIdx: index('idx_entity_id').on(table.entityId),
  createdAtIdx: index('idx_created_at').on(table.createdAt),
  hashIdx: index('idx_hash').on(table.hash),
}));
