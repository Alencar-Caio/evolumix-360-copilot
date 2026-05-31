/**
 * Encryption Router
 * 
 * Endpoints tRPC para criptografia de dados
 */

import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { encryptData, decryptData, validateHMAC, generateSecureHash, getEncryptionStatistics } from '../_core/security/encryptionManager';

export const encryptionRouter = router({
  /**
   * Criptografar dados
   */
  encrypt: protectedProcedure
    .input(
      z.object({
        plaintext: z.string(),
        associatedData: z.string().optional(),
      })
    )
    .mutation(({ input }) => {
      try {
        const result = encryptData(input.plaintext, input.associatedData);
        return {
          success: true,
          ciphertext: result.ciphertext,
          iv: result.iv,
          authTag: result.authTag,
          algorithm: 'AES-256-GCM',
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Encryption failed',
        };
      }
    }),

  /**
   * Descriptografar dados
   */
  decrypt: protectedProcedure
    .input(
      z.object({
        ciphertext: z.string(),
        iv: z.string(),
        authTag: z.string(),
        associatedData: z.string().optional(),
      })
    )
    .mutation(({ input }) => {
      try {
        const plaintext = decryptData(
          {
            ciphertext: input.ciphertext,
            iv: input.iv,
            authTag: input.authTag,
            algorithm: 'aes-256-gcm',
          },
          input.associatedData
        );
        return {
          success: true,
          plaintext,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Decryption failed',
        };
      }
    }),

  /**
   * Gerar hash seguro
   */
  generateHash: protectedProcedure
    .input(
      z.object({
        data: z.string(),
      })
    )
    .mutation(({ input }) => {
      try {
        const hash = generateSecureHash(input.data);
        return {
          success: true,
          hash,
          algorithm: 'SHA-256',
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Hash generation failed',
        };
      }
    }),

  /**
   * Validar HMAC
   */
  validateHmac: protectedProcedure
    .input(
      z.object({
        data: z.string(),
        hmac: z.string(),
        secret: z.string(),
      })
    )
    .query(({ input }) => {
      try {
        const isValid = validateHMAC(input.data, input.hmac, input.secret);
        return {
          success: true,
          isValid,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'HMAC validation failed',
        };
      }
    }),

  /**
   * Obter status de criptografia
   */
  getStatus: protectedProcedure.query(() => {
    const stats = getEncryptionStatistics();
    return {
      encryptionEnabled: true,
      algorithm: 'AES-256-GCM',
      keyManagement: 'FIPS 140-2 Level 2',
      tlsVersion: '1.3',
      status: 'operational',
      statistics: stats,
    };
  }),
});
