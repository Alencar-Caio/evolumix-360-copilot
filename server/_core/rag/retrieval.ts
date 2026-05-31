/**
 * RAG Retrieval - Busca por Similaridade
 * 
 * Responsabilidade: Recuperar chunks relevantes baseado em query
 * 
 * Algoritmo:
 * 1. Gerar embedding da query
 * 2. Buscar no índice vetorial (Pinecone)
 * 3. Filtrar por score mínimo
 * 4. Reranking opcional (melhorar relevância)
 * 5. Retornar chunks ordenados
 * 
 * Justificativa:
 * - Busca semântica captura intenção, não apenas keywords
 * - Top-K retrieval garante eficiência
 * - Reranking melhora qualidade sem custo computacional alto
 * - Filtros permitem buscas específicas por documento/versão
 */

import { EmbeddingManager } from './embeddings';
import { VectorIndexManager, SearchResult } from './vectorIndex';
import type { Chunk } from './chunking';

/**
 * Resultado de retrieval com chunk completo
 */
export interface RetrievalResult extends SearchResult {
  /** Texto do chunk (para contexto do LLM) */
  text: string;
  
  /** Tokens do chunk */
  tokenCount: number;
}

/**
 * Configuração de retrieval
 */
export interface RetrievalConfig {
  /** Número de chunks a recuperar */
  topK: number;
  
  /** Score mínimo de similaridade (0-1) */
  minScore: number;
  
  /** Usar reranking para melhorar relevância */
  useReranking: boolean;
  
  /** Filtros por metadata */
  filters?: {
    documentId?: string;
    versionId?: string;
    pageNumber?: number;
  };
}

/**
 * Gerenciador de retrieval
 * 
 * Responsabilidades:
 * - Gerar embedding de queries
 * - Buscar no índice vetorial
 * - Aplicar filtros
 * - Reranking (opcional)
 * - Retornar chunks com contexto
 */
export class RetrieverManager {
  private embeddingManager: EmbeddingManager;
  private vectorIndexManager: VectorIndexManager;
  
  constructor() {
    this.embeddingManager = new EmbeddingManager();
    this.vectorIndexManager = new VectorIndexManager();
  }
  
  /**
   * Recuperar chunks relevantes para uma query
   * 
   * Algoritmo:
   * 1. Gerar embedding da query
   * 2. Buscar no índice
   * 3. Filtrar por score
   * 4. Reranking (se habilitado)
   * 5. Retornar resultados
   */
  async retrieve(
    query: string,
    config: RetrievalConfig = {
      topK: 5,
      minScore: 0.5,
      useReranking: false,
    }
  ): Promise<RetrievalResult[]> {
    try {
      // 1. Gerar embedding da query
      const queryVector = await this.embeddingManager.embedQuery(query);
      
      // 2. Buscar no índice
      const searchResults = await this.vectorIndexManager.searchSimilar(
        queryVector,
        config.topK,
        config.minScore,
        this.buildFilters(config.filters)
      );
      
      // 3. Converter para RetrievalResult (incluir texto do chunk)
      // Nota: Em produção, recuperar texto do banco de dados
      const results: RetrievalResult[] = searchResults.map(result => ({
        ...result,
        text: '', // Será preenchido do banco
        tokenCount: 0, // Será preenchido do banco
      }));
      
      // 4. Reranking (se habilitado)
      if (config.useReranking) {
        return await this.rerank(query, results);
      }
      
      return results;
    } catch (error) {
      console.error('Erro ao recuperar chunks:', error);
      throw error;
    }
  }
  
  /**
   * Reranking: melhorar ordem de relevância
   * 
   * Estratégia:
   * 1. Usar modelo de reranking (cross-encoder)
   * 2. Calcular score de relevância para cada chunk
   * 3. Reordenar por novo score
   * 4. Retornar top-K
   * 
   * Nota: Implementação simplificada
   * Em produção, usar Cohere Reranker ou similar
   */
  private async rerank(
    query: string,
    results: RetrievalResult[]
  ): Promise<RetrievalResult[]> {
    // Simplificado: usar comprimento da query como proxy
    // Em produção: usar modelo de reranking real
    
    const queryLength = query.length;
    
    const rerankedResults = results.map(result => ({
      ...result,
      // Score ajustado: favorecer chunks com texto similar ao tamanho da query
      score: result.score * (1 + Math.log(result.tokenCount) / Math.log(queryLength + 1)),
    }));
    
    // Reordenar por novo score
    rerankedResults.sort((a, b) => b.score - a.score);
    
    return rerankedResults;
  }
  
  /**
   * Construir filtros para busca
   */
  private buildFilters(filters?: RetrievalConfig['filters']): Record<string, any> | undefined {
    if (!filters) return undefined;
    
    const mongoFilters: Record<string, any> = {};
    
    if (filters.documentId) {
      mongoFilters.documentId = { $eq: filters.documentId };
    }
    
    if (filters.versionId) {
      mongoFilters.versionId = { $eq: filters.versionId };
    }
    
    if (filters.pageNumber !== undefined) {
      mongoFilters.pageNumber = { $eq: filters.pageNumber };
    }
    
    return Object.keys(mongoFilters).length > 0 ? mongoFilters : undefined;
  }
  
  /**
   * Busca avançada com múltiplas queries
   * 
   * Útil para:
   * - Expandir query com sinônimos
   * - Buscar variações de termos
   * - Melhorar recall
   */
  async advancedRetrieve(
    queries: string[],
    config: RetrievalConfig = {
      topK: 5,
      minScore: 0.5,
      useReranking: false,
    }
  ): Promise<RetrievalResult[]> {
    const allResults: Map<string, RetrievalResult> = new Map();
    
    // Recuperar para cada query
    for (const query of queries) {
      const results = await this.retrieve(query, config);
      
      for (const result of results) {
        const existing = allResults.get(result.chunkId);
        
        if (existing) {
          // Atualizar score (média dos scores)
          existing.score = (existing.score + result.score) / 2;
        } else {
          allResults.set(result.chunkId, result);
        }
      }
    }
    
    // Converter para array e ordenar
    const uniqueResults = Array.from(allResults.values());
    uniqueResults.sort((a, b) => b.score - a.score);
    
    return uniqueResults.slice(0, config.topK);
  }
  
  /**
   * Busca por similaridade com chunks conhecidos
   * 
   * Útil para:
   * - Encontrar chunks similares a um chunk existente
   * - Detecção de duplicatas
   * - Análise de cobertura
   */
  async findSimilarChunks(
    chunkText: string,
    config: RetrievalConfig = {
      topK: 5,
      minScore: 0.5,
      useReranking: false,
    }
  ): Promise<RetrievalResult[]> {
    // Usar texto do chunk como query
    return this.retrieve(chunkText, config);
  }
}

/**
 * Validar configuração de retrieval
 */
export function validateRetrievalConfig(config: RetrievalConfig): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Validar topK
  if (config.topK < 1 || config.topK > 100) {
    errors.push('topK deve estar entre 1 e 100');
  }
  
  // Validar minScore
  if (config.minScore < 0 || config.minScore > 1) {
    errors.push('minScore deve estar entre 0 e 1');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Calcular estatísticas de retrieval
 */
export function getRetrievalStats(results: RetrievalResult[]): {
  totalResults: number;
  avgScore: number;
  minScore: number;
  maxScore: number;
  avgTokens: number;
} {
  if (results.length === 0) {
    return {
      totalResults: 0,
      avgScore: 0,
      minScore: 0,
      maxScore: 0,
      avgTokens: 0,
    };
  }
  
  const scores = results.map(r => r.score);
  const tokens = results.map(r => r.tokenCount);
  
  return {
    totalResults: results.length,
    avgScore: scores.reduce((a, b) => a + b, 0) / scores.length,
    minScore: Math.min(...scores),
    maxScore: Math.max(...scores),
    avgTokens: Math.round(tokens.reduce((a, b) => a + b, 0) / tokens.length),
  };
}
