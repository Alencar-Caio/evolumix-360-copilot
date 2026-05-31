/**
 * Testes para FIPS 140-2 Level 2 Compliance
 * 
 * Validar:
 * - Criptografia AES-256-GCM
 * - Hash SHA-256
 * - HMAC-SHA256
 * - Números aleatórios seguros
 * - Auditoria criptográfica
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateSecureKey,
  encryptAES256GCM,
  decryptAES256GCM,
  hashSHA256,
  hmacSHA256,
  verifyHMACSHA256,
  generateSecureRandom,
  getCryptoAuditLogs,
  getCryptoStatistics,
  resetCryptoAuditLogs,
  FIPS140_APPROVED_ALGORITHMS,
} from './fips140Compliance';

describe('FIPS 140-2 Level 2 Compliance', () => {
  beforeEach(() => {
    resetCryptoAuditLogs();
  });

  describe('Key Generation', () => {
    it('deve gerar chave segura de 32 bytes', () => {
      const key = generateSecureKey(32);

      expect(key).toHaveLength(32);
      expect(key).toBeInstanceOf(Buffer);
    });

    it('deve rejeitar chaves muito pequenas', () => {
      expect(() => generateSecureKey(8)).toThrow();
    });

    it('deve registrar operação de geração de chave', () => {
      generateSecureKey(32);

      const logs = getCryptoAuditLogs();
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].operation).toBe('random');
    });
  });

  describe('AES-256-GCM Encryption', () => {
    let key: Buffer;
    const plaintext = 'Dados sensíveis para criptografia';

    beforeEach(() => {
      key = generateSecureKey(32);
      resetCryptoAuditLogs();
    });

    it('deve criptografar dados', () => {
      const result = encryptAES256GCM(plaintext, key);

      expect(result.ciphertext).toBeDefined();
      expect(result.iv).toBeDefined();
      expect(result.authTag).toBeDefined();
      expect(result.algorithm).toBe(FIPS140_APPROVED_ALGORITHMS.AES_256_GCM);
    });

    it('deve descriptografar dados criptografados', () => {
      const encrypted = encryptAES256GCM(plaintext, key);
      resetCryptoAuditLogs();

      const decrypted = decryptAES256GCM(encrypted, key);

      expect(decrypted.plaintext).toBe(plaintext);
      expect(decrypted.verified).toBe(true);
    });

    it('deve falhar com chave incorreta', () => {
      const encrypted = encryptAES256GCM(plaintext, key);
      const wrongKey = generateSecureKey(32);

      expect(() => decryptAES256GCM(encrypted, wrongKey)).toThrow();
    });

    it('deve registrar operações de criptografia', () => {
      encryptAES256GCM(plaintext, key);

      const logs = getCryptoAuditLogs();
      expect(logs.some((l) => l.operation === 'encrypt')).toBe(true);
    });
  });

  describe('SHA-256 Hashing', () => {
    it('deve calcular hash SHA-256', () => {
      const data = 'dados para hash';
      const hash = hashSHA256(data);

      expect(hash).toHaveLength(64); // SHA-256 = 64 caracteres hex
      expect(/^[a-f0-9]{64}$/.test(hash)).toBe(true);
    });

    it('deve produzir hash consistente', () => {
      const data = 'dados para hash';
      const hash1 = hashSHA256(data);
      resetCryptoAuditLogs();
      const hash2 = hashSHA256(data);

      expect(hash1).toBe(hash2);
    });

    it('deve produzir hash diferente para dados diferentes', () => {
      const hash1 = hashSHA256('dados1');
      resetCryptoAuditLogs();
      const hash2 = hashSHA256('dados2');

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('HMAC-SHA256', () => {
    let key: Buffer;

    beforeEach(() => {
      key = generateSecureKey(32);
      resetCryptoAuditLogs();
    });

    it('deve calcular HMAC-SHA256', () => {
      const data = 'dados para HMAC';
      const hmac = hmacSHA256(data, key);

      expect(hmac).toHaveLength(64);
      expect(/^[a-f0-9]{64}$/.test(hmac)).toBe(true);
    });

    it('deve verificar HMAC válido', () => {
      const data = 'dados para HMAC';
      const hmac = hmacSHA256(data, key);
      resetCryptoAuditLogs();

      const isValid = verifyHMACSHA256(data, key, hmac);

      expect(isValid).toBe(true);
    });

    it('deve rejeitar HMAC inválido', () => {
      const data = 'dados para HMAC';
      const hmac = hmacSHA256(data, key);
      const wrongData = 'dados diferentes';

      const isValid = verifyHMACSHA256(wrongData, key, hmac);

      expect(isValid).toBe(false);
    });

    it('deve rejeitar HMAC com chave errada', () => {
      const data = 'dados para HMAC';
      const hmac = hmacSHA256(data, key);
      const wrongKey = generateSecureKey(32);

      const isValid = verifyHMACSHA256(data, wrongKey, hmac);

      expect(isValid).toBe(false);
    });
  });

  describe('Secure Random Generation', () => {
    it('deve gerar números aleatórios', () => {
      const random = generateSecureRandom(32);

      expect(random).toHaveLength(64); // 32 bytes = 64 caracteres hex
      expect(/^[a-f0-9]{64}$/.test(random)).toBe(true);
    });

    it('deve gerar números aleatórios diferentes', () => {
      const random1 = generateSecureRandom(32);
      resetCryptoAuditLogs();
      const random2 = generateSecureRandom(32);

      expect(random1).not.toBe(random2);
    });

    it('deve rejeitar tamanho inválido', () => {
      expect(() => generateSecureRandom(0)).toThrow();
      expect(() => generateSecureRandom(2000)).toThrow();
    });
  });

  describe('Crypto Audit Logging', () => {
    it('deve registrar operações criptográficas', () => {
      const key = generateSecureKey(32);
      hashSHA256('dados');

      const logs = getCryptoAuditLogs();

      expect(logs.length).toBeGreaterThan(0);
      expect(logs.some((l) => l.operation === 'random')).toBe(true);
      expect(logs.some((l) => l.operation === 'hash')).toBe(true);
    });

    it('deve incluir status de operação', () => {
      const key = generateSecureKey(32);

      const logs = getCryptoAuditLogs();

      expect(logs.every((l) => l.status === 'success' || l.status === 'failed')).toBe(true);
    });

    it('deve incluir algoritmo em logs', () => {
      hashSHA256('dados');

      const logs = getCryptoAuditLogs();

      expect(logs[logs.length - 1].algorithm).toBe(FIPS140_APPROVED_ALGORITHMS.SHA256);
    });
  });

  describe('Crypto Statistics', () => {
    it('deve rastrear estatísticas de operações', () => {
      generateSecureKey(32);
      hashSHA256('dados');

      const stats = getCryptoStatistics();

      expect(stats.totalOperations).toBeGreaterThan(0);
      expect(stats.successfulOperations).toBeGreaterThan(0);
      expect(stats.failedOperations).toBe(0);
    });

    it('deve contar operações por tipo', () => {
      generateSecureKey(32);
      hashSHA256('dados');

      const stats = getCryptoStatistics();

      expect(stats.operationsByType['random']).toBeGreaterThan(0);
      expect(stats.operationsByType['hash']).toBeGreaterThan(0);
    });

    it('deve rastrear uso de algoritmos', () => {
      hashSHA256('dados');

      const stats = getCryptoStatistics();

      expect(stats.algorithmUsage[FIPS140_APPROVED_ALGORITHMS.SHA256]).toBeGreaterThan(0);
    });
  });

  describe('FIPS 140-2 Compliance', () => {
    it('deve usar apenas algoritmos aprovados', () => {
      const approvedAlgos = Object.values(FIPS140_APPROVED_ALGORITHMS);

      const logs = getCryptoAuditLogs();
      for (const log of logs) {
        expect(approvedAlgos).toContain(log.algorithm);
      }
    });

    it('deve manter auditoria de todas as operações', () => {
      const key = generateSecureKey(32);
      encryptAES256GCM('dados', key);
      hashSHA256('dados');
      hmacSHA256('dados', key);

      const logs = getCryptoAuditLogs();

      expect(logs.length).toBeGreaterThan(0);
      expect(logs.every((l) => l.timestamp)).toBe(true);
    });
  });
});
