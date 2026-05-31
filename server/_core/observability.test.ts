import { describe, it, expect } from 'vitest';
import { getMetricsHealth } from './metrics';
import { logInfo, logError, logWarn, logDebug } from './structuredLogger';

describe('Observability - Gaps 5-7', () => {
  describe('Metrics', () => {
    it('should return metrics health', () => {
      const health = getMetricsHealth();
      expect(health).toHaveProperty('status');
      expect(health).toHaveProperty('metrics');
    });

    it('should have valid status', () => {
      const health = getMetricsHealth();
      expect(health.status).toBe('healthy');
    });

    it('should have metrics object', () => {
      const health = getMetricsHealth();
      expect(health.metrics).toHaveProperty('httpRequests');
      expect(health.metrics).toHaveProperty('dbQueries');
      expect(health.metrics).toHaveProperty('llmRequests');
    });

    it('should have numeric metric values', () => {
      const health = getMetricsHealth();
      expect(typeof health.metrics.httpRequests).toBe('number');
      expect(typeof health.metrics.dbQueries).toBe('number');
      expect(typeof health.metrics.llmRequests).toBe('number');
    });
  });

  describe('Logging', () => {
    it('should log info', () => {
      expect(() => logInfo('Test info')).not.toThrow();
    });

    it('should log error', () => {
      const error = new Error('Test error');
      expect(() => logError('Test error', error)).not.toThrow();
    });

    it('should log warning', () => {
      expect(() => logWarn('Test warning')).not.toThrow();
    });

    it('should log debug', () => {
      expect(() => logDebug('Test debug')).not.toThrow();
    });

    it('should log with metadata', () => {
      expect(() => logInfo('Test', { userId: '123' })).not.toThrow();
    });
  });

  describe('Integration', () => {
    it('should have all observability components', () => {
      const health = getMetricsHealth();
      expect(health.status).toBe('healthy');
      expect(() => logInfo('Integration test')).not.toThrow();
    });
  });
});
