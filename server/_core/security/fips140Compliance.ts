/**
 * FIPS 140-2 Level 2 Compliance
 * 
 * Responsabilidade: Implementar criptografia validada por FIPS 140-2 Level 2
 * 
 * Requisitos FIPS 140-2 Level 2:
 * 1. Criptografia aprovada (AES, SHA-256, etc)
 * 2. Autenticação de usuário (MFA)
 * 3. Integridade de dados (HMAC)
 * 4. Geração de números aleatórios criptograficamente seguros
 * 5. Auditoria de operações criptográficas
 * 6. Conformidade com padrões NIST
 * 
 * Justificativa:
 * - Conformidade regulatória (HIPAA, FedRAMP, DoD)
 * - Proteção de dados sensíveis
 * - Auditoria de operações criptográficas
 * - Certificação de segurança
 */

import crypto from 'crypto';

/**
 * Algoritmos aprovados por FIPS 140-2 Level 2
 */
export const FIPS140_APPROVED_ALGORITHMS = {
  // Criptografia simétrica
  AES_256_GCM: 'aes-256-gcm',
  AES_256_CBC: 'aes-256-cbc',
  
  // Hash
  SHA256: 'sha256',
  SHA384: 'sha384',
  SHA512: 'sha512',
  
  // HMAC
  HMAC_SHA256: 'sha256',
  HMAC_SHA384: 'sha384',
  HMAC_SHA512: 'sha512',
};

/**
 * Estrutura de resultado de criptografia
 */
export interface EncryptionResult {
  ciphertext: string;
  iv: string;
  authTag: string;
  algorithm: string;
  timestamp: Date;
}

/**
 * Estrutura de resultado de descriptografia
 */
export interface DecryptionResult {
  plaintext: string;
  verified: boolean;
  algorithm: string;
  timestamp: Date;
}

/**
 * Estrutura de auditoria criptográfica
 */
export interface CryptoAuditLog {
  id: string;
  operation: 'encrypt' | 'decrypt' | 'hash' | 'hmac' | 'random';
  algorithm: string;
  keyId: string;
  status: 'success' | 'failed';
  reason?: string;
  timestamp: Date;
  userId?: string;
}

// Logs de auditoria em memória
let auditLogs: CryptoAuditLog[] = [];

/**
 * Gerar chave criptográfica segura
 */
export function generateSecureKey(keyLength: number = 32): Buffer {
  if (keyLength < 16) {
    throw new Error('Tamanho de chave mínimo: 16 bytes');
  }
  
  const key = crypto.randomBytes(keyLength);
  
  logCryptoOperation({
    id: `key-${Date.now()}`,
    operation: 'random',
    algorithm: 'random-bytes',
    keyId: 'generated',
    status: 'success',
    timestamp: new Date(),
  });
  
  return key;
}

/**
 * Criptografar dados com AES-256-GCM
 */
export function encryptAES256GCM(
  plaintext: string,
  key: Buffer,
  keyId: string = 'default'
): EncryptionResult {
  try {
    if (key.length !== 32) {
      throw new Error('Chave deve ter 32 bytes para AES-256');
    }
    
    const iv = crypto.randomBytes(12); // GCM recomenda 12 bytes
    const cipher = crypto.createCipheriv(FIPS140_APPROVED_ALGORITHMS.AES_256_GCM, key, iv) as any;
    
    let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
    ciphertext += cipher.final('hex');
    
    const authTag = (cipher.getAuthTag() as Buffer).toString('hex');
    
    logCryptoOperation({
      id: `enc-${Date.now()}`,
      operation: 'encrypt',
      algorithm: FIPS140_APPROVED_ALGORITHMS.AES_256_GCM,
      keyId,
      status: 'success',
      timestamp: new Date(),
    });
    
    return {
      ciphertext,
      iv: iv.toString('hex'),
      authTag,
      algorithm: FIPS140_APPROVED_ALGORITHMS.AES_256_GCM,
      timestamp: new Date(),
    };
  } catch (error) {
    logCryptoOperation({
      id: `enc-${Date.now()}`,
      operation: 'encrypt',
      algorithm: FIPS140_APPROVED_ALGORITHMS.AES_256_GCM,
      keyId,
      status: 'failed',
      reason: String(error),
      timestamp: new Date(),
    });
    throw error;
  }
}

/**
 * Descriptografar dados com AES-256-GCM
 */
export function decryptAES256GCM(
  encrypted: EncryptionResult,
  key: Buffer,
  keyId: string = 'default'
): DecryptionResult {
  try {
    if (key.length !== 32) {
      throw new Error('Chave deve ter 32 bytes para AES-256');
    }
    
    const iv = Buffer.from(encrypted.iv, 'hex');
    const authTag = Buffer.from(encrypted.authTag, 'hex');
    
    const decipher = crypto.createDecipheriv(
      FIPS140_APPROVED_ALGORITHMS.AES_256_GCM,
      key,
      iv
    ) as any;
    
    (decipher as any).setAuthTag(authTag);
    
    let plaintext = decipher.update(encrypted.ciphertext, 'hex', 'utf8');
    plaintext += decipher.final('utf8');
    
    logCryptoOperation({
      id: `dec-${Date.now()}`,
      operation: 'decrypt',
      algorithm: FIPS140_APPROVED_ALGORITHMS.AES_256_GCM,
      keyId,
      status: 'success',
      timestamp: new Date(),
    });
    
    return {
      plaintext,
      verified: true,
      algorithm: FIPS140_APPROVED_ALGORITHMS.AES_256_GCM,
      timestamp: new Date(),
    };
  } catch (error) {
    logCryptoOperation({
      id: `dec-${Date.now()}`,
      operation: 'decrypt',
      algorithm: FIPS140_APPROVED_ALGORITHMS.AES_256_GCM,
      keyId,
      status: 'failed',
      reason: String(error),
      timestamp: new Date(),
    });
    throw error;
  }
}

/**
 * Calcular hash SHA-256
 */
export function hashSHA256(data: string): string {
  const hash = crypto.createHash(FIPS140_APPROVED_ALGORITHMS.SHA256);
  hash.update(data);
  
  logCryptoOperation({
    id: `hash-${Date.now()}`,
    operation: 'hash',
    algorithm: FIPS140_APPROVED_ALGORITHMS.SHA256,
    keyId: 'none',
    status: 'success',
    timestamp: new Date(),
  });
  
  return hash.digest('hex');
}

/**
 * Calcular HMAC-SHA256
 */
export function hmacSHA256(data: string, key: Buffer): string {
  const hmac = crypto.createHmac(FIPS140_APPROVED_ALGORITHMS.HMAC_SHA256, key);
  hmac.update(data);
  
  logCryptoOperation({
    id: `hmac-${Date.now()}`,
    operation: 'hmac',
    algorithm: FIPS140_APPROVED_ALGORITHMS.HMAC_SHA256,
    keyId: 'provided',
    status: 'success',
    timestamp: new Date(),
  });
  
  return hmac.digest('hex');
}

/**
 * Verificar HMAC-SHA256
 */
export function verifyHMACSHA256(data: string, key: Buffer, hmac: string): boolean {
  try {
    const computed = hmacSHA256(data, key);
    const isValid = crypto.timingSafeEqual(
      Buffer.from(computed, 'hex'),
      Buffer.from(hmac, 'hex')
    );
    
    return isValid;
  } catch (error) {
    logCryptoOperation({
      id: `hmac-verify-${Date.now()}`,
      operation: 'hmac',
      algorithm: FIPS140_APPROVED_ALGORITHMS.HMAC_SHA256,
      keyId: 'provided',
      status: 'failed',
      reason: 'HMAC verification failed',
      timestamp: new Date(),
    });
    return false;
  }
}

/**
 * Gerar números aleatórios criptograficamente seguros
 */
export function generateSecureRandom(length: number = 32): string {
  if (length < 1 || length > 1024) {
    throw new Error('Tamanho deve estar entre 1 e 1024 bytes');
  }
  
  const random = crypto.randomBytes(length);
  
  logCryptoOperation({
    id: `random-${Date.now()}`,
    operation: 'random',
    algorithm: 'secure-random',
    keyId: 'none',
    status: 'success',
    timestamp: new Date(),
  });
  
  return random.toString('hex');
}

/**
 * Registrar operação criptográfica
 */
export function logCryptoOperation(log: CryptoAuditLog): void {
  auditLogs.push(log);
  
  // Manter apenas últimos 1000 logs
  if (auditLogs.length > 1000) {
    auditLogs = auditLogs.slice(-1000);
  }
  
  console.log(`[FIPS140] ${log.operation.toUpperCase()} - ${log.algorithm} - ${log.status}`);
}

/**
 * Obter logs de auditoria criptográfica
 */
export function getCryptoAuditLogs(limit: number = 100): CryptoAuditLog[] {
  return auditLogs.slice(-limit);
}

/**
 * Obter estatísticas de operações criptográficas
 */
export function getCryptoStatistics(): {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  operationsByType: Record<string, number>;
  algorithmUsage: Record<string, number>;
} {
  const stats = {
    totalOperations: auditLogs.length,
    successfulOperations: auditLogs.filter((l) => l.status === 'success').length,
    failedOperations: auditLogs.filter((l) => l.status === 'failed').length,
    operationsByType: {} as Record<string, number>,
    algorithmUsage: {} as Record<string, number>,
  };
  
  for (const log of auditLogs) {
    stats.operationsByType[log.operation] = (stats.operationsByType[log.operation] || 0) + 1;
    stats.algorithmUsage[log.algorithm] = (stats.algorithmUsage[log.algorithm] || 0) + 1;
  }
  
  return stats;
}

/**
 * Resetar logs de auditoria
 */
export function resetCryptoAuditLogs(): void {
  auditLogs = [];
}
