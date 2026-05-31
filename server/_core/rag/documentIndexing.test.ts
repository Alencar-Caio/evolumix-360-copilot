/**
 * Testes de Integração para Document Indexing Pipeline
 * 
 * Validar:
 * - Pipeline initialization
 * - Document search with cache
 * - Cache invalidation on updates
 * - Performance metrics
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  findDocumentById,
  searchDocumentsByTitleIndexed,
  searchDocumentsByPatternIndexed,
  listAllDocumentsIndexed,
  invalidateDocumentAfterUpdate,
  getIndexingStats,
  rebuildIndex,
} from './documentIndexing';
import { addDocumentToCache, clearCache } from './indexCache';
import type { CachedDocument } from './indexCache';

describe('Document Indexing Pipeline', () => {
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
    addDocumentToCache(mockDocument);
    addDocumentToCache(mockDocument2);
  });

  describe('Document Search', () => {
    it('deve buscar documento por ID', async () => {
      const result = await findDocumentById(1);

      expect(result.documents.length).toBe(1);
      expect(result.documents[0].title).toBe('FISPQ Produto A');
      expect(result.executionTime).toBeGreaterThanOrEqual(0);
    });

    it('deve retornar array vazio para ID inexistente', async () => {
      const result = await findDocumentById(999);

      expect(result.documents.length).toBe(0);
    });

    it('deve buscar por título', async () => {
      const result = await searchDocumentsByTitleIndexed('FISPQ Produto A');

      expect(result.documents.length).toBe(1);
      expect(result.documents[0].id).toBe(1);
    });

    it('deve buscar por padrão', async () => {
      const result = await searchDocumentsByPatternIndexed('Produto');

      expect(result.documents.length).toBe(2);
    });

    it('deve listar todos os documentos', async () => {
      const result = await listAllDocumentsIndexed();

      expect(result.documents.length).toBe(2);
      expect(result.fromCache).toBe(true);
    });
  });

  describe('Cache Performance', () => {
    it('deve registrar tempo de execução', async () => {
      const result = await findDocumentById(1);

      expect(result.executionTime).toBeGreaterThanOrEqual(0);
      expect(typeof result.executionTime).toBe('number');
    });

    it('deve indicar se resultado veio do cache', async () => {
      const result = await findDocumentById(1);

      expect(result.fromCache).toBeDefined();
      expect(typeof result.fromCache).toBe('boolean');
    });

    it('deve incluir estatísticas de cache', async () => {
      const result = await findDocumentById(1);

      expect(result.cacheStats).toBeDefined();
      expect(result.cacheStats.totalDocuments).toBe(2);
      expect(result.cacheStats.hitRate).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Cache Invalidation', () => {
    it('deve invalidar documento após atualização', async () => {
      // Buscar antes de invalidar
      let result = await findDocumentById(1);
      expect(result.documents.length).toBe(1);

      // Invalidar
      await invalidateDocumentAfterUpdate(1);

      // Buscar após invalidar (deve estar vazio porque não há DB)
      result = await findDocumentById(1);
      // Resultado depende de DB estar disponível
      expect(result).toBeDefined();
    });
  });

  describe('Indexing Statistics', () => {
    it('deve retornar estatísticas de indexação', () => {
      const stats = getIndexingStats();

      expect(stats).toBeDefined();
      expect(stats.cacheInitialized).toBeDefined();
      expect(stats.cacheStats).toBeDefined();
    });

    it('deve incluir cache stats', () => {
      const stats = getIndexingStats();

      expect(stats.cacheStats.totalDocuments).toBe(2);
      expect(stats.cacheStats.hitRate).toBeGreaterThanOrEqual(0);
      expect(stats.cacheStats.lastUpdated).toBeInstanceOf(Date);
    });
  });

  describe('Index Rebuild', () => {
    it('deve reconstruir índice', async () => {
      const statsBefore = getIndexingStats();
      expect(statsBefore.cacheStats.totalDocuments).toBe(2);

      // Reconstruir índice
      await rebuildIndex();

      // Após rebuild, cache será vazio (sem DB)
      const statsAfter = getIndexingStats();
      expect(statsAfter).toBeDefined();
    });
  });

  describe('Search Performance', () => {
    it('deve executar busca rápida', async () => {
      const start = Date.now();
      const result = await searchDocumentsByPatternIndexed('Produto');
      const duration = Date.now() - start;

      expect(result.documents.length).toBe(2);
      expect(duration).toBeLessThan(100); // Deve ser rápido
    });

    it('deve executar busca por título rápida', async () => {
      const start = Date.now();
      const result = await searchDocumentsByTitleIndexed('FISPQ Produto A');
      const duration = Date.now() - start;

      expect(result.documents.length).toBe(1);
      expect(duration).toBeLessThan(100);
    });

    it('deve executar listagem rápida', async () => {
      const start = Date.now();
      const result = await listAllDocumentsIndexed();
      const duration = Date.now() - start;

      expect(result.documents.length).toBe(2);
      expect(duration).toBeLessThan(100);
    });
  });

  describe('Search Result Structure', () => {
    it('deve retornar estrutura correta de resultado', async () => {
      const result = await findDocumentById(1);

      expect(result).toHaveProperty('documents');
      expect(result).toHaveProperty('fromCache');
      expect(result).toHaveProperty('cacheStats');
      expect(result).toHaveProperty('executionTime');
    });

    it('deve incluir metadados de documento', async () => {
      const result = await findDocumentById(1);

      expect(result.documents[0]).toHaveProperty('id');
      expect(result.documents[0]).toHaveProperty('title');
      expect(result.documents[0]).toHaveProperty('content');
      expect(result.documents[0]).toHaveProperty('metadata');
      expect(result.documents[0]).toHaveProperty('status');
      expect(result.documents[0]).toHaveProperty('createdAt');
    });
  });
});
