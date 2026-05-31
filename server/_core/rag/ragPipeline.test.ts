/**
 * Testes para RAG Pipeline
 * 
 * Validar:
 * - Pipeline integration
 * - Response validation
 * - Statistics tracking
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  validateRAGResponse,
  getRAGStatistics,
  resetRAGStatistics,
  updateRAGStatistics,
} from './ragPipeline';
import type { RAGResponse } from './ragPipeline';

describe('RAG Pipeline', () => {
  const goodResponse: RAGResponse = {
    content: 'Resposta técnica válida',
    sourceDocuments: ['Doc A', 'Doc B'],
    citations: ['Doc A'],
    qualityScore: 85,
    qualityPassed: true,
    hallucinations: [],
    hallucinated: false,
    confidence: 0.95,
    executionTime: 150,
    metadata: {
      documentCount: 2,
      searchTime: 50,
      validationTime: 30,
      crossValidationTime: 40,
    },
  };

  const poorResponse: RAGResponse = {
    content: 'Resposta ruim',
    sourceDocuments: [],
    citations: [],
    qualityScore: 20,
    qualityPassed: false,
    hallucinations: ['Informação falsa'],
    hallucinated: true,
    confidence: 0.3,
    executionTime: 200,
    metadata: {
      documentCount: 0,
      searchTime: 100,
      validationTime: 50,
      crossValidationTime: 30,
    },
  };

  beforeEach(() => {
    resetRAGStatistics();
  });

  describe('Response Validation', () => {
    it('deve validar resposta boa', () => {
      const result = validateRAGResponse(goodResponse);

      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('deve rejeitar resposta com alucinações', () => {
      const result = validateRAGResponse(poorResponse);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('deve incluir avisos para qualidade baixa', () => {
      const result = validateRAGResponse(poorResponse);

      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('deve validar sem documentos', () => {
      const result = validateRAGResponse(poorResponse);

      expect(result.errors.some((e) => e.includes('documento'))).toBe(true);
    });
  });

  describe('Statistics Tracking', () => {
    it('deve rastrear queries bem-sucedidas', () => {
      updateRAGStatistics(goodResponse, true);
      updateRAGStatistics(goodResponse, true);

      const stats = getRAGStatistics();
      expect(stats.totalQueries).toBe(2);
      expect(stats.successfulQueries).toBe(2);
    });

    it('deve rastrear queries falhadas', () => {
      updateRAGStatistics(goodResponse, true);
      updateRAGStatistics(poorResponse, false);

      const stats = getRAGStatistics();
      expect(stats.totalQueries).toBe(2);
      expect(stats.failedQueries).toBe(1);
    });

    it('deve calcular tempo médio de execução', () => {
      updateRAGStatistics(goodResponse, true);
      updateRAGStatistics(goodResponse, true);

      const stats = getRAGStatistics();
      expect(stats.averageExecutionTime).toBeGreaterThan(0);
    });

    it('deve calcular pontuação média de qualidade', () => {
      updateRAGStatistics(goodResponse, true);
      updateRAGStatistics(goodResponse, true);

      const stats = getRAGStatistics();
      expect(stats.averageQualityScore).toBeGreaterThan(0);
      expect(stats.averageQualityScore).toBeLessThanOrEqual(100);
    });

    it('deve rastrear taxa de alucinação', () => {
      updateRAGStatistics(goodResponse, true);
      updateRAGStatistics(poorResponse, false);

      const stats = getRAGStatistics();
      expect(stats.hallucinationRate).toBeGreaterThanOrEqual(0);
      expect(stats.hallucinationRate).toBeLessThanOrEqual(1);
    });
  });

  describe('Statistics Management', () => {
    it('deve resetar estatísticas', () => {
      updateRAGStatistics(goodResponse, true);
      resetRAGStatistics();

      const stats = getRAGStatistics();
      expect(stats.totalQueries).toBe(0);
      expect(stats.successfulQueries).toBe(0);
      expect(stats.failedQueries).toBe(0);
    });

    it('deve incluir timestamp em estatísticas', () => {
      updateRAGStatistics(goodResponse, true);

      const stats = getRAGStatistics();
      expect(stats.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('Response Structure', () => {
    it('deve ter estrutura completa', () => {
      expect(goodResponse).toHaveProperty('content');
      expect(goodResponse).toHaveProperty('sourceDocuments');
      expect(goodResponse).toHaveProperty('citations');
      expect(goodResponse).toHaveProperty('qualityScore');
      expect(goodResponse).toHaveProperty('qualityPassed');
      expect(goodResponse).toHaveProperty('hallucinations');
      expect(goodResponse).toHaveProperty('hallucinated');
      expect(goodResponse).toHaveProperty('confidence');
      expect(goodResponse).toHaveProperty('executionTime');
      expect(goodResponse).toHaveProperty('metadata');
    });

    it('deve incluir metadados de execução', () => {
      expect(goodResponse.metadata).toHaveProperty('documentCount');
      expect(goodResponse.metadata).toHaveProperty('searchTime');
      expect(goodResponse.metadata).toHaveProperty('validationTime');
      expect(goodResponse.metadata).toHaveProperty('crossValidationTime');
    });
  });

  describe('Edge Cases', () => {
    it('deve validar resposta com alta confiança', () => {
      const highConfidenceResponse: RAGResponse = {
        ...goodResponse,
        confidence: 0.99,
      };

      const result = validateRAGResponse(highConfidenceResponse);
      expect(result.valid).toBe(true);
    });

    it('deve validar resposta com baixa confiança', () => {
      const lowConfidenceResponse: RAGResponse = {
        ...goodResponse,
        confidence: 0.1,
      };

      const result = validateRAGResponse(lowConfidenceResponse);
      expect(result.warnings.some((w) => w.includes('Confiança'))).toBe(true);
    });

    it('deve validar resposta com muitas alucinações', () => {
      const hallucinatedResponse: RAGResponse = {
        ...goodResponse,
        hallucinations: ['Alucinação 1', 'Alucinação 2', 'Alucinação 3'],
        hallucinated: true,
      };

      const result = validateRAGResponse(hallucinatedResponse);
      expect(result.valid).toBe(false);
    });
  });
});
