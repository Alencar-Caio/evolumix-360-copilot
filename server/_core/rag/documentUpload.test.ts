/**
 * Testes Unitários - RAG Document Upload
 */

import { describe, it, expect } from 'vitest';
import {
  uploadDocument,
  validateUploadedDocument,
  getUploadStats,
} from './documentUpload';

describe('RAG - Document Upload', () => {
  describe('Validação de Documento', () => {
    it('deve validar documento completo', () => {
      const doc = {
        id: 'doc-123',
        fileName: 'test.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        storageUrl: '/manus-storage/doc-123',
        storageKey: 'doc-123',
        content: 'Test content',
        chunkCount: 2,
        tokenCount: 100,
        status: 'completed' as const,
        uploadedAt: new Date(),
        metadata: {},
      };

      const isValid = validateUploadedDocument(doc);
      expect(isValid).toBe(true);
    });

    it('deve rejeitar documento sem ID', () => {
      const doc = {
        id: '',
        fileName: 'test.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        storageUrl: '/manus-storage/doc-123',
        storageKey: 'doc-123',
        content: 'Test content',
        chunkCount: 2,
        tokenCount: 100,
        status: 'completed' as const,
        uploadedAt: new Date(),
        metadata: {},
      };

      const isValid = validateUploadedDocument(doc);
      expect(isValid).toBe(false);
    });

    it('deve rejeitar documento com status inválido', () => {
      const doc = {
        id: 'doc-123',
        fileName: 'test.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        storageUrl: '/manus-storage/doc-123',
        storageKey: 'doc-123',
        content: 'Test content',
        chunkCount: 2,
        tokenCount: 100,
        status: 'invalid' as any,
        uploadedAt: new Date(),
        metadata: {},
      };

      const isValid = validateUploadedDocument(doc);
      expect(isValid).toBe(false);
    });

    it('deve rejeitar documento com tamanho inválido', () => {
      const doc = {
        id: 'doc-123',
        fileName: 'test.pdf',
        mimeType: 'application/pdf',
        size: 0,
        storageUrl: '/manus-storage/doc-123',
        storageKey: 'doc-123',
        content: 'Test content',
        chunkCount: 2,
        tokenCount: 100,
        status: 'completed' as const,
        uploadedAt: new Date(),
        metadata: {},
      };

      const isValid = validateUploadedDocument(doc);
      expect(isValid).toBe(false);
    });
  });

  describe('Estatísticas de Upload', () => {
    it('deve calcular estatísticas de documentos vazios', () => {
      const stats = getUploadStats([]);

      expect(stats.totalDocuments).toBe(0);
      expect(stats.totalSize).toBe(0);
      expect(stats.totalChunks).toBe(0);
      expect(stats.totalTokens).toBe(0);
      expect(stats.avgSize).toBe(0);
      expect(stats.avgChunks).toBe(0);
    });

    it('deve calcular estatísticas de um documento', () => {
      const docs = [
        {
          id: 'doc-1',
          fileName: 'test1.pdf',
          mimeType: 'application/pdf',
          size: 1024,
          storageUrl: '/manus-storage/doc-1',
          storageKey: 'doc-1',
          content: 'Test content 1',
          chunkCount: 2,
          tokenCount: 100,
          status: 'completed' as const,
          uploadedAt: new Date(),
          metadata: {},
        },
      ];

      const stats = getUploadStats(docs);

      expect(stats.totalDocuments).toBe(1);
      expect(stats.totalSize).toBe(1024);
      expect(stats.totalChunks).toBe(2);
      expect(stats.totalTokens).toBe(100);
      expect(stats.avgSize).toBe(1024);
      expect(stats.avgChunks).toBe(2);
    });

    it('deve calcular estatísticas de múltiplos documentos', () => {
      const docs = [
        {
          id: 'doc-1',
          fileName: 'test1.pdf',
          mimeType: 'application/pdf',
          size: 1000,
          storageUrl: '/manus-storage/doc-1',
          storageKey: 'doc-1',
          content: 'Test content 1',
          chunkCount: 2,
          tokenCount: 100,
          status: 'completed' as const,
          uploadedAt: new Date(),
          metadata: {},
        },
        {
          id: 'doc-2',
          fileName: 'test2.docx',
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          size: 2000,
          storageUrl: '/manus-storage/doc-2',
          storageKey: 'doc-2',
          content: 'Test content 2',
          chunkCount: 4,
          tokenCount: 200,
          status: 'completed' as const,
          uploadedAt: new Date(),
          metadata: {},
        },
        {
          id: 'doc-3',
          fileName: 'test3.txt',
          mimeType: 'text/plain',
          size: 500,
          storageUrl: '/manus-storage/doc-3',
          storageKey: 'doc-3',
          content: 'Test content 3',
          chunkCount: 1,
          tokenCount: 50,
          status: 'completed' as const,
          uploadedAt: new Date(),
          metadata: {},
        },
      ];

      const stats = getUploadStats(docs);

      expect(stats.totalDocuments).toBe(3);
      expect(stats.totalSize).toBe(3500);
      expect(stats.totalChunks).toBe(7);
      expect(stats.totalTokens).toBe(350);
      expect(stats.avgSize).toBe(1167); // 3500 / 3
      expect(stats.avgChunks).toBe(2); // 7 / 3 = 2.33 -> 2
    });
  });
});
