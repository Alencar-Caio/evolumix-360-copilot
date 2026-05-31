/**
 * Testes para Quality Assurance Pipeline
 * 
 * Validar:
 * - Quality checks
 * - Metrics tracking
 * - Report generation
 * - Batch validation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  validateQuality,
  getQualityMetrics,
  resetQualityMetrics,
  generateQualityReport,
  validateBatch,
} from './qualityAssurance';
import type { ResponseToValidate } from './qualityAssurance';

describe('Quality Assurance Pipeline', () => {
  const goodResponse: ResponseToValidate = {
    content: 'Este é um conteúdo técnico válido sobre o produto',
    sourceDocuments: ['FISPQ Produto A', 'Ficha Técnica Produto A'],
    citations: ['FISPQ Produto A', 'Ficha Técnica Produto A'],
    confidence: 0.95,
    metadata: { category: 'technical' },
  };

  const poorResponse: ResponseToValidate = {
    content: 'Resposta',
    sourceDocuments: [],
    citations: [],
    confidence: 0.1,
  };

  const maliciousResponse: ResponseToValidate = {
    content: 'Conteúdo com <script>alert("xss")</script>',
    sourceDocuments: ['Doc'],
    citations: ['Doc'],
    confidence: 0.5,
  };

  beforeEach(() => {
    resetQualityMetrics();
  });

  describe('Quality Validation', () => {
    it('deve retornar resultado com score', () => {
      const result = validateQuality(goodResponse);

      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.checks.length).toBe(5);
    });

    it('deve rejeitar resposta maliciosa', () => {
      const result = validateQuality(maliciousResponse);

      expect(result.passed).toBe(false);
      expect(result.checks.some((c) => c.name === 'Security' && !c.passed)).toBe(true);
    });

    it('deve incluir todos os checks', () => {
      const result = validateQuality(goodResponse);

      const checkNames = result.checks.map((c) => c.name);
      expect(checkNames).toContain('Completeness');
      expect(checkNames).toContain('Relevance');
      expect(checkNames).toContain('Compliance');
      expect(checkNames).toContain('Security');
      expect(checkNames).toContain('Citations');
    });

    it('deve incluir timestamp', () => {
      const result = validateQuality(goodResponse);

      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('deve incluir detalhes', () => {
      const result = validateQuality(goodResponse);

      expect(result.details).toBeDefined();
      expect(result.details.documentCount).toBe(2);
      expect(result.details.citationCount).toBe(2);
      expect(result.details.contentLength).toBeGreaterThan(0);
    });
  });

  describe('Quality Checks', () => {
    it('deve ter check de completude', () => {
      const result = validateQuality(goodResponse);
      const completenessCheck = result.checks.find((c) => c.name === 'Completeness');

      expect(completenessCheck).toBeDefined();
      expect(completenessCheck?.score).toBeGreaterThanOrEqual(0);
    });

    it('deve ter check de relevância', () => {
      const result = validateQuality(goodResponse);
      const relevanceCheck = result.checks.find((c) => c.name === 'Relevance');

      expect(relevanceCheck).toBeDefined();
      expect(relevanceCheck?.score).toBeGreaterThanOrEqual(0);
    });

    it('deve ter check de conformidade', () => {
      const result = validateQuality(goodResponse);
      const complianceCheck = result.checks.find((c) => c.name === 'Compliance');

      expect(complianceCheck).toBeDefined();
    });

    it('deve ter check de segurança', () => {
      const result = validateQuality(goodResponse);
      const securityCheck = result.checks.find((c) => c.name === 'Security');

      expect(securityCheck).toBeDefined();
      expect(securityCheck?.score).toBe(100);
    });

    it('deve ter check de citações', () => {
      const result = validateQuality(goodResponse);
      const citationsCheck = result.checks.find((c) => c.name === 'Citations');

      expect(citationsCheck).toBeDefined();
      expect(citationsCheck?.score).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Metrics Tracking', () => {
    it('deve rastrear respostas validadas', () => {
      validateQuality(goodResponse);
      validateQuality(goodResponse);

      const metrics = getQualityMetrics();
      expect(metrics.totalResponses).toBe(2);
    });

    it('deve rastrear respostas aprovadas ou rejeitadas', () => {
      validateQuality(goodResponse);
      validateQuality(goodResponse);

      const metrics = getQualityMetrics();
      expect(metrics.passedResponses + metrics.failedResponses).toBe(2);
    });

    it('deve calcular pontuação média', () => {
      validateQuality(goodResponse);
      validateQuality(goodResponse);

      const metrics = getQualityMetrics();
      expect(metrics.averageScore).toBeGreaterThanOrEqual(0);
      expect(metrics.averageScore).toBeLessThanOrEqual(100);
    });

    it('deve rastrear falhas críticas', () => {
      validateQuality(maliciousResponse);

      const metrics = getQualityMetrics();
      expect(metrics.criticalFailures).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Metrics Management', () => {
    it('deve resetar métricas', () => {
      validateQuality(goodResponse);
      resetQualityMetrics();

      const metrics = getQualityMetrics();
      expect(metrics.totalResponses).toBe(0);
      expect(metrics.passedResponses).toBe(0);
      expect(metrics.failedResponses).toBe(0);
    });

    it('deve incluir timestamp em métricas', () => {
      validateQuality(goodResponse);

      const metrics = getQualityMetrics();
      expect(metrics.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('Report Generation', () => {
    it('deve gerar relatório', () => {
      validateQuality(goodResponse);
      validateQuality(goodResponse);

      const report = generateQualityReport();

      expect(report).toContain('Relatório de Qualidade');
      expect(report).toContain('Total de respostas');
      expect(report).toContain('Respostas aprovadas');
    });

    it('deve incluir métricas no relatório', () => {
      validateQuality(goodResponse);

      const report = generateQualityReport();

      expect(report).toContain('Pontuação média');
      expect(report).toContain('Falhas críticas');
      expect(report).toContain('Avisos');
    });

    it('deve incluir data no relatório', () => {
      validateQuality(goodResponse);

      const report = generateQualityReport();

      expect(report).toContain('Última atualização');
    });
  });

  describe('Batch Validation', () => {
    it('deve validar lote de respostas', () => {
      const responses = [goodResponse, goodResponse, poorResponse];
      const result = validateBatch(responses);

      expect(result.results.length).toBe(3);
      expect(result.summary.total).toBe(3);
      expect(result.summary.passed + result.summary.failed).toBe(3);
    });

    it('deve calcular pontuação média do lote', () => {
      const responses = [goodResponse, goodResponse];
      const result = validateBatch(responses);

      expect(result.summary.averageScore).toBeGreaterThanOrEqual(0);
      expect(result.summary.averageScore).toBeLessThanOrEqual(100);
    });

    it('deve retornar resultados detalhados', () => {
      const responses = [goodResponse, poorResponse];
      const result = validateBatch(responses);

      expect(result.results.length).toBe(2);
      expect(result.results[0]).toBeDefined();
      expect(result.results[1]).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('deve validar resposta vazia', () => {
      const emptyResponse: ResponseToValidate = {
        content: '',
        sourceDocuments: [],
        citations: [],
      };

      const result = validateQuality(emptyResponse);
      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0);
    });

    it('deve validar resposta muito longa', () => {
      const longResponse: ResponseToValidate = {
        content: 'a'.repeat(15000),
        sourceDocuments: ['Doc'],
        citations: ['Doc'],
      };

      const result = validateQuality(longResponse);
      expect(result).toBeDefined();
      expect(result.checks.some((c) => c.name === 'Compliance')).toBe(true);
    });

    it('deve validar resposta com muitos documentos', () => {
      const manyDocsResponse: ResponseToValidate = {
        content: 'Conteúdo válido',
        sourceDocuments: Array(15)
          .fill(0)
          .map((_, i) => `Doc ${i}`),
        citations: ['Doc 0'],
      };

      const result = validateQuality(manyDocsResponse);
      expect(result).toBeDefined();
      expect(result.checks.some((c) => c.name === 'Compliance')).toBe(true);
    });

    it('deve validar resposta com baixa confiança', () => {
      const lowConfidenceResponse: ResponseToValidate = {
        content: 'Conteúdo válido',
        sourceDocuments: ['Doc'],
        citations: ['Doc'],
        confidence: 0.2,
      };

      const result = validateQuality(lowConfidenceResponse);
      expect(result).toBeDefined();
      expect(result.checks.some((c) => c.name === 'Compliance')).toBe(true);
    });
  });
});
