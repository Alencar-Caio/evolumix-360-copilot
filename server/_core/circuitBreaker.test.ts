import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createCircuitBreaker, getCircuitBreakerStatus, resetCircuitBreaker } from './circuitBreaker';

describe('Circuit Breaker - Gap 4', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Create Circuit Breaker', () => {
    it('should create a circuit breaker', () => {
      const fn = vi.fn().mockResolvedValue({ success: true });
      const breaker = createCircuitBreaker(fn, { name: 'test' });
      expect(breaker).toBeDefined();
    });

    it('should execute function successfully', async () => {
      const fn = vi.fn().mockResolvedValue({ success: true });
      const breaker = createCircuitBreaker(fn, { name: 'test' });
      
      const result = await breaker.fire();
      expect(result).toEqual({ success: true });
    });

    it('should have correct name', () => {
      const fn = vi.fn().mockResolvedValue({});
      const breaker = createCircuitBreaker(fn, { name: 'TestBreaker' });
      expect(breaker.name).toBe('TestBreaker');
    });
  });

  describe('Circuit Breaker Status', () => {
    it('should return status for all breakers', () => {
      const status = getCircuitBreakerStatus();
      expect(status).toHaveProperty('llm');
      expect(status).toHaveProperty('database');
      expect(status).toHaveProperty('s3');
    });

    it('should have state property', () => {
      const status = getCircuitBreakerStatus();
      expect(status.llm).toHaveProperty('state');
      expect(status.database).toHaveProperty('state');
      expect(status.s3).toHaveProperty('state');
    });

    it('should have stats property', () => {
      const status = getCircuitBreakerStatus();
      expect(status.llm).toHaveProperty('stats');
      expect(status.database).toHaveProperty('stats');
      expect(status.s3).toHaveProperty('stats');
    });

    it('should have valid state values', () => {
      const status = getCircuitBreakerStatus();
      expect(['open', 'closed']).toContain(status.llm.state);
      expect(['open', 'closed']).toContain(status.database.state);
      expect(['open', 'closed']).toContain(status.s3.state);
    });

    it('should have numeric stats', () => {
      const status = getCircuitBreakerStatus();
      expect(status.llm.stats.fires).toBeGreaterThanOrEqual(0);
      expect(status.llm.stats.failures).toBeGreaterThanOrEqual(0);
      expect(status.llm.stats.successes).toBeGreaterThanOrEqual(0);
      expect(status.llm.stats.timeouts).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Reset Circuit Breaker', () => {
    it('should reset circuit breaker', () => {
      resetCircuitBreaker('llm');
      const status = getCircuitBreakerStatus();
      expect(status.llm.state).toBe('closed');
    });

    it('should reset database breaker', () => {
      resetCircuitBreaker('database');
      const status = getCircuitBreakerStatus();
      expect(status.database.state).toBe('closed');
    });

    it('should reset s3 breaker', () => {
      resetCircuitBreaker('s3');
      const status = getCircuitBreakerStatus();
      expect(status.s3.state).toBe('closed');
    });
  });

  describe('Configuration', () => {
    it('should accept custom timeout', () => {
      const fn = vi.fn().mockResolvedValue({});
      const breaker = createCircuitBreaker(fn, {
        name: 'test',
        timeout: 5000,
      });
      expect(breaker).toBeDefined();
    });

    it('should accept custom error threshold', () => {
      const fn = vi.fn().mockResolvedValue({});
      const breaker = createCircuitBreaker(fn, {
        name: 'test',
        errorThresholdPercentage: 75,
      });
      expect(breaker).toBeDefined();
    });

    it('should accept custom reset timeout', () => {
      const fn = vi.fn().mockResolvedValue({});
      const breaker = createCircuitBreaker(fn, {
        name: 'test',
        resetTimeout: 60000,
      });
      expect(breaker).toBeDefined();
    });
  });

  describe('Integration', () => {
    it('should have all breakers initialized', () => {
      const status = getCircuitBreakerStatus();
      expect(Object.keys(status).length).toBe(3);
    });

    it('should maintain state across calls', async () => {
      const status1 = getCircuitBreakerStatus();
      const status2 = getCircuitBreakerStatus();
      expect(status1.llm.state).toBe(status2.llm.state);
    });
  });
});
