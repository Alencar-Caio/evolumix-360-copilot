/**
 * Testes Unitários - RAG Indexação Semântica
 * 
 * Cobertura:
 * - Chunking: divisão de documentos
 * - Embeddings: geração de vetores
 * - Vector Index: armazenamento e busca
 * - Validação: qualidade de dados
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { chunkDocument, validateChunks, getChunkStats } from './chunking';
import { EmbeddingManager, validateEmbeddings, getEmbeddingStats } from './embeddings';
import { VectorIndexManager, validateSearchResults } from './vectorIndex';

describe('RAG - Indexação Semântica', () => {
  
  // ============================================================================
  // TESTES DE CHUNKING
  // ============================================================================
  
  describe('Chunking', () => {
    it('deve dividir documento em chunks', () => {
      const text = `
        Seção 1: Introdução
        
        Este é um documento de teste com múltiplas seções.
        Cada seção será dividida em chunks de 512 tokens.
        
        Seção 2: Conteúdo
        
        Mais conteúdo aqui para testar a divisão.
        O algoritmo deve preservar limites semânticos.
      `;
      
      const chunks = chunkDocument(text, {
        id: 'doc-1',
        versionId: 'v1',
        title: 'Test Document',
        type: 'FISPQ',
        supplier: 'Test Supplier',
        pageNumber: 1,
      });
      
      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks[0].documentId).toBe('doc-1');
      expect(chunks[0].versionId).toBe('v1');
    });
    
    it('deve validar chunks corretamente', () => {
      const text = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';
      
      const chunks = chunkDocument(text, {
        id: 'doc-1',
        versionId: 'v1',
        title: 'Test',
        type: 'FISPQ',
        supplier: 'Test',
        pageNumber: 1,
      });
      
      const isValid = validateChunks(chunks);
      expect(isValid).toBe(true);
    });
    
    it('deve calcular estatísticas de chunks', () => {
      const text = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(10);
      
      const chunks = chunkDocument(text, {
        id: 'doc-1',
        versionId: 'v1',
        title: 'Test',
        type: 'FISPQ',
        supplier: 'Test',
        pageNumber: 1,
      });
      
      const stats = getChunkStats(chunks);
      
      expect(stats.totalChunks).toBeGreaterThan(0);
      expect(stats.totalTokens).toBeGreaterThan(0);
      expect(stats.avgTokensPerChunk).toBeGreaterThan(0);
      expect(stats.minTokens).toBeGreaterThan(0);
      expect(stats.maxTokens).toBeGreaterThan(0);
    });
    
    it('deve preservar metadata dos chunks', () => {
      const text = 'Test content for metadata preservation. '.repeat(50);
      
      const chunks = chunkDocument(text, {
        id: 'doc-123',
        versionId: 'v2',
        title: 'FISPQ Document',
        type: 'FISPQ',
        supplier: 'Supplier ABC',
        pageNumber: 5,
      });
      
      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks[0].metadata.source).toBe('FISPQ Document');
      expect(chunks[0].metadata.documentType).toBe('FISPQ');
      expect(chunks[0].metadata.supplier).toBe('Supplier ABC');
      expect(chunks[0].pageNumber).toBe(5);
    });
    
    it('deve extrair títulos de seção', () => {
      const text = `
        SEÇÃO IMPORTANTE
        
        Conteúdo da seção importante. `.repeat(50) + `
      `;
      
      const chunks = chunkDocument(text, {
        id: 'doc-1',
        versionId: 'v1',
        title: 'Test',
        type: 'FISPQ',
        supplier: 'Test',
        pageNumber: 1,
      });
      
      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks[0].sectionTitle).toBeDefined();
      expect(chunks[0].sectionTitle.length).toBeGreaterThan(0);
    });
  });
  
  // ============================================================================
  // TESTES DE EMBEDDINGS
  // ============================================================================
  
  describe('Embeddings', () => {
    let embeddingManager: EmbeddingManager;
    
    beforeEach(() => {
      embeddingManager = new EmbeddingManager();
      
      // Mock OpenAI API se necessário
      vi.stubEnv('OPENAI_API_KEY', 'test-key');
    });
    
    it('deve validar embeddings com dimensões corretas', () => {
      const embeddings = [
        {
          chunkId: 'chunk-1',
          vector: new Array(3072).fill(0.1),
          norm: 1.0,
          dimensions: 3072,
          model: 'text-embedding-3-large',
          createdAt: new Date(),
          metadata: {
            documentId: 'doc-1',
            versionId: 'v1',
            pageNumber: 1,
            sectionTitle: 'Test',
          },
        },
      ];
      
      const validation = validateEmbeddings(embeddings);
      expect(validation.valid).toBe(true);
      expect(validation.errors.length).toBe(0);
    });
    
    it('deve detectar embeddings com dimensões inválidas', () => {
      const embeddings = [
        {
          chunkId: 'chunk-1',
          vector: new Array(1024).fill(0.1), // Errado: deve ser 3072
          norm: 1.0,
          dimensions: 1024,
          model: 'text-embedding-3-large',
          createdAt: new Date(),
          metadata: {
            documentId: 'doc-1',
            versionId: 'v1',
            pageNumber: 1,
            sectionTitle: 'Test',
          },
        },
      ];
      
      const validation = validateEmbeddings(embeddings);
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
    
    it('deve detectar norma L2 inválida', () => {
      const embeddings = [
        {
          chunkId: 'chunk-1',
          vector: new Array(3072).fill(0.1),
          norm: 2.5, // Errado: deve ser ≈ 1.0
          dimensions: 3072,
          model: 'text-embedding-3-large',
          createdAt: new Date(),
          metadata: {
            documentId: 'doc-1',
            versionId: 'v1',
            pageNumber: 1,
            sectionTitle: 'Test',
          },
        },
      ];
      
      const validation = validateEmbeddings(embeddings);
      expect(validation.valid).toBe(false);
    });
    
    it('deve calcular estatísticas de embeddings', () => {
      const embeddings = [
        {
          chunkId: 'chunk-1',
          vector: new Array(3072).fill(0.1),
          norm: 1.0,
          dimensions: 3072,
          model: 'text-embedding-3-large',
          createdAt: new Date(),
          metadata: {
            documentId: 'doc-1',
            versionId: 'v1',
            pageNumber: 1,
            sectionTitle: 'Test',
          },
        },
        {
          chunkId: 'chunk-2',
          vector: new Array(3072).fill(0.2),
          norm: 1.0,
          dimensions: 3072,
          model: 'text-embedding-3-large',
          createdAt: new Date(),
          metadata: {
            documentId: 'doc-1',
            versionId: 'v1',
            pageNumber: 2,
            sectionTitle: 'Test',
          },
        },
      ];
      
      const stats = getEmbeddingStats(embeddings);
      
      expect(stats.totalEmbeddings).toBe(2);
      expect(stats.avgNorm).toBeCloseTo(1.0, 1);
      expect(stats.sparsity).toBeGreaterThanOrEqual(0);
    });
  });
  
  // ============================================================================
  // TESTES DE VECTOR INDEX
  // ============================================================================
  
  describe('Vector Index', () => {
    it('deve validar resultados de busca', () => {
      const results = [
        {
          chunkId: 'chunk-1',
          score: 0.95,
          metadata: {
            documentId: 'doc-1',
            versionId: 'v1',
            pageNumber: 1,
            sectionTitle: 'Test',
            source: 'Test Document',
          },
        },
        {
          chunkId: 'chunk-2',
          score: 0.87,
          metadata: {
            documentId: 'doc-1',
            versionId: 'v1',
            pageNumber: 2,
            sectionTitle: 'Test',
            source: 'Test Document',
          },
        },
      ];
      
      const isValid = validateSearchResults(results);
      expect(isValid).toBe(true);
    });
    
    it('deve detectar scores inválidos', () => {
      const results = [
        {
          chunkId: 'chunk-1',
          score: 1.5, // Errado: deve estar entre 0-1
          metadata: {
            documentId: 'doc-1',
            versionId: 'v1',
            pageNumber: 1,
            sectionTitle: 'Test',
            source: 'Test Document',
          },
        },
      ];
      
      const isValid = validateSearchResults(results);
      expect(isValid).toBe(false);
    });
  });
  
  // ============================================================================
  // TESTES DE INTEGRAÇÃO
  // ============================================================================
  
  describe('Integração', () => {
    it('deve processar documento completo: chunk → embedding → validação', () => {
      // 1. Chunking
      const text = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(20);
      const chunks = chunkDocument(text, {
        id: 'doc-1',
        versionId: 'v1',
        title: 'Test',
        type: 'FISPQ',
        supplier: 'Test',
        pageNumber: 1,
      });
      
      expect(chunks.length).toBeGreaterThan(0);
      
      // 2. Validar chunks
      const chunksValid = validateChunks(chunks);
      expect(chunksValid).toBe(true);
      
      // 3. Criar embeddings mock
      const embeddings = chunks.map(chunk => ({
        chunkId: chunk.id,
        vector: new Array(3072).fill(Math.random() / 10),
        norm: 1.0,
        dimensions: 3072,
        model: 'text-embedding-3-large',
        createdAt: new Date(),
        metadata: {
          documentId: chunk.documentId,
          versionId: chunk.versionId,
          pageNumber: chunk.pageNumber,
          sectionTitle: chunk.sectionTitle,
        },
      }));
      
      // 4. Validar embeddings
      const embeddingsValid = validateEmbeddings(embeddings);
      expect(embeddingsValid.valid).toBe(true);
      
      // 5. Verificar estatísticas
      const stats = getEmbeddingStats(embeddings);
      expect(stats.totalEmbeddings).toBe(chunks.length);
    });
  });
});
