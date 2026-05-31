import { describe, it, expect, beforeEach } from 'vitest';
import { encryptData, decryptData, generateSecureHash, validateHMAC, resetMasterKey, initializeMasterKey } from '../_core/security/encryptionManager';

describe('Encryption Router', () => {
  beforeEach(() => {
    resetMasterKey();
    initializeMasterKey();
  });

  describe('Encrypt/Decrypt', () => {
    it('should encrypt and decrypt data', () => {
      const plaintext = 'Hello, World!';
      const encrypted = encryptData(plaintext);

      expect(encrypted.ciphertext).toBeDefined();
      expect(encrypted.iv).toBeDefined();
      expect(encrypted.authTag).toBeDefined();
      expect(encrypted.algorithm).toBe('aes-256-gcm');

      const decrypted = decryptData(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('should encrypt and decrypt data with associated data', () => {
      const plaintext = 'Sensitive data';
      const associatedData = 'user-123';
      const encrypted = encryptData(plaintext, associatedData);

      const decrypted = decryptData(encrypted, associatedData);
      expect(decrypted).toBe(plaintext);
    });

    it('should fail to decrypt with wrong associated data', () => {
      const plaintext = 'Sensitive data';
      const associatedData = 'user-123';
      const encrypted = encryptData(plaintext, associatedData);

      expect(() => {
        decryptData(encrypted, 'wrong-data');
      }).toThrow();
    });

    it('should produce different ciphertexts for same plaintext', () => {
      const plaintext = 'Same data';
      const encrypted1 = encryptData(plaintext);
      const encrypted2 = encryptData(plaintext);

      expect(encrypted1.ciphertext).not.toBe(encrypted2.ciphertext);
      expect(encrypted1.iv).not.toBe(encrypted2.iv);
    });
  });

  describe('Hash Generation', () => {
    it('should generate consistent hash', () => {
      const data = 'test data';
      const hash1 = generateSecureHash(data);
      const hash2 = generateSecureHash(data);

      expect(hash1).toBe(hash2);
      expect(hash1.length).toBe(64); // SHA-256 hex length
    });

    it('should generate different hashes for different data', () => {
      const hash1 = generateSecureHash('data1');
      const hash2 = generateSecureHash('data2');

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('HMAC Validation', () => {
    it('should validate correct HMAC', () => {
      const data = 'message';
      const secret = 'secret-key';
      const hmac = require('crypto').createHmac('sha256', secret).update(data).digest('hex');

      const isValid = validateHMAC(data, hmac, secret);
      expect(isValid).toBe(true);
    });

    it('should reject invalid HMAC', () => {
      const data = 'message';
      const secret = 'secret-key';
      const wrongHmac = 'invalid-hmac-value';

      const isValid = validateHMAC(data, wrongHmac, secret);
      expect(isValid).toBe(false);
    });

    it('should reject HMAC with wrong secret', () => {
      const data = 'message';
      const secret = 'secret-key';
      const hmac = require('crypto').createHmac('sha256', secret).update(data).digest('hex');

      const isValid = validateHMAC(data, hmac, 'wrong-secret');
      expect(isValid).toBe(false);
    });
  });

  describe('Large Data', () => {
    it('should encrypt and decrypt large data', () => {
      const largeData = 'x'.repeat(10000);
      const encrypted = encryptData(largeData);
      const decrypted = decryptData(encrypted);

      expect(decrypted).toBe(largeData);
    });

    it('should handle binary-like data', () => {
      const binaryData = String.fromCharCode(...Array.from({ length: 256 }, (_, i) => i));
      const encrypted = encryptData(binaryData);
      const decrypted = decryptData(encrypted);

      expect(decrypted).toBe(binaryData);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string', () => {
      const encrypted = encryptData('');
      const decrypted = decryptData(encrypted);
      expect(decrypted).toBe('');
    });

    it('should handle special characters', () => {
      const specialData = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`';
      const encrypted = encryptData(specialData);
      const decrypted = decryptData(encrypted);
      expect(decrypted).toBe(specialData);
    });

    it('should handle unicode characters', () => {
      const unicodeData = '你好世界 🌍 مرحبا العالم';
      const encrypted = encryptData(unicodeData);
      const decrypted = decryptData(encrypted);
      expect(decrypted).toBe(unicodeData);
    });
  });
});
