/**
 * Testes para Encryption Manager
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  initializeMasterKey,
  getMasterKey,
  encryptData,
  decryptData,
  validateTLSConfiguration,
  generateSecureHash,
  generateHMAC,
  validateHMAC,
  getEncryptionStatistics,
  resetEncryptionStatistics,
  resetMasterKey,
} from './encryptionManager';
import crypto from 'crypto';

describe('Encryption Manager', () => {
  beforeEach(() => {
    resetMasterKey();
    resetEncryptionStatistics();
  });

  describe('Master Key Management', () => {
    it('deve inicializar master key', () => {
      const key = crypto.randomBytes(32);
      initializeMasterKey(key);

      const retrieved = getMasterKey();

      expect(retrieved).toEqual(key);
    });

    it('deve gerar master key automaticamente', () => {
      initializeMasterKey();

      const key = getMasterKey();

      expect(key).toBeDefined();
      expect(key.length).toBe(32);
    });

    it('deve rejeitar chave com tamanho incorreto', () => {
      const invalidKey = crypto.randomBytes(16);

      expect(() => initializeMasterKey(invalidKey)).toThrow();
    });

    it('deve lançar erro se master key não foi inicializada', () => {
      expect(() => getMasterKey()).toThrow();
    });
  });

  describe('Data Encryption', () => {
    beforeEach(() => {
      initializeMasterKey();
    });

    it('deve criptografar dados', () => {
      const plaintext = 'Secret data';

      const encrypted = encryptData(plaintext);

      expect(encrypted).toBeDefined();
      expect(encrypted.ciphertext).toBeDefined();
      expect(encrypted.iv).toBeDefined();
      expect(encrypted.authTag).toBeDefined();
      expect(encrypted.algorithm).toBe('aes-256-gcm');
    });

    it('deve descriptografar dados', () => {
      const plaintext = 'Secret data';

      const encrypted = encryptData(plaintext);
      const decrypted = decryptData(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('deve criptografar com dados adicionais', () => {
      const plaintext = 'Secret data';
      const aad = 'Additional authenticated data';

      const encrypted = encryptData(plaintext, aad);
      const decrypted = decryptData(encrypted, aad);

      expect(decrypted).toBe(plaintext);
    });

    it('deve falhar ao descriptografar com AAD incorreto', () => {
      const plaintext = 'Secret data';
      const aad = 'Additional authenticated data';

      const encrypted = encryptData(plaintext, aad);

      expect(() => decryptData(encrypted, 'Wrong AAD')).toThrow();
    });

    it('deve gerar IV diferente para cada criptografia', () => {
      const plaintext = 'Secret data';

      const encrypted1 = encryptData(plaintext);
      const encrypted2 = encryptData(plaintext);

      expect(encrypted1.iv).not.toBe(encrypted2.iv);
    });
  });

  describe('Hashing', () => {
    it('deve gerar hash seguro', () => {
      const data = 'Test data';

      const hash = generateSecureHash(data);

      expect(hash).toBeDefined();
      expect(hash.length).toBe(64); // SHA-256 em hex
    });

    it('deve gerar mesmo hash para mesmo dado', () => {
      const data = 'Test data';

      const hash1 = generateSecureHash(data);
      const hash2 = generateSecureHash(data);

      expect(hash1).toBe(hash2);
    });

    it('deve gerar hash diferente para dados diferentes', () => {
      const hash1 = generateSecureHash('Data 1');
      const hash2 = generateSecureHash('Data 2');

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('HMAC', () => {
    it('deve gerar HMAC', () => {
      const data = 'Test data';
      const secret = 'Secret key';

      const hmac = generateHMAC(data, secret);

      expect(hmac).toBeDefined();
      expect(hmac.length).toBe(64); // SHA-256 em hex
    });

    it('deve validar HMAC correto', () => {
      const data = 'Test data';
      const secret = 'Secret key';

      const hmac = generateHMAC(data, secret);
      const isValid = validateHMAC(data, hmac, secret);

      expect(isValid).toBe(true);
    });

    it('deve rejeitar HMAC incorreto', () => {
      const data = 'Test data';
      const secret = 'Secret key';

      const hmac = generateHMAC(data, secret);
      const isValid = validateHMAC(data, 'wrong-hmac', secret);

      expect(isValid).toBe(false);
    });

    it('deve rejeitar HMAC com secret incorreto', () => {
      const data = 'Test data';
      const secret = 'Secret key';

      const hmac = generateHMAC(data, secret);
      const isValid = validateHMAC(data, hmac, 'wrong-secret');

      expect(isValid).toBe(false);
    });
  });

  describe('TLS Configuration', () => {
    it('deve validar configuração TLS', () => {
      const config = validateTLSConfiguration();

      expect(config).toBeDefined();
      expect(config.tlsVersion).toBeDefined();
      expect(config.ciphers).toBeDefined();
      expect(config.isSecure).toBeDefined();
    });
  });

  describe('Statistics', () => {
    beforeEach(() => {
      initializeMasterKey();
    });

    it('deve rastrear operações de criptografia', () => {
      encryptData('Test data');

      const stats = getEncryptionStatistics();

      expect(stats.encryptedItems).toBe(1);
      expect(stats.decryptedItems).toBe(0);
    });

    it('deve rastrear operações de descriptografia', () => {
      const encrypted = encryptData('Test data');
      decryptData(encrypted);

      const stats = getEncryptionStatistics();

      expect(stats.encryptedItems).toBe(1);
      expect(stats.decryptedItems).toBe(1);
    });

    it('deve rastrear falhas', () => {
      try {
        decryptData({
          ciphertext: 'invalid',
          iv: 'invalid',
          authTag: 'invalid',
          algorithm: 'aes-256-gcm',
        });
      } catch {
        // Expected
      }

      const stats = getEncryptionStatistics();

      expect(stats.failedDecryptions).toBeGreaterThan(0);
    });
  });
});
