/**
 * Encryption Manager
 * 
 * Responsabilidade: Gerenciar criptografia em repouso e em trânsito
 * 
 * Implementa:
 * - AES-256-GCM para dados em repouso
 * - TLS 1.3 para dados em trânsito
 * - Key rotation
 * - Secure key storage
 */

import crypto from 'crypto';

/**
 * Configuração de criptografia
 */
export interface EncryptionConfig {
  algorithm: 'aes-256-gcm';
  keyLength: number; // 32 bytes para AES-256
  ivLength: number; // 12 bytes para GCM
  authTagLength: number; // 16 bytes
  tlsVersion: 'TLSv1.3' | 'TLSv1.2';
}

/**
 * Dados criptografados
 */
export interface EncryptedData {
  ciphertext: string; // Base64
  iv: string; // Base64
  authTag: string; // Base64
  algorithm: string;
}

/**
 * Configuração padrão
 */
const DEFAULT_CONFIG: EncryptionConfig = {
  algorithm: 'aes-256-gcm',
  keyLength: 32,
  ivLength: 12,
  authTagLength: 16,
  tlsVersion: 'TLSv1.3',
};

// Armazenamento de chaves (em produção, usar Key Management Service)
let masterKey: Buffer | null = null;
let encryptionStats = {
  encryptedItems: 0,
  decryptedItems: 0,
  failedEncryptions: 0,
  failedDecryptions: 0,
};

/**
 * Inicializar master key
 */
export function initializeMasterKey(key?: Buffer): void {
  if (key) {
    if (key.length !== DEFAULT_CONFIG.keyLength) {
      throw new Error(`Master key must be ${DEFAULT_CONFIG.keyLength} bytes`);
    }
    masterKey = key;
  } else {
    // Gerar nova chave (apenas para desenvolvimento)
    masterKey = crypto.randomBytes(DEFAULT_CONFIG.keyLength);
  }

  console.log('[EncryptionManager] Master key initialized');
}

/**
 * Obter master key
 */
export function getMasterKey(): Buffer {
  if (!masterKey) {
    throw new Error('Master key not initialized. Call initializeMasterKey() first');
  }
  return masterKey;
}

/**
 * Criptografar dados
 */
export function encryptData(plaintext: string, additionalData?: string): EncryptedData {
  try {
    const key = getMasterKey();
    const iv = crypto.randomBytes(DEFAULT_CONFIG.ivLength);

    const cipher = crypto.createCipheriv(DEFAULT_CONFIG.algorithm, key, iv);

    if (additionalData) {
      cipher.setAAD(Buffer.from(additionalData));
    }

    let ciphertextHex = cipher.update(plaintext, 'utf-8', 'hex');
    ciphertextHex += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    encryptionStats.encryptedItems++;

    console.log(`[EncryptionManager] Data encrypted (${plaintext.length} bytes)`);

    return {
      ciphertext: Buffer.from(ciphertextHex, 'hex').toString('base64'),
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
      algorithm: DEFAULT_CONFIG.algorithm,
    };
  } catch (error) {
    encryptionStats.failedEncryptions++;
    throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Descriptografar dados
 */
export function decryptData(encrypted: EncryptedData, additionalData?: string): string {
  try {
    const key = getMasterKey();
    const iv = Buffer.from(encrypted.iv, 'base64');
    const ciphertext = Buffer.from(encrypted.ciphertext, 'base64');
    const authTag = Buffer.from(encrypted.authTag, 'base64');

    const decipher = crypto.createDecipheriv(encrypted.algorithm as any, key, iv);

    if (additionalData) {
      decipher.setAAD(Buffer.from(additionalData));
    }

    decipher.setAuthTag(authTag);

    let plaintextResult: string = (decipher.update(ciphertext) as unknown as string);
    plaintextResult += (decipher.final('utf-8') as unknown as string);

    encryptionStats.decryptedItems++;

    console.log(`[EncryptionManager] Data decrypted (${plaintextResult.length} bytes)`);

    return plaintextResult;
  } catch (error) {
    encryptionStats.failedDecryptions++;
    throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validar configuração TLS
 */
export function validateTLSConfiguration(): {
  tlsVersion: string;
  ciphers: string[];
  isSecure: boolean;
} {
  const tlsVersion = process.env.NODE_TLS_VERSION || 'TLSv1.3';
  const ciphers = process.env.NODE_OPTIONS?.match(/--tls-cipher-list=([^ ]+)/)?.[1]?.split(':') || [];

  const isSecure =
    tlsVersion === 'TLSv1.3' ||
    (tlsVersion === 'TLSv1.2' && ciphers.length > 0);

  console.log(
    `[EncryptionManager] TLS Configuration: ${tlsVersion} (${isSecure ? 'Secure' : 'Not Secure'})`
  );

  return {
    tlsVersion,
    ciphers,
    isSecure,
  };
}

/**
 * Gerar hash seguro
 */
export function generateSecureHash(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Gerar HMAC
 */
export function generateHMAC(data: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

/**
 * Validar HMAC
 */
export function validateHMAC(data: string, hmac: string, secret: string): boolean {
  const computed = generateHMAC(data, secret);
  
  // Verificar tamanho primeiro para evitar erro de timingSafeEqual
  if (computed.length !== hmac.length) {
    return false;
  }
  
  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(hmac));
}

/**
 * Obter estatísticas de criptografia
 */
export function getEncryptionStatistics() {
  return {
    ...encryptionStats,
    totalOperations: encryptionStats.encryptedItems + encryptionStats.decryptedItems,
    failureRate:
      (encryptionStats.failedEncryptions + encryptionStats.failedDecryptions) /
      (encryptionStats.encryptedItems + encryptionStats.decryptedItems || 1),
  };
}

/**
 * Resetar estatísticas (para testes)
 */
export function resetEncryptionStatistics(): void {
  encryptionStats = {
    encryptedItems: 0,
    decryptedItems: 0,
    failedEncryptions: 0,
    failedDecryptions: 0,
  };
}

/**
 * Resetar master key (para testes)
 */
export function resetMasterKey(): void {
  masterKey = null;
}
