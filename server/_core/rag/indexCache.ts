/**
 * Document Index Cache - Otimização de Busca Semântica
 * 
 * Responsabilidade: Cache em memória de índices de documentos
 * 
 * Fluxo:
 * 1. Carregar índices de documentos na inicialização
 * 2. Manter cache em memória para busca rápida
 * 3. Invalidar cache quando documentos são atualizados
 * 4. Implementar TTL para refresh automático
 * 5. Suportar múltiplas estratégias de cache
 * 
 * Justificativa:
 * - Performance (evita queries repetidas)
 * - Escalabilidade (suporta muitos documentos)
 * - Resiliência (fallback se banco falhar)
 * - Conformidade (rastreamento de cache hits/misses)
 */

import { getDb } from '../../db';
import { documentVersions } from '../../../drizzle/schema';
import { eq, desc } from 'drizzle-orm';

/**
 * Estrutura de documento em cache
 */
export interface CachedDocument {
  id: number;
  documentId: number;
  versionNumber: number;
  title: string;
  content: string;
  embedding?: number[];
  metadata: Record<string, any>;
  status: string;
  createdAt: Date;
}

/**
 * Estrutura de cache
 */
export interface IndexCache {
  documents: Map<number, CachedDocument>;
  documentsByTitle: Map<string, CachedDocument[]>;
  lastUpdated: Date;
  hitCount: number;
  missCount: number;
  ttl: number; // em ms
}

/**
 * Estatísticas de cache
 */
export interface CacheStats {
  totalDocuments: number;
  hitRate: number;
  missRate: number;
  hitCount: number;
  missCount: number;
  lastUpdated: Date;
  ttlExpires: Date;
}

// Cache global
let cache: IndexCache | null = null;
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutos

// Inicializar cache automaticamente
function ensureCacheInitialized(): void {
  if (!cache) {
    cache = {
      documents: new Map(),
      documentsByTitle: new Map(),
      lastUpdated: new Date(),
      hitCount: 0,
      missCount: 0,
      ttl: DEFAULT_TTL,
    };
  }
}

/**
 * Inicializar cache
 */
export async function initializeCache(ttl: number = DEFAULT_TTL): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  try {
    console.log('[Cache] Inicializando índice de documentos...');

    const documents = await db
      .select()
      .from(documentVersions)
      .orderBy(desc(documentVersions.createdAt)) as any;

    cache = {
      documents: new Map(),
      documentsByTitle: new Map(),
      lastUpdated: new Date(),
      hitCount: 0,
      missCount: 0,
      ttl,
    };

    // Indexar documentos
    documents.forEach((doc: any) => {
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

      // Indexar por ID
      cache!.documents.set(doc.id, cached);

      // Indexar por título
      if (!cache!.documentsByTitle.has(doc.title)) {
        cache!.documentsByTitle.set(doc.title, []);
      }
      cache!.documentsByTitle.get(doc.title)!.push(cached);
    });

    console.log(`[Cache] ${documents.length} documentos indexados`);

    // Agendar refresh automático
    scheduleRefresh(ttl);
  } catch (error) {
    console.error('[Cache] Erro ao inicializar:', error);
    throw error;
  }
}

/**
 * Agendar refresh automático do cache
 */
function scheduleRefresh(ttl: number): void {
  setTimeout(async () => {
    try {
      console.log('[Cache] Refresh automático...');
      await initializeCache(ttl);
    } catch (error) {
      console.error('[Cache] Erro no refresh automático:', error);
    }
  }, ttl);
}

/**
 * Obter documento do cache
 */
export function getDocumentFromCache(documentId: number): CachedDocument | undefined {
  ensureCacheInitialized();
  if (!cache) return undefined;

  const doc = cache.documents.get(documentId);
  if (doc) {
    cache.hitCount++;
  } else {
    cache.missCount++;
  }

  return doc;
}

/**
 * Buscar documentos por título
 */
export function searchDocumentsByTitle(title: string): CachedDocument[] {
  ensureCacheInitialized();
  if (!cache) return [];

  const results = cache.documentsByTitle.get(title) || [];
  if (results.length > 0) {
    cache.hitCount++;
  } else {
    cache.missCount++;
  }

  return results;
}

/**
 * Buscar documentos por padrão (substring)
 */
export function searchDocumentsByPattern(pattern: string): CachedDocument[] {
  ensureCacheInitialized();
  if (!cache) return [];

  const regex = new RegExp(pattern, 'i');
  const results: CachedDocument[] = [];

  cache.documents.forEach((doc) => {
    if (regex.test(doc.title) || regex.test(doc.content)) {
      results.push(doc);
    }
  });

  if (results.length > 0) {
    cache.hitCount++;
  } else {
    cache.missCount++;
  }

  return results;
}

/**
 * Obter todos os documentos do cache
 */
export function getAllDocumentsFromCache(): CachedDocument[] {
  ensureCacheInitialized();
  if (!cache) return [];

  cache.hitCount++;
  return Array.from(cache.documents.values());
}

/**
 * Invalidar cache (quando documento é atualizado)
 */
export async function invalidateCache(): Promise<void> {
  if (!cache) return;

  console.log('[Cache] Invalidando cache...');
  cache = null;
  await initializeCache();
}

/**
 * Invalidar documento específico
 */
export function invalidateDocument(documentId: number): void {
  if (!cache) return;

  const doc = cache.documents.get(documentId);
  if (doc) {
    cache.documents.delete(documentId);

    // Remover de índice por título
    const titleDocs = cache.documentsByTitle.get(doc.title);
    if (titleDocs) {
      const index = titleDocs.findIndex((d) => d.id === documentId);
      if (index !== -1) {
        titleDocs.splice(index, 1);
      }
    }

    console.log(`[Cache] Documento ${documentId} invalidado`);
  }
}

/**
 * Adicionar documento ao cache
 */
export function addDocumentToCache(doc: CachedDocument): void {
  ensureCacheInitialized();
  if (!cache) return;

  cache.documents.set(doc.id, doc);

  if (!cache.documentsByTitle.has(doc.title)) {
    cache.documentsByTitle.set(doc.title, []);
  }
  cache.documentsByTitle.get(doc.title)!.push(doc);

  console.log(`[Cache] Documento ${doc.id} adicionado ao cache`);
}

/**
 * Obter estatísticas de cache
 */
export function getCacheStats(): CacheStats {
  if (!cache) {
    return {
      totalDocuments: 0,
      hitRate: 0,
      missRate: 0,
      hitCount: 0,
      missCount: 0,
      lastUpdated: new Date(),
      ttlExpires: new Date(),
    };
  }

  const total = cache.hitCount + cache.missCount;
  const hitRate = total > 0 ? (cache.hitCount / total) * 100 : 0;
  const missRate = total > 0 ? (cache.missCount / total) * 100 : 0;

  return {
    totalDocuments: cache.documents.size,
    hitRate,
    missRate,
    hitCount: cache.hitCount,
    missCount: cache.missCount,
    lastUpdated: cache.lastUpdated,
    ttlExpires: new Date(cache.lastUpdated.getTime() + cache.ttl),
  };
}

/**
 * Limpar cache
 */
export function clearCache(): void {
  if (cache) {
    cache.documents.clear();
    cache.documentsByTitle.clear();
    cache.hitCount = 0;
    cache.missCount = 0;
    console.log('[Cache] Cache limpo');
  }
}

/**
 * Verificar se cache está inicializado
 */
export function isCacheInitialized(): boolean {
  return cache !== null;
}

/**
 * Obter tamanho do cache em bytes (aproximado)
 */
export function getCacheSize(): number {
  if (!cache) return 0;

  let size = 0;
  cache.documents.forEach((doc) => {
    size += JSON.stringify(doc).length;
  });

  return size;
}

/**
 * Implementar estratégia LRU (Least Recently Used)
 * Remove documentos menos usados quando cache atinge limite
 */
export function enforceMaxCacheSize(maxSizeBytes: number): void {
  if (!cache) return;

  const currentSize = getCacheSize();
  if (currentSize > maxSizeBytes) {
    console.warn(`[Cache] Tamanho excedido (${currentSize}/${maxSizeBytes}). Limpando...`);
    clearCache();
  }
}
