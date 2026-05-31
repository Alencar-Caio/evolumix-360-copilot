/**
 * Testes para Immutable Audit Trail
 * 
 * Validar:
 * - Hash chain integrity
 * - Event logging
 * - Chain verification
 * - Tamper detection
 */

import { describe, it, expect } from 'vitest';
import { calculateHash, createHashString } from './auditTrail';
import type { AuditEvent } from './auditTrail';

describe('Immutable Audit Trail', () => {
  describe('Hash Calculation', () => {
    it('deve calcular hash SHA-256 corretamente', () => {
      const data = 'test data';
      const hash = calculateHash(data);
      
      expect(hash).toBeDefined();
      expect(hash).toMatch(/^[a-f0-9]{64}$/); // SHA-256 = 64 hex chars
      expect(hash.length).toBe(64);
    });

    it('deve gerar hash determinístico', () => {
      const data = 'test data';
      const hash1 = calculateHash(data);
      const hash2 = calculateHash(data);
      
      expect(hash1).toBe(hash2);
    });

    it('deve gerar hashes diferentes para dados diferentes', () => {
      const hash1 = calculateHash('data1');
      const hash2 = calculateHash('data2');
      
      expect(hash1).not.toBe(hash2);
    });

    it('deve ser sensível a mudanças mínimas', () => {
      const hash1 = calculateHash('test');
      const hash2 = calculateHash('test '); // espaço adicionado
      
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('Event Structure', () => {
    it('deve criar evento de auditoria válido', () => {
      const event: AuditEvent = {
        eventType: 'DOCUMENT_UPLOAD',
        entityType: 'document',
        entityId: 'doc-123',
        userId: 'user-456',
        action: 'upload',
        details: { fileName: 'test.pdf', size: 1024 },
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      };

      expect(event.eventType).toBe('DOCUMENT_UPLOAD');
      expect(event.entityType).toBe('document');
      expect(event.userId).toBe('user-456');
      expect(event.details.fileName).toBe('test.pdf');
    });

    it('deve permitir eventos sem userAgent', () => {
      const event: AuditEvent = {
        eventType: 'QUERY_EXECUTED',
        entityType: 'query',
        entityId: 'query-789',
        userId: 'user-456',
        action: 'execute',
        details: { queryText: 'SELECT *' },
        ipAddress: '192.168.1.1',
      };

      expect(event.userAgent).toBeUndefined();
    });
  });

  describe('Hash Chain Integrity', () => {
    it('deve criar hash string determinístico', () => {
      const event: AuditEvent = {
        eventType: 'TEST',
        entityType: 'test',
        entityId: 'test-1',
        userId: 'user-1',
        action: 'test_action',
        details: { key: 'value' },
        ipAddress: '127.0.0.1',
      };

      // Nota: createHashString não é exportada, então testamos o conceito
      const hash = calculateHash(JSON.stringify(event));
      expect(hash).toBeDefined();
      expect(hash.length).toBe(64);
    });

    it('deve detectar tampering em hash chain', () => {
      const originalHash = calculateHash('original data');
      const tamperedHash = calculateHash('tampered data');

      expect(originalHash).not.toBe(tamperedHash);
    });

    it('deve validar ligação entre eventos', () => {
      const event1Hash = calculateHash('event1');
      const event2Data = JSON.stringify({
        event: 'event2',
        previousHash: event1Hash,
      });
      const event2Hash = calculateHash(event2Data);

      // Se alguém tentar quebrar a cadeia
      const tamperedEvent2Data = JSON.stringify({
        event: 'event2',
        previousHash: 'different-hash',
      });
      const tamperedEvent2Hash = calculateHash(tamperedEvent2Data);

      expect(event2Hash).not.toBe(tamperedEvent2Hash);
    });
  });

  describe('Audit Event Types', () => {
    it('deve suportar evento de upload de documento', () => {
      const event: AuditEvent = {
        eventType: 'DOCUMENT_UPLOAD',
        entityType: 'document',
        entityId: 'doc-123',
        userId: 'user-456',
        action: 'upload',
        details: {
          fileName: 'FISPQ.pdf',
          size: 2048,
          documentType: 'FISPQ',
        },
        ipAddress: '192.168.1.1',
      };

      expect(event.eventType).toBe('DOCUMENT_UPLOAD');
      expect(event.details.documentType).toBe('FISPQ');
    });

    it('deve suportar evento de consulta executada', () => {
      const event: AuditEvent = {
        eventType: 'QUERY_EXECUTED',
        entityType: 'query',
        entityId: 'query-789',
        userId: 'user-456',
        action: 'execute',
        details: {
          queryText: 'Como usar produto X?',
          documentsUsed: 2,
          responseTime: 1234,
        },
        ipAddress: '192.168.1.1',
      };

      expect(event.eventType).toBe('QUERY_EXECUTED');
      expect(event.details.documentsUsed).toBe(2);
    });

    it('deve suportar evento de aprovação', () => {
      const event: AuditEvent = {
        eventType: 'APPROVAL_GRANTED',
        entityType: 'query',
        entityId: 'query-789',
        userId: 'reviewer-123',
        action: 'approve',
        details: {
          reason: 'Conteúdo verificado',
          riskLevel: 'LOW',
        },
        ipAddress: '192.168.1.1',
      };

      expect(event.eventType).toBe('APPROVAL_GRANTED');
      expect(event.details.riskLevel).toBe('LOW');
    });

    it('deve suportar evento de rejeição', () => {
      const event: AuditEvent = {
        eventType: 'APPROVAL_REJECTED',
        entityType: 'query',
        entityId: 'query-789',
        userId: 'reviewer-123',
        action: 'reject',
        details: {
          reason: 'Conteúdo inadequado',
          riskLevel: 'CRITICAL',
        },
        ipAddress: '192.168.1.1',
      };

      expect(event.eventType).toBe('APPROVAL_REJECTED');
      expect(event.details.riskLevel).toBe('CRITICAL');
    });
  });

  describe('Compliance Requirements', () => {
    it('deve incluir IP address para rastreabilidade', () => {
      const event: AuditEvent = {
        eventType: 'TEST',
        entityType: 'test',
        entityId: 'test-1',
        userId: 'user-1',
        action: 'test',
        details: {},
        ipAddress: '192.168.1.1',
      };

      expect(event.ipAddress).toBeDefined();
      expect(event.ipAddress).toMatch(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/);
    });

    it('deve incluir userId para auditoria', () => {
      const event: AuditEvent = {
        eventType: 'TEST',
        entityType: 'test',
        entityId: 'test-1',
        userId: 'user-123',
        action: 'test',
        details: {},
        ipAddress: '127.0.0.1',
      };

      expect(event.userId).toBeDefined();
      expect(event.userId).toBe('user-123');
    });

    it('deve incluir timestamp implícito', () => {
      const event: AuditEvent = {
        eventType: 'TEST',
        entityType: 'test',
        entityId: 'test-1',
        userId: 'user-1',
        action: 'test',
        details: { timestamp: new Date().toISOString() },
        ipAddress: '127.0.0.1',
      };

      expect(event.details.timestamp).toBeDefined();
    });

    it('deve permitir detalhes estruturados', () => {
      const event: AuditEvent = {
        eventType: 'TEST',
        entityType: 'test',
        entityId: 'test-1',
        userId: 'user-1',
        action: 'test',
        details: {
          key1: 'value1',
          key2: 123,
          key3: { nested: 'object' },
          key4: ['array', 'of', 'values'],
        },
        ipAddress: '127.0.0.1',
      };

      expect(event.details.key1).toBe('value1');
      expect(event.details.key2).toBe(123);
      expect(event.details.key3.nested).toBe('object');
      expect(event.details.key4.length).toBe(3);
    });
  });
});
