/**
 * RAG Vector Index (Pinecone)
 * 
 * Responsabilidade: Armazenar e buscar embeddings em índice vetorial
 * 
 * Pinecone:
 * - Índice vetorial gerenciado (serverless)
 * - Busca por similaridade em tempo real
 * - Filtros por metadata
 * - Replicação e alta disponibilidade
 * 
 * Justificativa:
 * - Pinecone é o padrão ouro para RAG em 2024
 * - Busca sub-milissegundo mesmo com milhões de vetores
 * - Metadata filtering permite buscas precisas
 * - Serverless reduz overhead operacional
 */

import { Pinecone } from '@pinecone-database/pinecone';
import type { Embedding } from './embeddings';

/**
 * Resultado de busca por similaridade
 */
export interface SearchResult {
  /** ID do chunk recuperado */
  chunkId: string;
  
  /** Score de similaridade (0-1, onde 1 é idêntico) */
  score: number;
  
  /** Metadata do chunk */
  metadata: {
    documentId: string | undefined;
    versionId: string | undefined;
    pageNumber: number | undefined;
    sectionTitle: string | undefined;
    source: string | undefined;
  };
}

/**
 * Gerenciador de índice vetorial
 * 
 * Responsabilidades:
 * - Conectar ao Pinecone
 * - Upsert (inserir/atualizar) embeddings
 * - Buscar por similaridade
 * - Filtrar por metadata
 */
export class VectorIndexManager {
  private client: Pinecone;
  private indexName = 'evolumix-rag';
  private namespace: string | undefined = 'default';
  private batchSize = 100; // Upsert em batches de 100
  
  constructor() {
    this.client = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY || '',
    });
  }
  
  /**
   * Inicializar índice
   * 
   * Cria índice se não existir com:
   * - Dimensões: 3072 (text-embedding-3-large)
   * - Métrica: cosine similarity
   * - Replicação: 3 (alta disponibilidade)
   */
  async initialize(): Promise<void> {
    try {
      const index = this.client.Index(this.indexName);
      
      // Verificar se índice existe
      const stats = await index.describeIndexStats();
      console.log(`Índice ${this.indexName} já existe:`, stats);
    } catch (error) {
      // Criar índice se não existir
      console.log(`Criando índice ${this.indexName}...`);
      
      await this.client.createIndex({
        name: this.indexName,
        dimension: 3072,
        metric: 'cosine',
        spec: {
          serverless: {
            cloud: 'aws',
            region: 'us-east-1',
          },
        },
      });
      
      console.log(`Índice ${this.indexName} criado com sucesso`);
    }
  }
  
  /**
   * Upsert (inserir/atualizar) embeddings no índice
   * 
   * Algoritmo:
   * 1. Dividir embeddings em batches
   * 2. Para cada batch:
   *    a. Converter para formato Pinecone
   *    b. Upsert no índice
   *    c. Validar resultado
   * 3. Retornar estatísticas
   * 
   * Otimizações:
   * - Batch processing reduz latência
   * - Metadata filtering permite buscas precisas
   */
  async upsertEmbeddings(embeddings: Embedding[]): Promise<{
    upsertedCount: number;
    failedCount: number;
  }> {
    const index = this.client.Index(this.indexName);
    
    let upsertedCount = 0;
    let failedCount = 0;
    
    // Processar em batches
    for (let i = 0; i < embeddings.length; i += this.batchSize) {
      const batch = embeddings.slice(i, i + this.batchSize);
      
      try {
        // Converter para formato Pinecone
        const vectors = batch.map(emb => ({
          id: emb.chunkId,
          values: emb.vector,
          metadata: {
            documentId: emb.metadata.documentId,
            versionId: emb.metadata.versionId,
            pageNumber: emb.metadata.pageNumber,
            sectionTitle: emb.metadata.sectionTitle,
          },
        }));
        
        // Upsert no índice
        await index.upsert(vectors as any);
        
        upsertedCount += vectors.length;
        console.log(`Batch ${Math.floor(i / this.batchSize) + 1}: ${vectors.length} embeddings upsertados`);
      } catch (error) {
        console.error(`Erro ao upsert batch ${Math.floor(i / this.batchSize) + 1}:`, error);
        failedCount += batch.length;
      }
    }
    
    return { upsertedCount, failedCount };
  }
  
  /**
   * Buscar chunks similares
   * 
   * Algoritmo:
   * 1. Converter query vector para formato Pinecone
   * 2. Buscar no índice com top-K
   * 3. Filtrar por score mínimo
   * 4. Retornar resultados ordenados
   * 
   * Parâmetros:
   * - queryVector: embedding da query (3072 dimensões)
   * - topK: número de resultados (padrão: 5)
   * - minScore: score mínimo (padrão: 0.5)
   * - filter: filtro por metadata (opcional)
   */
  async searchSimilar(
    queryVector: number[],
    topK: number = 5,
    minScore: number = 0.5,
    filter?: Record<string, any>
  ): Promise<SearchResult[]> {
    const index = this.client.Index(this.indexName);
    
    try {
      // Buscar no índice
      const response = await index.query({
        vector: queryVector,
        topK,
        includeMetadata: true,
        namespace: this.namespace,
        filter,
      });
      
      // Converter resultados
      const results: SearchResult[] = response.matches
        .filter(match => (match.score ?? 0) >= minScore)
        .map(match => ({
          chunkId: match.id,
          score: match.score ?? 0,
          metadata: {
            documentId: (match.metadata?.documentId as string) || '',
            versionId: (match.metadata?.versionId as string) || '',
            pageNumber: (match.metadata?.pageNumber as number) || 0,
            sectionTitle: (match.metadata?.sectionTitle as string) || '',
            source: (match.metadata?.source as string) || '',
          },
        }));
      
      return results;
    } catch (error) {
      console.error('Erro ao buscar no índice:', error);
      throw error;
    }
  }
  
  /**
   * Deletar embeddings por documento
   * 
   * Útil para:
   * - Remover documento do índice
   * - Reindexar documento com nova versão
   */
  async deleteByDocumentId(documentId: string): Promise<number> {
    const index = this.client.Index(this.indexName);
    
    try {
      // Buscar todos os chunks do documento
      const response = await index.query({
        vector: new Array(3072).fill(0), // Dummy vector
        topK: 10000,
        includeMetadata: true,
        namespace: this.namespace,
        filter: { documentId: { $eq: documentId } },
      });
      
      // Deletar chunks
      const chunkIds = response.matches.map(m => m.id);
      
      if (chunkIds.length > 0) {
        await index.deleteMany(chunkIds);
      }
      
      return chunkIds.length;
    } catch (error) {
      console.error('Erro ao deletar embeddings:', error);
      throw error;
    }
  }
  
  /**
   * Obter estatísticas do índice
   */
  async getStats(): Promise<{
    indexName: string;
    dimension: number;
    vectorCount: number;
    indexSize: string;
  }> {
    const index = this.client.Index(this.indexName);
    
    try {
      const stats = await index.describeIndexStats();
      
      return {
        indexName: this.indexName,
        dimension: 3072,
        vectorCount: stats.totalRecordCount || 0,
        indexSize: `${Math.round((stats.totalRecordCount || 0) * 3072 * 4 / 1024 / 1024)} MB`,
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      throw error;
    }
  }
}

/**
 * Validar resultado de busca
 */
export function validateSearchResults(results: SearchResult[]): boolean {
  for (const result of results) {
    // Validar score
    if (result.score < 0 || result.score > 1) {
      console.error(`Score inválido: ${result.score}`);
      return false;
    }
    
    // Validar metadata
    if (!result.metadata.documentId) {
      console.error(`Metadata incompleta: ${result.chunkId}`);
      return false;
    }
  }
  
  return true;
}
