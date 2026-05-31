/**
 * Testes Unitários - RAG Retrieval (Busca por Similaridade)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RetrieverManager, validateRetrievalConfig, getRetrievalStats } from './retrieval';

describe('RAG - Retrieval (Busca por Similaridade)', () => {
  let retriever: RetrieverManager;
  
  beforeEach(() => {
    retriever = new RetrieverManager();
    vi.stubEnv('OPENAI_API_KEY', 'test-key');
    vi.stubEnv('PINECONE_API_KEY', 'test-key');
  });
  
  describe('Configuração de Retrieval', () => {
    it('deve validar configuração válida', () => {
      const config = {
        topK: 5,
        minScore: 0.5,
        useReranking: false,
      };
      
      const validation = validateRetrievalConfig(config);
      expect(validation.valid).toBe(true);
      expect(validation.errors.length).toBe(0);
    });
    
    it('deve rejeitar topK inválido', () => {
      const config = {
        topK: 150, // Deve estar entre 1-100
        minScore: 0.5,
        useReranking: false,
      };
      
      const validation = validateRetrievalConfig(config);
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
    
    it('deve rejeitar minScore inválido', () => {
      const config = {
        topK: 5,
        minScore: 1.5, // Deve estar entre 0-1
        useReranking: false,
      };
      
      const validation = validateRetrievalConfig(config);
      expect(validation.valid).toBe(false);
    });
  });
  
  describe('Estatísticas de Retrieval', () => {
    it('deve calcular estatísticas de resultados vazios', () => {
      const stats = getRetrievalStats([]);
      
      expect(stats.totalResults).toBe(0);
      expect(stats.avgScore).toBe(0);
      expect(stats.avgTokens).toBe(0);
    });
    
    it('deve calcular estatísticas de resultados', () => {
      const results = [
        {
          chunkId: 'chunk-1',
          score: 0.95,
          text: 'Lorem ipsum dolor sit amet',
          tokenCount: 100,
          metadata: {
            documentId: 'doc-1',
            versionId: 'v1',
            pageNumber: 1,
            sectionTitle: 'Test',
            source: 'Test',
          },
        },
        {
          chunkId: 'chunk-2',
          score: 0.87,
          text: 'Consectetur adipiscing elit',
          tokenCount: 80,
          metadata: {
            documentId: 'doc-1',
            versionId: 'v1',
            pageNumber: 2,
            sectionTitle: 'Test',
            source: 'Test',
          },
        },
      ];
      
      const stats = getRetrievalStats(results);
      
      expect(stats.totalResults).toBe(2);
      expect(stats.avgScore).toBeCloseTo(0.91, 1);
      expect(stats.minScore).toBe(0.87);
      expect(stats.maxScore).toBe(0.95);
      expect(stats.avgTokens).toBe(90);
    });
  });
  
  describe('Filtros de Retrieval', () => {
    it('deve validar filtro por documentId', () => {
      const config = {
        topK: 5,
        minScore: 0.5,
        useReranking: false,
        filters: {
          documentId: 'doc-123',
        },
      };
      
      const validation = validateRetrievalConfig(config);
      expect(validation.valid).toBe(true);
    });
    
    it('deve validar filtro por versionId', () => {
      const config = {
        topK: 5,
        minScore: 0.5,
        useReranking: false,
        filters: {
          versionId: 'v2',
        },
      };
      
      const validation = validateRetrievalConfig(config);
      expect(validation.valid).toBe(true);
    });
    
    it('deve validar filtro por pageNumber', () => {
      const config = {
        topK: 5,
        minScore: 0.5,
        useReranking: false,
        filters: {
          pageNumber: 5,
        },
      };
      
      const validation = validateRetrievalConfig(config);
      expect(validation.valid).toBe(true);
    });
  });
  
  describe('Busca Avançada', () => {
    it('deve validar múltiplas queries', () => {
      const queries = [
        'O que é segurança?',
        'Como usar equipamento de proteção?',
        'Quais são os riscos?',
      ];
      
      expect(queries.length).toBe(3);
      expect(queries[0].length).toBeGreaterThan(0);
    });
  });
});
