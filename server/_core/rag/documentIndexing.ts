/**
 * Document Indexing Pipeline - Integração com Cache
 * 
 * Responsabilidade: Pipeline de indexação de documentos com cache otimizado
 * 
 * Fluxo:
 * 1. Carregar documentos do banco
 * 2. Indexar em cache em memória
 * 3. Suportar busca rápida por título/padrão
 * 4. Invalidar cache quando documentos mudam
 * 5. Rastrear performance de cache
 * 
 * Justificativa:
 * - Performance (cache reduz queries ao banco)
 * - Escalabilidade (suporta muitos documentos)
 * - Observabilidade (métricas de cache)
 */

import { getDb } from '../../db';
import { documentVersions } from '../../../drizzle/schema';
import { desc, eq } from 'drizzle-orm';
import {
  initializeCache,
  getDocumentFromCache,
  searchDocumentsByTitle,
  searchDocumentsByPattern,
  getAllDocumentsFromCache,
  invalidateCache,
  invalidateDocument,
  addDocumentToCache,
  getCacheStats,
  isCacheInitialized,
} from './indexCache';
import type { CachedDocument, CacheStats } from './indexCache';

/**
 * Resultado de busca de documentos
 */
export interface DocumentSearchResult {
  documents: CachedDocument[];
  fromCache: boolean;
  cacheStats: CacheStats;
  executionTime: number;
}

/**
 * Inicializar pipeline de indexação
 */
export async function initializeIndexingPipeline(): Promise<void> {
  const startTime = Date.now();

  try {
    console.log('[Indexing] Inicializando pipeline...');

    // Inicializar cache com DB
    await initializeCache();

    const duration = Date.now() - startTime;
    console.log(`[Indexing] Pipeline inicializado em ${duration}ms`);
  } catch (error) {
    console.error('[Indexing] Erro ao inicializar pipeline:', error);
    throw error;
  }
}

/**
 * Buscar documento por ID
 */
export async function findDocumentById(documentId: number): Promise<DocumentSearchResult> {
  const startTime = Date.now();

  try {
    // Tentar buscar do cache
    const cachedDoc = getDocumentFromCache(documentId);

    if (cachedDoc) {
      const duration = Date.now() - startTime;
      return {
        documents: [cachedDoc],
        fromCache: true,
        cacheStats: getCacheStats(),
        executionTime: duration,
      };
    }

    // Fallback: buscar do banco
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const dbDoc = await db
      .select()
      .from(documentVersions)
      .where(eq(documentVersions.id, documentId))
      .limit(1) as any;

    if (dbDoc.length > 0) {
      const doc = dbDoc[0];
      const cached: CachedDocument = {
        id: doc.id,
        documentId: doc.documentId,
        versionNumber: doc.versionNumber,
        title: doc.title,
        content: doc.content || '',
        embedding: doc.embedding ? JSON.parse(doc.embedding) : undefined,
        metadata: doc.metadata ? JSON.parse(doc.metadata) : {},
        status: doc.status,
        createdAt: doc.createdAt,
      };

      // Adicionar ao cache
      addDocumentToCache(cached);

      const duration = Date.now() - startTime;
      return {
        documents: [cached],
        fromCache: false,
        cacheStats: getCacheStats(),
        executionTime: duration,
      };
    }

    const duration = Date.now() - startTime;
    return {
      documents: [],
      fromCache: false,
      cacheStats: getCacheStats(),
      executionTime: duration,
    };
  } catch (error) {
    console.error('[Indexing] Erro ao buscar documento:', error);
    throw error;
  }
}

/**
 * Buscar documentos por título
 */
export async function searchDocumentsByTitleIndexed(title: string): Promise<DocumentSearchResult> {
  const startTime = Date.now();

  try {
    // Buscar do cache
    const results = searchDocumentsByTitle(title);

    const duration = Date.now() - startTime;
    return {
      documents: results,
      fromCache: results.length > 0,
      cacheStats: getCacheStats(),
      executionTime: duration,
    };
  } catch (error) {
    console.error('[Indexing] Erro ao buscar por título:', error);
    throw error;
  }
}

/**
 * Buscar documentos por padrão
 */
export async function searchDocumentsByPatternIndexed(pattern: string): Promise<DocumentSearchResult> {
  const startTime = Date.now();

  try {
    // Buscar do cache
    const results = searchDocumentsByPattern(pattern);

    const duration = Date.now() - startTime;
    return {
      documents: results,
      fromCache: results.length > 0,
      cacheStats: getCacheStats(),
      executionTime: duration,
    };
  } catch (error) {
    console.error('[Indexing] Erro ao buscar por padrão:', error);
    throw error;
  }
}

/**
 * Listar todos os documentos
 */
export async function listAllDocumentsIndexed(): Promise<DocumentSearchResult> {
  const startTime = Date.now();

  try {
    // Buscar do cache
    const results = getAllDocumentsFromCache();

    const duration = Date.now() - startTime;
    return {
      documents: results,
      fromCache: true,
      cacheStats: getCacheStats(),
      executionTime: duration,
    };
  } catch (error) {
    console.error('[Indexing] Erro ao listar documentos:', error);
    throw error;
  }
}

/**
 * Invalidar documento após atualização
 */
export async function invalidateDocumentAfterUpdate(documentId: number): Promise<void> {
  try {
    console.log(`[Indexing] Invalidando documento ${documentId}...`);
    invalidateDocument(documentId);

    // Recarregar do banco
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const updated = await db
      .select()
      .from(documentVersions)
      .where(eq(documentVersions.id, documentId))
      .limit(1) as any;

    if (updated.length > 0) {
      const doc = updated[0];
      const cached: CachedDocument = {
        id: doc.id,
        documentId: doc.documentId,
        versionNumber: doc.versionNumber,
        title: doc.title,
        content: doc.content || '',
        embedding: doc.embedding ? JSON.parse(doc.embedding) : undefined,
        metadata: doc.metadata ? JSON.parse(doc.metadata) : {},
        status: doc.status,
        createdAt: doc.createdAt,
      };

      addDocumentToCache(cached);
      console.log(`[Indexing] Documento ${documentId} reindexado`);
    }
  } catch (error) {
    console.error('[Indexing] Erro ao invalidar documento:', error);
    throw error;
  }
}

/**
 * Obter estatísticas de indexação
 */
export function getIndexingStats(): {
  cacheInitialized: boolean;
  cacheStats: CacheStats;
} {
  return {
    cacheInitialized: isCacheInitialized(),
    cacheStats: getCacheStats(),
  };
}

/**
 * Reconstruir índice completo
 */
export async function rebuildIndex(): Promise<void> {
  const startTime = Date.now();

  try {
    console.log('[Indexing] Reconstruindo índice...');

    // Reinicializar cache
    await initializeCache();

    const duration = Date.now() - startTime;
    console.log(`[Indexing] Índice reconstruído em ${duration}ms`);
  } catch (error) {
    console.error('[Indexing] Erro ao reconstruir índice:', error);
    throw error;
  }
}
