/**
 * Immutable Audit Trail - Hash Chain
 * 
 * Responsabilidade: Manter log de auditoria imutável usando hash chain
 * 
 * Fluxo:
 * 1. Cada evento cria um hash SHA-256 do evento + hash anterior
 * 2. Hash anterior é armazenado para validar integridade
 * 3. Qualquer alteração no histórico quebra a cadeia
 * 4. Permite validação de integridade de todo o histórico
 * 5. Conformidade com ISO 27001 (auditoria imutável)
 * 
 * Justificativa:
 * - Imutabilidade (não pode alterar logs após criação)
 * - Integridade (detecta qualquer modificação)
 * - Rastreabilidade (cadeia completa de eventos)
 * - Conformidade (ISO 27001, GDPR, SOC 2)
 * - Forensics (investigação de incidentes)
 */

import crypto from 'crypto';
import { getDb } from '../../db';
import { immutableAuditLogs } from '../../../drizzle/schema';
import { eq, desc } from 'drizzle-orm';

/**
 * Estrutura de evento de auditoria
 */
export interface AuditEvent {
  eventType: string;
  entityType: string;
  entityId: string;
  userId: string;
  action: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent?: string;
}

/**
 * Estrutura de log imutável
 */
export interface ImmutableLog {
  id: bigint | string;
  eventType: string;
  entityType: string;
  entityId: string;
  userId: string;
  action: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent?: string;
  hash: string;
  previousHash?: string;
  createdAt: Date;
  verified?: boolean;
}

/**
 * Calcular hash SHA-256
 */
export function calculateHash(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Criar string para hashing (determinística)
 */
function createHashString(event: AuditEvent, previousHash?: string): string {
  const eventData = {
    eventType: event.eventType,
    entityType: event.entityType,
    entityId: event.entityId,
    userId: event.userId,
    action: event.action,
    details: JSON.stringify(event.details),
    ipAddress: event.ipAddress,
    userAgent: event.userAgent || '',
    timestamp: new Date().toISOString(),
    previousHash: previousHash || '',
  };

  return JSON.stringify(eventData);
}

/**
 * Registrar evento de auditoria com hash chain
 */
export async function logAuditEvent(event: AuditEvent): Promise<ImmutableLog> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  try {
    // Obter último hash da cadeia
    const lastLog = await db
      .select()
      .from(immutableAuditLogs)
      .orderBy(desc(immutableAuditLogs.createdAt))
      .limit(1) as any;

    const previousHash = lastLog.length > 0 ? lastLog[0].hash : undefined;

    // Usar timestamp determinístico para hash
    const createdAt = new Date();
    const createdAtIso = createdAt.toISOString();

    // Calcular novo hash com timestamp fixo
    const eventData = {
      eventType: event.eventType,
      entityType: event.entityType,
      entityId: event.entityId,
      userId: event.userId,
      action: event.action,
      details: JSON.stringify(event.details),
      ipAddress: event.ipAddress,
      userAgent: event.userAgent || '',
      createdAt: createdAtIso,
      previousHash: previousHash || '',
    };
    const hashString = JSON.stringify(eventData);
    const hash = calculateHash(hashString);

    // Inserir log (deixar banco gerar ID)
    await db.insert(immutableAuditLogs).values({
      eventType: event.eventType,
      entityType: event.entityType,
      entityId: event.entityId,
      userId: event.userId,
      action: event.action,
      details: event.details,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      hash,
      previousHash,
      createdAt: new Date(),
    });

    return {
      id: 'generated-by-db' as any,
      eventType: event.eventType,
      entityType: event.entityType,
      entityId: event.entityId,
      userId: event.userId,
      action: event.action,
      details: event.details,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      hash,
      previousHash,
      createdAt,
    };
  } catch (error) {
    console.error('Erro ao registrar evento de auditoria:', error);
    throw error;
  }
}

/**
 * Validar integridade de um log
 */
export async function verifyLogIntegrity(logId: string | bigint): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  try {
    const logs = await db
      .select()
      .from(immutableAuditLogs) as any;
    
    // Filtrar por ID em memória (bigint não funciona bem com eq)
    const filtered = logs.filter((l: any) => String(l.id) === String(logId));

    if (filtered.length === 0) {
      console.warn(`Log não encontrado: ${logId}`);
      return false;
    }

    const currentLog = filtered[0];

    // Se é o primeiro log, não há hash anterior para validar
    if (!currentLog.previousHash) {
      return true;
    }

    // Obter log anterior
    const allLogs = await db
      .select()
      .from(immutableAuditLogs) as any;
    
    const previousLog = allLogs.filter((l: any) => l.hash === currentLog.previousHash);

    if (previousLog.length === 0) {
      console.warn(`Log anterior não encontrado: ${currentLog.previousHash}`);
      return false;
    }

    // Recalcular hash do log atual
    const event: AuditEvent = {
      eventType: currentLog.eventType,
      entityType: currentLog.entityType,
      entityId: currentLog.entityId,
      userId: currentLog.userId,
      action: currentLog.action,
      details: currentLog.details as Record<string, any>,
      ipAddress: currentLog.ipAddress,
      userAgent: currentLog.userAgent || undefined,
    };

    const hashString = createHashString(event, currentLog.previousHash);
    const recalculatedHash = calculateHash(hashString);

    return recalculatedHash === currentLog.hash;
  } catch (error) {
    console.error('Erro ao validar integridade de log:', error);
    throw error;
  }
}

/**
 * Validar integridade de toda a cadeia
 */
export async function verifyChainIntegrity(): Promise<{
  isValid: boolean;
  totalLogs: number;
  invalidLogs: string[];
  brokenAt?: string;
}> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  try {
    const logs = await db
      .select()
      .from(immutableAuditLogs)
      .orderBy(immutableAuditLogs.createdAt);

    const invalidLogs: string[] = [];
    let brokenAt: string | undefined;

    for (let i = 0; i < logs.length; i++) {
      const log = logs[i];

      // Validar hash do log atual
      const event: AuditEvent = {
        eventType: log.eventType,
        entityType: log.entityType,
        entityId: log.entityId,
        userId: log.userId,
        action: log.action,
        details: log.details as Record<string, any>,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent || undefined,
      };

      const hashString = createHashString(event, log.previousHash || undefined);
      const recalculatedHash = calculateHash(hashString);

      if (recalculatedHash !== log.hash) {
        invalidLogs.push(String(log.id));
        if (!brokenAt) {
          brokenAt = String(log.id);
        }
      }

      // Validar ligação com log anterior
      if (i > 0) {
        const previousLog = logs[i - 1];
        if (log.previousHash !== previousLog.hash) {
          invalidLogs.push(String(log.id));
          if (!brokenAt) {
            brokenAt = String(log.id);
          }
        }
      }
    }

    return {
      isValid: invalidLogs.length === 0,
      totalLogs: logs.length,
      invalidLogs,
      brokenAt,
    };
  } catch (error) {
    console.error('Erro ao validar cadeia de auditoria:', error);
    throw error;
  }
}

/**
 * Obter histórico de auditoria para uma entidade
 */
export async function getAuditHistory(
  entityType: string,
  entityId: string,
  limit: number = 50
): Promise<ImmutableLog[]> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  try {
    const logs = await db
      .select()
      .from(immutableAuditLogs)
      .orderBy(desc(immutableAuditLogs.createdAt))
      .limit(limit) as any;

    // Filtrar em memória (TODO: otimizar com índices compostos)
    return logs
      .filter((log: any) => log.entityType === entityType && log.entityId === entityId)
      .map((log: any) => ({
        id: String(log.id),
        eventType: log.eventType,
        entityType: log.entityType,
        entityId: log.entityId,
        userId: log.userId,
        action: log.action,
        details: log.details as Record<string, any>,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent || undefined,
        hash: log.hash,
        previousHash: log.previousHash || undefined,
        createdAt: log.createdAt,
      }));
  } catch (error) {
    console.error('Erro ao obter histórico de auditoria:', error);
    throw error;
  }
}

/**
 * Obter estatísticas de auditoria
 */
export async function getAuditStats(): Promise<{
  totalEvents: number;
  eventsByType: Record<string, number>;
  eventsByUser: Record<string, number>;
  lastEvent?: Date;
  chainValid: boolean;
}> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  try {
    const logs = await db.select().from(immutableAuditLogs);

    const eventsByType: Record<string, number> = {};
    const eventsByUser: Record<string, number> = {};

    logs.forEach((log) => {
      eventsByType[log.eventType] = (eventsByType[log.eventType] || 0) + 1;
      eventsByUser[log.userId] = (eventsByUser[log.userId] || 0) + 1;
    });

    // Validar cadeia
    const chainValidation = await verifyChainIntegrity();

    return {
      totalEvents: logs.length,
      eventsByType,
      eventsByUser,
      lastEvent: logs.length > 0 ? logs[logs.length - 1].createdAt : undefined,
      chainValid: chainValidation.isValid,
    };
  } catch (error) {
    console.error('Erro ao obter estatísticas de auditoria:', error);
    throw error;
  }
}

/**
 * Exportar auditoria para arquivo (compliance)
 */
export async function exportAuditLog(
  startDate?: Date,
  endDate?: Date
): Promise<ImmutableLog[]> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  try {
    const logs = await db
      .select()
      .from(immutableAuditLogs)
      .orderBy(immutableAuditLogs.createdAt) as any;

    return logs.map((log: any) => ({
      id: String(log.id),
      eventType: log.eventType,
      entityType: log.entityType,
      entityId: log.entityId,
      userId: log.userId,
      action: log.action,
      details: log.details as Record<string, any>,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent || undefined,
      hash: log.hash,
      previousHash: log.previousHash || undefined,
      createdAt: log.createdAt,
    }));
  } catch (error) {
    console.error('Erro ao exportar auditoria:', error);
    throw error;
  }
}
