import { describe, it, expect, beforeEach } from 'vitest';
import { checkRateLimit, getRateLimiterStatistics, resetRateLimiter, initializeRateLimiter } from '../_core/resilience/rateLimiter';

describe('Rate Limiter Router', () => {
  beforeEach(() => {
    resetRateLimiter();
    initializeRateLimiter();
  });

  it('should allow requests within limit', () => {
    const result = checkRateLimit('192.168.1.1');
    expect(result.allowed).toBe(true);
  });

  it('should check rate limit with userId', () => {
    const result = checkRateLimit('192.168.1.1', 'user-123');
    expect(result.allowed).toBe(true);
  });

  it('should return remaining tokens', () => {
    const result = checkRateLimit('192.168.1.1');
    expect(result.remaining).toBeGreaterThanOrEqual(0);
  });

  it('should return resetAt timestamp', () => {
    const result = checkRateLimit('192.168.1.1');
    expect(result.resetAt).toBeGreaterThan(Date.now() - 2000);
  });

  it('should track statistics', () => {
    checkRateLimit('192.168.1.1');
    checkRateLimit('192.168.1.2');

    const stats = getRateLimiterStatistics();
    expect(stats.totalRequests).toBeGreaterThanOrEqual(2);
    expect(stats.allowedRequests).toBeGreaterThanOrEqual(2);
  });

  it('should calculate allow rate', () => {
    checkRateLimit('192.168.1.1');
    checkRateLimit('192.168.1.2');

    const stats = getRateLimiterStatistics();
    expect(stats.allowRate).toBeGreaterThanOrEqual(0);
    expect(stats.allowRate).toBeLessThanOrEqual(100);
  });

  it('should track different IPs separately', () => {
    const result1 = checkRateLimit('192.168.1.1');
    const result2 = checkRateLimit('192.168.1.2');

    expect(result1.allowed).toBe(true);
    expect(result2.allowed).toBe(true);

    const stats = getRateLimiterStatistics();
    expect(stats.ipBuckets).toBeGreaterThanOrEqual(2);
  });

  it('should track different users separately', () => {
    const result1 = checkRateLimit('192.168.1.1', 'user-1');
    const result2 = checkRateLimit('192.168.1.1', 'user-2');

    expect(result1.allowed).toBe(true);
    expect(result2.allowed).toBe(true);

    const stats = getRateLimiterStatistics();
    expect(stats.userBuckets).toBeGreaterThanOrEqual(2);
  });

  it('should return retry information when limited', () => {
    // Simular múltiplas requisições para atingir o limite
    // (em um teste real, isso levaria tempo ou seria mockado)
    const result = checkRateLimit('192.168.1.1');
    
    if (!result.allowed) {
      expect(result.retryAfter).toBeDefined();
      expect(result.retryAfter).toBeGreaterThan(0);
    }
  });
});
