/**
 * Testes para Index Cache
 * 
 * Validar:
 * - Cache initialization
 * - Document retrieval
 * - Search functionality
 * - Cache statistics
 * - Cache invalidation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  getDocumentFromCache,
  searchDocumentsByTitle,
  searchDocumentsByPattern,
  getAllDocumentsFromCache,
  addDocumentToCache,
  invalidateDocument,
  getCacheStats,
  clearCache,
  getCacheSize,
  enforceMaxCacheSize,
} from './indexCache';
import type { CachedDocument } from './indexCache';

describe('Index Cache', () => {
  const mockDocument: CachedDocument = {
    id: 1,
    documentId: 100,
    versionNumber: 1,
    title: 'FISPQ Produto A',
    content: 'Conteúdo técnico do produto A',
    metadata: { supplier: 'Supplier X' },
    status: 'approved',
    createdAt: new Date(),
  };

  const mockDocument2: CachedDocument = {
    id: 2,
    documentId: 101,
    versionNumber: 1,
    title: 'Ficha Técnica Produto B',
    content: 'Conteúdo técnico do produto B',
    metadata: { supplier: 'Supplier Y' },
    status: 'approved',
    createdAt: new Date(),
  };

  beforeEach(() => {
    clearCache();
  });

  describe('Cache Management', () => {
    it('deve iniciar com cache limpo', () => {
      clearCache();
      const stats = getCacheStats();
      expect(stats.totalDocuments).toBe(0);
    });

    it('deve adicionar documento ao cache', () => {
      addDocumentToCache(mockDocument);
      const stats = getCacheStats();
      expect(stats.totalDocuments).toBe(1);
    });

    it('deve limpar cache', () => {
      addDocumentToCache(mockDocument);
      clearCache();
      
      const stats = getCacheStats();
      expect(stats.totalDocuments).toBe(0);
    });
  });

  describe('Document Retrieval', () => {
    beforeEach(() => {
      clearCache();
      addDocumentToCache(mockDocument);
      addDocumentToCache(mockDocument2);
    });

    it('deve recuperar documento por ID', () => {
      const doc = getDocumentFromCache(1);
      
      expect(doc).toBeDefined();
      expect(doc?.title).toBe('FISPQ Produto A');
    });

    it('deve retornar undefined para documento inexistente', () => {
      const doc = getDocumentFromCache(999);
      
      expect(doc).toBeUndefined();
    });

    it('deve obter todos os documentos', () => {
      const docs = getAllDocumentsFromCache();
      
      expect(docs.length).toBe(2);
      expect(docs.map((d) => d.id)).toContain(1);
      expect(docs.map((d) => d.id)).toContain(2);
    });
  });

  describe('Search Functionality', () => {
    beforeEach(() => {
      clearCache();
      addDocumentToCache(mockDocument);
      addDocumentToCache(mockDocument2);
    });

    it('deve buscar documentos por título exato', () => {
      const results = searchDocumentsByTitle('FISPQ Produto A');
      
      expect(results.length).toBe(1);
      expect(results[0].id).toBe(1);
    });

    it('deve retornar array vazio para título inexistente', () => {
      const results = searchDocumentsByTitle('Produto Inexistente');
      
      expect(results.length).toBe(0);
    });

    it('deve buscar documentos por padrão (regex)', () => {
      const results = searchDocumentsByPattern('Produto');
      
      expect(results.length).toBe(2);
    });

    it('deve buscar documentos por padrão case-insensitive', () => {
      const results = searchDocumentsByPattern('fispq');
      
      expect(results.length).toBe(1);
      expect(results[0].title).toBe('FISPQ Produto A');
    });

    it('deve buscar em conteúdo', () => {
      const results = searchDocumentsByPattern('técnico');
      
      expect(results.length).toBe(2);
    });
  });

  describe('Cache Statistics', () => {
    beforeEach(() => {
      clearCache();
      addDocumentToCache(mockDocument);
    });

    it('deve rastrear hit rate', () => {
      getDocumentFromCache(1); // hit
      getDocumentFromCache(999); // miss
      
      const stats = getCacheStats();
      
      expect(stats.hitCount).toBe(1);
      expect(stats.missCount).toBe(1);
      expect(stats.hitRate).toBe(50);
      expect(stats.missRate).toBe(50);
    });

    it('deve calcular 100% hit rate', () => {
      getDocumentFromCache(1);
      getDocumentFromCache(1);
      
      const stats = getCacheStats();
      
      expect(stats.hitRate).toBe(100);
      expect(stats.missRate).toBe(0);
    });

    it('deve contar documentos totais', () => {
      addDocumentToCache(mockDocument2);
      
      const stats = getCacheStats();
      
      expect(stats.totalDocuments).toBe(2);
    });

    it('deve registrar lastUpdated', () => {
      const stats = getCacheStats();
      
      expect(stats.lastUpdated).toBeDefined();
      expect(stats.lastUpdated).toBeInstanceOf(Date);
    });

    it('deve calcular TTL expiration', () => {
      const stats = getCacheStats();
      
      expect(stats.ttlExpires).toBeInstanceOf(Date);
      expect(stats.ttlExpires.getTime()).toBeGreaterThan(stats.lastUpdated.getTime());
    });
  });

  describe('Cache Invalidation', () => {
    beforeEach(() => {
      clearCache();
      addDocumentToCache(mockDocument);
      addDocumentToCache(mockDocument2);
    });

    it('deve invalidar documento específico', () => {
      invalidateDocument(1);
      
      const doc = getDocumentFromCache(1);
      expect(doc).toBeUndefined();
    });

    it('deve manter outros documentos após invalidação', () => {
      invalidateDocument(1);
      
      const doc = getDocumentFromCache(2);
      expect(doc).toBeDefined();
      expect(doc?.id).toBe(2);
    });

    it('deve remover de índice por título', () => {
      invalidateDocument(1);
      
      const results = searchDocumentsByTitle('FISPQ Produto A');
      expect(results.length).toBe(0);
    });
  });

  describe('Cache Size Management', () => {
    it('deve calcular tamanho do cache', () => {
      clearCache();
      addDocumentToCache(mockDocument);
      
      const size = getCacheSize();
      expect(size).toBeGreaterThan(0);
    });

    it('deve limpar cache quando exceder limite', () => {
      clearCache();
      addDocumentToCache(mockDocument);
      addDocumentToCache(mockDocument2);
      
      const currentSize = getCacheSize();
      const maxSize = currentSize / 2; // Força limpeza
      
      enforceMaxCacheSize(maxSize);
      
      const stats = getCacheStats();
      expect(stats.totalDocuments).toBe(0);
    });
  });

  describe('Cache Hit/Miss Tracking', () => {
    beforeEach(() => {
      clearCache();
      addDocumentToCache(mockDocument);
    });

    it('deve incrementar hit count', () => {
      getDocumentFromCache(1);
      getDocumentFromCache(1);
      
      const stats = getCacheStats();
      expect(stats.hitCount).toBe(2);
    });

    it('deve incrementar miss count', () => {
      getDocumentFromCache(999);
      getDocumentFromCache(999);
      
      const stats = getCacheStats();
      expect(stats.missCount).toBe(2);
    });

    it('deve rastrear hits em busca por título', () => {
      searchDocumentsByTitle('FISPQ Produto A');
      
      const stats = getCacheStats();
      expect(stats.hitCount).toBe(1);
    });

    it('deve rastrear misses em busca por título', () => {
      searchDocumentsByTitle('Inexistente');
      
      const stats = getCacheStats();
      expect(stats.missCount).toBe(1);
    });
  });

  describe('Document Metadata', () => {
    beforeEach(() => {
      clearCache();
    });

    it('deve preservar metadata do documento', () => {
      addDocumentToCache(mockDocument);
      
      const doc = getDocumentFromCache(1);
      expect(doc).toBeDefined();
      expect(doc?.metadata.supplier).toBe('Supplier X');
    });

    it('deve suportar metadata complexa', () => {
      const complexDoc: CachedDocument = {
        ...mockDocument,
        metadata: {
          supplier: 'Supplier X',
          certifications: ['ISO 27001', 'SOC 2'],
          tags: ['chemical', 'hygiene'],
          nested: { level1: { level2: 'value' } },
        },
      };

      addDocumentToCache(complexDoc);
      
      const doc = getDocumentFromCache(1);
      expect(doc).toBeDefined();
      expect(doc?.metadata.supplier).toBe('Supplier X');
      expect(Array.isArray(doc?.metadata.certifications)).toBe(true);
      expect(doc?.metadata.nested.level1.level2).toBe('value');
    });
  });
});
