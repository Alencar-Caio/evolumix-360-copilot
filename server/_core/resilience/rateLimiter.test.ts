/**
 * Testes para Rate Limiter
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  initializeRateLimiter,
  checkRateLimit,
  getRateLimiterStatistics,
  resetRateLimiter,
  type RateLimitConfig,
} from './rateLimiter';

const testConfig: RateLimitConfig = {
  globalLimit: 100,
  perIpLimit: 10,
  perUserLimit: 5,
  refillInterval: 1000,
};

describe('Rate Limiter', () => {
  beforeEach(() => {
    resetRateLimiter();
    initializeRateLimiter(testConfig);
  });

  describe('Initialization', () => {
    it('deve inicializar rate limiter', () => {
      const stats = getRateLimiterStatistics();

      expect(stats.totalRequests).toBe(0);
      expect(stats.allowedRequests).toBe(0);
    });
  });

  describe('Global Rate Limiting', () => {
    it('deve permitir requisições dentro do limite global', () => {
      const result = checkRateLimit('192.168.1.1');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBeGreaterThanOrEqual(0);
    });

    it('deve negar requisições após atingir limite global', () => {
      // Consumir limite global
      for (let i = 0; i < testConfig.globalLimit; i++) {
        checkRateLimit(`192.168.1.${i % 255}`);
      }

      const result = checkRateLimit('192.168.1.1');

      expect(result.allowed).toBe(false);
      expect(result.retryAfter).toBe(1);
    });
  });

  describe('Per-IP Rate Limiting', () => {
    it('deve permitir requisições dentro do limite por IP', () => {
      const ip = '192.168.1.1';

      for (let i = 0; i < testConfig.perIpLimit; i++) {
        const result = checkRateLimit(ip);
        expect(result.allowed).toBe(true);
      }
    });

    it('deve negar requisições após atingir limite por IP', () => {
      const ip = '192.168.1.1';

      // Consumir limite por IP
      for (let i = 0; i < testConfig.perIpLimit; i++) {
        checkRateLimit(ip);
      }

      const result = checkRateLimit(ip);

      expect(result.allowed).toBe(false);
    });

    it('deve ter limites independentes por IP', () => {
      const ip1 = '192.168.1.1';
      const ip2 = '192.168.1.2';

      // Consumir limite para IP1
      for (let i = 0; i < testConfig.perIpLimit; i++) {
        checkRateLimit(ip1);
      }

      // IP2 ainda deve ter limite disponível
      const result = checkRateLimit(ip2);

      expect(result.allowed).toBe(true);
    });
  });

  describe('Per-User Rate Limiting', () => {
    it('deve permitir requisições dentro do limite por usuário', () => {
      const userId = 'user-123';
      const ip = '192.168.1.1';

      for (let i = 0; i < testConfig.perUserLimit; i++) {
        const result = checkRateLimit(ip, userId);
        expect(result.allowed).toBe(true);
      }
    });

    it('deve negar requisições após atingir limite por usuário', () => {
      const userId = 'user-123';
      const ip = '192.168.1.1';

      // Consumir limite por usuário
      for (let i = 0; i < testConfig.perUserLimit; i++) {
        checkRateLimit(ip, userId);
      }

      const result = checkRateLimit(ip, userId);

      expect(result.allowed).toBe(false);
    });

    it('deve ter limites independentes por usuário', () => {
      const user1 = 'user-1';
      const user2 = 'user-2';
      const ip = '192.168.1.1';

      // Consumir limite para user1
      for (let i = 0; i < testConfig.perUserLimit; i++) {
        checkRateLimit(ip, user1);
      }

      // user2 ainda deve ter limite disponível
      const result = checkRateLimit(ip, user2);

      expect(result.allowed).toBe(true);
    });
  });

  describe('Statistics', () => {
    it('deve rastrear requisições totais', () => {
      checkRateLimit('192.168.1.1');
      checkRateLimit('192.168.1.1');

      const stats = getRateLimiterStatistics();

      expect(stats.totalRequests).toBe(2);
      expect(stats.allowedRequests).toBe(2);
    });

    it('deve rastrear requisições negadas', () => {
      const ip = '192.168.1.1';

      // Consumir limite
      for (let i = 0; i < testConfig.perIpLimit; i++) {
        checkRateLimit(ip);
      }

      // Próxima requisição será negada
      checkRateLimit(ip);

      const stats = getRateLimiterStatistics();

      expect(stats.deniedRequests).toBeGreaterThan(0);
    });

    it('deve calcular taxa de permissão', () => {
      checkRateLimit('192.168.1.1');
      checkRateLimit('192.168.1.1');

      const stats = getRateLimiterStatistics();

      expect(stats.allowRate).toBe(100);
    });

    it('deve contar buckets', () => {
      checkRateLimit('192.168.1.1', 'user-1');
      checkRateLimit('192.168.1.2', 'user-2');

      const stats = getRateLimiterStatistics();

      expect(stats.ipBuckets).toBeGreaterThan(0);
      expect(stats.userBuckets).toBeGreaterThan(0);
    });
  });

  describe('Reset', () => {
    it('deve resetar rate limiter', () => {
      checkRateLimit('192.168.1.1');

      resetRateLimiter();
      initializeRateLimiter(testConfig);

      const stats = getRateLimiterStatistics();

      expect(stats.totalRequests).toBe(0);
    });
  });
});
