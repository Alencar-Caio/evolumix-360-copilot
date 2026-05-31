/**
 * Testes para Distributed Tracing
 * 
 * Validar:
 * - Trace creation
 * - Span management
 * - Tracing statistics
 * - Jaeger export
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  startTrace,
  startSpan,
  addSpanTag,
  addSpanLog,
  finishSpan,
  finishSpanWithError,
  finishTrace,
  getTrace,
  getSpan,
  getTracingStatistics,
  exportTraceToJaeger,
  cleanupOldTraces,
  resetTracing,
} from './distributedTracing';

describe('Distributed Tracing', () => {
  beforeEach(() => {
    resetTracing();
  });

  describe('Trace Management', () => {
    it('deve iniciar novo trace', () => {
      const traceId = startTrace('test-service');

      expect(traceId).toBeDefined();
      expect(typeof traceId).toBe('string');
    });

    it('deve obter trace iniciado', () => {
      const traceId = startTrace('test-service');

      const trace = getTrace(traceId);

      expect(trace).toBeDefined();
      expect(trace?.traceId).toBe(traceId);
      expect(trace?.status).toBe('pending');
    });

    it('deve finalizar trace com sucesso', () => {
      const traceId = startTrace('test-service');
      const spanId = startSpan(traceId, 'operation', 'test-service');
      finishSpan(spanId);
      finishTrace(traceId);

      const trace = getTrace(traceId);

      expect(trace?.status).toBe('success');
      expect(trace?.endTime).toBeDefined();
      expect(trace?.duration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Span Management', () => {
    let traceId: string;

    beforeEach(() => {
      traceId = startTrace('test-service');
    });

    it('deve iniciar novo span', () => {
      const spanId = startSpan(traceId, 'operation', 'test-service');

      expect(spanId).toBeDefined();
      expect(typeof spanId).toBe('string');
    });

    it('deve obter span iniciado', () => {
      const spanId = startSpan(traceId, 'operation', 'test-service');

      const span = getSpan(spanId);

      expect(span).toBeDefined();
      expect(span?.spanId).toBe(spanId);
      expect(span?.operationName).toBe('operation');
    });

    it('deve adicionar tags a span', () => {
      const spanId = startSpan(traceId, 'operation', 'test-service');

      addSpanTag(spanId, 'key1', 'value1');
      addSpanTag(spanId, 'key2', 123);

      const span = getSpan(spanId);

      expect(span?.tags['key1']).toBe('value1');
      expect(span?.tags['key2']).toBe(123);
    });

    it('deve adicionar logs a span', () => {
      const spanId = startSpan(traceId, 'operation', 'test-service');

      addSpanLog(spanId, 'Log message', 'info');
      addSpanLog(spanId, 'Error message', 'error', { code: 500 });

      const span = getSpan(spanId);

      expect(span?.logs.length).toBe(2);
      expect(span?.logs[0].message).toBe('Log message');
      expect(span?.logs[1].level).toBe('error');
    });

    it('deve finalizar span com sucesso', () => {
      const spanId = startSpan(traceId, 'operation', 'test-service');

      finishSpan(spanId);

      const span = getSpan(spanId);

      expect(span?.status).toBe('success');
      expect(span?.endTime).toBeDefined();
      expect(span?.duration).toBeGreaterThanOrEqual(0);
    });

    it('deve finalizar span com erro', () => {
      const spanId = startSpan(traceId, 'operation', 'test-service');
      const error = new Error('Test error');

      finishSpanWithError(spanId, error);

      const span = getSpan(spanId);

      expect(span?.status).toBe('error');
      expect(span?.error?.message).toBe('Test error');
      expect(span?.error?.stack).toBeDefined();
    });
  });

  describe('Span Hierarchy', () => {
    let traceId: string;

    beforeEach(() => {
      traceId = startTrace('test-service');
    });

    it('deve criar spans com parent-child relationship', () => {
      const parentSpanId = startSpan(traceId, 'parent', 'test-service');
      const childSpanId = startSpan(traceId, 'child', 'test-service', parentSpanId);

      const childSpan = getSpan(childSpanId);

      expect(childSpan?.parentSpanId).toBe(parentSpanId);
    });

    it('deve rastrear múltiplos níveis de spans', () => {
      const span1 = startSpan(traceId, 'op1', 'test-service');
      const span2 = startSpan(traceId, 'op2', 'test-service', span1);
      const span3 = startSpan(traceId, 'op3', 'test-service', span2);

      const trace = getTrace(traceId);

      expect(trace?.spans.length).toBe(3);
    });
  });

  describe('Tracing Statistics', () => {
    it('deve rastrear estatísticas de tracing', () => {
      const traceId = startTrace('test-service');
      const spanId = startSpan(traceId, 'operation', 'test-service');
      finishSpan(spanId);
      finishTrace(traceId);

      const stats = getTracingStatistics();

      expect(stats.completedTraces).toBeGreaterThan(0);
      expect(stats.averageTraceDuration).toBeGreaterThanOrEqual(0);
      expect(stats.errorRate).toBe(0);
    });

    it('deve calcular taxa de erro', () => {
      const traceId1 = startTrace('test-service');
      const spanId1 = startSpan(traceId1, 'operation', 'test-service');
      finishSpan(spanId1);
      finishTrace(traceId1);

      const traceId2 = startTrace('test-service');
      const spanId2 = startSpan(traceId2, 'operation', 'test-service');
      finishSpanWithError(spanId2, new Error('Test error'));
      finishTrace(traceId2);

      const stats = getTracingStatistics();

      expect(stats.errorRate).toBeGreaterThan(0);
    });
  });

  describe('Jaeger Export', () => {
    it('deve exportar trace para formato Jaeger', () => {
      const traceId = startTrace('test-service');
      const spanId = startSpan(traceId, 'operation', 'test-service');

      addSpanTag(spanId, 'http.method', 'GET');
      addSpanLog(spanId, 'Request started', 'info');

      finishSpan(spanId);
      finishTrace(traceId);

      const jaegerTrace = exportTraceToJaeger(traceId);

      expect(jaegerTrace.traceID).toBe(traceId);
      expect(jaegerTrace.spans.length).toBe(1);
      expect(jaegerTrace.spans[0].operationName).toBe('operation');
      expect(jaegerTrace.spans[0].tags.some((t) => t.key === 'http.method')).toBe(true);
    });

    it('deve incluir logs em exportação Jaeger', () => {
      const traceId = startTrace('test-service');
      const spanId = startSpan(traceId, 'operation', 'test-service');

      addSpanLog(spanId, 'Log message', 'info');

      finishSpan(spanId);
      finishTrace(traceId);

      const jaegerTrace = exportTraceToJaeger(traceId);

      expect(jaegerTrace.spans[0].logs.length).toBeGreaterThan(0);
    });
  });

  describe('Cleanup', () => {
    it('deve limpar traces antigos', () => {
      const traceId = startTrace('test-service');
      const spanId = startSpan(traceId, 'operation', 'test-service');
      finishSpan(spanId);
      finishTrace(traceId);

      // Simular trace antigo alterando endTime
      const trace = getTrace(traceId);
      if (trace?.endTime) {
        trace.endTime = new Date(Date.now() - 4 * 3600000); // 4 horas atrás
      }

      const cleaned = cleanupOldTraces(3600000); // 1 hora

      expect(cleaned).toBeGreaterThan(0);
      expect(getTrace(traceId)).toBeUndefined();
    });
  });
});
